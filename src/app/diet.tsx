import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/screen-header';
import { Colors, Radius, Shadow } from '@/constants/theme';
import { dietPlan } from '@/lib/mock';

const summary = [
  { icon: '🔥', v: '1,650', l: 'kcal' },
  { icon: '💧', v: '2.5 L', l: 'water' },
  { icon: '🥗', v: '5', l: 'meals' },
];

// Screen 7: Diet Chart. Visual, icon led, low text.
export default function DietScreen() {
  return (
    <View style={styles.screen}>
      <ScreenHeader title="Today's plan" back="/" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {/* Daily summary chips */}
        <View style={styles.summaryRow}>
          {summary.map((s) => (
            <View key={s.l} style={[styles.summaryCard, Shadow]}>
              <Text style={styles.summaryIcon}>{s.icon}</Text>
              <Text style={styles.summaryValue}>{s.v}</Text>
              <Text style={styles.summaryLabel}>{s.l}</Text>
            </View>
          ))}
        </View>

        {/* Timeline of meals */}
        <View style={styles.timeline}>
          <View style={styles.rail} />
          {dietPlan.map((m) => (
            <View key={m.id} style={styles.mealRow}>
              <View style={styles.dot} />
              <View style={[styles.mealCard, Shadow]}>
                <View style={styles.mealIcon}>
                  <Text style={styles.mealEmoji}>{m.icon}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={styles.mealHead}>
                    <Text style={styles.mealTitle}>{m.title}</Text>
                    <Text style={styles.mealTime}>{m.time}</Text>
                  </View>
                  <View style={styles.items}>
                    {m.items.map((it) => (
                      <View key={it} style={styles.itemChip}>
                        <Text style={styles.itemText}>{it}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.note}>
          <Text style={styles.noteEmoji}>🥑</Text>
          <Text style={styles.noteText}>
            Low salt, low sugar. Tuned to your last visit and lab trends.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  list: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
    paddingVertical: 12,
  },
  summaryIcon: { fontSize: 22 },
  summaryValue: { fontSize: 15, fontWeight: '800', color: Colors.ink, marginTop: 4 },
  summaryLabel: { fontSize: 11, fontWeight: '600', color: Colors.inkSoft },

  timeline: { paddingLeft: 24 },
  rail: { position: 'absolute', left: 7, top: 12, bottom: 12, width: 2, borderRadius: 1, backgroundColor: Colors.hairline },
  mealRow: { position: 'relative', marginBottom: 12 },
  dot: {
    position: 'absolute',
    left: -21,
    top: 20,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: Colors.bg,
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
    padding: 14,
  },
  mealIcon: { width: 48, height: 48, borderRadius: Radius.input, backgroundColor: Colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  mealEmoji: { fontSize: 24 },
  mealHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mealTitle: { fontSize: 14, fontWeight: '700', color: Colors.ink },
  mealTime: { fontSize: 11, fontWeight: '600', color: Colors.inkSoft },
  items: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  itemChip: { backgroundColor: Colors.bg, borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  itemText: { fontSize: 11, fontWeight: '600', color: Colors.inkSoft },

  note: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.secondaryTint,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
    padding: 16,
  },
  noteEmoji: { fontSize: 24 },
  noteText: { flex: 1, fontSize: 12.5, lineHeight: 19, color: Colors.secondaryInk },
});
