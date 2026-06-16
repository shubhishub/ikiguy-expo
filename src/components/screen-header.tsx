import { useRouter } from 'expo-router';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Radius } from '@/constants/theme';
import { BackIcon } from './icons';

// Compact header for sub-screens: back chevron + title, optional right slot.
export function ScreenHeader({
  title,
  back = '/',
  right,
}: {
  title: string;
  back?: string;
  right?: ReactNode;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
      <Pressable
        accessibilityLabel="Back"
        onPress={() => (router.canGoBack() ? router.back() : router.replace(back as never))}
        style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
        <BackIcon size={22} color={Colors.ink} />
      </Pressable>
      <Text numberOfLines={1} style={styles.title}>
        {title}
      </Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.hairline,
    backgroundColor: 'rgba(244,245,250,0.92)',
  },
  backBtn: {
    height: 36,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
  },
  pressed: { backgroundColor: Colors.primaryTint },
  title: { flex: 1, fontSize: 17, fontWeight: '700', color: Colors.ink },
});
