import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

// Both values are public by design. Row-level security on the server decides what each login can see.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabaseConfigured = url.startsWith('https://') && key.length > 20;

export const supabase = createClient(supabaseConfigured ? url : 'https://not-configured.supabase.co', supabaseConfigured ? key : 'missing-key-missing-key', {
  auth: {
    storage: Platform.OS === 'web' && typeof window === 'undefined' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Refresh the login only while the app is on screen.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

// True when a request failed because there was no network, not because the server said no.
export function isNetworkError(e: { status?: number; message?: string } | null | undefined): boolean {
  if (!e) return false;
  if (e.status === 0) return true;
  return /network request failed|failed to fetch|fetch failed|load failed|networkerror|timeout|aborted/i.test(e.message ?? '');
}
