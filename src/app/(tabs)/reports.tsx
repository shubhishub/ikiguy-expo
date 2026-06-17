import * as DocumentPicker from 'expo-document-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { TabHeader } from '@/components/app-header';
import { FileIcon, UploadIcon, XIcon } from '@/components/icons';
import { Sparkline } from '@/components/sparkline';
import { StatusChip } from '@/components/status-chip';
import { Colors, Radius, Shadow, StatusStyles } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import {
  deleteReport,
  listReports,
  uploadReport,
  uploadReportPhotos,
  type LabReport,
  type MarkerStatus,
  type ReportMarker,
} from '@/lib/api';
import { statusLabel } from '@/lib/mock';

const fmt = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(1));
const sig = (r: LabReport) => `${r.date}|${r.markers.map((m) => `${m.id}:${m.value}`).sort().join(',')}`;

// Common, easily-trackable markers shown by default (everything else is behind
// "Show all"). Keeps the page focused instead of dumping all 100 CBC rows.
const KEY_PATTERNS: RegExp[] = [
  /h[a]?emoglobin|\bhb\b|hba1c|a1c|glycated/,
  /glucose|blood sugar|\bfbs\b|\brbs\b|\bsugar\b/,
  /cholesterol|\bldl\b|\bhdl\b|triglyceride|\blipid\b/,
  /blood pressure|systolic|diastolic|\bbp\b/,
  /vitamin\s*d|25-hydroxy/,
  /vitamin\s*b\s*-?12|cobalamin/,
  /\btsh\b|thyroid|\bt3\b|\bt4\b/,
  /creatinine|\burea\b|\bbun\b/,
  /\btlc\b|wbc|white blood|leukocyte/,
  /platelet/,
];
const rankOf = (s: MarkerStatus) => (s === 'flag' ? 2 : s === 'caution' ? 1 : 0);
function isKeyMarker(m: ReportMarker): boolean {
  const t = `${m.name} ${m.id}`.toLowerCase();
  return KEY_PATTERNS.some((re) => re.test(t));
}

function dedupeReports(list: LabReport[]): LabReport[] {
  const seen = new Set<string>();
  const out: LabReport[] = [];
  for (const r of list) {
    const s = sig(r);
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(r);
  }
  return out;
}

