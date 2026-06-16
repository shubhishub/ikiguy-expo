import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import Fastify from 'fastify';

import { toMp3 } from './audio.ts';
import { api, requireConvex } from './convex.ts';
import { biomarkers, familyMembers, profile, reminders, visits } from './data.ts';
import { structureNote, transcribeAudio } from './gemini.ts';

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(multipart, { limits: { fileSize: 25 * 1024 * 1024 } });

// Surface our 503-style errors cleanly.
app.setErrorHandler((err: Error & { statusCode?: number }, _req, reply) => {
  const status = err.statusCode ?? 500;
  app.log.error(err);
  reply.code(status).send({ error: err.message });
});

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------
app.get('/health', async () => ({ status: 'ok', service: 'ikiguy-server' }));

// ---------------------------------------------------------------------------
// Auth — email-only identity backed by Convex
// ---------------------------------------------------------------------------
app.post('/api/auth/login', async (req) => {
  const { email, name } = (req.body ?? {}) as { email?: string; name?: string };
  if (!email || !email.includes('@')) {
    throw Object.assign(new Error('A valid email is required'), { statusCode: 400 });
  }
  const convex = requireConvex();
  return convex.mutation(api.users.upsert, { email, name });
});

// ---------------------------------------------------------------------------
// Recording sessions + live transcription
// ---------------------------------------------------------------------------

// Start a session.
app.post('/api/sessions', async (req) => {
  const { userId } = (req.body ?? {}) as { userId?: string };
  if (!userId) throw Object.assign(new Error('userId is required'), { statusCode: 400 });
  const convex = requireConvex();
  const sessionId = await convex.mutation(api.sessions.create, { userId });
  return { sessionId };
});

// Upload one audio chunk -> transcribe with Gemini -> append to transcript.
// Send the audio as multipart field "audio" and the chunk number as ?index=N.
app.post('/api/sessions/:id/chunk', async (req) => {
  const { id: sessionId } = req.params as { id: string };
  const index = Number((req.query as { index?: string }).index ?? 0);

  const file = await req.file();
  if (!file) throw Object.assign(new Error('audio file is required'), { statusCode: 400 });
  const buffer = await file.toBuffer();
  const ext = file.filename?.split('.').pop() || 'm4a';

  // Transcode the native recording to mp3 so Gemini gets a supported format.
  const { data, mimeType } = await toMp3(buffer, ext);
  const text = await transcribeAudio(data.toString('base64'), mimeType);

  const convex = requireConvex();
  const { transcript } = await convex.mutation(api.sessions.appendChunk, { sessionId, index, text });
  return { index, text, transcript };
});

// Finish a session -> structure the full transcript into a note -> persist it.
app.post('/api/sessions/:id/finalize', async (req) => {
  const { id: sessionId } = req.params as { id: string };
  const { durationSec } = (req.body ?? {}) as { durationSec?: number };

  const convex = requireConvex();
  await convex.mutation(api.sessions.setStatus, { sessionId, status: 'processing', durationSec });

  const session = (await convex.query(api.sessions.get, { sessionId })) as
    | { transcript: string; userId: string }
    | null;
  if (!session) throw Object.assign(new Error('Session not found'), { statusCode: 404 });

  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const structured = await structureNote(session.transcript || 'No transcript captured.', today);

  await convex.mutation(api.notes.save, { sessionId, userId: session.userId, ...structured });
  await convex.mutation(api.sessions.setStatus, { sessionId, status: 'complete', durationSec });

  return { note: { sessionId, ...structured } };
});

app.get('/api/sessions/:id', async (req) => {
  const { id: sessionId } = req.params as { id: string };
  const convex = requireConvex();
  return { session: await convex.query(api.sessions.get, { sessionId }) };
});

app.get('/api/sessions/:id/note', async (req) => {
  const { id: sessionId } = req.params as { id: string };
  const convex = requireConvex();
  return { note: await convex.query(api.notes.getBySession, { sessionId }) };
});

app.get('/api/users/:id/notes', async (req) => {
  const { id: userId } = req.params as { id: string };
  const convex = requireConvex();
  return { notes: await convex.query(api.notes.listByUser, { userId }) };
});

// ---------------------------------------------------------------------------
// Mock content backing the existing screens (visits, labs, etc.)
// ---------------------------------------------------------------------------
app.get('/api/visits', async () => ({ visits }));
app.get('/api/visits/:id', async (req, reply) => {
  const { id } = req.params as { id: string };
  const visit = visits.find((v) => v.id === id);
  if (!visit) return reply.code(404).send({ error: 'Visit not found' });
  return { visit };
});
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
