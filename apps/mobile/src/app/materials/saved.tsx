import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { AppText, Button, Card, Screen, StatusRow } from '@/components/ui';
import { useStore } from '@/data/store';
import { unitLabel, useT } from '@/i18n';
import { groupIndian } from '@/lib/format';
import { colors } from '@/theme/tokens';

export default function Saved() {
  const router = useRouter();
  const { t } = useT();
  const S = t.stock;
  const params = useLocalSearchParams<{ id?: string; qty?: string; mode?: string }>();
  const { materials } = useStore();
  const m = materials.find((x) => x.id === params.id);
  const mode = params.mode === 'out' ? 'out' : 'in';
  const unit = m ? unitLabel(m.unit) : '';

  return (
    <Screen
      footer={
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button label={S.addMore} variant="secondary" icon="plus" flex onPress={() => router.replace({ pathname: '/materials/stock-in', params: { id: m?.id ?? '', mode } })} />
          <Button label={S.backToStock} flex onPress={() => router.replace('/materials')} />
        </View>
      }
    >
      <View style={{ paddingTop: 16 }}>
        <StatusRow />
      </View>
      <View style={styles.center}>
        <View style={styles.tickRing}>
          <View style={styles.tick}>
            <Icon name="check" size={46} color={colors.white} strokeWidth={2.6} />
          </View>
        </View>
        <AppText size={26} weight="bold" style={{ marginTop: 8, textAlign: 'center' }}>{mode === 'in' ? S.savedIn : S.savedOut}</AppText>
        <AppText size={15} color={colors.muted} style={{ textAlign: 'center' }}>{S.savedNote}</AppText>
        {m ? (
          <Card style={{ width: '100%', marginTop: 12, paddingVertical: 6, paddingHorizontal: 16 }}>
            <Line label={m.name} value={`${mode === 'in' ? '+' : '−'}${params.qty ?? ''} ${unit}`} color={mode === 'in' ? colors.success : colors.warning} />
            <Line label={S.nowOnSite} value={`${groupIndian(m.qty)} ${unit}`} last={!m.supplier} />
            {m.supplier ? <Line label={S.supplier} value={m.supplier} last /> : null}
          </Card>
        ) : null}
      </View>
    </Screen>
  );
}

function Line({ label, value, last, color }: { label: string; value: string; last?: boolean; color?: string }) {
  return (
    <View style={[styles.line, last && { borderBottomWidth: 0 }]}>
      <AppText size={16} style={{ flex: 1 }}>{label}</AppText>
      <AppText size={17} weight="bold" tabular color={color}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: 8, paddingTop: 24 },
  tickRing: { width: 112, height: 112, borderRadius: 56, backgroundColor: colors.tSuccess, alignItems: 'center', justifyContent: 'center' },
  tick: { width: 92, height: 92, borderRadius: 46, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
});
