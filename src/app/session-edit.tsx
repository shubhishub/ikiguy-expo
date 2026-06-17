import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ScreenHeader } from '@/components/screen-header';
import { Colors, Radius, Shadow } from '@/constants/theme';
import { getSession, searchPlaces, updateSession, type Place } from '@/lib/api';
import { specialties } from '@/lib/mock';

export default function SessionEditScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();

  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState('');
  const [facility, setFacility] = useState('');
  const [specialty, setSpecialty] = useState(specialties[0]);
  const [place, setPlace] = useState<Place | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Prefill from the existing session.
  useEffect(() => {
    if (!sessionId) return;
    (async () => {
      try {
        const { session } = await getSession(sessionId);
        if (session) {
          setDoctor(session.doctor ?? '');
          setFacility(session.facility ?? '');
          if (session.specialty) setSpecialty(session.specialty);
        }
      } catch {
        /* keep blanks */
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId]);

  // Debounced place search.
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    debounce.current = setTimeout(async () => {
      try {
        const { results: r } = await searchPlaces(query.trim());
        setResults(r);
      } catch {
        setResults([]);
      }
    }, 350);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [query]);

  async function onSave() {
    if (!sessionId || saving) return;
    setSaving(true);
    setError(null);
    try {
      await updateSession(sessionId, {
        doctor: doctor.trim() || undefined,
        specialty,
        facility: facility.trim() || undefined,
        placeId: place?.placeId,
        address: place?.address,
        lat: place?.lat ?? undefined,
        lng: place?.lng ?? undefined,
      });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save changes.');
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Edit visit" back="/" />
        <View style={styles.loader}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Edit visit" back="/" />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.list}>
        <Text style={styles.section}>DOCTOR</Text>
        <TextInput
          value={doctor}
          onChangeText={setDoctor}
          placeholder="Dr. name"
          placeholderTextColor="rgba(138,144,162,0.7)"
          autoCapitalize="words"
          style={styles.input}
        />

        <Text style={[styles.section, { marginTop: 24 }]}>LOCATION</Text>
        <TextInput
          value={facility}
          onChangeText={(t) => {
            setFacility(t);
            setQuery(t);
            setPlace(null);
          }}
          placeholder="Hospital or clinic name"
          placeholderTextColor="rgba(138,144,162,0.7)"
          style={styles.input}
        />
        {results.map((r) => (
          <Pressable
            key={r.placeId}
            onPress={() => {
              setPlace(r);
              setFacility(r.name);
              setResults([]);
            }}
            style={({ pressed }) => [styles.result, pressed && { backgroundColor: Colors.bg }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.resultName}>{r.name}</Text>
              <Text numberOfLines={1} style={styles.resultAddr}>
                {r.address}
              </Text>
            </View>
            {r.isHealth && (
              <View style={styles.healthTag}>
                <Text style={styles.healthTagText}>Health</Text>
              </View>
            )}
          </Pressable>
        ))}

        <Text style={[styles.section, { marginTop: 24 }]}>TYPE OF VISIT</Text>
        <View style={styles.chips}>
          {specialties.map((s) => {
            const active = s === specialty;
            return (
              <Pressable
                key={s}
                onPress={() => setSpecialty(s)}
                style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}>
                <Text style={[styles.chipText, { color: active ? '#FFFFFF' : Colors.secondary }]}>{s}</Text>
              </Pressable>
            );
          })}
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          onPress={onSave}
          disabled={saving}
          style={({ pressed }) => [styles.save, pressed && !saving && { backgroundColor: Colors.primaryPressed }]}>
          {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveText}>Save changes</Text>}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120 },
  section: { fontSize: 12, fontWeight: '700', color: Colors.inkSoft, letterSpacing: 0.6, marginBottom: 10 },
  input: {
    height: 52,
    borderRadius: Radius.input,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
    backgroundColor: Colors.card,
    paddingHorizontal: 16,
    fontSize: 15,
    color: Colors.ink,
    ...Shadow,
  },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.hairline,
  },
  resultName: { fontSize: 14.5, fontWeight: '700', color: Colors.ink },
  resultAddr: { fontSize: 12, color: Colors.inkSoft, marginTop: 1 },
  healthTag: { backgroundColor: '#E8F7EF', borderRadius: Radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
  healthTagText: { fontSize: 10.5, fontWeight: '700', color: '#3E9B72' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: Radius.pill, paddingHorizontal: 14, paddingVertical: 9 },
  chipActive: { backgroundColor: Colors.primary },
  chipIdle: { backgroundColor: Colors.secondaryTint },
  chipText: { fontSize: 13, fontWeight: '700' },
  error: { fontSize: 12.5, color: Colors.statusFlag, marginTop: 16 },
  save: {
    height: 56,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    ...Shadow,
  },
  saveText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
