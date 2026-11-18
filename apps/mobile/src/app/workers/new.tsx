import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { AppText, Button, Card, Field, Screen, ScreenHeader } from '@/components/ui';
import { useStore } from '@/data/store';
import { useT } from '@/i18n';
import { colors } from '@/theme/tokens';

export default function NewWorker() {
  const router = useRouter();
  const { t } = useT();
  const W = t.worker;
  const { addWorker, site } = useStore();
  const [name, setName] = useState('');
  const [trade, setTrade] = useState('');
  const [rate, setRate] = useState('');
  const [added, setAdded] = useState<string[]>([]);

  const rateNum = rate ? Number(rate) : 0;
  const ok = name.trim().length > 0 && Number.isFinite(rateNum) && rateNum >= 0 && rateNum <= 100000;

  function save(more: boolean) {
    addWorker({ name: name.trim(), trade: trade.trim(), rate: rateNum });
    if (more) {
      setAdded((a) => [...a, name.trim()]);
      setName('');
      setTrade('');
      setRate('');
    } else {
      router.back();
    }
  }

  return (
    <Screen
      footer={
        <>
          <Button label={W.save} variant="success" icon="check" disabled={!ok} onPress={() => save(false)} />
          <Button label={W.saveMore} variant="secondary" icon="plus" disabled={!ok} onPress={() => save(true)} />
        </>
      }
    >
      <ScreenHeader title={W.title} subtitle={site ? W.worksAt(site.name) : undefined} />
      {added.length > 0 ? (
        <View style={styles.added}>
          <Icon name="check" size={18} color={colors.success} strokeWidth={2.6} />
          <AppText size={15} weight="semibold" color={colors.success} style={{ flex: 1 }}>{W.added(added.join(', '))}</AppText>
        </View>
      ) : null}
      <Card>
        <Field label={W.name} value={name} onChangeText={setName} placeholder="Ramesh Kumar" autoCapitalize="words" autoFocus />
        <Field label={W.trade} value={trade} onChangeText={setTrade} placeholder={W.tradePh} autoCapitalize="sentences" />
        <Field
          label={W.rate}
          value={rate}
          onChangeText={(v) => setRate(v.replace(/[^\d]/g, ''))}
          placeholder="800"
          keyboardType="number-pad"
          maxLength={6}
          hint={W.rateHint}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  added: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.tSuccess, borderRadius: 12, padding: 12, marginBottom: 12 },
});
