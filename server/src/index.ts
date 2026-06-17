import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import Fastify from 'fastify';

import { toMp3 } from './audio.ts';
import { api, requireConvex } from './convex.ts';
import { biomarkers, familyMembers, profile, reminders, visits } from './data.ts';
import { extractLabReport, structureNote, transcribeAudio } from './gemini.ts';
import { placesConfigured, searchPlaces } from './places.ts';

const app = Fastify({ logger: true, bodyLimit: 60 * 1024 * 1024 });

await app.register(cors, { origin: true });
await app.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } });

app.setErrorHandler((err: Error & { statusCode?: number; status?: number }, _req, reply) => {
  app.log.error(err);
  const raw = err.statusCode ?? err.status ?? 500;
  const busy = raw === 503 || raw === 429 || /UNAVAILABLE|overloaded|high demand|RESOURCE_EXHAUSTED/i.test(err.message);
  if (busy) {
    reply.code(503).send({ error: 'The AI service is busy right now. Please try again in a moment.' });
  } else {
    reply.code(raw >= 400 && raw < 600 ? raw : 500).send({ error: err.message });
  }
});

app.get('/health', async () => ({ status: 'ok', places: placesConfigured() }));

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
app.post('/api/auth/login', async (req) => {
  const { email, firstName, lastName, phone, age } = (req.body ?? {}) as {
    email?: string; firstName?: string; lastName?: string; phone?: string; age?: number;
  };
  if (!email || !email.includes('@')) {
    throw Object.assign(new Error('A valid email is required'), { statusCode: 400 });
  }
  return requireConvex().mutation(api.users.upsert, { email, firstName, lastName, phone, age });
});

app.get('/api/users/:id', async (req) => {
  const { id: userId } = req.params as { id: string };
  return { user: await requireConvex().query(api.users.get, { userId }) };
});

// Permanently delete the user and all their data.
app.delete('/api/users/:id', async (req) => {
  const { id: userId } = req.params as { id: string };
  return requireConvex().mutation(api.users.deleteAccount, { userId });
});

// ---------------------------------------------------------------------------
// Places (Google Places proxy)
// ---------------------------------------------------------------------------
app.get('/api/places/search', async (req) => {
  const q = ((req.query as { q?: string }).q ?? '').trim();
  if (q.length < 2) return { results: [] };
  return { results: await searchPlaces(q) };
});

// ---------------------------------------------------------------------------
// Recording sessions
// ---------------------------------------------------------------------------

// Start a session with the visit context chosen up front.
app.post('/api/sessions', async (req) => {
  const body = (req.body ?? {}) as {
    userId?: string; doctor?: string; specialty?: string; facility?: string;
    placeId?: string; address?: string; lat?: number; lng?: number;
  };
  if (!body.userId) throw Object.assign(new Error('userId is required'), { statusCode: 400 });
  const sessionId = await requireConvex().mutation(api.sessions.create, body);
  return { sessionId };
});

// Finish a session: receive the full recording, transcribe it, store the mp3,
// structure the note, and persist everything.
// multipart field "audio"; duration via ?durationSec=N
app.post('/api/sessions/:id/finalize', async (req) => {
  const { id: sessionId } = req.params as { id: string };
  const durationSec = Number((req.query as { durationSec?: string }).durationSec ?? 0);
  const convex = requireConvex();

  const file = await req.file();
  if (!file) throw Object.assign(new Error('audio file is required'), { statusCode: 400 });
  const buffer = await file.toBuffer();
  const ext = file.filename?.split('.').pop() || 'm4a';
  app.log.info(`[finalize] session=${sessionId} received ${buffer.length}B (.${ext})`);

  await convex.mutation(api.sessions.setStatus, { sessionId, status: 'processing', durationSec });

  // 1) transcode to mp3
  const { data: mp3, mimeType } = await toMp3(buffer, ext);

  // 2) transcribe
  let transcript = '';
  try {
    transcript = await transcribeAudio(mp3.toString('base64'), mimeType);
  } catch (err) {
    app.log.error({ err }, '[finalize] transcription failed');
  }
  await convex.mutation(api.sessions.setTranscript, { sessionId, transcript });

  // 3) store the mp3 in Convex storage for playback
  try {
    const uploadUrl = (await convex.mutation(api.files.generateUploadUrl, {})) as string;
    const up = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'audio/mpeg' },
      body: mp3,
    });
    const { storageId } = (await up.json()) as { storageId: string };
    if (storageId) await convex.mutation(api.sessions.setAudio, { sessionId, audioId: storageId });
  } catch (err) {
    app.log.error({ err }, '[finalize] audio store failed');
  }

  // 4) structure the note using the session's visit context
  const session = (await convex.query(api.sessions.get, { sessionId })) as
    | { userId: string; doctor?: string; specialty?: string; facility?: string }
    | null;
  if (!session) throw Object.assign(new Error('Session not found'), { statusCode: 404 });

  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const note = await structureNote(transcript || 'No transcript captured.', today, {
    doctor: session.doctor,
    specialty: session.specialty,
    facility: session.facility,
  });

  await convex.mutation(api.notes.save, { sessionId, userId: session.userId, ...note });
  await convex.mutation(api.sessions.setStatus, { sessionId, status: 'complete', durationSec });

  const audioUrl = await convex.query(api.sessions.getAudioUrl, { sessionId });
  return { note: { sessionId, ...note }, transcript, audioUrl };
});