export default function ReportsScreen() {
  const { userId } = useAuth();
  const [reports, setReports] = useState<LabReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const load = useCallback(async () => {
    if (!userId) {
      setReports([]);
      setLoading(false);
      return;
    }
    try {
      const { reports: list } = await listReports(userId);
      setReports(list);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Identical re-uploads shouldn't count as separate reports.
  const unique = useMemo(() => dedupeReports(reports), [reports]);
  const latest = unique[0];

  // Per-marker value history (oldest -> newest) for the inline sparkline.
  const trends = useMemo(() => {
    const asc = [...unique].reverse();
    const m = new Map<string, number[]>();
    for (const r of asc) for (const mk of r.markers) {
      const a = m.get(mk.id) ?? [];
      a.push(mk.value);
      m.set(mk.id, a);
    }
    return m;
  }, [unique]);

  function onUpload() {
    if (!userId || uploading) return;
    Alert.alert('Add a lab report', 'Pick photos of the report or choose a PDF / file.', [
      { text: 'Photos', onPress: pickPhotos },
      { text: 'PDF / File', onPress: pickFile },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function pickPhotos() {
    if (!userId) return;
    setError(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('Photo library permission is required.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 10,
    });
    if (res.canceled || !res.assets?.length) return;
    try {
      setUploading(true);
      const images = await Promise.all(
        res.assets.map(async (a) => {
          const resize = a.width && a.width > 2200 ? [{ resize: { width: 2200 } }] : [];
          const out = await manipulateAsync(a.uri, resize, { compress: 0.7, format: SaveFormat.JPEG, base64: true });
          return { data: out.base64 as string, mimeType: 'image/jpeg' };
        }),
      );
      const { markerCount } = await uploadReportPhotos(userId, images);
      await load();
      if (markerCount === 0) setError('No values could be read. Try clearer, well-lit photos or a PDF.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read those photos.');
    } finally {
      setUploading(false);
    }
  }

  async function pickFile() {
    if (!userId) return;
    setError(null);
    const res = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true });
    if (res.canceled || !res.assets?.[0]) return;
    const asset = res.assets[0];
    try {
      setUploading(true);
      const { markerCount } = await uploadReport(userId, asset.uri, asset.mimeType ?? 'application/pdf');
      await load();
      if (markerCount === 0) setError('No values could be read. Try a clearer file.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that report.');
    } finally {
      setUploading(false);
    }
  }

  async function onDelete(id: string) {
    setReports((prev) => prev.filter((r) => r._id !== id));
    try {
      await deleteReport(id);
    } catch {
      load();
    }
  }

  const counts = countByStatus(latest);
  const all = latest?.markers ?? [];
  // Default: the curated key markers (flagged first), capped at 10. Fall back to
  // flagged markers if a report happens to contain none of the key ones.
  const keyMarkers = all.filter(isKeyMarker).sort((a, b) => rankOf(b.status) - rankOf(a.status));
  const base = (keyMarkers.length ? keyMarkers : all.filter((m) => m.status !== 'good')).slice(0, 10);
  const visible = showAll ? all : base;
  const hidden = all.length - base.length;

  return (
    <View style={styles.screen}>
      <TabHeader title="Reports" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        <Text style={styles.title}>Your lab reports</Text>
        <Text style={styles.subtitle}>
          Upload a report and iKiguy AI reads it, flags what needs attention, and tracks your trends.
        </Text>

        {/* Upload */}
        <Pressable
          onPress={onUpload}
          disabled={uploading}
          style={({ pressed }) => [styles.dropZone, pressed && { borderColor: Colors.primary, backgroundColor: Colors.primaryTint }]}>
          {uploading ? (
            <>
              <ActivityIndicator color={Colors.primary} />
              <Text style={styles.dropTitle}>Reading your report…</Text>
              <Text style={styles.dropHint}>A multi-page PDF can take up to a minute.</Text>
            </>
          ) : (
            <>
              <View style={styles.uploadIcon}>
                <UploadIcon size={24} color={Colors.primary} />
              </View>
              <Text style={styles.dropTitle}>Upload a lab report</Text>
              <Text style={styles.dropHint}>PDF, or pick multiple photos as one report</Text>
            </>
          )}
        </Pressable>
        {error && <Text style={styles.error}>{error}</Text>}

        {loading ? (
          <View style={{ paddingTop: 40, alignItems: 'center' }}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : !latest ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No reports yet</Text>
            <Text style={styles.emptyText}>Upload your first lab report to see it analyzed here.</Text>
          </View>
        ) : (
          <>
            {/* Summary of the latest report */}
            <View style={styles.summaryRow}>
              {counts.flag > 0 && <SummaryChip status="flag" n={counts.flag} word="need attention" />}
              {counts.caution > 0 && <SummaryChip status="caution" n={counts.caution} word="to watch" />}
              {counts.good > 0 && <SummaryChip status="good" n={counts.good} word="on track" />}
            </View>

            <View style={styles.sectionHead}>
              <Text style={styles.sectionLabel}>{showAll ? 'ALL RESULTS' : 'KEY RESULTS'}</Text>
              <Text style={styles.sectionMeta}>{latest.date}</Text>
            </View>

            {visible.length === 0 ? (
              <View style={styles.allGood}>
                <Text style={styles.allGoodText}>All {all.length} results are on track 🎉</Text>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {visible.map((m) => (
                  <MarkerCard key={m.id} m={m} points={trends.get(m.id)} />
                ))}
              </View>
            )}

            {/* Toggle curated key results vs everything */}
            {hidden > 0 && (
              <Pressable onPress={() => setShowAll((s) => !s)} style={({ pressed }) => [styles.toggle, pressed && { opacity: 0.7 }]}>
                <Text style={styles.toggleText}>
                  {showAll ? 'Show key results' : `Show all results (${all.length})`}
                </Text>
              </Pressable>
            )}

            {/* Uploaded files */}
            <Text style={[styles.sectionLabel, { marginTop: 28, marginBottom: 12 }]}>YOUR FILES</Text>
            <View style={{ gap: 10 }}>
              {reports.map((r) => (
                <View key={r._id} style={[styles.fileRow, Shadow]}>
                  <View style={styles.fileIcon}>
                    <FileIcon size={18} color={Colors.secondary} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={styles.fileName}>{r.fileName}</Text>
                    <Text style={styles.fileMeta}>{r.date} · {r.markers.length} markers</Text>
                  </View>
                  <Pressable onPress={() => onDelete(r._id)} hitSlop={8} style={styles.removeBtn}>
                    <XIcon size={17} color={Colors.inkSoft} />
                  </Pressable>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function MarkerCard({ m, points }: { m: ReportMarker; points?: number[] }) {
  const sparkPoints = points && points.length >= 2 && new Set(points).size > 1 ? points : null;
  const diff = sparkPoints ? sparkPoints[sparkPoints.length - 1] - sparkPoints[0] : 0;

  return (
    <View style={[styles.markerCard, Shadow]}>
      <View style={styles.markerTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.markerName}>{m.name}</Text>
          <Text style={styles.markerRange}>Normal: {m.range || 'not stated'}</Text>
        </View>
        <View style={styles.markerRight}>
          <Text style={styles.markerValue}>
            {m.value}
            <Text style={styles.markerUnit}> {m.unit}</Text>
          </Text>
          <StatusChip status={m.status} label={statusLabel[m.status]} />
        </View>
      </View>
      {sparkPoints && (
        <View style={styles.trendRow}>
          <Sparkline points={sparkPoints} status={m.status} width={200} height={38} />
          <Text style={styles.trendCaption}>
            {diff === 0 ? 'no change' : `${diff > 0 ? '↑' : '↓'} ${fmt(Math.abs(diff))}`} over {sparkPoints.length} reports
          </Text>
        </View>
      )}
    </View>
  );
}

function countByStatus(report?: LabReport) {
  const c = { good: 0, caution: 0, flag: 0 };
  report?.markers.forEach((m) => { c[m.status] += 1; });
  return c;
}

function SummaryChip({ status, n, word }: { status: MarkerStatus; n: number; word: string }) {
  const s = StatusStyles[status];
  return (
    <View style={[styles.sumChip, { backgroundColor: s.bg }]}>
      <Text style={[styles.sumChipNum, { color: s.text }]}>{n}</Text>
      <Text style={[styles.sumChipWord, { color: s.text }]}>{word}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  list: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.ink, letterSpacing: -0.4 },
  subtitle: { fontSize: 13, lineHeight: 19, color: Colors.inkSoft, marginTop: 4, marginBottom: 20 },
  dropZone: {
    alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 2, borderColor: Colors.hairline, borderStyle: 'dashed',
    borderRadius: Radius.input, backgroundColor: Colors.bg, paddingVertical: 28,
  },
  uploadIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  dropTitle: { fontSize: 13.5, fontWeight: '700', color: Colors.ink },
  dropHint: { fontSize: 12, color: Colors.inkSoft },
  error: { fontSize: 12.5, color: Colors.statusFlag, marginTop: 12 },

  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 24 },
  sumChip: { flexDirection: 'row', alignItems: 'baseline', gap: 5, borderRadius: Radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
  sumChipNum: { fontSize: 14, fontWeight: '800' },
  sumChipWord: { fontSize: 12, fontWeight: '700' },

  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 12 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: Colors.inkSoft, letterSpacing: 0.6 },
  sectionMeta: { fontSize: 11.5, fontWeight: '600', color: Colors.inkSoft },

  markerCard: {
    backgroundColor: Colors.card, borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.hairline, padding: 16,
  },
  markerTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  markerName: { fontSize: 15, fontWeight: '700', color: Colors.ink },
  markerRange: { fontSize: 11.5, color: Colors.inkSoft, marginTop: 2 },
  markerRight: { alignItems: 'flex-end', gap: 6 },
  markerValue: { fontSize: 20, fontWeight: '800', color: Colors.ink, letterSpacing: -0.3 },
  markerUnit: { fontSize: 12, fontWeight: '600', color: Colors.inkSoft },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.hairline },
  trendCaption: { fontSize: 11.5, fontWeight: '600', color: Colors.inkSoft, flex: 1 },

  allGood: {
    backgroundColor: '#E8F7EF', borderRadius: Radius.card, padding: 20, alignItems: 'center',
  },
  allGoodText: { fontSize: 14, fontWeight: '700', color: '#3E9B72' },
  toggle: { marginTop: 14, paddingVertical: 12, alignItems: 'center', backgroundColor: Colors.primaryTint, borderRadius: Radius.input },
  toggleText: { fontSize: 13, fontWeight: '700', color: Colors.primary },

  emptyCard: {
    backgroundColor: Colors.card, borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.hairline,
    padding: 28, alignItems: 'center', gap: 6, marginTop: 24,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: Colors.ink },
  emptyText: { fontSize: 13.5, lineHeight: 20, color: Colors.inkSoft, textAlign: 'center' },

  fileRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.card, borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.hairline, padding: 14,
  },
  fileIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.secondaryTint, alignItems: 'center', justifyContent: 'center' },
  fileName: { fontSize: 13.5, fontWeight: '700', color: Colors.ink },
  fileMeta: { fontSize: 11.5, color: Colors.inkSoft, marginTop: 1 },
  removeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
