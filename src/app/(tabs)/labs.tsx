import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { TabHeader } from '@/components/app-header';
import { Sparkline } from '@/components/sparkline';
import { StatusChip } from '@/components/status-chip';
import { Colors, Radius, Shadow } from '@/constants/theme';
import { biomarkers, statusLabel } from '@/lib/mock';

export default function LabsScreen() {
  return (
    <View style={styles.screen}>
      <TabHeader title="Lab analytics" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        <Text style={styles.intro}>
          Trends pulled from your uploaded lab reports. Six most recent readings per marker.
        </Text>

        <View style={{ gap: 16 }}>
          {biomarkers.map((b) => (
            <View key={b.id} style={[styles.card, Shadow]}>
              <View style={styles.topRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{b.name}</Text>
                  <Text style={styles.range}>
                    Normal: {b.range} {b.unit}
                  </Text>
                </View>
                <StatusChip status={b.status} label={statusLabel[b.status]} />
              </View>

              <View style={styles.valueRow}>
                <View style={styles.valueBaseline}>
                  <Text style={styles.value}>{b.value}</Text>
                  <Text style={styles.unit}> {b.unit}</Text>
                </View>
                <Sparkline points={b.points} status={b.status} />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.checkup}>
          <Text style={styles.checkupTitle}>Next checkup</Text>
          <Text style={styles.checkupBody}>
            HbA1c recheck suggested in four weeks based on your last visit note.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  list: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 },
  intro: { fontSize: 13, lineHeight: 19, color: Colors.inkSoft, marginBottom: 20 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
    padding: 16,
  },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  name: { fontSize: 15, fontWeight: '700', color: Colors.ink },
  range: { fontSize: 11.5, color: Colors.inkSoft, marginTop: 2 },
  valueRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 12 },
  valueBaseline: { flexDirection: 'row', alignItems: 'baseline' },
  value: { fontSize: 30, fontWeight: '800', color: Colors.ink, letterSpacing: -0.5 },
  unit: { fontSize: 13, fontWeight: '600', color: Colors.inkSoft },
  checkup: {
    marginTop: 20,
    backgroundColor: Colors.primaryTint,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
    padding: 16,
  },
  checkupTitle: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  checkupBody: { fontSize: 12.5, lineHeight: 19, color: Colors.inkSoft, marginTop: 4 },
});
