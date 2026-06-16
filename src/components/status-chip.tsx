import { StyleSheet, Text, View } from 'react-native';

import { Radius, StatusStyles } from '@/constants/theme';
import type { VisitStatus } from '@/lib/mock';

export function StatusChip({ status, label }: { status: VisitStatus; label: string }) {
  const s = StatusStyles[status];
  return (
    <View style={[styles.chip, { backgroundColor: s.bg }]}>
      <View style={[styles.dot, { backgroundColor: s.dot }]} />
      <Text style={[styles.label, { color: s.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 11.5, fontWeight: '700' },
});
