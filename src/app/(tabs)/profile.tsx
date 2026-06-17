import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StatusChip } from '@/components/status-chip';
import { Colors, Radius, Shadow, StatusStyles } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import { deleteAccount, listReports, listVisits, type NoteRecord } from '@/lib/api';
import { profile, statusLabel, type VisitStatus } from '@/lib/mock';

const FILLED = [0, 2, 4, 5, 7, 8];
const rank: Record<VisitStatus, number> = { good: 0, caution: 1, flag: 2 };

function orUnknown(v: string | undefined | null, fallback: string) {
  const s = (v ?? '').trim();
  return !s || /^unknown/i.test(s) ? fallback : s;
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { fullName, initials, email, userId, signOut } = useAuth();

  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [reportCount, setReportCount] = useState(0);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const [{ notes: n }, { reports }] = await Promise.all([listVisits(userId), listReports(userId)]);
      setNotes(n);
      setReportCount(reports.length);
    } catch {
      /* keep last */
    }
  }, [userId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const displayName = fullName || profile.name;
  const handle = email ? `@${email.split('@')[0]}` : profile.handle;

  // Dynamic stats.
  const visitCount = notes.length;
  const doctorCount = new Set(
    notes.map((n) => n.doctor?.trim().toLowerCase()).filter((d) => d && !/^unknown/.test(d)),
  ).size;

  // Overall = most concerning recent status.
  const overall: VisitStatus = notes.reduce<VisitStatus>(
    (worst, n) => (rank[n.status] > rank[worst] ? n.status : worst),
    'good',
  );

  const grid = notes.slice(0, 9);

  function confirmDelete() {
    Alert.alert(
      'Delete account',
      'This permanently deletes your account and all visits, notes, recordings and reports. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: async () => {
            try {
              if (userId) await deleteAccount(userId);
            } catch {
              /* still sign out locally */
            } finally {
              await signOut();
            }
          },
        },
      ],
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.handle}>{handle}</Text>
        <Pressable onPress={() => router.push('/family')} style={({ pressed }) => [styles.familyBtn, pressed && { opacity: 0.7 }]}>
          <Text style={styles.familyText}>Family</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        <View style={styles.headRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.stats}>
            <Stat value={visitCount} label="Visits" />
            <Stat value={reportCount} label="Reports" />
            <Stat value={doctorCount} label="Doctors" />
          </View>
        </View>

        <View style={{ marginTop: 16 }}>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.bio}>{profile.bio}</Text>
          {!!email && <Text style={styles.joined}>{email}</Text>}
        </View>

        {/* Health ID card */}
        <View style={[styles.idCard, Shadow]}>
          <View>
            <Text style={styles.idLabel}>HEALTH ID</Text>
            <Text style={styles.idValue}>IKG 4821 7730</Text>
          </View>
          <View style={styles.barcode}>
            {Array.from({ length: 9 }).map((_, i) => (
              <View key={i} style={[styles.cell, { backgroundColor: FILLED.includes(i) ? Colors.ink : Colors.hairline }]} />
            ))}
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.actionRow}>
          <Pressable onPress={() => router.push('/reports')} style={({ pressed }) => [styles.actionPrimary, pressed && { opacity: 0.85 }]}>
            <Text style={styles.actionPrimaryText}>Lab reports</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/diet')} style={({ pressed }) => [styles.actionTint, pressed && { opacity: 0.7 }]}>
            <Text style={styles.actionTintText}>Diet chart</Text>
          </Pressable>
        </View>

        {/* Visit grid */}
        <Text style={styles.sectionLabel}>VISIT HISTORY</Text>
        {grid.length === 0 ? (
          <View style={styles.emptyGrid}>
            <Text style={styles.emptyGridText}>No visits yet. Record one from the Visits tab.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {grid.map((v) => (
              <Pressable
                key={v._id ?? v.sessionId}
                onPress={() => router.push({ pathname: '/note', params: { sessionId: v.sessionId } })}
                style={[styles.gridItem, Shadow]}>
                <View style={[styles.gridDot, { backgroundColor: StatusStyles[v.status].dot }]} />
                <View>
                  <Text numberOfLines={1} style={styles.gridSpecialty}>{orUnknown(v.specialty, 'General')}</Text>
                  <Text numberOfLines={1} style={styles.gridDate}>{v.date}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {visitCount > 0 && (
          <View style={styles.overall}>
            <StatusChip status={overall} label={`Overall: ${statusLabel[overall]}`} />
          </View>
        )}

        {/* Account */}
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <Pressable onPress={signOut} style={({ pressed }) => [styles.signOut, pressed && { opacity: 0.7 }]}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
        <Pressable onPress={confirmDelete} style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.7 }]}>
          <Text style={styles.deleteText}>Delete account</Text>
        </Pressable>
        <Text style={styles.deleteHint}>Permanently removes all your visits, notes, recordings and reports.</Text>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.hairline, backgroundColor: Colors.bg,
  },
  handle: { fontSize: 17, fontWeight: '700', color: Colors.ink },
  familyBtn: { backgroundColor: Colors.primaryTint, borderRadius: Radius.pill, paddingHorizontal: 14, paddingVertical: 6 },
  familyText: { fontSize: 12, fontWeight: '700', color: Colors.primary },

  list: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 140 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  avatar: {
    width: 78, height: 78, borderRadius: 39, backgroundColor: Colors.primaryTint,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(245,166,35,0.3)',
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
    marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.card, borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.hairline, padding: 16,
  },
  idLabel: { fontSize: 11, fontWeight: '700', color: Colors.primary, letterSpacing: 0.6 },
  idValue: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontSize: 14, fontWeight: '700', color: Colors.ink, letterSpacing: 2, marginTop: 4,
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
    width: '31.5%', aspectRatio: 1, justifyContent: 'space-between',
    backgroundColor: Colors.card, borderRadius: Radius.input,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.hairline, padding: 10,
  },
  gridDot: { width: 8, height: 8, borderRadius: 4 },
  gridSpecialty: { fontSize: 11, fontWeight: '700', color: Colors.ink },
  gridDate: { fontSize: 9.5, color: Colors.inkSoft, marginTop: 1 },
  emptyGrid: {
    backgroundColor: Colors.card, borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.hairline, padding: 20, alignItems: 'center',
  },
  emptyGridText: { fontSize: 13, color: Colors.inkSoft, textAlign: 'center' },
  overall: { alignItems: 'center', marginTop: 24 },

  signOut: {
    backgroundColor: Colors.card, borderRadius: Radius.input,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.hairline,
    paddingVertical: 14, alignItems: 'center',
  },
  signOutText: { fontSize: 14, fontWeight: '700', color: Colors.ink },
  deleteBtn: {
    backgroundColor: '#FDEAF1', borderRadius: Radius.input,
    paddingVertical: 14, alignItems: 'center', marginTop: 10,
  },
  deleteText: { fontSize: 14, fontWeight: '700', color: '#D85488' },
  deleteHint: { fontSize: 11.5, lineHeight: 16, color: Colors.inkSoft, textAlign: 'center', marginTop: 10 },
});
