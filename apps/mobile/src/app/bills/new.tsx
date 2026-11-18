import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Badge, Button, Card, Field, Pill, Screen, ScreenHeader, Section, Segmented } from '@/components/ui';
import { useStore } from '@/data/store';
import type { BillKind } from '@/data/types';
import { useT } from '@/i18n';
import { colors, shadow } from '@/theme/tokens';

function Option({ title, sub, active, onPress }: { title: string; sub: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.opt, active && styles.optOn]}>
      <View style={[styles.radio, active && { borderColor: colors.primary }]}>{active ? <View style={styles.radioDot} /> : null}</View>
      <View style={{ flex: 1 }}>
        <AppText size={19} weight="semibold">{title}</AppText>
        <AppText size={14} color={colors.muted}>{sub}</AppText>
      </View>
    </Pressable>
  );
}

type Due = '7' | '15' | '30';

export default function NewBill() {
  const router = useRouter();
  const { t } = useT();
  const B = t.billNew;
  const { company, site } = useStore();
  const gst = !!company?.gstRegistered;
  const [kind, setKind] = useState<BillKind>(gst ? 'tax' : 'plain');
  const [client, setClient] = useState(site?.clientName ?? '');
  const [due, setDue] = useState<Due>('15');

  return (
    <Screen
      footer={
        <Button
          label={B.continue}
          disabled={client.trim().length === 0}
          onPress={() => router.push({ pathname: '/bills/lines', params: { kind, client: client.trim(), due } })}
        />
      }
    >
      <ScreenHeader title={B.title} subtitle={site ? B.forSite(site.name) : B.pickType} />

      <Card style={styles.company}>
        <Badge icon="building" color={colors.darkSlate} tint={colors.tNeutral} size={40} />
        <View style={{ flex: 1 }}>
          <AppText size={14} color={colors.muted}>{B.yourCompany}</AppText>
          <AppText size={17} weight="semibold">{gst ? B.gst : B.noGst}</AppText>
        </View>
        {gst ? <Pill tone="ok" icon="check" label={B.gstinSet} /> : <Pill tone="off" label={B.noTax} />}
      </Card>

      {gst ? (
        <Option title={B.tax} sub={B.taxSub} active={kind === 'tax'} onPress={() => setKind('tax')} />
      ) : (
        <Option title={B.plain} sub={B.plainSub} active={kind === 'plain'} onPress={() => setKind('plain')} />
      )}
      <Option title={B.ra} sub={B.raSub} active={kind === 'ra'} onPress={() => setKind('ra')} />

      <View style={{ height: 8 }} />
      <Field label={B.client} value={client} onChangeText={setClient} placeholder="Mr. Anil Sharma" autoCapitalize="words" />

      <Section style={{ marginTop: 0 }}>{B.dueIn}</Section>
      <Segmented<Due>
        options={[{ value: '7', label: B.days(7) }, { value: '15', label: B.days(15) }, { value: '30', label: B.days(30) }]}
        value={due}
        onChange={setDue}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  company: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  opt: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...shadow.card,
  },
  optOn: { borderColor: colors.primary, backgroundColor: '#F5F8FF' },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
});
