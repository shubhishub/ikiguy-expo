import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CheckIcon, PillIcon, SaveIcon, ShareIcon } from '@/components/icons';
import { ScreenHeader } from '@/components/screen-header';
import { StatusChip } from '@/components/status-chip';
import { Colors, Radius, Shadow } from '@/constants/theme';
import { getNote, type StructuredNote } from '@/lib/api';
import { generatedNote, statusLabel, type VisitStatus } from '@/lib/mock';

// Normalized note shape used by this screen.
type NoteData = StructuredNote;

// The demo note, used when no live session is available.
const demoNote: NoteData = {
  doctor: generatedNote.visit.doctor,
  specialty: generatedNote.visit.specialty,
  facility: generatedNote.visit.facility,
  date: generatedNote.visit.date,
  status: generatedNote.visit.status as VisitStatus,
  chiefComplaint: generatedNote.chiefComplaint,
  history: generatedNote.history,
  risks: generatedNote.risks,
  advice: generatedNote.postOpAdvice,
  prescription: generatedNote.prescription,
};

export default function NoteScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const [note, setNote] = useState<NoteData | null>(sessionId ? null : demoNote);
  const [loading, setLoading] = useState(!!sessionId);

  useEffect(() => {
    if (!sessionId) return;
    let active = true;
    (async () => {
      try {
        const { note: fetched } = await getNote(sessionId);
        if (active) setNote(fetched ?? demoNote);
      } catch {
        if (active) setNote(demoNote);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [sessionId]);

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Medical note"
        back="/"
        right={
          <View style={styles.headerActions}>
            <View style={styles.iconBtn}>
              <ShareIcon size={19} color={Colors.ink} />
            </View>
            <View style={styles.iconBtn}>
              <SaveIcon size={19} color={Colors.ink} />
            </View>
          </View>
        }
      />

      {loading || !note ? (
        <View style={styles.loader}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.loaderText}>Loading your note…</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          <View style={[styles.card, Shadow]}>
            <View style={styles.visitTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.doctor}>{note.doctor}</Text>
                <Text style={styles.meta}>
                  {note.specialty} · {note.facility}
                </Text>
              </View>
              <StatusChip status={note.status} label={statusLabel[note.status]} />
            </View>
            <Text style={styles.date}>{note.date}</Text>
          </View>

          <Section title="Chief complaint">
            <Text style={styles.body}>{note.chiefComplaint}</Text>
          </Section>

          <Section title="History">
            <Text style={styles.body}>{note.history}</Text>
          </Section>

          {note.risks.length > 0 && (
            <Section title="Risks flagged">
              {note.risks.map((r) => (
                <Bullet key={r} text={r} tone="flag" />
              ))}
            </Section>
          )}

          {note.advice.length > 0 && (
            <Section title="Advice">
              {note.advice.map((a) => (
                <Bullet key={a} text={a} tone="good" />
              ))}
            </Section>
          )}

          {note.prescription.length > 0 && (
            <Section title="Prescription">
              {note.prescription.map((p) => (
                <View key={p.name} style={styles.rx}>
                  <View style={styles.rxIcon}>
                    <PillIcon size={16} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rxName}>{p.name}</Text>
                    <Text style={styles.rxDose}>{p.dose}</Text>
                  </View>
                </View>
              ))}
            </Section>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={[styles.card, Shadow, { gap: 10 }]}>{children}</View>
    </View>
  );
}

function Bullet({ text, tone }: { text: string; tone: 'good' | 'flag' }) {
  const color = tone === 'good' ? Colors.statusGood : Colors.statusFlag;
  return (
    <View style={styles.bullet}>
      <View style={[styles.bulletIcon, { backgroundColor: tone === 'good' ? '#E8F7EF' : '#FDEAF1' }]}>
        <CheckIcon size={12} color={color} strokeWidth={2.4} />
      </View>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  headerActions: { flexDirection: 'row', gap: 6 },
  iconBtn: { width: 36, height: 36, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loaderText: { fontSize: 13, color: Colors.inkSoft },
  list: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
    padding: 16,
  },
  visitTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  doctor: { fontSize: 16, fontWeight: '700', color: Colors.ink },
  meta: { fontSize: 12.5, color: Colors.inkSoft, marginTop: 2 },
  date: { fontSize: 12, fontWeight: '600', color: Colors.inkSoft, marginTop: 10 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: Colors.inkSoft, letterSpacing: 0.6, marginBottom: 8, marginLeft: 2 },
  body: { fontSize: 13.5, lineHeight: 21, color: '#5B6072' },
  bullet: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  bulletIcon: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  bulletText: { flex: 1, fontSize: 13.5, lineHeight: 20, color: '#5B6072' },
  rx: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rxIcon: { width: 36, height: 36, borderRadius: Radius.input, backgroundColor: Colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  rxName: { fontSize: 14, fontWeight: '700', color: Colors.ink },
  rxDose: { fontSize: 12.5, color: Colors.inkSoft, marginTop: 1 },
});
