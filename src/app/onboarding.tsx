import { useState } from 'react';
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

import { BackIcon } from '@/components/icons';
import { Mascot } from '@/components/mascot';
import { Colors, Radius, Shadow } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Screen 1: Onboarding / Welcome - email, then a few personal details.
export default function OnboardingScreen() {
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<'email' | 'details'>('email');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = EMAIL_RE.test(email.trim());

  function goToDetails() {
    if (!emailValid) {
      setError('Please enter a valid email address.');
      return;
    }
    setError(null);
    setStep('details');
  }

  // Submit with whatever profile we have. `withDetails` requires the full form.
  async function submit(withDetails: boolean) {
    if (busy) return;
    const trimmedEmail = email.trim();
    if (!EMAIL_RE.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      setStep('email');
      return;
    }

    let profile: { firstName: string; lastName: string; phone: string; age: number } | undefined;
    if (withDetails) {
      const ageNum = Number(age);
      if (!firstName.trim() || !lastName.trim()) {
        setError('Please enter your first and last name.');
        return;
      }
      if (phone.replace(/\D/g, '').length < 7) {
        setError('Please enter a valid phone number.');
        return;
      }
      if (!Number.isFinite(ageNum) || ageNum < 1 || ageNum > 120) {
        setError('Please enter a valid age.');
        return;
      }
      profile = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        age: ageNum,
      };
    }

    setBusy(true);
    setError(null);
    try {
      await signIn(trimmedEmail, profile);
      // RootNavigator redirects to /home once the user exists.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Check your connection.');
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.screen, { paddingTop: insets.top + (step === 'email' ? 40 : 12), paddingBottom: insets.bottom + 16 }]}>
      {step === 'email' ? (
        <EmailStep
          email={email}
          setEmail={setEmail}
          error={error}
          onContinue={goToDetails}
          onSignIn={() => submit(false)}
          busy={busy}
        />
      ) : (
        <DetailsStep
          firstName={firstName}
          lastName={lastName}
          phone={phone}
          age={age}
          setFirstName={setFirstName}
          setLastName={setLastName}
          setPhone={setPhone}
          setAge={setAge}
          error={error}
          busy={busy}
          onBack={() => {
            setError(null);
            setStep('email');
          }}
          onSubmit={() => submit(true)}
        />
      )}
    </KeyboardAvoidingView>
  );
}

function EmailStep({
  email,
  setEmail,
  error,
  onContinue,
  onSignIn,
  busy,
}: {
  email: string;
  setEmail: (v: string) => void;
  error: string | null;
  onContinue: () => void;
  onSignIn: () => void;
  busy: boolean;
}) {
  return (
    <>
      <View style={styles.hero}>
        <Mascot status="good" size={132} />
        <Text style={styles.title}>Every doctor visit, remembered.</Text>
        <Text style={styles.subtitle}>Records you follow and track, until you heal.</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Mobile number or email"
          placeholderTextColor="rgba(138,144,162,0.7)"
          keyboardType="email-address"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          style={styles.input}
          onSubmitEditing={onContinue}
          returnKeyType="next"
        />
        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          onPress={onContinue}
          disabled={busy}
          style={({ pressed }) => [styles.button, pressed && !busy && { backgroundColor: Colors.primaryPressed }]}>
          <Text style={styles.buttonText}>Continue</Text>
        </Pressable>

        <Text style={styles.signinRow}>
          Already have an account?{' '}
          <Text style={styles.signinLink} onPress={onSignIn}>
            Sign in
          </Text>
        </Text>
      </View>

      <Text style={styles.waitlist}>Join the beta waitlist</Text>
    </>
  );
}

function DetailsStep({
  firstName,
  lastName,
  phone,
  age,
  setFirstName,
  setLastName,
  setPhone,
  setAge,
  error,
  busy,
  onBack,
  onSubmit,
}: {
  firstName: string;
  lastName: string;
  phone: string;
  age: string;
  setFirstName: (v: string) => void;
  setLastName: (v: string) => void;
  setPhone: (v: string) => void;
  setAge: (v: string) => void;
  error: string | null;
  busy: boolean;
  onBack: () => void;
  onSubmit: () => void;
}) {
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.detailsHeader}>
        <Pressable onPress={onBack} hitSlop={8} style={styles.backBtn}>
          <BackIcon size={22} color={Colors.ink} />
        </Pressable>
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
            onSubmitEditing={onSubmit}
          />
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          onPress={onSubmit}
          disabled={busy}
          style={({ pressed }) => [styles.button, { marginTop: 6 }, pressed && !busy && { backgroundColor: Colors.primaryPressed }]}>
          {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Create account</Text>}
        </Pressable>
      </View>
    </ScrollView>
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
  signinRow: { paddingTop: 4, textAlign: 'center', fontSize: 14, color: Colors.inkSoft },
  signinLink: { fontWeight: '700', color: Colors.primary },
  waitlist: { marginTop: 24, textAlign: 'center', fontSize: 12.5, fontWeight: '600', color: 'rgba(138,144,162,0.8)' },

  detailsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 36 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.pill },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.hairline },
  dotActive: { width: 18, backgroundColor: Colors.primary },
  detailsIntro: { marginTop: 24, marginBottom: 28, alignItems: 'center' },
  detailsTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, color: Colors.ink, textAlign: 'center' },
  nameRow: { flexDirection: 'row', gap: 12 },
});
