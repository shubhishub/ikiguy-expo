import { describe, expect, it } from 'bun:test';

import { applyContext, NOTE_SCHEMA, normStatus, stripFences, toNumber, type StructuredNote } from './gemini.ts';

// The SDK call itself is exercised end-to-end (with an injected fake) in
// routes.test.ts. Here we cover the deterministic, network-free logic.

describe('toNumber', () => {
  it('parses numbers, commas and trailing units', () => {
    expect(toNumber(5.6)).toBe(5.6);
    expect(toNumber('1,200')).toBe(1200);
    expect(toNumber('12.3 %')).toBe(12.3);
  });
  it('returns NaN for non-numeric input', () => {
    expect(Number.isNaN(toNumber('abc'))).toBe(true);
    expect(Number.isNaN(toNumber(null))).toBe(true);
  });
});

describe('normStatus', () => {
  it('maps synonyms into the three buckets', () => {
    expect(normStatus('normal')).toBe('good');
    expect(normStatus('High')).toBe('flag');
    expect(normStatus('borderline')).toBe('caution');
    expect(normStatus('mystery')).toBe('caution'); // default
  });
});

describe('stripFences', () => {
  it('removes ```json fences', () => {
    expect(stripFences('```json\n{"a":1}\n```')).toBe('{"a":1}');
    expect(stripFences('{"a":1}')).toBe('{"a":1}');
  });
});

describe('applyContext', () => {
  const base = (): StructuredNote => ({
    doctor: 'Unknown', specialty: 'General', facility: 'Unknown', date: 'Jun 9, 2026',
    status: 'good', chiefComplaint: '', history: '', risks: [], advice: [], prescription: [],
    summary: '', patientSummary: '', diagnoses: [], testsOrdered: [],
    followUp: { date: '', instructions: '' },
  });

  it('overrides header fields with known context', () => {
    const note = applyContext(base(), { doctor: 'Dr. Rivera', specialty: 'Cardiology', facility: 'Hill Clinic' });
    expect(note.doctor).toBe('Dr. Rivera');
    expect(note.specialty).toBe('Cardiology');
    expect(note.facility).toBe('Hill Clinic');
  });

  it('leaves model output untouched when no context is given', () => {
    const note = applyContext({ ...base(), doctor: 'Dr. Who' }, {});
    expect(note.doctor).toBe('Dr. Who');
  });
});

describe('NOTE_SCHEMA', () => {
  it('requires the expanded note fields', () => {
    for (const field of ['summary', 'patientSummary', 'diagnoses', 'testsOrdered', 'followUp']) {
      expect(NOTE_SCHEMA.properties).toHaveProperty(field);
      expect(NOTE_SCHEMA.required).toContain(field);
    }
  });
});
