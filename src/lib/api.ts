// Thin client for the Fastify backend. The app only talks to this server;
// the server handles Gemini + Convex + Google Places.
//
// Set EXPO_PUBLIC_API_URL to your machine's LAN IP when testing on a device,
// e.g. EXPO_PUBLIC_API_URL=http://192.168.1.20:4000

import { FileSystemUploadType, uploadAsync } from 'expo-file-system/legacy';

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

export type UserProfile = { firstName?: string; lastName?: string; phone?: string; age?: number };

export type UserRecord = {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  age: number | null;
};

export type Place = {
  placeId: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  types: string[];
  isHealth: boolean;
};

export type VisitContext = {
  userId: string;
  doctor?: string;
  specialty?: string;
  facility?: string;
  placeId?: string;
  address?: string;
  lat?: number;
  lng?: number;
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

export function login(email: string, profile?: UserProfile) {
  return postJson<UserRecord & { created: boolean }>('/api/auth/login', { email, ...profile });
}

export function getUser(userId: string) {
  return getJson<{ user: UserRecord | null }>(`/api/users/${userId}`);
}

// Permanently delete the account and all associated data.
export async function deleteAccount(userId: string) {
  const res = await fetch(`${API_BASE}/api/users/${userId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Delete failed (${res.status})`);
  return res.json();
}

export function searchPlaces(query: string) {
  return getJson<{ results: Place[] }>(`/api/places/search?q=${encodeURIComponent(query)}`);
}

export function createSession(ctx: VisitContext) {
  return postJson<{ sessionId: string }>('/api/sessions', ctx);
}

// Upload the full recording, transcribe + structure on the server. Uses
// expo-file-system uploadAsync (multipart) - robust for local file URIs, unlike
// RN's fetch+FormData which rejects the legacy { uri } file part.
export async function finalizeSession(
  sessionId: string,
  audioUri: string,
  mimeType: string,
  durationSec: number,
): Promise<{ note: StructuredNote & { sessionId: string }; transcript: string; audioUrl: string | null }> {
  const res = await uploadAsync(
    `${API_BASE}/api/sessions/${sessionId}/finalize?durationSec=${Math.round(durationSec)}`,
    audioUri,
    {
      httpMethod: 'POST',
      uploadType: FileSystemUploadType.MULTIPART,
      fieldName: 'audio',
      mimeType,
    },
  );
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Finalize failed (${res.status})`);
  }
  return JSON.parse(res.body);
}

export type NoteRecord = {
  _id: string;
  sessionId: string;
  doctor: string;
  specialty: string;
  facility: string;
  date: string;
  status: 'good' | 'caution' | 'flag';
  chiefComplaint: string;
  createdAt: number;
};

// The user's recorded visits (one note per finalized session), newest first.
export function listVisits(userId: string) {
  return getJson<{ notes: NoteRecord[] }>(`/api/users/${userId}/notes`);
}

export type SessionRecord = {
  _id: string;
  doctor?: string;
  specialty?: string;
  facility?: string;
  placeId?: string;
  address?: string;
  lat?: number;
  lng?: number;
};

export function getSession(sessionId: string) {
  return getJson<{ session: SessionRecord | null }>(`/api/sessions/${sessionId}`);
}

// Edit a session's visit details after recording.
export async function updateSession(
  sessionId: string,
  details: { doctor?: string; specialty?: string; facility?: string; placeId?: string; address?: string; lat?: number; lng?: number },
) {
  const res = await fetch(`${API_BASE}/api/sessions/${sessionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(details),
  });
  if (!res.ok) throw new Error(`Update failed (${res.status})`);
  return res.json();
}

export type MarkerStatus = 'good' | 'caution' | 'flag';

export type ReportMarker = {
  id: string;
  name: string;
  value: number;
  unit: string;
  range: string;
  status: MarkerStatus;
};

export type LabReport = {
  _id: string;
  fileName: string;
  date: string;
  label: string;
  markers: ReportMarker[];
  createdAt: number;
};

export function listReports(userId: string) {
  return getJson<{ reports: LabReport[] }>(`/api/users/${userId}/reports`);
}

// Upload a lab report file (PDF/image); the server extracts + classifies markers.
export async function uploadReport(userId: string, fileUri: string, mimeType: string) {
  const res = await uploadAsync(`${API_BASE}/api/reports?userId=${userId}`, fileUri, {
    httpMethod: 'POST',
    uploadType: FileSystemUploadType.MULTIPART,
    fieldName: 'file',
    mimeType,
  });
  if (res.status < 200 || res.status >= 300) {
    throw new Error(errorFromBody(res.body) ?? `Upload failed (${res.status})`);
  }
  return JSON.parse(res.body) as { reportId: string; date: string; markerCount: number };
}

// Pull a server { error } message out of an uploadAsync response body.
function errorFromBody(body: string): string | null {
  try {
    return (JSON.parse(body) as { error?: string }).error ?? null;
  } catch {
    return null;
  }
}

// Upload multiple photos of a single report (base64), combined into one report.
export function uploadReportPhotos(
  userId: string,
  images: { data: string; mimeType?: string }[],
) {
  return postJson<{ reportId: string; date: string; markerCount: number }>('/api/reports/photos', {
    userId,
    images,
  });
}

export async function deleteReport(reportId: string) {
  const res = await fetch(`${API_BASE}/api/reports/${reportId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Delete failed (${res.status})`);
  return res.json();
}

export function getNote(sessionId: string) {
  return getJson<{ note: (StructuredNote & { _id: string }) | null; audioUrl: string | null }>(
    `/api/sessions/${sessionId}/note`,
  );
}
