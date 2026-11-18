import React, { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { AppText, Badge, Button, Card, ErrorStrip, Field, LangSwitch, Screen, Section } from '@/components/ui';
import { useStore } from '@/data/store';
import { useT } from '@/i18n';
import { isNetworkError, supabase } from '@/lib/supabase';
import { colors } from '@/theme/tokens';

const GSTIN = /^[0-9]{2}[A-Z0-9]{13}$/;

// First login with no company: either set one up as the owner, or wait for an invite.
export default function Setup() {
  const { email, reload, signOut } = useStore();
  const { t } = useT();
  const S = t.setup;
  const [company, setCompany] = useState('');
  const [name, setName] = useState('');
  const [gst, setGst] = useState(false);
  const [gstin, setGstin] = useState('');
  const [site, setSite] = useState('');
  const [client, setClient] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gstinClean = gstin.trim().toUpperCase();
  const gstinBad = gst && gstinClean.length > 0 && !GSTIN.test(gstinClean);
  const ready = company.trim() && name.trim() && site.trim() && (!gst || GSTIN.test(gstinClean));

  async function create() {
    setBusy(true);
    setError(null);
    const { error: e } = await supabase.rpc('create_company', {
      p_company: company.trim(),
      p_your_name: name.trim(),
      p_gst: gst,
      p_gstin: gst ? gstinClean : '',
      p_site: site.trim(),
      p_client: client.trim(),
    });
    setBusy(false);
    if (e) {
      setError(isNetworkError(e) ? t.common.noInternet : e.message);
      return;
    }
    await reload();
  }

  return (
    <Screen footer={<Button label={busy ? S.starting : S.start} icon="check" disabled={busy || !ready} onPress={create} />}>
      <View style={styles.top}>
        <LangSwitch />
      </View>
      <View style={styles.head}>
        <Badge icon="building" color={colors.primary} tint={colors.tPrimary} size={52} />
        <View style={{ flex: 1 }}>
          <AppText size={25} weight="bold">{S.title}</AppText>
          <AppText size={15} color={colors.muted}>{S.sub(email ?? '')}</AppText>
        </View>
      </View>

      <Card>
        <Field label={S.company} value={company} onChangeText={setCompany} placeholder="Ali Constructions" autoCapitalize="words" />
        <Field label={S.yourName} value={name} onChangeText={setName} placeholder="Ali" autoCapitalize="words" />
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <AppText size={18} weight="semibold">{S.gst}</AppText>
            <AppText size={14} color={colors.muted}>{gst ? S.gstOn : S.gstOff}</AppText>
          </View>
          <Switch accessibilityLabel={S.gst} value={gst} onValueChange={setGst} trackColor={{ false: colors.line, true: colors.primary }} />
        </View>
        {gst ? (
          <Field
            label={S.gstin}
            value={gstin}
            onChangeText={setGstin}
            placeholder="06ABCDE1234F1Z5"
            autoCapitalize="characters"
            maxLength={15}
            error={gstinBad ? S.gstinBad : null}
          />
        ) : null}
      </Card>

      <Section>{S.firstSite}</Section>
      <Card>
        <Field label={S.siteName} value={site} onChangeText={setSite} placeholder="Sector 21" autoCapitalize="words" />
        <Field label={S.client} value={client} onChangeText={setClient} placeholder="Mr. Anil Sharma" autoCapitalize="words" />
      </Card>

      {error ? (
        <View style={{ marginTop: 12 }}>
          <ErrorStrip>
            <AppText size={15} weight="semibold" color={colors.danger}>{error}</AppText>
          </ErrorStrip>
        </View>
      ) : null}

      <Card style={styles.manager}>
        <AppText size={17} weight="semibold">{S.managerTitle}</AppText>
        <AppText size={15} color={colors.muted}>{S.managerBody(email ?? '')}</AppText>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
          <Button label={S.checkAgain} variant="secondary" icon="sync" flex onPress={() => void reload()} />
          <Button label={t.common.logOut} variant="secondary" flex onPress={() => void signOut()} />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 16, paddingBottom: 16 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, marginBottom: 8 },
  manager: { gap: 6, marginTop: 20, backgroundColor: colors.tNeutral, shadowOpacity: 0, elevation: 0 },
});
