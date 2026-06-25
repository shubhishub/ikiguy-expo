import { beforeAll, describe, expect, it } from 'bun:test';

import { buildApp } from './index.ts';

// `api.<module>.<fn>` resolves to the string "module.fn" so the fake convex
// client can switch on it. Injected via buildApp deps — no module mocking, so
// nothing leaks into the other test files.
const api: any = new Proxy(
  {},
  { get: (_t, mod) => new Proxy({}, { get: (_t2, fn) => `${String(mod)}.${String(fn)}` }) },
);

const calls: { kind: 'mutation' | 'query'; ref: string; args: unknown }[] = [];

const fakeNote = {
  doctor: 'Dr. A', specialty: 'Cardio', facility: 'Clinic', date: 'Jun 9, 2026',
  status: 'good', chiefComplaint: 'Checkup', history: 'Routine.',
  risks: [], advice: ['Stay active'], prescription: [],
  summary: 'Routine visit, all good.', patientSummary: "You're healthy — keep it up.",
  diagnoses: ['Healthy'], testsOrdered: ['Lipid panel'],
  followUp: { date: 'In 1 year', instructions: 'Annual checkup.' },
};

const fakeClient: any = {
  mutation: async (ref: string, args: unknown) => {
    calls.push({ kind: 'mutation', ref, args });
    switch (ref) {
      case 'sessions.create': return 'sess_123';
      case 'files.generateUploadUrl': return 'https://upload.example/slot';
      case 'chunks.add': return 'chunk_1';
      case 'chunks.deleteBySession': return 1;
      case 'notes.save': return 'note_1';
      case 'users.upsertGoogle':
        return { userId: 'user_1', email: (args as any).email, created: true };
      default: return null;
    }
  },
  query: async (ref: string, args: unknown) => {
    calls.push({ kind: 'query', ref, args });
    switch (ref) {
      case 'sessions.get':
        return { userId: 'user_1', doctor: 'Dr. A', specialty: 'Cardio', facility: 'Clinic' };
      case 'chunks.urlsBySession':
        return [{ index: 0, mimeType: 'audio/mp4', url: 'https://blob.example/0' }];
      case 'sessions.getAudioUrl':
        return 'https://audio.example/final.mp3';
      default: return null;
    }
  },
};

const gemini = {
  transcribeAudio: async () => 'mock transcript',
  structureNote: async () => ({ ...fakeNote }),
  extractLabReport: async () => ({ date: 'Jun 9, 2026', markers: [] }),
} as any;

const audio = {
  toMp3: async (buf: Buffer) => ({ data: buf, mimeType: 'audio/mp3' }),
  combineToMp3: async (parts: { buf: Buffer }[]) => ({
    data: Buffer.concat(parts.map((p) => p.buf)),
    mimeType: 'audio/mp3',
  }),
} as any;

// Stub network used by storeInConvex (upload URL) and chunk-blob downloads.
beforeAll(() => {
  globalThis.fetch = (async (url: unknown) => {
    const u = String(url);
    if (u.includes('upload.example')) {
      return new Response(JSON.stringify({ storageId: 'stored_1' }), {
        status: 200, headers: { 'content-type': 'application/json' },
      });
    }
    if (u.includes('blob.example')) {
      return new Response(new Uint8Array([1, 2, 3, 4]), { status: 200 });
    }
    return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
});

// Fake Google verifier: accepts "good-token", rejects everything else — no real
// network or signature check, so the route logic is exercised in isolation.
const google = {
  verifyGoogleIdToken: async (idToken: string) => {
    if (idToken !== 'good-token') throw Object.assign(new Error('Invalid Google token'), { statusCode: 401 });
    return { googleId: 'g_sub_1', email: 'jdoe@gmail.com', name: 'J Doe', firstName: 'J', lastName: 'Doe' };
  },
} as any;

const app = await buildApp({ api, requireConvex: () => fakeClient, gemini, audio, google });

function multipart(field: string, filename: string, contentType: string, bytes: Buffer) {
  const boundary = '----ikiguytest';
  const head = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="${field}"; filename="${filename}"\r\n` +
      `Content-Type: ${contentType}\r\n\r\n`,
  );
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
  return { payload: Buffer.concat([head, bytes, tail]), contentType: `multipart/form-data; boundary=${boundary}` };
}

describe('routes', () => {
  it('GET /health is ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe('ok');
  });

  it('POST /api/auth/google verifies the token and upserts the user', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/auth/google',
      payload: JSON.stringify({ idToken: 'good-token' }),
      headers: { 'content-type': 'application/json' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ userId: 'user_1', email: 'jdoe@gmail.com', created: true });
    const upsert = calls.find((c) => c.ref === 'users.upsertGoogle');
    expect(upsert?.args).toMatchObject({ googleId: 'g_sub_1', email: 'jdoe@gmail.com', firstName: 'J' });
  });

  it('POST /api/auth/google rejects an invalid token', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/auth/google',
      payload: JSON.stringify({ idToken: 'nope' }),
      headers: { 'content-type': 'application/json' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/auth/google requires an idToken', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/auth/google',
      payload: JSON.stringify({}),
      headers: { 'content-type': 'application/json' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST /api/sessions creates a session', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/sessions',
      payload: JSON.stringify({ userId: 'user_1' }),
      headers: { 'content-type': 'application/json' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().sessionId).toBe('sess_123');
  });

  it('POST /api/sessions/:id/chunks stores a chunk', async () => {
    const { payload, contentType } = multipart('audio', 'c0.m4a', 'audio/mp4', Buffer.from([1, 2, 3, 4]));
    const res = await app.inject({
      method: 'POST', url: '/api/sessions/sess_123/chunks?index=0',
      payload, headers: { 'content-type': contentType },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ index: 0, ok: true });
    const add = calls.find((c) => c.ref === 'chunks.add');
    expect(add?.args).toMatchObject({ sessionId: 'sess_123', index: 0, storageId: 'stored_1', mimeType: 'audio/mp4' });
  });

  it('POST /api/sessions/:id/finalize combines chunks and saves a note', async () => {
    calls.length = 0;
    const res = await app.inject({
      method: 'POST', url: '/api/sessions/sess_123/finalize',
      payload: JSON.stringify({ durationSec: 42 }),
      headers: { 'content-type': 'application/json' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.transcript).toBe('mock transcript');
    expect(body.audioUrl).toBe('https://audio.example/final.mp3');
    expect(body.note).toMatchObject({
      sessionId: 'sess_123',
      summary: expect.any(String),
      diagnoses: expect.any(Array),
      testsOrdered: expect.any(Array),
      followUp: { date: expect.any(String), instructions: expect.any(String) },
    });
    expect(calls.some((c) => c.ref === 'chunks.urlsBySession')).toBe(true);
    expect(calls.some((c) => c.ref === 'notes.save')).toBe(true);
    expect(calls.some((c) => c.ref === 'chunks.deleteBySession')).toBe(true);
  });

  it('finalize errors cleanly when there are no chunks', async () => {
    const orig = fakeClient.query;
    fakeClient.query = async (ref: string, args: unknown) =>
      ref === 'chunks.urlsBySession' ? [] : orig(ref, args);
    const res = await app.inject({
      method: 'POST', url: '/api/sessions/sess_empty/finalize',
      payload: JSON.stringify({ durationSec: 1 }),
      headers: { 'content-type': 'application/json' },
    });
    fakeClient.query = orig;
    expect(res.statusCode).toBe(400);
  });
});
