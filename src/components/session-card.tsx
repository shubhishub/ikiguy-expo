import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EditIcon } from '@/components/icons';
import { StatusChip } from '@/components/status-chip';
import { Colors, Radius, Shadow } from '@/constants/theme';
import { statusLabel, type VisitStatus } from '@/lib/mock';
import type { NoteRecord } from '@/lib/api';

// Treat empty / model-placeholder values as "unknown".
function orUnknown(value: string | undefined | null, fallback: string) {
  const v = (value ?? '').trim();
  if (!v || /^unknown/i.test(v)) return fallback;
  return v;
}

// A recorded visit on the home feed, built from a stored note.
export function SessionCard({ note }: { note: NoteRecord }) {
  const router = useRouter();
  const doctor = orUnknown(note.doctor, 'Unknown doctor');
  const specialty = orUnknown(note.specialty, 'General');
  const facility = orUnknown(note.facility, 'Unknown location');
  const status = (note.status ?? 'good') as VisitStatus;

  return (
    <View style={[styles.card, Shadow]}>
      <Pressable onPress={() => router.push({ pathname: '/note', params: { sessionId: note.sessionId } })}>
        <View style={styles.topRow}>
          <View style={styles.titleCol}>
            <Text numberOfLines={1} style={styles.doctor}>
              {doctor}
            </Text>
            <Text numberOfLines={1} style={styles.meta}>
              {specialty} · {facility}
            </Text>
          </View>
          <StatusChip status={status} label={statusLabel[status]} />
        </View>

        {!!note.chiefComplaint && (
          <Text numberOfLines={2} style={styles.summary}>
            {note.chiefComplaint}
          </Text>
        )}

        <View style={styles.chips}>
          <View style={styles.dateChip}>
            <Text style={styles.dateChipText}>{note.date}</Text>
          </View>
        </View>
      </Pressable>

      <View style={styles.divider} />

      <Pressable
        onPress={() => router.push({ pathname: '/session-edit', params: { sessionId: note.sessionId } })}
        style={({ pressed }) => [styles.editBtn, pressed && styles.editPressed]}>
        <EditIcon size={16} color={Colors.primary} />
        <Text style={styles.editLabel}>Edit details</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
    padding: 16,
  },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  titleCol: { flex: 1, minWidth: 0 },
  doctor: { fontSize: 16, fontWeight: '700', color: Colors.ink },
  meta: { fontSize: 12.5, color: Colors.inkSoft, marginTop: 2 },
  summary: { fontSize: 13.5, lineHeight: 20, color: Colors.inkSoft, marginTop: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 12 },
  dateChip: { backgroundColor: Colors.bg, borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  dateChipText: { fontSize: 11, fontWeight: '600', color: Colors.inkSoft },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.hairline, marginTop: 16, marginBottom: 12 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primaryTint,
    borderRadius: Radius.input,
    paddingVertical: 10,
  },
  editPressed: { opacity: 0.7 },
  editLabel: { fontSize: 13, fontWeight: '700', color: Colors.primary },
});
