// In-memory mock data mirroring the mobile app's src/lib/mock.ts.
// Swap this out for a real database later.

export type VisitStatus = 'good' | 'caution' | 'flag';

export const visits = [
  {
    id: 'v-1042',
    doctor: 'Dr. Anita Rao',
    specialty: 'Cardiology',
    facility: 'Fortis Heart Institute',
    date: 'Jun 9, 2026',
    summary:
      'Follow up for blood pressure. Advised to continue medication and reduce salt intake.',
    status: 'caution' as VisitStatus,
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
    summary: 'Seasonal viral fever. Rest advised, fluids, and a short course of medication.',
    status: 'good' as VisitStatus,
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
    summary: 'Reviewed fasting sugar trend. Slight elevation flagged, diet plan updated.',
    status: 'flag' as VisitStatus,
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
    summary: 'Post-op review for knee. Healing well, physiotherapy continued for four weeks.',
    status: 'good' as VisitStatus,
    hasPrescription: false,
    hasLabReport: true,
    tags: ['Post-op', 'Knee'],
  },
];

export const biomarkers = [
  { id: 'hba1c', name: 'HbA1c', value: '6.1', unit: '%', status: 'caution' as VisitStatus, range: '4.0 to 5.6', points: [5.4, 5.6, 5.8, 5.7, 6.0, 6.1] },
  { id: 'ldl', name: 'LDL Cholesterol', value: '98', unit: 'mg/dL', status: 'good' as VisitStatus, range: 'Below 100', points: [120, 114, 108, 104, 101, 98] },
  { id: 'vitd', name: 'Vitamin D', value: '18', unit: 'ng/mL', status: 'flag' as VisitStatus, range: '30 to 100', points: [22, 21, 20, 19, 18, 18] },
  { id: 'hb', name: 'Hemoglobin', value: '13.4', unit: 'g/dL', status: 'good' as VisitStatus, range: '12.0 to 15.5', points: [12.8, 13.0, 13.1, 13.3, 13.2, 13.4] },
];

export const reminders = [
  { id: 'r1', label: 'Hydration', detail: '8 glasses, every 2 hours', icon: '💧', source: 'From Dr. Rao visit', on: true },
  { id: 'r2', label: 'Sugar check', detail: 'Fasting, every morning', icon: '🩸', source: 'From lab note', on: true },
  { id: 'r3', label: 'Blood pressure', detail: 'Twice daily, 9 AM and 9 PM', icon: '❤️', source: 'Doctor advised', on: true },
  { id: 'r4', label: 'Steps', detail: '6,000 steps daily', icon: '👟', source: 'From diet plan', on: false },
  { id: 'r5', label: 'Lab checkup', detail: 'HbA1c in 4 weeks', icon: '🧪', source: 'Auto from note', on: true },
];

export const profile = {
  name: 'Shubhi Jha',
  handle: '@shubhi.health',
  bio: 'One account for every appointment. Owned by me for life.',
  joined: 'Member since 2026',
  stats: { visits: 12, reports: 8, doctors: 6 },
};

export const familyMembers = [
  { id: 'f1', name: 'Shubhi Jha', relation: 'You', handle: '@shubhi.health', status: 'caution' as VisitStatus, initials: 'SJ' },
  { id: 'f2', name: 'Asha Jha', relation: 'Mother', handle: '@asha.health', status: 'good' as VisitStatus, initials: 'AJ' },
  { id: 'f3', name: 'Ravi Jha', relation: 'Father', handle: '@ravi.health', status: 'flag' as VisitStatus, initials: 'RJ' },
];
