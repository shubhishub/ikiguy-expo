import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StopIcon } from '@/components/icons';
import { Logo } from '@/components/logo';
import { Colors, Radius } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import { createSession, finalizeSession, uploadChunk } from '@/lib/api';
import { ChunkUploader } from '@/lib/chunk-uploader';

const AUDIO_MIME = 'audio/mp4'; // expo-audio HIGH_QUALITY records .m4a; server transcodes to mp3

// Length of each background-uploaded segment. We record continuously but rotate
// the recorder on this interval, uploading each finished segment to the session
// while the next one records. (μ-law was considered but expo-audio can't record
// it and Gemini doesn't accept it, so we keep AAC and combine server-side.)
const CHUNK_SECONDS = 30;

const bars = [
  0.4, 0.7, 1, 0.55, 0.85, 0.35, 0.95, 0.6, 0.45, 0.8, 0.5, 0.9, 0.4, 0.7, 1, 0.55, 0.85, 0.35,
  0.95, 0.6, 0.45, 0.8, 0.5, 0.9, 0.6, 0.7,
];

function fmt(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

type Phase = 'preparing' | 'recording' | 'processing' | 'error';

export default function TranscribeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const params = useLocalSearchParams<{ sessionId?: string }>();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const [phase, setPhase] = useState<Phase>('preparing');
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState(0);
  const [chunkCount, setChunkCount] = useState(0);
  const sessionRef = useRef<string | null>(null);
  const uploaderRef = useRef<ChunkUploader | null>(null);
  const chunkIndexRef = useRef(0);
  const rotatingRef = useRef(false);

  // Stop the current segment, enqueue it for background upload, and (unless this
  // is the final segment) immediately start the next one. Guarded so an
  // interval tick can't overlap with the manual stop.
  const rotateRef = useRef<(final: boolean) => Promise<void>>(async () => {});
  rotateRef.current = async (final: boolean) => {
    if (rotatingRef.current) return;
    rotatingRef.current = true;
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (uri) {
        const index = chunkIndexRef.current++;
        setChunkCount((c) => c + 1);
        uploaderRef.current?.enqueue(index, uri);
      }
      if (!final) {
        await recorder.prepareToRecordAsync();
        recorder.record();
      }
    } finally {
      rotatingRef.current = false;
    }
  };

  // Timer ticks while recording.
  useEffect(() => {
    if (phase !== 'recording') return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Rotate the recorder every CHUNK_SECONDS so finished segments upload in the
  // background while recording continues.
  useEffect(() => {
    if (phase !== 'recording') return;
    const id = setInterval(() => {
      void rotateRef.current(false);
    }, CHUNK_SECONDS * 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Permissions, session, start one continuous recording.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const perm = await AudioModule.requestRecordingPermissionsAsync();
        if (!perm.granted) throw new Error('Microphone permission is required to record.');
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });

        let sid = params.sessionId ?? null;
        if (!sid) {
          if (!userId) throw new Error('Please sign in before recording.');
          sid = (await createSession({ userId })).sessionId;
        }
        if (cancelled) return;
        sessionRef.current = sid;
        uploaderRef.current = new ChunkUploader(
          (index, uri) => uploadChunk(sid!, index, uri, AUDIO_MIME).then(() => setUploaded((n) => n + 1)),
        );

        await recorder.prepareToRecordAsync();
        recorder.record();
        setPhase('recording');
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Could not start recording.');
          setPhase('error');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onStop() {
    if (phase !== 'recording') return;
    setPhase('processing');
    const sid = sessionRef.current;
    try {
      // Capture + enqueue the final segment, then wait for all uploads.
      await rotateRef.current(true);
      if (!sid) throw new Error('Recording was not captured.');
      await uploaderRef.current?.flush();
      const up = uploaderRef.current;
      if (!up || up.enqueued === 0) throw new Error('Recording was not captured.');
      if (up.uploaded === 0) {
        throw new Error(
          up.lastError ? `Audio upload failed: ${up.lastError}` : 'Audio upload failed. Check your connection and try again.',
        );
      }
      await finalizeSession(sid, seconds);
      router.replace({ pathname: '/note', params: { sessionId: sid } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not process the recording.');
      setPhase('error');
    }
  }

  if (phase === 'error') {
    return (
      <View style={[styles.screen, styles.errorScreen, { paddingTop: insets.top + 24 }]}>
        <Logo />
        <View style={styles.errorBody}>
          <Text style={styles.errorTitle}>Recording problem</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
        <View style={{ gap: 10 }}>
          <Pressable onPress={() => router.replace('/note')} style={styles.demoBtn}>
            <Text style={styles.demoText}>Continue with a demo note</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Go back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.topRow}>
        <Logo />
        <View style={styles.recChip}>
          <View style={styles.recDot} />
          <Text style={styles.recText}>{phase === 'processing' ? 'Processing' : 'Recording'}</Text>
        </View>
      </View>

      <View style={styles.center}>
        <Text style={styles.listening}>
          {phase === 'processing' ? 'Transcribing and writing your note…' : 'Listening to your visit'}
        </Text>
        <Text style={styles.timer}>{fmt(seconds)}</Text>

        {chunkCount > 0 && (
          <Text style={styles.uploadStatus}>
            {uploaded}/{chunkCount} clips uploaded
          </Text>
        )}

        <View style={styles.wave}>
          {bars.map((h, i) => (
            <WaveBar key={i} height={h} delay={(i % 9) * 90} active={phase === 'recording'} />
          ))}
        </View>

        <Text style={styles.helper}>
          Keep your phone nearby. iKiguy AI records the full visit, then structures it into a medical
          note you can replay.
        </Text>
      </View>

      <View style={styles.bottom}>
        <Pressable
          accessibilityLabel="Stop recording"
          onPress={onStop}
          disabled={phase !== 'recording'}
          style={({ pressed }) => [
            styles.stopBtn,
            phase !== 'recording' && { opacity: 0.6 },
            pressed && { transform: [{ scale: 0.95 }] },
          ]}>
          <StopIcon size={34} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.stopHint}>
          {phase === 'processing' ? 'Almost done…' : 'Tap to stop and generate note'}
        </Text>
      </View>
    </View>
  );
}

function WaveBar({ height, delay, active }: { height: number; delay: number; active: boolean }) {
  const scale = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    if (!active) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1, duration: 550, delay, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.4, duration: 550, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [scale, delay, active]);

  return (
    <Animated.View
      style={[
        styles.bar,
        { height: `${height * 100}%`, opacity: 0.55 + height * 0.45, transform: [{ scaleY: scale }] },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 24 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FDEAF1',
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.statusFlag },
  recText: { fontSize: 12, fontWeight: '700', color: Colors.statusFlag },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listening: { fontSize: 13, fontWeight: '600', color: Colors.inkSoft, marginBottom: 8, textAlign: 'center' },
  timer: { fontSize: 52, fontWeight: '800', color: Colors.ink, letterSpacing: -1, fontVariant: ['tabular-nums'] },
  uploadStatus: { fontSize: 12, fontWeight: '600', color: Colors.inkSoft, marginTop: 6 },
  wave: { height: 96, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, marginTop: 32 },
  bar: { width: 5, borderRadius: 3, backgroundColor: Colors.primary },
  helper: { maxWidth: 280, textAlign: 'center', fontSize: 13, lineHeight: 19, color: Colors.inkSoft, marginTop: 32 },

  bottom: { alignItems: 'center', gap: 12 },
  stopBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.statusFlag,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.statusFlag,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  stopHint: { fontSize: 12.5, fontWeight: '600', color: Colors.inkSoft },

  errorScreen: { justifyContent: 'space-between', paddingBottom: 40 },
  errorBody: { flex: 1, justifyContent: 'center', gap: 8 },
  errorTitle: { fontSize: 20, fontWeight: '800', color: Colors.ink },
  errorText: { fontSize: 14, lineHeight: 21, color: Colors.inkSoft },
  demoBtn: { backgroundColor: Colors.primary, borderRadius: Radius.input, paddingVertical: 15, alignItems: 'center' },
  demoText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  cancelBtn: { paddingVertical: 12, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '600', color: Colors.inkSoft },
});
