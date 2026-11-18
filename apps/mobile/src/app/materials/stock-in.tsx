import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { AppText, Button, Card, ErrorStrip, Screen, ScreenHeader, Segmented } from '@/components/ui';
import { useStore } from '@/data/store';
import { unitLabel, useT } from '@/i18n';
import { groupIndian } from '@/lib/format';
import { colors, shadow } from '@/theme/tokens';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'] as const;

export default function StockIn() {
  const router = useRouter();
  const { t } = useT();
  const S = t.stock;
  const params = useLocalSearchParams<{ id?: string; mode?: string }>();
  const { materials, applyStock } = useStore();
  const [mode, setMode] = useState<'in' | 'out'>(params.mode === 'out' ? 'out' : 'in');
  const material = materials.find((m) => m.id === params.id);
  const [qty, setQty] = useState('');

  if (!material) {
    return (
      <Screen footer={<Button label={S.backToStock} onPress={() => router.replace('/materials')} />}>
        <ScreenHeader title={S.notFound} subtitle={S.notFoundSub} />
      </Screen>
    );
  }

  const unit = unitLabel(material.unit);
  const value = qty === '' || qty === '.' ? 0 : parseFloat(qty);
  const tooMuch = mode === 'out' && value > material.qty;
  const canSave = value > 0 && !tooMuch;
  const accent = mode === 'in' ? colors.success : colors.warning;

  function press(k: (typeof KEYS)[number]) {
    if (k === 'del') return setQty((q) => q.slice(0, -1));
    if (k === '.') return setQty((q) => (q.includes('.') ? q : (q === '' ? '0.' : q + '.')));
    setQty((q) => (q === '0' ? k : q.length >= 7 ? q : q + k));
  }

  const materialId = material.id;
  function save() {
    applyStock(materialId, value, mode);
    router.replace({ pathname: '/materials/saved', params: { id: materialId, qty: String(value), mode } });
  }

  return (
    <Screen
      footer={<Button label={mode === 'in' ? S.saveIn : S.saveOut} variant="success" icon="check" disabled={!canSave} onPress={save} />}
    >
      <ScreenHeader title={material.name} subtitle={S.onSite(groupIndian(material.qty), unit)} />
      <View style={{ marginBottom: 12 }}>
        <Segmented<'in' | 'out'>
          options={[{ value: 'in', label: S.in }, { value: 'out', label: S.out }]}
          value={mode}
          onChange={setMode}
          activeColors={{ in: colors.success, out: colors.warning }}
        />
      </View>

      <Card style={[styles.qty, { borderColor: accent }]}>
        <AppText size={15} weight="semibold" color={colors.muted}>{S.quantity}</AppText>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <Icon name={mode === 'in' ? 'plus' : 'minus'} size={24} color={accent} strokeWidth={2.6} />
          <AppText size={42} weight="bold" tabular color={qty === '' ? colors.muted : colors.text}>{qty === '' ? '0' : qty}</AppText>
          <AppText size={18} weight="semibold" color={colors.muted}>{unit}</AppText>
        </View>
      </Card>
      {tooMuch ? (
        <ErrorStrip>
          <AppText size={15} weight="semibold" color={colors.danger}>{S.onlyHave(groupIndian(material.qty), unit)}</AppText>
        </ErrorStrip>
      ) : null}

      {mode === 'in' && material.supplier ? (
        <AppText size={15} color={colors.muted} style={{ marginBottom: 10, marginLeft: 2 }}>{t.materials.supplier(material.supplier)}</AppText>
      ) : null}

      <View style={styles.keys}>
        {KEYS.map((k) => (
          <Pressable
            key={k}
            accessibilityRole="button"
            accessibilityLabel={k === 'del' ? S.del : k}
            onPress={() => press(k)}
            style={({ pressed }) => [styles.key, pressed && { backgroundColor: colors.tPrimary }]}
          >
            {k === 'del' ? <Icon name="del" size={24} color={colors.muted} /> : <AppText size={26} weight="semibold" color={k === '.' ? colors.muted : colors.text}>{k}</AppText>}
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  qty: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 16, marginBottom: 12, borderWidth: 2 },
  keys: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  key: { width: '31.5%', height: 56, borderRadius: 14, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', ...shadow.card },
});
