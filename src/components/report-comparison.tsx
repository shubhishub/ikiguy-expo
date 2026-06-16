import { StyleSheet, Text, View } from 'react-native';

import { CompareChart } from '@/components/compare-chart';
import { StatusChip } from '@/components/status-chip';
import { Colors, Radius, Shadow, StatusStyles } from '@/constants/theme';
import { labMarkers, statusLabel, type VisitStatus } from '@/lib/mock';

const fmt = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(1));

// Calm, plain-language line for each marker based on its movement and status.
function phraseFor(name: string, steady: boolean, improved: boolean, latest: VisitStatus) {
  if (steady) return `${name} is steady.`;
  if (improved) {
    return latest === 'good'
      ? `${name} improved into the healthy range.`
      : `${name} is improving, still in the ${latest === 'caution' ? 'watch' : 'attention'} range.`;
  }
  if (latest === 'good') return `${name} dipped slightly but stays healthy.`;
  return latest === 'caution' ? `${name} moved into the watch range.` : `${name} needs attention now.`;
}

export type ComparableReport = {
  label: string;
  values: Record<string, number>;
};

// Trend lines plus a plain-language "what changed" summary across two or more
// reports. Expects reports already in chronological order.
export function ReportComparison({ reports }: { reports: ComparableReport[] }) {
  const results = labMarkers.map((m) => {
    const readings = reports.map((r) => ({
      date: r.label,
      value: r.values[m.id],
      status: m.status(r.values[m.id]),
    }));
    const first = readings[0].value;
    const last = readings[readings.length - 1].value;
    const diff = last - first;
    const steady = Math.abs(diff) < m.eps;
    const improved = m.better === 'lower' ? diff < 0 : diff > 0;
    const latest = m.status(last);
    const tone: VisitStatus = steady || improved ? 'good' : latest === 'flag' ? 'flag' : 'caution';
    return { m, readings, first, last, diff, steady, improved, latest, tone };
  });

  return (
    <View>
      {/* Plain-language summary */}
      <View style={[styles.card, Shadow, { marginBottom: 16 }]}>
        <Text style={styles.summaryTitle}>WHAT CHANGED</Text>
        <View style={{ gap: 10 }}>
          {results.map((r) => (
            <View key={r.m.id} style={styles.summaryRow}>
              <View
                style={[
                  styles.summaryDot,
                  {
                    backgroundColor: r.steady
                      ? 'rgba(138,144,162,0.4)'
                      : StatusStyles[r.improved ? 'good' : r.latest].dot,
                  },
                ]}
              />
              <Text style={styles.summaryText}>
                {phraseFor(r.m.name, r.steady, r.improved, r.latest)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Per-marker trend cards */}
      <View style={{ gap: 16 }}>
        {results.map((r) => {
          const arrow = r.steady ? '→' : r.diff > 0 ? '↑' : '↓';
          const word = r.steady ? 'steady' : r.improved ? 'improved' : 'worse';
          const delta = StatusStyles[r.tone];
          return (
            <View key={r.m.id} style={[styles.card, Shadow]}>
              <View style={styles.topRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{r.m.name}</Text>
                  <Text style={styles.range}>
                    Normal: {r.m.range} {r.m.unit}
                  </Text>
                </View>
                <StatusChip status={r.latest} label={statusLabel[r.latest]} />
              </View>

              <View style={styles.valueRow}>
                <View style={styles.valueBaseline}>
                  <Text style={styles.value}>{fmt(r.last)}</Text>
                  <Text style={styles.unit}> {r.m.unit}</Text>
                </View>
                <View style={[styles.deltaPill, { backgroundColor: delta.bg }]}>
                  <Text style={[styles.deltaText, { color: delta.text }]}>
                    {arrow} {fmt(Math.abs(r.diff))} {word}
                  </Text>
                </View>
              </View>

              <View style={{ marginTop: 12 }}>
                <CompareChart readings={r.readings} />
                <View style={styles.axis}>
                  <Text style={styles.axisLabel}>{r.readings[0].date}</Text>
                  <Text style={styles.axisLabel}>{r.readings[r.readings.length - 1].date}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
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
  summaryTitle: { fontSize: 12, fontWeight: '700', color: Colors.primary, letterSpacing: 0.6, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  summaryDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  summaryText: { flex: 1, fontSize: 13, lineHeight: 20, color: Colors.ink },

  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  name: { fontSize: 15, fontWeight: '700', color: Colors.ink },
  range: { fontSize: 11.5, color: Colors.inkSoft, marginTop: 2 },
  valueRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  valueBaseline: { flexDirection: 'row', alignItems: 'baseline' },
  value: { fontSize: 24, fontWeight: '800', color: Colors.ink, letterSpacing: -0.4 },
  unit: { fontSize: 12, fontWeight: '600', color: Colors.inkSoft },
  deltaPill: { marginLeft: 'auto', borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  deltaText: { fontSize: 11.5, fontWeight: '700' },
  axis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  axisLabel: { fontSize: 10.5, fontWeight: '600', color: Colors.inkSoft },
});
