import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { TabHeader } from '@/components/app-header';
import { ReportComparison } from '@/components/report-comparison';
import { CheckIcon, FileIcon, UploadIcon, XIcon } from '@/components/icons';
import { Colors, Radius, Shadow } from '@/constants/theme';
import { nextReportValues, seedReports, type LabFileReport } from '@/lib/mock';

// Counter for unique upload ids within a session.
let uploadCounter = 0;

// Reports: a standalone destination where a patient uploads and tracks their own
// lab reports, independent of any doctor visit.
export default function ReportsScreen() {
  const [reports, setReports] = useState<LabFileReport[]>(seedReports);
  const [selected, setSelected] = useState<string[]>(seedReports.map((r) => r.id));

  // Each upload gets realistic mock biomarker values that drift from the latest
  // report, so the trends look natural. Files are visual only for now — on mobile
  // tapping the zone simulates picking a file.
  function addUpload() {
    const last = reports.length
      ? reports[reports.length - 1].values
      : { hba1c: 5.6, ldl: 120, vitd: 20, hb: 13 };
    const values = nextReportValues(last);
    const created: LabFileReport = {
      id: `up-${Date.now()}-${uploadCounter++}`,
      fileName: `Scan_${reports.length + 1}.pdf`,
      dateAdded: 'Jun 16, 2026',
      label: 'Jun 16',
      values,
    };
    setReports((prev) => [...prev, created]);
    setSelected((prev) => [...prev, created.id]);
  }

  function removeReport(id: string) {
    setReports((prev) => prev.filter((r) => r.id !== id));
    setSelected((prev) => prev.filter((x) => x !== id));
  }

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  // Reports stay oldest to newest internally; show newest first in the list.
  const displayList = useMemo(() => [...reports].reverse(), [reports]);
  const chosen = useMemo(() => reports.filter((r) => selected.includes(r.id)), [reports, selected]);
  const ready = chosen.length >= 2;

  return (
    <View style={styles.screen}>
      <TabHeader title="Reports" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.title}>Your lab reports</Text>
          <Text style={styles.subtitle}>Upload and track results yourself, no visit needed.</Text>
        </View>

        {/* Upload is the primary action. */}
        <Pressable
          onPress={addUpload}
          style={({ pressed }) => [styles.dropZone, pressed && { borderColor: Colors.primary, backgroundColor: Colors.primaryTint }]}>
          <View style={styles.uploadIcon}>
            <UploadIcon size={24} color={Colors.primary} />
          </View>
          <Text style={styles.dropTitle}>Tap to upload a file</Text>
          <Text style={styles.dropHint}>add a report, scan, or PDF</Text>
        </Pressable>

        {/* Uploaded reports */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionLabel}>YOUR REPORTS</Text>
          <Text style={styles.sectionCount}>{reports.length} total</Text>
        </View>

        {reports.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No reports yet. Upload a file to get started.</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {displayList.map((r) => {
              const on = selected.includes(r.id);
              return (
                <Pressable
                  key={r.id}
                  onPress={() => toggle(r.id)}
                  style={[
                    styles.reportRow,
                    on
                      ? { borderColor: Colors.primary, backgroundColor: Colors.primaryTint }
                      : [styles.reportRowIdle, Shadow],
                  ]}>
                  <View
                    style={[
                      styles.reportIcon,
                      { backgroundColor: on ? Colors.primary : Colors.secondaryTint },
                    ]}>
                    {on ? (
                      <CheckIcon size={18} color="#FFFFFF" strokeWidth={2.2} />
                    ) : (
                      <FileIcon size={18} color={Colors.secondary} />
                    )}
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={styles.reportName}>
                      {r.fileName}
                    </Text>
                    <Text style={styles.reportDate}>Added {r.dateAdded}</Text>
                  </View>
                  <Pressable
                    accessibilityLabel={`Remove ${r.fileName}`}
                    onPress={() => removeReport(r.id)}
                    hitSlop={8}
                    style={styles.removeBtn}>
                    <XIcon size={17} color={Colors.inkSoft} />
                  </Pressable>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={styles.divider} />

        {/* Comparison */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionLabel}>COMPARE</Text>
          <Text style={styles.sectionCount}>{chosen.length} selected</Text>
        </View>

        {ready ? (
          <ReportComparison reports={chosen.map((r) => ({ label: r.label, values: r.values }))} />
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              Select two or more reports above to see how your markers moved.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  list: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.ink, letterSpacing: -0.4 },
  subtitle: { fontSize: 13, lineHeight: 19, color: Colors.inkSoft, marginTop: 4 },

  dropZone: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.hairline,
    borderStyle: 'dashed',
    borderRadius: Radius.input,
    backgroundColor: Colors.bg,
    paddingVertical: 28,
  },
  uploadIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  dropTitle: { fontSize: 13.5, fontWeight: '700', color: Colors.ink, marginTop: 10 },
  dropHint: { fontSize: 12, color: Colors.inkSoft, marginTop: 2 },

  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 10 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: Colors.inkSoft, letterSpacing: 0.6 },
  sectionCount: { fontSize: 11.5, fontWeight: '600', color: Colors.inkSoft },

  empty: {
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderStyle: 'dashed',
    borderRadius: Radius.card,
    backgroundColor: Colors.card,
    padding: 28,
    alignItems: 'center',
  },
  emptyText: { fontSize: 13, lineHeight: 19, color: Colors.inkSoft, textAlign: 'center' },

  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: 14,
  },
  reportRowIdle: { borderColor: Colors.hairline, backgroundColor: Colors.card },
  reportIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  reportName: { fontSize: 13.5, fontWeight: '700', color: Colors.ink },
  reportDate: { fontSize: 11.5, color: Colors.inkSoft, marginTop: 1 },
  removeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.hairline, marginVertical: 20 },
});
