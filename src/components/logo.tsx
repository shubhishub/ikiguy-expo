import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { Mascot } from './mascot';

// Brand lockup: cube mascot (good face) + the wordmark, always "iKiguy AI".
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <View style={styles.row}>
      <Mascot status="good" size={size} />
      <Text style={styles.wordmark}>
        iKiguy <Text style={styles.honey}>AI</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wordmark: { fontSize: 19, fontWeight: '800', letterSpacing: -0.5, color: Colors.ink },
  honey: { color: Colors.honey },
});
