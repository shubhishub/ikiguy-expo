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
  const { userId, needsProfile, ready } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Keep the user on onboarding until they have an identity AND a complete
  // profile (Google sign-in, then the phone/age details step).
  useEffect(() => {
    if (!ready) return;
    const onboarding = segments[0] === 'onboarding';
    const authed = !!userId && !needsProfile;
    if (!authed && !onboarding) router.replace('/onboarding');
    else if (authed && onboarding) router.replace('/');
  }, [ready, userId, needsProfile, segments, router]);

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
      <Stack.Screen name="visit-setup" options={{ presentation: 'modal' }} />
      <Stack.Screen name="session-edit" options={{ presentation: 'modal' }} />
      <Stack.Screen name="transcribe" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
    </Stack>
  );
}
