// Dummy data for the iKiguy AI prototype. No backend — everything is static
// here so every screen renders and is clickable. Ported from the web app.

export type VisitStatus = 'good' | 'caution' | 'flag';

export type Visit = {
  id: string;
  doctor: string;
  specialty: string;
  facility: string;
  date: string;
  summary: string;
  status: VisitStatus;
  hasPrescription: boolean;
  hasLabReport: boolean;
  tags: string[];
};

export const visits: Visit[] = [
  {
    id: 'v-1042',
    doctor: 'Dr. Anita Rao',
    specialty: 'Cardiology',
    facility: 'Fortis Heart Institute',
    date: 'Jun 9, 2026',
    summary:
      'Follow up for blood pressure. Advised to continue medication and reduce salt intake.',
    status: 'caution',
    hasPrescription: true,
    hasLabReport: true,
    tags: ['BP', 'Follow up'],
  },
  {
    id: 'v-1038',
    doctor: 'Dr. Vikram Sethi',
    specialty: 'General Medicine',
    facility: 'Apollo Clinic, Indiranagar',
    date: 'May 21, 2026',
    summary:
      'Seasonal viral fever. Rest advised, fluids, and a short course of medication.',
    status: 'good',
    hasPrescription: true,
    hasLabReport: false,
    tags: ['Fever'],
  },
  {
    id: 'v-1031',
    doctor: 'Dr. Meera Joshi',
    specialty: 'Endocrinology',
    facility: 'Manipal Hospital',
    date: 'Apr 30, 2026',
    summary:
      'Reviewed fasting sugar trend. Slight elevation flagged, diet plan updated.',
    status: 'flag',
    hasPrescription: true,
    hasLabReport: true,
    tags: ['Sugar', 'Diet'],
  },
  {
    id: 'v-1024',
    doctor: 'Dr. Rohan Iyer',
    specialty: 'Orthopedics',
    facility: 'Sparsh Hospital',
    date: 'Mar 12, 2026',
    summary:
      'Post-op review for knee. Healing well, physiotherapy continued for four weeks.',
    status: 'good',
    hasPrescription: false,
    hasLabReport: true,
    tags: ['Post-op', 'Knee'],
  },
];

export const statusLabel: Record<VisitStatus, string> = {
  good: 'On track',
  caution: 'Watch',
  flag: 'Needs attention',
};

export const profile = {
  name: 'Shubhi Jha',
  handle: '@shubhi.health',
  bio: 'One account for every appointment. Owned by me for life.',
  joined: 'Member since 2026',
  stats: {
    visits: 12,
    reports: 8,
    doctors: 6,
  },
};

export type Biomarker = {
  id: string;
  name: string;
  value: string;
  unit: string;
  status: VisitStatus;
  range: string;
  points: number[];
};

export const biomarkers: Biomarker[] = [
  {
    id: 'hba1c',
    name: 'HbA1c',
    value: '6.1',
    unit: '%',
    status: 'caution',
    range: '4.0 to 5.6',
    points: [5.4, 5.6, 5.8, 5.7, 6.0, 6.1],
  },
  {
    id: 'ldl',
    name: 'LDL Cholesterol',
    value: '98',
    unit: 'mg/dL',
    status: 'good',
    range: 'Below 100',
    points: [120, 114, 108, 104, 101, 98],
  },
  {
    id: 'vitd',
    name: 'Vitamin D',
    value: '18',
    unit: 'ng/mL',
    status: 'flag',
    range: '30 to 100',
    points: [22, 21, 20, 19, 18, 18],
  },
  {
    id: 'hb',
    name: 'Hemoglobin',
    value: '13.4',
    unit: 'g/dL',
    status: 'good',
    range: '12.0 to 15.5',
    points: [12.8, 13.0, 13.1, 13.3, 13.2, 13.4],
  },
];

export type Meal = {
  id: string;
  time: string;
  title: string;
  icon: string;
  items: string[];
};

export const dietPlan: Meal[] = [
  { id: 'm1', time: '7:30 AM', title: 'Morning', icon: '☀️', items: ['Warm water', 'Soaked almonds'] },
  { id: 'm2', time: '9:00 AM', title: 'Breakfast', icon: '🥣', items: ['Oats bowl', 'Berries', 'Green tea'] },
  { id: 'm3', time: '1:00 PM', title: 'Lunch', icon: '🍲', items: ['Brown rice', 'Dal', 'Salad'] },
  { id: 'm4', time: '5:00 PM', title: 'Snack', icon: '🍎', items: ['Apple', 'Handful of nuts'] },
  { id: 'm5', time: '8:00 PM', title: 'Dinner', icon: '🥗', items: ['Grilled veg', 'Quinoa', 'Soup'] },
];

export type Member = {
  id: string;
  name: string;
  relation: string;
  handle: string;
  status: VisitStatus;
  initials: string;
};

export const familyMembers: Member[] = [
  { id: 'f1', name: 'Shubhi Jha', relation: 'You', handle: '@shubhi.health', status: 'caution', initials: 'SJ' },
  { id: 'f2', name: 'Asha Jha', relation: 'Mother', handle: '@asha.health', status: 'good', initials: 'AJ' },
  { id: 'f3', name: 'Ravi Jha', relation: 'Father', handle: '@ravi.health', status: 'flag', initials: 'RJ' },
];

