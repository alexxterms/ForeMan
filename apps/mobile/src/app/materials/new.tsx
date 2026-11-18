import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, Card, Field, Screen, ScreenHeader, Segmented } from '@/components/ui';
import { useStore } from '@/data/store';
import { unitLabel, useT } from '@/i18n';
import { colors } from '@/theme/tokens';

const UNITS = ['bags', 'kg', 'tons', 'cu m', 'pcs'] as const;
type Unit = (typeof UNITS)[number];

const num = (v: string) => v.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');

export default function NewMaterial() {
  const router = useRouter();
  const { t } = useT();
  const M = t.materials;
  const { addMaterial, site } = useStore();
  const [name, setName] = useState('');
  const [unit, setUnit] = useState<Unit>('bags');
  const [min, setMin] = useState('');
  const [opening, setOpening] = useState('');
  const [supplier, setSupplier] = useState('');

  const ok = name.trim().length > 0;
  const u = unitLabel(unit);

  function save() {
    addMaterial({ name: name.trim(), unit, min: Number(min) || 0, supplier: supplier.trim() }, Number(opening) || 0);
    router.back();
  }

  return (
    <Screen footer={<Button label={M.save} variant="success" icon="check" disabled={!ok} onPress={save} />}>
      <ScreenHeader title={M.newTitle} subtitle={site ? M.forSite(site.name) : undefined} />
      <Card>
        <Field label={M.name} value={name} onChangeText={setName} placeholder="Cement (OPC 53)" autoCapitalize="sentences" autoFocus />

        <AppText size={15} weight="semibold" color={colors.muted} style={styles.label}>{M.countedIn}</AppText>
        <View style={{ marginBottom: 14 }}>
          <Segmented<Unit> options={UNITS.map((x) => ({ value: x, label: unitLabel(x) }))} value={unit} onChange={setUnit} />
        </View>

        <Field label={M.opening(u)} value={opening} onChangeText={(v) => setOpening(num(v))} placeholder="0" keyboardType="decimal-pad" maxLength={9} />
        <Field
          label={M.min(u)}
          value={min}
          onChangeText={(v) => setMin(num(v))}
          placeholder="60"
          keyboardType="decimal-pad"
          maxLength={9}
          hint={M.minHint}
        />
        <Field label={M.supplierField} value={supplier} onChangeText={setSupplier} placeholder="ABC Traders" autoCapitalize="words" />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: 6, marginLeft: 2 },
});
