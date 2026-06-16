import { useRouter } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StatusChip } from '@/components/status-chip';
import { Colors, Radius, Shadow, StatusStyles } from '@/constants/theme';
import { profile, statusLabel, visits } from '@/lib/mock';

const FILLED = [0, 2, 4, 5, 7, 8];

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const grid = visits.concat(visits).slice(0, 9);

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.handle}>{profile.handle}</Text>
        <Pressable
          onPress={() => router.push('/family')}
          style={({ pressed }) => [styles.familyBtn, pressed && { opacity: 0.7 }]}>
          <Text style={styles.familyText}>Family</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {/* Profile head */}
        <View style={styles.headRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>SJ</Text>
          </View>
          <View style={styles.stats}>
            <Stat value={profile.stats.visits} label="Visits" />
            <Stat value={profile.stats.reports} label="Reports" />
            <Stat value={profile.stats.doctors} label="Doctors" />
          </View>
        </View>

        <View style={{ marginTop: 16 }}>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.bio}>{profile.bio}</Text>
          <Text style={styles.joined}>{profile.joined}</Text>
        </View>

        {/* Health ID card */}
        <View style={[styles.idCard, Shadow]}>
          <View>
            <Text style={styles.idLabel}>HEALTH ID</Text>
            <Text style={styles.idValue}>IKG 4821 7730</Text>
          </View>
          <View style={styles.barcode}>
            {Array.from({ length: 9 }).map((_, i) => (
              <View
                key={i}
                style={[styles.cell, { backgroundColor: FILLED.includes(i) ? Colors.ink : Colors.hairline }]}
              />
            ))}
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.actionRow}>
          <Pressable
            onPress={() => router.push('/labs')}
            style={({ pressed }) => [styles.actionPrimary, pressed && { opacity: 0.85 }]}>
            <Text style={styles.actionPrimaryText}>Lab analytics</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/diet')}
            style={({ pressed }) => [styles.actionTint, pressed && { opacity: 0.7 }]}>
            <Text style={styles.actionTintText}>Diet chart</Text>
          </Pressable>
        </View>

        {/* Visit grid */}
        <Text style={styles.sectionLabel}>VISIT HISTORY</Text>
        <View style={styles.grid}>
          {grid.map((v, i) => (
            <Pressable
              key={`${v.id}-${i}`}
              onPress={() => router.push('/note')}
              style={[styles.gridItem, Shadow]}>
              <View style={[styles.gridDot, { backgroundColor: StatusStyles[v.status].dot }]} />
              <View>
                <Text numberOfLines={1} style={styles.gridSpecialty}>
                  {v.specialty}
                </Text>
                <Text numberOfLines={1} style={styles.gridDate}>
                  {v.date}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.overall}>
          <StatusChip status="caution" label={`Overall: ${statusLabel.caution}`} />
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.hairline,
    backgroundColor: Colors.bg,
  },
  handle: { fontSize: 17, fontWeight: '700', color: Colors.ink },
  familyBtn: { backgroundColor: Colors.primaryTint, borderRadius: Radius.pill, paddingHorizontal: 14, paddingVertical: 6 },
  familyText: { fontSize: 12, fontWeight: '700', color: Colors.primary },

  list: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: Colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(245,166,35,0.3)',
  },
  avatarText: { fontSize: 26, fontWeight: '800', color: Colors.primary },
  stats: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: Colors.ink },
  statLabel: { fontSize: 11.5, fontWeight: '600', color: Colors.inkSoft, marginTop: 1 },

  name: { fontSize: 15, fontWeight: '800', color: Colors.ink },
  bio: { fontSize: 13, lineHeight: 19, color: Colors.inkSoft, marginTop: 2 },
  joined: { fontSize: 12, fontWeight: '600', color: Colors.inkSoft, marginTop: 4, opacity: 0.8 },

  idCard: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
    padding: 16,
  },
  idLabel: { fontSize: 11, fontWeight: '700', color: Colors.primary, letterSpacing: 0.6 },
  idValue: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontSize: 14,
    fontWeight: '700',
    color: Colors.ink,
    letterSpacing: 2,
    marginTop: 4,
  },
  barcode: { width: 42, flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  cell: { width: 12, height: 12, borderRadius: 3 },

  actionRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  actionPrimary: { flex: 1, backgroundColor: Colors.primary, borderRadius: Radius.input, paddingVertical: 11, alignItems: 'center' },
  actionPrimaryText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  actionTint: { flex: 1, backgroundColor: Colors.primaryTint, borderRadius: Radius.input, paddingVertical: 11, alignItems: 'center' },
  actionTintText: { fontSize: 13, fontWeight: '700', color: Colors.primary },

  sectionLabel: { fontSize: 12, fontWeight: '700', color: Colors.inkSoft, letterSpacing: 0.6, marginTop: 24, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridItem: {
    width: '31.5%',
    aspectRatio: 1,
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: Radius.input,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
    padding: 10,
  },
  gridDot: { width: 8, height: 8, borderRadius: 4 },
  gridSpecialty: { fontSize: 11, fontWeight: '700', color: Colors.ink },
  gridDate: { fontSize: 9.5, color: Colors.inkSoft, marginTop: 1 },
  overall: { alignItems: 'center', marginTop: 24 },
});
