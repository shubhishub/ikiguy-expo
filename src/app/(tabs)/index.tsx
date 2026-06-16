import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { Mascot } from '@/components/mascot';
import { SessionCard } from '@/components/session-card';
import { Colors, Radius } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import { listVisits, type NoteRecord } from '@/lib/api';

export default function VisitsScreen() {
  const { firstName, userId } = useAuth();
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!userId) {
      setNotes([]);
      setLoading(false);
      return;
    }
    try {
      const { notes: list } = await listVisits(userId);
      setNotes(list);
    } catch {
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Refresh whenever the tab regains focus (after recording / editing).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <View style={styles.screen}>
      <AppHeader />
      <FlatList
        data={notes}
        keyExtractor={(n) => n._id ?? n.sessionId}
        renderItem={({ item }) => <SessionCard note={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListHeaderComponent={
          <View style={styles.intro}>
            <View style={{ flex: 1 }}>
              <Text style={styles.welcome}>Welcome back</Text>
              <Text style={styles.title}>{firstName}, your visit log</Text>
            </View>
            <Mascot status="good" size={76} />
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.empty}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No visits yet</Text>
              <Text style={styles.emptyText}>
                Tap the mic button to record your first visit. Your structured note will appear here.
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  list: { paddingHorizontal: 20, paddingBottom: 140, gap: 16, flexGrow: 1 },
  intro: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 20, paddingBottom: 8 },
  welcome: { fontSize: 13, fontWeight: '600', color: Colors.inkSoft },
  title: { fontSize: 24, fontWeight: '800', color: Colors.ink, letterSpacing: -0.4, marginTop: 2 },
  empty: { paddingTop: 60, alignItems: 'center' },
  emptyCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
    padding: 28,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: Colors.ink },
  emptyText: { fontSize: 13.5, lineHeight: 20, color: Colors.inkSoft, textAlign: 'center' },
});
