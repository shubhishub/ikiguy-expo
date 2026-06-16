import { Pressable, StyleSheet, View } from 'react-native';

import { Colors, FabShadow } from '@/constants/theme';
import { MicIcon, PlusIcon } from './icons';

// Floating voice-capture button with the orange "+" badge, as in the design.
export function MicFab({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel="New voice note"
      style={({ pressed }) => [styles.fab, FabShadow, pressed && styles.pressed]}>
      <MicIcon size={26} color="#FFFFFF" strokeWidth={2} />
      <View style={styles.badge}>
        <PlusIcon size={14} color="#FFFFFF" strokeWidth={2.6} />
      </View>
    </Pressable>
  );
}

const SIZE = 60;

const styles = StyleSheet.create({
  fab: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.96 }] },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.honey,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.bg,
  },
});
