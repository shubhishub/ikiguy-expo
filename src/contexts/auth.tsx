import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import { login as apiLogin } from '@/lib/api';

const USER_KEY = 'ikiguy.userId';
const EMAIL_KEY = 'ikiguy.email';

// SecureStore is unavailable on web — fall back to localStorage there.
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
  userId: string | null;
  email: string | null;
  ready: boolean;
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const [id, mail] = await Promise.all([storage.get(USER_KEY), storage.get(EMAIL_KEY)]);
      setUserId(id);
      setEmail(mail);
      setReady(true);
    })();
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      userId,
      email,
      ready,
      async signIn(nextEmail: string) {
        const { userId: id, email: mail } = await apiLogin(nextEmail);
        await Promise.all([storage.set(USER_KEY, id), storage.set(EMAIL_KEY, mail)]);
        setUserId(id);
        setEmail(mail);
      },
      async signOut() {
        await Promise.all([storage.del(USER_KEY), storage.del(EMAIL_KEY)]);
        setUserId(null);
        setEmail(null);
      },
    }),
    [userId, email, ready],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
