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

// Transcribe a single audio chunk verbatim.
export async function transcribeAudio(base64: string, mimeType: string): Promise<string> {
  const res = await requireAi().models.generateContent({
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
  });
  return (res.text ?? '').trim();
}

const NOTE_SCHEMA = {
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
  },
  required: [
    'doctor',
    'specialty',
    'facility',
    'date',
    'status',
    'chiefComplaint',
    'history',
    'risks',
    'advice',
    'prescription',
  ],
};

// Turn a full transcript into a structured medical note.
export async function structureNote(transcript: string, today: string): Promise<StructuredNote> {
  const res = await requireAi().models.generateContent({
    model: MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          {
            text:
              'You are a medical scribe. From the following doctor-patient visit transcript, produce a ' +
              'structured clinical note. Use clear, plain language. If a field is not mentioned, infer ' +
              `conservatively or use a sensible placeholder. Use "${today}" if no date is mentioned. ` +
              'Set status to "flag" if anything needs urgent attention, "caution" if follow-up is advised, ' +
              'otherwise "good".\n\nTRANSCRIPT:\n' +
              transcript,
          },
        ],
      },
    ],
    config: { responseMimeType: 'application/json', responseSchema: NOTE_SCHEMA },
  });

  const raw = res.text ?? '{}';
  return JSON.parse(raw) as StructuredNote;
}