app.get('/api/sessions/:id', async (req) => {
  const { id: sessionId } = req.params as { id: string };
  return { session: await requireConvex().query(api.sessions.get, { sessionId }) };
});

// Edit a session's visit context later; mirror the change onto its note.
app.patch('/api/sessions/:id', async (req) => {
  const { id: sessionId } = req.params as { id: string };
  const body = (req.body ?? {}) as {
    doctor?: string; specialty?: string; facility?: string;
    placeId?: string; address?: string; lat?: number; lng?: number;
  };
  const convex = requireConvex();
  await convex.mutation(api.sessions.updateContext, { sessionId, ...body });
  await convex.mutation(api.notes.updateDetails, {
    sessionId,
    doctor: body.doctor,
    specialty: body.specialty,
    facility: body.facility,
  });
  return { ok: true };
});

app.get('/api/sessions/:id/note', async (req) => {
  const { id: sessionId } = req.params as { id: string };
  const convex = requireConvex();
  const [note, audioUrl] = await Promise.all([
    convex.query(api.notes.getBySession, { sessionId }),
    convex.query(api.sessions.getAudioUrl, { sessionId }),
  ]);
  return { note, audioUrl };
});

app.get('/api/users/:id/notes', async (req) => {
  const { id: userId } = req.params as { id: string };
  return { notes: await requireConvex().query(api.notes.listByUser, { userId }) };
});

// ---------------------------------------------------------------------------
// Lab reports — upload a file, Gemini extracts + classifies markers
// ---------------------------------------------------------------------------
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'marker';

// Run extraction over one or more files and persist a single report.
async function saveReport(
  userId: string,
  fileName: string,
  files: { base64: string; mimeType: string }[],
) {
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const { date, markers } = await extractLabReport(files, today);
  const label = date.replace(/,?\s*\d{4}$/, '').trim() || date;

  // Dedupe markers by id (same test repeated across pages) and cap the count.
  const seen = new Set<string>();
  const withIds = markers
    .map((m) => ({ id: slug(m.name), ...m }))
    .filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)))
    .slice(0, 80);
  if (markers.length > withIds.length) {
    app.log.info(`[reports] ${markers.length} markers -> ${withIds.length} after dedupe/cap`);
  }

  // Skip if an identical report (same date + same marker values) already exists,
  // so retried uploads don't pile up duplicates.
  const sig = (ms: { id: string; value: number }[]) =>
    ms.map((m) => `${m.id}:${m.value}`).sort().join(',');
  const newSig = `${date}|${sig(withIds)}`;
  const existing = (await requireConvex().query(api.reports.listByUser, { userId })) as {
    _id: string;
    date: string;
    markers: { id: string; value: number }[];
  }[];
  const dup = existing.find((r) => `${r.date}|${sig(r.markers)}` === newSig);
  if (dup) {
    app.log.info(`[reports] duplicate of ${dup._id} — not re-adding`);
    return { reportId: dup._id, date, markerCount: withIds.length, duplicate: true };
  }

  const reportId = await requireConvex().mutation(api.reports.add, {
    userId,
    fileName,
    date,
    label,
    markers: withIds,
  });
  return { reportId, date, markerCount: withIds.length, duplicate: false };
}

// Single file (PDF or image). multipart field "file"; userId via ?userId=
app.post('/api/reports', async (req) => {
  const userId = (req.query as { userId?: string }).userId;
  if (!userId) throw Object.assign(new Error('userId is required'), { statusCode: 400 });
  const file = await req.file();
  if (!file) throw Object.assign(new Error('file is required'), { statusCode: 400 });
  const buffer = await file.toBuffer();
  const mimeType = file.mimetype || 'application/pdf';
  app.log.info(`[reports] file ${file.filename} ${buffer.length}B ${mimeType}`);
  return saveReport(userId, file.filename || 'report', [{ base64: buffer.toString('base64'), mimeType }]);
});

// Multiple photos of one report, as base64 JSON.
app.post('/api/reports/photos', async (req) => {
  const { userId, images, fileName } = (req.body ?? {}) as {
    userId?: string;
    images?: { data: string; mimeType?: string }[];
    fileName?: string;
  };
  if (!userId) throw Object.assign(new Error('userId is required'), { statusCode: 400 });
  if (!images?.length) throw Object.assign(new Error('images are required'), { statusCode: 400 });
  app.log.info(`[reports] ${images.length} photo(s) for one report`);
  const files = images.map((i) => ({ base64: i.data, mimeType: i.mimeType || 'image/jpeg' }));
  return saveReport(userId, fileName || `report (${images.length} photos)`, files);
});

app.get('/api/users/:id/reports', async (req) => {
  const { id: userId } = req.params as { id: string };
  return { reports: await requireConvex().query(api.reports.listByUser, { userId }) };
});

app.delete('/api/reports/:id', async (req) => {
  const { id: reportId } = req.params as { id: string };
  await requireConvex().mutation(api.reports.remove, { reportId });
  return { ok: true };
});

// ---------------------------------------------------------------------------
// Mock content backing the other screens
// ---------------------------------------------------------------------------
app.get('/api/visits', async () => ({ visits }));
app.get('/api/biomarkers', async () => ({ biomarkers }));
app.get('/api/reminders', async () => ({ reminders }));
app.get('/api/profile', async () => ({ profile }));
app.get('/api/family', async () => ({ family: familyMembers }));

const port = Number(process.env.PORT ?? 3000);

try {
  await app.listen({ port, host: '0.0.0.0' });
  app.log.info(`iKiguy server listening on http://localhost:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
