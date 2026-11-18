import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, IconName } from '@/components/Icon';
import { AppText, Badge, Button, Card, Screen, ScreenHeader } from '@/components/ui';
import { useStore } from '@/data/store';
import { unitLabel, useT } from '@/i18n';
import { colors } from '@/theme/tokens';

type Row = { label: string; value: string; icon: IconName; color: string; tint: string };

export default function VoiceConfirm() {
  const router = useRouter();
  const { t } = useT();
  const C = t.confirm;
  const { voiceDraft, materials, workers, applyVoiceDraft, date, site } = useStore();
  const SITE = site?.name ?? '';

  if (!voiceDraft) {
    return (
      <Screen footer={<Button label={C.home} onPress={() => router.replace('/')} />}>
        <ScreenHeader title={C.nothing} />
      </Screen>
    );
  }

  const common: Row[] = [
    { label: C.site, value: SITE, icon: 'building', color: colors.secondary, tint: colors.tTeal },
    { label: C.date, value: t.common.today(date), icon: 'cal', color: colors.slate, tint: colors.tNeutral },
  ];

  let rows: Row[];
  if (voiceDraft.kind === 'attendance') {
    const w = workers.find((x) => x.id === voiceDraft.workerId);
    const tone = voiceDraft.status === 'p' ? colors.success : voiceDraft.status === 'h' ? colors.warning : colors.danger;
    const tint = voiceDraft.status === 'p' ? colors.tSuccess : voiceDraft.status === 'h' ? colors.tWarning : colors.tDanger;
    rows = [
      { label: C.worker, value: w ? `${w.name}${w.trade ? ` (${w.trade})` : ''}` : C.unknown, icon: 'user', color: colors.primary, tint: colors.tPrimary },
      {
        label: C.entry,
        value: `${C.status[voiceDraft.status]}${voiceDraft.hours ? ` · ${C.hours(voiceDraft.hours)}` : ''}`,
        icon: 'hat',
        color: tone,
        tint,
      },
      ...common,
    ];
  } else {
    const m = materials.find((x) => x.id === voiceDraft.materialId);
    const inMode = voiceDraft.mode === 'in';
    rows = [
      { label: C.material, value: m?.name ?? C.unknown, icon: 'box', color: colors.warning, tint: colors.tWarning },
      {
        label: inMode ? t.stock.in : t.stock.out,
        value: `${inMode ? '+' : '−'}${voiceDraft.qty} ${unitLabel(voiceDraft.unit)}`,
        icon: inMode ? 'plus' : 'minus',
        color: inMode ? colors.success : colors.warning,
        tint: inMode ? colors.tSuccess : colors.tWarning,
      },
      ...common,
    ];
  }

  return (
    <Screen
      footer={
        <>
          <Button
            label={C.save}
            variant="success"
            icon="check"
            onPress={() => {
              applyVoiceDraft();
              router.replace('/');
            }}
          />
          <Button label={C.again} variant="secondary" icon="mic" onPress={() => router.back()} />
        </>
      }
    >
      <ScreenHeader title={C.title} subtitle={C.sub} />

      {voiceDraft.transcript ? (
        <View style={styles.said}>
          <Icon name="mic" size={18} color={colors.secondary} />
          <AppText size={16} weight="medium" style={{ flex: 1 }}>{C.youSaid(voiceDraft.transcript)}</AppText>
        </View>
      ) : null}

      <Card style={{ paddingVertical: 4, paddingHorizontal: 0 }}>
        {rows.map((r, i) => (
          <View key={r.label} style={[styles.row, i < rows.length - 1 && styles.divider]}>
            <Badge icon={r.icon} color={r.color} tint={r.tint} size={42} />
            <View style={{ flex: 1 }}>
              <AppText size={14} color={colors.muted}>{r.label}</AppText>
              <AppText size={20} weight="semibold">{r.value}</AppText>
            </View>
          </View>
        ))}
      </Card>
      <AppText size={14} color={colors.muted} style={{ marginTop: 12, marginLeft: 2 }}>{C.offlineNote}</AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  said: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: colors.tTeal, borderRadius: 14, padding: 12, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.line },
});
