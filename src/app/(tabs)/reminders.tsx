import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { TabHeader } from '@/components/app-header';
import { Colors, Radius, Shadow } from '@/constants/theme';
import { reminders as seed } from '@/lib/mock';

export default function RemindersScreen() {
  const [items, setItems] = useState(seed);

  const toggle = (id: string) =>
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, on: !r.on } : r)));

  const active = items.filter((r) => r.on).length;

  return (
    <View style={styles.screen}>
      <TabHeader title="Reminders" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        <View style={styles.banner}>
          <Text style={styles.bannerEmoji}>✨</Text>
          <Text style={styles.bannerText}>
            Auto-suggested from your last visit note and what the doctor advised. Toggle off anything
            you do not need.
          </Text>
        </View>

        <Text style={styles.count}>{active} ACTIVE</Text>

        <View style={{ gap: 12 }}>
          {items.map((r) => (
            <View key={r.id} style={[styles.card, Shadow]}>
              <View style={styles.icon}>
                <Text style={styles.iconText}>{r.icon}</Text>
              </View>
              <View style={styles.body}>
                <Text style={styles.label}>{r.label}</Text>
                <Text style={styles.detail}>{r.detail}</Text>
                <View style={styles.sourceChip}>
                  <Text style={styles.sourceText}>{r.source}</Text>
                </View>
              </View>
              <Toggle on={r.on} onPress={() => toggle(r.id)} label={r.label} />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function Toggle({ on, onPress, label }: { on: boolean; onPress: () => void; label: string }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel={`Toggle ${label}`}
      onPress={onPress}
      style={[styles.track, { backgroundColor: on ? Colors.primary : Colors.hairline }]}>
      <View style={[styles.knob, { left: on ? 24 : 4 }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  list: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.primaryTint,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
    padding: 16,
  },
  bannerEmoji: { fontSize: 22 },
  bannerText: { flex: 1, fontSize: 12.5, lineHeight: 19, color: Colors.inkSoft },
  count: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.inkSoft,
    letterSpacing: 0.6,
    marginTop: 20,
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.card,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
    padding: 16,
  },
  icon: { width: 44, height: 44, borderRadius: Radius.input, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 20 },
  body: { flex: 1, gap: 2 },
  label: { fontSize: 14.5, fontWeight: '700', color: Colors.ink },
  detail: { fontSize: 12, color: Colors.inkSoft },
  sourceChip: { alignSelf: 'flex-start', backgroundColor: Colors.secondaryTint, borderRadius: Radius.pill, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 },
  sourceText: { fontSize: 10, fontWeight: '600', color: Colors.secondary },
  track: { width: 48, height: 28, borderRadius: 14, justifyContent: 'center' },
  knob: { position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF' },
});
