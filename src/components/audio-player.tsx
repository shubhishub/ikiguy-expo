import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Shadow } from '@/constants/theme';

function fmt(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// Compact player to replay the recorded conversation, shown atop a note.
export function AudioPlayer({ uri }: { uri: string }) {
  const player = useAudioPlayer({ uri });
  const status = useAudioPlayerStatus(player);
  const [width, setWidth] = useState(0);

  const duration = status.duration || 0;
  const current = status.currentTime || 0;
  const progress = duration > 0 ? Math.min(1, current / duration) : 0;

  function toggle() {
    if (status.playing) player.pause();
    else {
      if (status.didJustFinish || current >= duration) player.seekTo(0);
      player.play();
    }
  }

  function onSeek(e: { nativeEvent: { locationX: number } }) {
    if (!width || !duration) return;
    const ratio = Math.max(0, Math.min(1, e.nativeEvent.locationX / width));
    player.seekTo(ratio * duration);
  }

  return (
    <View style={[styles.bar, Shadow]}>
      <Pressable onPress={toggle} style={styles.playBtn} accessibilityLabel={status.playing ? 'Pause' : 'Play'}>
        {status.playing ? (
          <View style={styles.pauseGlyph}>
            <View style={styles.pauseBar} />
            <View style={styles.pauseBar} />
          </View>
        ) : (
          <View style={styles.playGlyph} />
        )}
      </Pressable>

      <View style={styles.body}>
        <Text style={styles.label}>Conversation recording</Text>
        <Pressable
          onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
          onPress={onSeek}
          style={styles.trackHit}>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${progress * 100}%` }]} />
          </View>
        </Pressable>
        <View style={styles.times}>
          <Text style={styles.time}>{fmt(current)}</Text>
          <Text style={styles.time}>{fmt(duration)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.card,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
    padding: 14,
  },
  playBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  playGlyph: {
    width: 0,
    height: 0,
    marginLeft: 3,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderLeftWidth: 13,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#FFFFFF',
  },
  pauseGlyph: { flexDirection: 'row', gap: 4 },
  pauseBar: { width: 4, height: 16, borderRadius: 2, backgroundColor: '#FFFFFF' },
  body: { flex: 1, gap: 6 },
  label: { fontSize: 12.5, fontWeight: '700', color: Colors.ink },
  trackHit: { paddingVertical: 4 },
  track: { height: 5, borderRadius: 3, backgroundColor: Colors.hairline, overflow: 'hidden' },
  fill: { height: 5, borderRadius: 3, backgroundColor: Colors.primary },
  times: { flexDirection: 'row', justifyContent: 'space-between' },
  time: { fontSize: 10.5, fontWeight: '600', color: Colors.inkSoft, fontVariant: ['tabular-nums'] },
});