export type Reminder = {
  id: string;
  label: string;
  detail: string;
  icon: string;
  source: string;
  on: boolean;
};

export const reminders: Reminder[] = [
  { id: 'r1', label: 'Hydration', detail: '8 glasses, every 2 hours', icon: '💧', source: 'From Dr. Rao visit', on: true },
  { id: 'r2', label: 'Sugar check', detail: 'Fasting, every morning', icon: '🩸', source: 'From lab note', on: true },
  { id: 'r3', label: 'Blood pressure', detail: 'Twice daily, 9 AM and 9 PM', icon: '❤️', source: 'Doctor advised', on: true },
  { id: 'r4', label: 'Steps', detail: '6,000 steps daily', icon: '👟', source: 'From diet plan', on: false },
  { id: 'r5', label: 'Lab checkup', detail: 'HbA1c in 4 weeks', icon: '🧪', source: 'Auto from note', on: true },
];

// Lab markers used by the Reports comparison. Each knows how to grade a raw
// value into a status and which direction counts as an improvement.
export type LabMarker = {
  id: string;
  name: string;
  unit: string;
  range: string;
  /** Which direction is healthier. */
  better: 'lower' | 'higher';
  /** Below this absolute change a marker is considered "steady". */
  eps: number;
  status: (value: number) => VisitStatus;
};

export const labMarkers: LabMarker[] = [
  {
    id: 'hba1c',
    name: 'HbA1c',
    unit: '%',
    range: '4.0 to 5.6',
    better: 'lower',
    eps: 0.1,
    status: (v) => (v <= 5.6 ? 'good' : v <= 6.4 ? 'caution' : 'flag'),
  },
  {
    id: 'ldl',
    name: 'LDL Cholesterol',
    unit: 'mg/dL',
    range: 'Below 100',
    better: 'lower',
    eps: 2,
    status: (v) => (v < 100 ? 'good' : v < 130 ? 'caution' : 'flag'),
  },
  {
    id: 'vitd',
    name: 'Vitamin D',
    unit: 'ng/mL',
    range: '30 to 100',
    better: 'higher',
    eps: 1,
    status: (v) => (v >= 30 ? 'good' : v >= 20 ? 'caution' : 'flag'),
  },
  {
    id: 'hb',
    name: 'Hemoglobin',
    unit: 'g/dL',
    range: '12.0 to 15.5',
    better: 'higher',
    eps: 0.2,
    status: (v) => (v >= 12 ? 'good' : v >= 11 ? 'caution' : 'flag'),
  },
];

// A patient-uploaded lab report with the markers parsed out of it.
export type LabFileReport = {
  id: string;
  fileName: string;
  dateAdded: string;
  label: string;
  values: Record<string, number>;
};

// Seed reports, oldest to newest, so trends read left-to-right.
export const seedReports: LabFileReport[] = [
  { id: 'rep-1', fileName: 'Lab_report_Jan.pdf', dateAdded: 'Jan 12, 2026', label: 'Jan', values: { hba1c: 5.6, ldl: 120, vitd: 20, hb: 13.0 } },
  { id: 'rep-2', fileName: 'Lab_report_Mar.pdf', dateAdded: 'Mar 30, 2026', label: 'Mar', values: { hba1c: 5.8, ldl: 108, vitd: 19, hb: 13.2 } },
  { id: 'rep-3', fileName: 'Lab_report_Jun.pdf', dateAdded: 'Jun 9, 2026', label: 'Jun', values: { hba1c: 6.1, ldl: 98, vitd: 18, hb: 13.4 } },
];

// Generate realistic mock biomarker values that drift slightly from the last
// report, so each new upload produces a natural-looking next point.
export function nextReportValues(last: Record<string, number>): Record<string, number> {
  const round1 = (n: number) => Math.round(n * 10) / 10;
  const jitter = (amt: number) => (Math.random() - 0.5) * amt;
  return {
    hba1c: round1(last.hba1c + jitter(0.4)),
    ldl: Math.round(last.ldl + jitter(16)),
    vitd: round1(last.vitd + jitter(4)),
    hb: round1(last.hb + jitter(0.6)),
  };
}

// Mock structured note for the Generated Medical Note screen.
export const generatedNote = {
  visit: visits[0],
  chiefComplaint:
    'Patient reports occasional headaches and elevated blood pressure readings at home over the past two weeks.',
  history:
    'Known hypertensive for three years, on regular medication. No chest pain, no breathlessness. Reports higher work stress and reduced sleep recently. Home readings around 150 over 95.',
  risks: [
    'Uncontrolled blood pressure if salt intake stays high',
    'Sleep deficit may worsen readings',
  ],
  postOpAdvice: [
    'Continue current medication at the same dose',
    'Reduce salt, avoid processed and packaged food',
    'Recheck blood pressure in two weeks',
    'Return earlier if headaches worsen',
  ],
  prescription: [
    { name: 'Telmisartan 40mg', dose: '1 tablet, morning' },
    { name: 'Amlodipine 5mg', dose: '1 tablet, night' },
  ],
};
