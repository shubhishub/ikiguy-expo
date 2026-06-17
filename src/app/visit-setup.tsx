import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ScreenHeader } from '@/components/screen-header';
import { Colors, Radius, Shadow } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import { createSession, searchPlaces, type Place } from '@/lib/api';
import { specialties } from '@/lib/mock';

export default function VisitSetupScreen() {
  const router = useRouter();
  const { userId } = useAuth();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [place, setPlace] = useState<Place | null>(null);
  const [manual, setManual] = useState('');
  const [doctor, setDoctor] = useState('');
  const [specialty, setSpecialty] = useState(specialties[0]);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced place search.
  useEffect(() => {
    if (place) return; // already chosen
    if (debounce.current) clearTimeout(debounce.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    debounce.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { results: r } = await searchPlaces(query.trim());
        setResults(r);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [query, place]);

  async function onStart() {
    if (!userId) {
      setError('Please sign in first.');
      return;
    }
    setStarting(true);
    setError(null);
    try {
      const facility = place?.name ?? (manual.trim() || undefined);
      const { sessionId } = await createSession({
        userId,
        doctor: doctor.trim() || undefined,
        specialty,
        facility,
        placeId: place?.placeId,
        address: place?.address,
        lat: place?.lat ?? undefined,
        lng: place?.lng ?? undefined,
      });
      router.push({ pathname: '/transcribe', params: { sessionId } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start the visit.');
      setStarting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader title="New visit" back="/" />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.list}>
        {/* Skip everything and start immediately. */}
        <Pressable
          onPress={onStart}
          disabled={starting}
          style={({ pressed }) => [styles.skip, pressed && !starting && { backgroundColor: Colors.primaryPressed }]}>
          {starting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.skipText}>Record now - add details later</Text>
          )}
        </Pressable>
        <Text style={styles.skipHint}>Or set the details below first (optional).</Text>

        {/* Where */}
        <Text style={[styles.section, { marginTop: 24 }]}>WHERE ARE YOU?</Text>
        {place ? (
          <View style={[styles.selected, Shadow]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.selectedName}>{place.name}</Text>
              {!!place.address && <Text style={styles.selectedAddr}>{place.address}</Text>}
            </View>
            <Pressable onPress={() => setPlace(null)} hitSlop={8}>
              <Text style={styles.change}>Change</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search hospital or clinic"
              placeholderTextColor="rgba(138,144,162,0.7)"
              style={styles.input}
              autoCorrect={false}
            />
            {searching && <ActivityIndicator color={Colors.primary} style={{ marginTop: 10 }} />}
            {results.map((r) => (
              <Pressable
                key={r.placeId}
                onPress={() => {
                  setPlace(r);
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
            <Text style={styles.manualLabel}>Or enter the place name</Text>
            <TextInput
              value={manual}
              onChangeText={setManual}
              placeholder="e.g. Fortis Heart Institute"
              placeholderTextColor="rgba(138,144,162,0.7)"
              style={styles.input}
            />
          </>
        )}

        {/* Doctor */}
        <Text style={[styles.section, { marginTop: 24 }]}>DOCTOR</Text>
        <TextInput
          value={doctor}
          onChangeText={setDoctor}
          placeholder="Dr. name (optional)"
          placeholderTextColor="rgba(138,144,162,0.7)"
          autoCapitalize="words"
          style={styles.input}
        />

        {/* Visit type */}
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
          onPress={onStart}
          disabled={starting}
          style={({ pressed }) => [styles.start, pressed && !starting && { backgroundColor: Colors.primaryPressed }]}>
          {starting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.startText}>Start with these details</Text>}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  list: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120 },
  section: { fontSize: 12, fontWeight: '700', color: Colors.inkSoft, letterSpacing: 0.6, marginBottom: 10 },
  skip: {
    height: 54,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow,
  },
  skipText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  skipHint: { fontSize: 12.5, color: Colors.inkSoft, textAlign: 'center', marginTop: 10 },
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
  manualLabel: { fontSize: 12.5, color: Colors.inkSoft, marginTop: 16, marginBottom: 8, marginLeft: 2 },
  selected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
    padding: 16,
  },
  selectedName: { fontSize: 15, fontWeight: '700', color: Colors.ink },
  selectedAddr: { fontSize: 12.5, color: Colors.inkSoft, marginTop: 2 },
  change: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: Radius.pill, paddingHorizontal: 14, paddingVertical: 9 },
  chipActive: { backgroundColor: Colors.primary },
  chipIdle: { backgroundColor: Colors.secondaryTint },
  chipText: { fontSize: 13, fontWeight: '700' },
  error: { fontSize: 12.5, color: Colors.statusFlag, marginTop: 16 },
  start: {
    height: 56,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    ...Shadow,
  },
  startText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
