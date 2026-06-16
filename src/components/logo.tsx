import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { HeartIcon } from './icons';

// Optional brand mascot. Drop a `mascot.png` into assets/images to show the
// illustrated head; otherwise we fall back to a clean cream brand mark.
let mascotSource: number | null = null;
try {
  mascotSource = require('@/assets/images/mascot.png');
} catch {
  mascotSource = null;
}

// Brand lockup: mascot mark + the wordmark, always written "iKiguy AI".
export function Logo({ size = 30 }: { size?: number }) {
  return (
    <View style={styles.row}>
      <MascotMark size={size} heartScale={0.36} />
      <Text style={styles.wordmark}>
        iKiguy <Text style={styles.honey}>AI</Text>
      </Text>
    </View>
  );
}

// Larger standalone mascot for onboarding / hero areas.
export function Mascot({ size = 120 }: { size?: number }) {
  return <MascotMark size={size} heartScale={0.34} />;
}

function MascotMark({ size, heartScale }: { size: number; heartScale: number }) {
  const heart = Math.round(size * heartScale);
  return (
    <View style={{ width: size, height: size }}>
      <View style={[styles.clip, { width: size, height: size, borderRadius: size / 2 }]}>
        {mascotSource ? (
          <Image source={mascotSource} style={styles.fill} contentFit="cover" />
        ) : (
          <HeartIcon size={size * 0.5} color={Colors.honey} />
        )}
      </View>
      <View
        style={[
          styles.heartBadge,
          { width: heart, height: heart, borderRadius: heart / 2, right: -heart * 0.12, bottom: -heart * 0.08 },
        ]}>
        <HeartIcon size={Math.round(heart * 0.62)} color={Colors.statusFlag} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wordmark: { fontSize: 19, fontWeight: '800', letterSpacing: -0.5, color: Colors.ink },
  honey: { color: Colors.honey },
  clip: {
    overflow: 'hidden',
    backgroundColor: '#FFF6E6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.25)',
  },
  fill: { width: '100%', height: '100%' },
  heartBadge: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.bg,
    padding: 2,
  },
});
