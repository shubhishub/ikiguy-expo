import { GoogleGenAI, Type } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

function requireAi() {
  if (!ai) {
    throw Object.assign(new Error('GEMINI_API_KEY is not configured'), { statusCode: 503 });
  }
  return ai;
}

// Retry transient Gemini errors (503 overloaded / 429 rate limit). These
// usually fail fast, so retrying with a short backoff is cheap.
async function withRetry<T>(fn: () => Promise<T>, label: string, tries = 3): Promise<T> {
  let delay = 1500;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      const status = (e as { status?: number; code?: number })?.status ?? (e as { code?: number })?.code;
      const msg = String((e as { message?: string })?.message ?? '');
      const transient =
        status === 503 || status === 429 || /UNAVAILABLE|RESOURCE_EXHAUSTED|overloaded|high demand/i.test(msg);
      if (!transient || i === tries - 1) throw e;
      console.warn(`[gemini] ${label} transient (${status}); retry ${i + 1}/${tries - 1} in ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2;
    }
  }
  throw new Error('unreachable');
}

export type VisitContext = {
  doctor?: string;
  specialty?: string;
  facility?: string;
};

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
  summary: string;
  patientSummary: string;
  diagnoses: string[];
  testsOrdered: string[];
  followUp: { date: string; instructions: string };
};

// Transcribe an audio recording verbatim. Logs sizes + result so the pipeline
// is observable in the server logs.
export async function transcribeAudio(base64: string, mimeType: string): Promise<string> {
  const approxKb = Math.round((base64.length * 0.75) / 1024);
  console.log(`[gemini] transcribe: ${approxKb}KB ${mimeType} via ${MODEL}`);
  try {
    const res = await withRetry(
      () =>
        requireAi().models.generateContent({
          model: MODEL,
          contents: [
            {
              role: 'user',
              parts: [
                { inlineData: { mimeType, data: base64 } },
                {
                  text:
                    'Transcribe this audio from a doctor-patient consultation verbatim. ' +
                    'Return only the spoken words as plain text. If there is no clear speech, return an empty string.',
                },
              ],
            },
          ],
        }),
      'transcribe',
    );
    const text = (res.text ?? '').trim();
    console.log(`[gemini] transcript chars=${text.length}: ${text.slice(0, 200)}`);
    return text;
  } catch (err) {
    console.error('[gemini] transcribe FAILED:', err instanceof Error ? err.message : err);
    throw err;
  }
}

export const NOTE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    doctor: { type: Type.STRING, description: "Doctor's name, or 'Unknown' if not mentioned" },
    specialty: { type: Type.STRING },
    facility: { type: Type.STRING },
    date: { type: Type.STRING, description: 'Visit date, e.g. "Jun 9, 2026"' },
    status: { type: Type.STRING, enum: ['good', 'caution', 'flag'], description: 'Overall concern level' },
    chiefComplaint: { type: Type.STRING },
    history: { type: Type.STRING },
    risks: { type: Type.ARRAY, items: { type: Type.STRING } },
    advice: { type: Type.ARRAY, items: { type: Type.STRING } },
    prescription: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { name: { type: Type.STRING }, dose: { type: Type.STRING } },
        required: ['name', 'dose'],
      },
    },
    summary: { type: Type.STRING, description: '1-2 sentence clinical summary of the visit' },
    patientSummary: {
      type: Type.STRING,
      description: 'Plain-language "what this means for you", reassuring and actionable',
    },
    diagnoses: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Named assessments/conditions' },
    testsOrdered: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Labs, imaging, or referrals ordered',
    },
    followUp: {
      type: Type.OBJECT,
      properties: {
        date: { type: Type.STRING, description: 'When to follow up, or "" if none' },
        instructions: { type: Type.STRING, description: 'Follow-up instructions, or "" if none' },
      },
      required: ['date', 'instructions'],
    },
  },
  required: [
    'doctor', 'specialty', 'facility', 'date', 'status',
    'chiefComplaint', 'history', 'risks', 'advice', 'prescription',
    'summary', 'patientSummary', 'diagnoses', 'testsOrdered', 'followUp',
  ],
};

// Turn a transcript into a structured note. Known visit context (doctor /
// specialty / facility chosen before recording) is given to the model and then
// enforced over its output so the header is never "Unknown".
export async function structureNote(
  transcript: string,
  today: string,
  context: VisitContext = {},
): Promise<StructuredNote> {
  const ctxLine =
    [
      context.doctor && `Doctor: ${context.doctor}`,
      context.specialty && `Specialty: ${context.specialty}`,
      context.facility && `Facility: ${context.facility}`,
    ]
      .filter(Boolean)
      .join('\n') || 'No visit context provided.';

  console.log(`[gemini] structureNote: transcriptChars=${transcript.length}`);

  const res = await withRetry(() => requireAi().models.generateContent({
    model: MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          {
            text:
              'You are a medical scribe. From the visit transcript below, produce a structured ' +
              'clinical note in plain language. If a field is not mentioned, infer conservatively. ' +
              `Use "${today}" if no date is mentioned. Set status to "flag" for anything urgent, ` +
              '"caution" if follow-up is advised, otherwise "good". ' +
              'Write "summary" as a 1-2 sentence clinical recap, and "patientSummary" as a warm, ' +
              'plain-language explanation the patient can act on. List "diagnoses" (named conditions) ' +
              'and "testsOrdered" (labs/imaging/referrals); use empty arrays if none. For "followUp", ' +
              'give a date and instructions, or empty strings if none.\n\n' +
              `KNOWN VISIT CONTEXT:\n${ctxLine}\n\nTRANSCRIPT:\n${transcript}`,
          },
        ],
      },
    ],
    config: { responseMimeType: 'application/json', responseSchema: NOTE_SCHEMA },
  }), 'structureNote');

  const note = JSON.parse(res.text ?? '{}') as StructuredNote;
  return applyContext(note, context);
}

// Enforce known visit context over the model's guesses, so the note header is
// never "Unknown" when we already chose the doctor/specialty/facility up front.
export function applyContext(note: StructuredNote, context: VisitContext = {}): StructuredNote {
  if (context.doctor) note.doctor = context.doctor;
  if (context.specialty) note.specialty = context.specialty;
  if (context.facility) note.facility = context.facility;
  return note;
}

export type ExtractedMarker = {
  name: string;
  value: number;
  unit: string;
  range: string;
  status: 'good' | 'caution' | 'flag';
};

// Coerce "5.6", "1,200", "12.3 %" → number.
export function toNumber(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(/,/g, '').replace(/[^0-9.\-]/g, ''));
    return Number.isFinite(n) ? n : NaN;
  }
  return NaN;
}

// Map whatever the model says into our 3 buckets.
export function normStatus(s: unknown): 'good' | 'caution' | 'flag' {
  const t = String(s ?? '').toLowerCase();
  if (/(good|normal|within|on[ -]?track|ok)/.test(t)) return 'good';
  if (/(flag|high|low|out|abnormal|critical|attention|elevated|deficien)/.test(t)) return 'flag';
  if (/(caution|borderline|watch|slightly)/.test(t)) return 'caution';
  if (t === 'good' || t === 'caution' || t === 'flag') return t as 'good' | 'caution' | 'flag';
  return 'caution';
}

export function stripFences(s: string): string {
  return s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
}

// Read an uploaded lab report and extract + classify biomarkers. Accepts one or
// more files (e.g. several photos of the same multi-page report) and treats them
// together as a single report.
export async function extractLabReport(
  files: { base64: string; mimeType: string }[],
  today: string,
): Promise<{ date: string; markers: ExtractedMarker[] }> {
  const totalKb = Math.round(files.reduce((n, f) => n + f.base64.length * 0.75, 0) / 1024);
  console.log(`[gemini] extractLabReport: ${files.length} file(s), ~${totalKb}KB`);

  const prompt =
    `These ${files.length} image(s)/file(s) are pages of ONE medical lab report. Read every results ` +
    'table carefully and extract EVERY test row you can see — be thorough, do not skip rows. ' +
    'Return ONLY JSON in exactly this shape:\n' +
    '{"date":"<report date like Jun 9, 2026>","markers":[{"name":"HbA1c","value":6.1,"unit":"%",' +
    '"range":"4.0 - 5.6","status":"caution"}]}\n' +
    'Rules: value must be a number. If a unit or range is missing on the page, use an empty string ' +
    'but STILL include the marker. Classify status: "good" if the value is within the normal range, ' +
    '"flag" if it is clearly out of range / marked High or Low / needs attention, "caution" if it is ' +
    `borderline. Use "${today}" if no date is printed. Merge duplicates across pages. If you truly ` +
    'cannot find any test values, return {"date":"","markers":[]}.';

  const res = await withRetry(() => requireAi().models.generateContent({
    model: MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          ...files.map((f) => ({ inlineData: { mimeType: f.mimeType, data: f.base64 } })),
          { text: prompt },
        ],
      },
    ],
    config: { responseMimeType: 'application/json', temperature: 0 },
  }), 'extractLabReport');

  const raw = stripFences(res.text ?? '{}');
  let parsed: { date?: string; markers?: unknown[] } = {};
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn('[gemini] could not parse response:', raw.slice(0, 300));
  }

  const markers: ExtractedMarker[] = (parsed.markers ?? [])
    .map((m) => {
      const o = m as Record<string, unknown>;
      return {
        name: String(o.name ?? '').trim(),
        value: toNumber(o.value),
        unit: String(o.unit ?? '').trim(),
        range: String(o.range ?? '').trim(),
        status: normStatus(o.status),
      };
    })
    .filter((m) => m.name && Number.isFinite(m.value));

  console.log(`[gemini] extracted ${markers.length} markers, date=${parsed.date}`);
  if (markers.length === 0) console.warn('[gemini] 0 markers — raw response:', raw.slice(0, 600));
  return { date: parsed.date || today, markers };
}
