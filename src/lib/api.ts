// Thin client for the Fastify backend. The app only ever talks to this server;
// the server handles Gemini + Convex.
//
// Set EXPO_PUBLIC_API_URL to your machine's LAN IP when testing on a device,
// e.g. EXPO_PUBLIC_API_URL=http://192.168.1.20:3000

export const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export type StructuredNote = {
  doctor: string;
  specialty: string;
  facility: string;
  date: string;
  status: 'good' | 'caution' | 'flag';
  chiefComplaint: string;
  history: string;
  risks: string[];
  advice: string[];
  prescription: { name: string; dose: string }[];
};

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `Request failed (${res.status})`);
  return res.json();
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

export function login(email: string) {
  return postJson<{ userId: string; email: string; created: boolean }>('/api/auth/login', { email });
}

export function createSession(userId: string) {
  return postJson<{ sessionId: string }>('/api/sessions', { userId });
}

// Upload one recorded audio chunk and get back the running transcript.
export async function uploadChunk(
  sessionId: string,
  index: number,
  uri: string,
  mimeType: string,
): Promise<{ text: string; transcript: string }> {
  const form = new FormData();
  const name = `chunk-${index}.${mimeType.includes('wav') ? 'wav' : 'm4a'}`;
  // React Native FormData file shape.
  form.append('audio', { uri, name, type: mimeType } as unknown as Blob);

  const res = await fetch(`${API_BASE}/api/sessions/${sessionId}/chunk?index=${index}`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error(`Chunk upload failed (${res.status})`);
  return res.json();
}

export function finalizeSession(sessionId: string, durationSec: number) {
  return postJson<{ note: StructuredNote & { sessionId: string } }>(
    `/api/sessions/${sessionId}/finalize`,
    { durationSec },
  );
}

export function getNote(sessionId: string) {
  return getJson<{ note: (StructuredNote & { _id: string }) | null }>(
    `/api/sessions/${sessionId}/note`,
  );
}
