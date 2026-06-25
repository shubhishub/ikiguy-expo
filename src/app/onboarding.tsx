import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Mascot } from '@/components/mascot';
import { Colors, Radius, Shadow } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import type { UserProfile } from '@/lib/api';

// Lets the web popup hand the result back and close itself.
WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const GOOGLE_CONFIGURED = !!(WEB_CLIENT_ID || IOS_CLIENT_ID || ANDROID_CLIENT_ID);

// Screen 1: Sign in with Google, then collect the details Google can't give us.
export default function OnboardingScreen() {
  const { user, needsProfile, signInWithGoogle, completeProfile } = useAuth();
  const insets = useSafeAreaInsets();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: WEB_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
  });

  // Exchange the Google ID token for our user record once the prompt returns.
  useEffect(() => {
    if (!response) return;
    if (response.type === 'success') {
      const idToken = response.params?.id_token ?? response.authentication?.idToken;
      if (!idToken) {
        setError('Google did not return an ID token. Check your Web client ID configuration.');
        setBusy(false);
        return;
      }
      signInWithGoogle(idToken)
        .catch((e) => setError(e instanceof Error ? e.message : 'Sign-in failed. Please try again.'))
        .finally(() => setBusy(false));
    } else if (response.type === 'error') {
      setError(response.error?.message ?? 'Google sign-in failed. Please try again.');
      setBusy(false);
    } else {
      setBusy(false); // dismissed / cancelled
    }
  }, [response, signInWithGoogle]);

  async function onGoogle() {
    if (busy) return;
    if (!GOOGLE_CONFIGURED) {
      setError('Google sign-in isn’t configured yet. Add EXPO_PUBLIC_GOOGLE_* client IDs to .env.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await promptAsync();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open Google sign-in.');
      setBusy(false);
    }
  }

  async function onSaveDetails(profile: UserProfile) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await completeProfile(profile);
      // RootNavigator redirects to /home once the profile is complete.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your details. Check your connection.');
      setBusy(false);
    }
  }

  const showDetails = !!user && needsProfile;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.screen, { paddingTop: insets.top + (showDetails ? 12 : 40), paddingBottom: insets.bottom + 16 }]}>
      {showDetails ? (
        <DetailsStep
          initialFirst={user?.firstName ?? ''}
          initialLast={user?.lastName ?? ''}
          error={error}
          busy={busy}
          onSubmit={onSaveDetails}
        />
      ) : (
        <WelcomeStep
          onGoogle={onGoogle}
          busy={busy}
          disabled={busy || (GOOGLE_CONFIGURED && !request)}
          error={error}
        />
      )}
    </KeyboardAvoidingView>
  );
}

function WelcomeStep({
  onGoogle,
  busy,
  disabled,
  error,
}: {
  onGoogle: () => void;
  busy: boolean;
  disabled: boolean;
  error: string | null;
}) {
  return (
    <>
      <View style={styles.hero}>
        <Mascot status="good" size={132} />
        <Text style={styles.title}>Every doctor visit, remembered.</Text>
        <Text style={styles.subtitle}>Records you follow and track, until you heal.</Text>
      </View>

      <View style={styles.form}>
        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          onPress={onGoogle}
          disabled={disabled}
          style={({ pressed }) => [styles.googleButton, pressed && !disabled && { opacity: 0.85 }, disabled && { opacity: 0.6 }]}>
          {busy ? (
            <ActivityIndicator color={Colors.ink} />
          ) : (
            <>
              <GoogleGlyph />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </>
          )}
        </Pressable>

        <Text style={styles.legal}>We use your Google account only to sign you in securely.</Text>
      </View>

      <Text style={styles.waitlist}>Join the beta waitlist</Text>
    </>
  );
}

