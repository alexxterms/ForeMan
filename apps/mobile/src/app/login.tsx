import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Badge, Button, Card, ErrorStrip, Field, LangSwitch, Screen, Segmented } from '@/components/ui';
import { useT } from '@/i18n';
import type { Strings } from '@/i18n/en';
import { isNetworkError, supabase } from '@/lib/supabase';
import { colors } from '@/theme/tokens';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

type Mode = 'login' | 'signup';

function explain(t: Strings, message: string, network: boolean): string {
  if (network) return t.common.noInternet;
  if (/invalid login credentials/i.test(message)) return t.login.wrong;
  if (/already registered|already exists/i.test(message)) return t.login.exists;
  if (/email not confirmed/i.test(message)) return t.login.notConfirmed;
  if (/rate|too many/i.test(message)) return t.login.tooMany;
  return message;
}

export default function Login() {
  const { t } = useT();
  const L = t.login;
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const mail = email.trim().toLowerCase();
  const signup = mode === 'signup';
  const ready = EMAIL.test(mail) && password.length >= (signup ? MIN_PASSWORD : 1) && (!signup || password === password2);

  async function submit() {
    setBusy(true);
    setError(null);
    setNotice(null);
    if (signup) {
      const { data, error: e } = await supabase.auth.signUp({ email: mail, password });
      setBusy(false);
      if (e) return setError(explain(t, e.message, isNetworkError(e)));
      // With email confirmation on, Supabase returns no session and sends an email instead.
      if (!data.session) setNotice(L.confirmNotice);
      return;
    }
    const { error: e } = await supabase.auth.signInWithPassword({ email: mail, password });
    setBusy(false);
    if (e) setError(explain(t, e.message, isNetworkError(e)));
    // On success the app moves on by itself.
  }

  return (
    <Screen
      footer={
        <Button
          label={busy ? t.common.wait : signup ? L.create : L.login}
          variant={signup ? 'primary' : 'success'}
          icon={signup ? 'plus' : 'check'}
          disabled={busy || !ready}
          onPress={submit}
        />
      }
    >
      <View style={styles.top}>
        <LangSwitch />
      </View>

      <View style={styles.brand}>
        <Badge icon="hat" color={colors.primary} tint={colors.tPrimary} size={60} />
        <View style={{ flex: 1 }}>
          <AppText size={32} weight="bold" color={colors.primary}>ForeMan</AppText>
          <AppText size={16} color={colors.muted}>{L.tagline}</AppText>
        </View>
      </View>

      <Card style={{ padding: 16 }}>
        <View style={{ marginBottom: 16 }}>
          <Segmented<Mode>
            options={[{ value: 'login', label: L.tabLogin }, { value: 'signup', label: L.tabSignup }]}
            value={mode}
            onChange={(m) => {
              setMode(m);
              setError(null);
              setNotice(null);
            }}
          />
        </View>

        <Field
          label={L.email}
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            setError(null);
          }}
          placeholder="name@gmail.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Field
          label={L.password}
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            setError(null);
          }}
          autoCapitalize="none"
          secure
          hint={signup ? L.passwordHint(MIN_PASSWORD) : undefined}
          error={signup && password.length > 0 && password.length < MIN_PASSWORD ? L.passwordShort(MIN_PASSWORD) : null}
        />
        {signup ? (
          <Field
            label={L.passwordAgain}
            value={password2}
            onChangeText={setPassword2}
            autoCapitalize="none"
            secure
            error={password2.length > 0 && password2 !== password ? L.passwordsDiffer : null}
          />
        ) : null}

        {error ? (
          <ErrorStrip>
            <AppText size={15} weight="semibold" color={colors.danger}>{error}</AppText>
          </ErrorStrip>
        ) : null}
        {notice ? (
          <View style={styles.notice}>
            <AppText size={15} weight="semibold" color={colors.warning}>{notice}</AppText>
          </View>
        ) : null}

        <AppText size={14} color={colors.muted}>{signup ? L.signupHint : L.loginHint}</AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 12 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 28, paddingBottom: 24 },
  notice: { backgroundColor: colors.tWarning, borderRadius: 12, padding: 12, marginBottom: 12 },
});
