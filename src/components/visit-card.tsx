import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Shadow } from '@/constants/theme';
import { statusLabel, type Visit } from '@/lib/mock';
import { CameraIcon, FileIcon, PillIcon, UploadIcon } from './icons';
import { StatusChip } from './status-chip';

export function VisitCard({ visit }: { visit: Visit }) {
  const router = useRouter();
  const open = () => router.push('/note');

  return (
    <View style={[styles.card, Shadow]}>
      <Pressable onPress={open}>
        <View style={styles.topRow}>
          <View style={styles.titleCol}>
            <Text numberOfLines={1} style={styles.doctor}>
              {visit.doctor}
            </Text>
            <Text style={styles.meta}>
              {visit.specialty} · {visit.facility}
            </Text>
          </View>
          <StatusChip status={visit.status} label={statusLabel[visit.status]} />
        </View>

        <Text style={styles.summary}>{visit.summary}</Text>

        <View style={styles.chips}>
          <View style={styles.dateChip}>
            <Text style={styles.dateChipText}>{visit.date}</Text>
          </View>
          {visit.tags.map((tag) => (
            <View key={tag} style={styles.tagChip}>
              <Text style={styles.tagChipText}>{tag}</Text>
            </View>
          ))}
        </View>
      </Pressable>

      <View style={styles.divider} />

      <View style={styles.actions}>
        <ActionButton
          variant="primary"
          icon={<CameraIcon size={17} color={Colors.primary} />}
          trailing={visit.hasPrescription ? <PillIcon size={15} color={Colors.primary} /> : undefined}
          label={visit.hasPrescription ? 'Prescription' : 'Add prescription'}
        />
        <ActionButton
          variant="secondary"
          icon={
            visit.hasLabReport ? (
              <FileIcon size={16} color={Colors.secondary} />
            ) : (
              <UploadIcon size={16} color={Colors.secondary} />
            )
          }
          label={visit.hasLabReport ? 'Lab report' : 'Add lab report'}
        />
      </View>
    </View>
  );
}

function ActionButton({
  icon,
  label,
  trailing,
  variant,
}: {
  icon: React.ReactNode;
  label: string;
  trailing?: React.ReactNode;
  variant: 'primary' | 'secondary';
}) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionBtn,
        { backgroundColor: isPrimary ? Colors.primaryTint : Colors.secondaryTint },
        pressed && styles.actionPressed,
      ]}>
      {icon}
      <Text style={[styles.actionLabel, { color: isPrimary ? Colors.primary : Colors.secondary }]}>
        {label}
      </Text>
      {trailing}
    </Pressable>
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
  tagChip: { backgroundColor: Colors.secondaryTint, borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  tagChipText: { fontSize: 11, fontWeight: '600', color: Colors.secondary },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.hairline, marginTop: 16, marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: Radius.input,
    paddingVertical: 10,
  },
  actionPressed: { opacity: 0.7 },
  actionLabel: { fontSize: 12.5, fontWeight: '700' },
});