function DetailsStep({
  initialFirst,
  initialLast,
  error,
  busy,
  onSubmit,
}: {
  initialFirst: string;
  initialLast: string;
  error: string | null;
  busy: boolean;
  onSubmit: (profile: UserProfile) => void;
}) {
  const [firstName, setFirstName] = useState(initialFirst);
  const [lastName, setLastName] = useState(initialLast);
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  function submit() {
    const ageNum = Number(age);
    if (!firstName.trim() || !lastName.trim()) {
      setLocalError('Please enter your first and last name.');
      return;
    }
    if (phone.replace(/\D/g, '').length < 7) {
      setLocalError('Please enter a valid phone number.');
      return;
    }
    if (!Number.isFinite(ageNum) || ageNum < 1 || ageNum > 120) {
      setLocalError('Please enter a valid age.');
      return;
    }
    setLocalError(null);
    onSubmit({ firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim(), age: ageNum });
  }

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.detailsHeader}>
        <View style={styles.backBtn} />
        <View style={styles.dots}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
        </View>
      </View>

      <View style={styles.detailsIntro}>
        <Text style={styles.detailsTitle}>A few details about you</Text>
        <Text style={styles.subtitle}>This personalizes your health record and reminders.</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.nameRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>First name</Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Shubhi"
              placeholderTextColor="rgba(138,144,162,0.7)"
              autoCapitalize="words"
              style={styles.input}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Last name</Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Jha"
              placeholderTextColor="rgba(138,144,162,0.7)"
              autoCapitalize="words"
              style={styles.input}
            />
          </View>
        </View>

        <View>
          <Text style={styles.label}>Phone number</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+91 98765 43210"
            placeholderTextColor="rgba(138,144,162,0.7)"
            keyboardType="phone-pad"
            style={styles.input}
          />
        </View>

        <View>
          <Text style={styles.label}>Age</Text>
          <TextInput
            value={age}
            onChangeText={(t) => setAge(t.replace(/\D/g, '').slice(0, 3))}
            placeholder="28"
            placeholderTextColor="rgba(138,144,162,0.7)"
            keyboardType="number-pad"
            style={styles.input}
            returnKeyType="go"
            onSubmitEditing={submit}
          />
        </View>

        {(localError ?? error) && <Text style={styles.error}>{localError ?? error}</Text>}

        <Pressable
          onPress={submit}
          disabled={busy}
          style={({ pressed }) => [styles.button, { marginTop: 6 }, pressed && !busy && { backgroundColor: Colors.primaryPressed }]}>
          {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Create account</Text>}
        </Pressable>
      </View>
    </ScrollView>
  );
}

// The official multi-colour Google "G".
function GoogleGlyph() {
  return (
    <Svg width={20} height={20} viewBox="0 0 48 48">
      <Path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <Path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <Path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <Path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 24 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: {
    marginTop: 36,
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
    letterSpacing: -0.6,
    color: Colors.ink,
    textAlign: 'center',
  },
  subtitle: { marginTop: 12, maxWidth: 300, fontSize: 15, lineHeight: 22, color: Colors.inkSoft, textAlign: 'center' },

  form: { gap: 12 },
  label: { fontSize: 12.5, fontWeight: '700', color: Colors.inkSoft, marginBottom: 6, marginLeft: 2 },
  input: {
    height: 54,
    width: '100%',
    borderRadius: Radius.input,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
    backgroundColor: Colors.card,
    paddingHorizontal: 18,
    fontSize: 15,
    color: Colors.ink,
    ...Shadow,
  },
  error: { fontSize: 12.5, color: Colors.statusFlag, marginLeft: 2, marginTop: -2 },
  button: {
    height: 56,
    width: '100%',
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow,
  },
  buttonText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },

  googleButton: {
    height: 56,
    width: '100%',
    flexDirection: 'row',
    gap: 12,
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow,
  },
  googleButtonText: { fontSize: 15, fontWeight: '700', color: Colors.ink },
  legal: { paddingTop: 2, textAlign: 'center', fontSize: 12, lineHeight: 17, color: Colors.inkSoft },
  waitlist: { marginTop: 24, textAlign: 'center', fontSize: 12.5, fontWeight: '600', color: 'rgba(138,144,162,0.8)' },

  detailsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 36 },
  backBtn: { width: 36, height: 36 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.hairline },
  dotActive: { width: 18, backgroundColor: Colors.primary },
  detailsIntro: { marginTop: 24, marginBottom: 28, alignItems: 'center' },
  detailsTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, color: Colors.ink, textAlign: 'center' },
  nameRow: { flexDirection: 'row', gap: 12 },
});
