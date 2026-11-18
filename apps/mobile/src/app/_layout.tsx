import {
  Hind_400Regular,
  Hind_500Medium,
  Hind_600SemiBold,
  Hind_700Bold,
  useFonts,
} from '@expo-google-fonts/hind';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { Badge, AppText, Button } from '@/components/ui';
import { StoreProvider, useStore } from '@/data/store';
import { LangProvider, useT } from '@/i18n';
import { colors, gutter } from '@/theme/tokens';

// Sends people to login, company setup, or the app, depending on where they are.
function Gate() {
  const { phase, reload } = useStore();
  const { t } = useT();
  const segments = useSegments();
  const router = useRouter();
  const first = segments[0] as string | undefined;

  useEffect(() => {
    if (phase === 'signedOut' && first !== 'login') router.replace('/login');
    else if (phase === 'noCompany' && first !== 'setup') router.replace('/setup');
    else if (phase === 'ready' && (first === 'login' || first === 'setup')) router.replace('/');
  }, [phase, first, router]);

  if (phase === 'loading') {
    return (
      <View style={styles.cover}>
        <Badge icon="hat" color={colors.primary} tint={colors.tPrimary} size={64} />
        <AppText size={28} weight="bold" color={colors.primary} style={{ marginTop: 12 }}>ForeMan</AppText>
        <ActivityIndicator size="small" color={colors.secondary} style={{ marginTop: 16 }} />
        <AppText size={15} color={colors.muted} style={{ marginTop: 6 }}>{t.common.loading}</AppText>
      </View>
    );
  }
  if (phase === 'unconfigured') {
    return (
      <View style={[styles.cover, { alignItems: 'stretch' }]}>
        <AppText size={24} weight="bold">{t.gate.unconfiguredTitle}</AppText>
        <AppText size={17} color={colors.muted} style={{ marginTop: 8 }}>
          {t.gate.unconfiguredBody}
        </AppText>
      </View>
    );
  }
  if (phase === 'needsNetwork') {
    return (
      <View style={[styles.cover, { alignItems: 'stretch' }]}>
        <Badge icon="cloudoff" color={colors.slate} tint={colors.tNeutral} size={56} />
        <AppText size={24} weight="bold" style={{ marginTop: 14 }}>{t.gate.networkTitle}</AppText>
        <AppText size={17} color={colors.muted} style={{ marginTop: 8, marginBottom: 20 }}>
          {t.gate.networkBody}
        </AppText>
        <Button label={t.common.tryAgain} icon="sync" onPress={() => void reload()} />
      </View>
    );
  }
  return null;
}

export default function RootLayout() {
  const [loaded] = useFonts({ Hind_400Regular, Hind_500Medium, Hind_600SemiBold, Hind_700Bold });
  if (!loaded) return null;

  return (
    <LangProvider>
    <StoreProvider>
      <StatusBar style="dark" />
      {/* On web, keep the app phone-width so it looks the same as on a phone. */}
      <View style={styles.outer}>
        <View style={styles.inner}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'fade' }} />
          <Gate />
        </View>
      </View>
    </StoreProvider>
    </LangProvider>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: Platform.OS === 'web' ? '#D9DEE4' : colors.bg, alignItems: 'center' },
  inner: { flex: 1, width: '100%', maxWidth: Platform.OS === 'web' ? 420 : undefined, backgroundColor: colors.bg },
  cover: { ...StyleSheet.absoluteFill, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: gutter },
});
