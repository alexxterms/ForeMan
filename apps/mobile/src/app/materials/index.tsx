import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Badge, Button, Card, Empty, Pill, Screen, ScreenHeader, Section, StatusRow } from '@/components/ui';
import type { Material } from '@/data/types';
import { useStore } from '@/data/store';
import { unitLabel, useT } from '@/i18n';
import { groupIndian } from '@/lib/format';
import { colors } from '@/theme/tokens';

function levelOf(m: Material): 'out' | 'low' | 'ok' {
  if (m.qty <= 0) return 'out';
  if (m.min > 0 && m.qty < m.min) return 'low';
  return 'ok';
}

function MaterialRow({ m, onPress }: { m: Material; onPress: () => void }) {
  const { t } = useT();
  const M = t.materials;
  const level = levelOf(m);
  const unit = unitLabel(m.unit);
  const barColor = level === 'out' ? colors.danger : level === 'low' ? colors.warning : colors.success;
  const badgeColor = level === 'out' ? colors.danger : level === 'low' ? colors.warning : colors.success;
  const badgeTint = level === 'out' ? colors.tDanger : level === 'low' ? colors.tWarning : colors.tSuccess;
  const full = Math.max(m.min * 3, m.qty, 1);
  const pct = Math.max(0, Math.min(100, (m.qty / full) * 100));
  const sub = m.supplier ? M.supplier(m.supplier) : m.min > 0 ? M.lowBelow(groupIndian(m.min), unit) : M.tapRow;

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${m.name}, ${m.qty} ${unit}`} onPress={onPress}>
      {({ pressed }) => (
        <Card style={[styles.row, pressed && { transform: [{ scale: 0.99 }] }]}>
          <View style={styles.top}>
            <Badge icon="box" color={badgeColor} tint={badgeTint} size={44} />
            <View style={{ flex: 1 }}>
              <AppText size={19} weight="semibold" numberOfLines={1}>{m.name}</AppText>
              <AppText size={14} color={colors.muted} numberOfLines={1}>{sub}</AppText>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <AppText size={24} weight="bold" tabular color={level === 'ok' ? colors.text : barColor}>{groupIndian(m.qty)}</AppText>
              <AppText size={14} color={colors.muted}>{unit}</AppText>
            </View>
          </View>
          <View style={styles.track}>
            <View style={{ width: `${pct}%`, height: 8, borderRadius: 99, backgroundColor: barColor }} />
          </View>
          <View style={styles.bottom}>
            {level === 'out' ? <Pill tone="out" icon="x" label={M.out} /> : null}
            {level === 'low' ? <Pill tone="low" icon="alert" label={M.low} /> : null}
            {level === 'ok' ? <Pill tone="ok" icon="check" label={M.ok} /> : null}
            <AppText size={14} color={colors.muted}>
              {M.usedToday} <AppText size={14} weight="bold" color={colors.text}>{groupIndian(m.usedToday)} {unit}</AppText>
            </AppText>
          </View>
        </Card>
      )}
    </Pressable>
  );
}

export default function Materials() {
  const router = useRouter();
  const { t } = useT();
  const M = t.materials;
  const { materials, date } = useStore();
  const flagged = materials.filter((m) => levelOf(m) !== 'ok');
  const fine = materials.filter((m) => levelOf(m) === 'ok');
  const open = (id: string, mode: 'in' | 'out') => router.push({ pathname: '/materials/stock-in', params: { id, mode } });

  return (
    <Screen footer={<Button label={M.add} icon="plus" onPress={() => router.push('/materials/new')} />}>
      <ScreenHeader title={M.title} subtitle={t.common.today(date)} />
      <StatusRow />

      {materials.length === 0 ? (
        <Empty icon="box" title={M.emptyTitle} body={M.emptyBody} />
      ) : (
        <AppText size={14} color={colors.muted} style={{ marginLeft: 2 }}>{M.tapHint}</AppText>
      )}

      {flagged.length > 0 ? (
        <>
          <Section>{M.flagged}</Section>
          {flagged.map((m) => (<MaterialRow key={m.id} m={m} onPress={() => open(m.id, 'in')} />))}
        </>
      ) : null}
      {fine.length > 0 ? <Section>{M.fine}</Section> : null}
      {fine.map((m) => (<MaterialRow key={m.id} m={m} onPress={() => open(m.id, 'in')} />))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: 10 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  track: { height: 8, backgroundColor: colors.tNeutral, borderRadius: 99, marginTop: 12, marginBottom: 10, overflow: 'hidden' },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, minHeight: 28, flexWrap: 'wrap' },
});
