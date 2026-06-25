import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import {
  loginWithGoogle as apiLoginWithGoogle,
  updateProfile as apiUpdateProfile,
  type UserProfile,
  type UserRecord,
} from '@/lib/api';

const USER_KEY = 'ikiguy.user';

// SecureStore is unavailable on web - fall back to localStorage there.
const storage = {
  async get(key: string) {
    if (Platform.OS === 'web') return globalThis.localStorage?.getItem(key) ?? null;
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string) {
    if (Platform.OS === 'web') return void globalThis.localStorage?.setItem(key, value);
    return SecureStore.setItemAsync(key, value);
  },
  async del(key: string) {
    if (Platform.OS === 'web') return void globalThis.localStorage?.removeItem(key);
    return SecureStore.deleteItemAsync(key);
  },
};

type AuthValue = {
  user: UserRecord | null;
  userId: string | null;
  email: string | null;
  /** First name if known, else the email handle. */
  firstName: string;
  /** "First Last" if known, else the email handle. */
  fullName: string;
  /** Up-to-two-letter avatar initials. */
  initials: string;
  /** Google profile photo URL, if any. */
  avatarUrl: string | null;
  ready: boolean;
  /** True once signed in but still missing the details Google can't supply. */
  needsProfile: boolean;
  /** Verify a Google ID token with the server and persist the user. */
  signInWithGoogle: (idToken: string) => Promise<void>;
  /** Save the extra onboarding details (phone, age, name edits). */
  completeProfile: (profile: UserProfile) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

function persist(record: UserRecord): UserRecord {
  return {
    userId: record.userId,
    email: record.email,
    firstName: record.firstName,
    lastName: record.lastName,
    phone: record.phone,
    age: record.age,
    avatarUrl: record.avatarUrl,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserRecord | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const raw = await storage.get(USER_KEY);
      if (raw) {
        try {
          setUser(JSON.parse(raw) as UserRecord);
        } catch {
          setUser(null);
        }
      }
      setReady(true);
    })();
  }, []);

  const value = useMemo<AuthValue>(() => {
    const emailHandle = user?.email?.split('@')[0] ?? '';
    const first = user?.firstName?.trim() || '';
    const last = user?.lastName?.trim() || '';
    const fullName = [first, last].filter(Boolean).join(' ') || emailHandle;
    const initials =
      (first || last
        ? `${first[0] ?? ''}${last[0] ?? ''}`
        : emailHandle.slice(0, 2)
      ).toUpperCase() || 'IK';

    // After Google sign-in we still need phone + age, which Google doesn't give.
    const needsProfile = !!user && (!user.phone || user.age == null);

    return {
      user,
      userId: user?.userId ?? null,
      email: user?.email ?? null,
      firstName: first || emailHandle,
      fullName,
      initials,
      avatarUrl: user?.avatarUrl ?? null,
      ready,
      needsProfile,
      async signInWithGoogle(idToken: string) {
        const record = await apiLoginWithGoogle(idToken);
        const next = persist(record);
        await storage.set(USER_KEY, JSON.stringify(next));
        setUser(next);
      },
      async completeProfile(profile: UserProfile) {
        if (!user) throw new Error('Not signed in');
        const { user: record } = await apiUpdateProfile(user.userId, profile);
        const next = persist(record);
        await storage.set(USER_KEY, JSON.stringify(next));
        setUser(next);
      },
      async signOut() {
        await storage.del(USER_KEY);
        setUser(null);
      },
    };
  }, [user, ready]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
