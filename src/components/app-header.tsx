import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Logo } from '@/components/logo';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';

// Top app bar shared by the main tabs: brand lockup + user avatar.
export function AppHeader({ initials: override }: { initials?: string }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { initials: authInitials } = useAuth();
  const initials = override ?? authInitials;
  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <Logo />
      <Pressable
        accessibilityLabel="Profile"
        onPress={() => router.push('/profile')}
        style={({ pressed }) => [styles.avatar, pressed && { opacity: 0.7 }]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </Pressable>
    </View>
  );
}

// Simple sticky title header for tab sub-pages (Labs, Reminders).
export function TabHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.titleHeader, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.titleHeaderText}>{title}</Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.hairline,
    backgroundColor: Colors.bg,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 13, fontWeight: '800', color: Colors.primary },
  titleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.hairline,
    backgroundColor: Colors.bg,
  },
  titleHeaderText: { fontSize: 17, fontWeight: '700', color: Colors.ink },
});
