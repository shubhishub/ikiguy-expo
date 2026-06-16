import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/contexts/auth';
import { Colors } from '@/constants/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const { userId, ready } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Redirect to onboarding until the user has an identity.
  useEffect(() => {
    if (!ready) return;
    const onboarding = segments[0] === 'onboarding';
    if (!userId && !onboarding) router.replace('/onboarding');
    else if (userId && onboarding) router.replace('/');
  }, [ready, userId, segments, router]);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg }}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="note" />
      <Stack.Screen name="diet" />
      <Stack.Screen name="family" />
      <Stack.Screen name="transcribe" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
    </Stack>
  );
}
