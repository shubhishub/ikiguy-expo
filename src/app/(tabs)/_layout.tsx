import { Tabs, useRouter } from 'expo-router';
import { View } from 'react-native';

import { BottomNav } from '@/components/bottom-nav';
import { MicFab } from '@/components/mic-fab';

export default function TabsLayout() {
  const router = useRouter();
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: '#F4F5FA' } }}
        tabBar={(props) => <BottomNav {...props} />}>
        <Tabs.Screen name="index" options={{ title: 'Visits' }} />
        <Tabs.Screen name="reports" options={{ title: 'Reports' }} />
        <Tabs.Screen name="reminders" options={{ title: 'Reminders' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>

      {/* Floating mic button, sits above the tab bar like the web prototype. */}
      <View style={{ position: 'absolute', right: 18, bottom: 96 }} pointerEvents="box-none">
        <MicFab onPress={() => router.push('/visit-setup')} />
      </View>
    </View>
  );
}
