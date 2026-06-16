import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Mascot } from '@/components/logo';
import { Colors, Radius } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';

export default function OnboardingScreen() {
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());

  async function onContinue() {
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      await signIn(email.trim());
      // RootNavigator redirects to the app once userId is set.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sign in. Check your connection.');
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.screen, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.hero}>
        <Mascot size={104} />
        <Text style={styles.brand}>
          iKiguy <Text style={styles.honey}>AI</Text>
        </Text>
        <Text style={styles.tagline}>One health account for every appointment. Owned by you for life.</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Your email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor={Colors.inkSoft}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          inputMode="email"
          style={styles.input}
          onSubmitEditing={onContinue}
          returnKeyType="go"
        />
        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          onPress={onContinue}
          disabled={!valid || busy}
          style={({ pressed }) => [
            styles.button,
            (!valid || busy) && styles.buttonDisabled,
            pressed && valid && !busy && { opacity: 0.9 },
          ]}>
          {busy ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </Pressable>

        <Text style={styles.fine}>
          We use your email to create your private health record. No password needed.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 28, justifyContent: 'space-between' },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  brand: { fontSize: 28, fontWeight: '800', letterSpacing: -0.6, color: Colors.ink, marginTop: 6 },
  honey: { color: Colors.honey },
  tagline: { fontSize: 14.5, lineHeight: 21, color: Colors.inkSoft, textAlign: 'center', maxWidth: 280, marginTop: 2 },

  form: { gap: 10 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.inkSoft, marginLeft: 2 },
  input: {
    backgroundColor: Colors.card,
    borderRadius: Radius.input,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.ink,
  },
  error: { fontSize: 12.5, color: Colors.statusFlag, marginLeft: 2 },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.input,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonDisabled: { backgroundColor: Colors.inkSoft, opacity: 0.5 },
  buttonText: { fontSize: 15.5, fontWeight: '700', color: '#FFFFFF' },
  fine: { fontSize: 12, lineHeight: 17, color: Colors.inkSoft, textAlign: 'center', marginTop: 4 },
});
