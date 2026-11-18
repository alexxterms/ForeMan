import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, IconName } from '@/components/Icon';
import { AppText, Badge, Card, ErrorStrip, Pill, Screen, StatusRow, useToast } from '@/components/ui';
import { useStore } from '@/data/store';
import { initialOf } from '@/data/types';
import { useT } from '@/i18n';
import { shownStatus } from '@/lib/billing';
import { colors, radius, shadow } from '@/theme/tokens';

type Tile = { key: string; icon: IconName; color: string; tint: string; route?: string };

const TILES: Tile[] = [
  { key: 'attendance', icon: 'clip', color: colors.success, tint: colors.tSuccess, route: '/attendance' },
  { key: 'materials', icon: 'box', color: colors.warning, tint: colors.tWarning, route: '/materials' },
  { key: 'bills', icon: 'doc', color: colors.darkSlate, tint: colors.tNeutral, route: '/bills' },
  { key: 'sites', icon: 'building', color: colors.secondary, tint: colors.tTeal, route: '/sites' },
  { key: 'wages', icon: 'wallet', color: colors.primary, tint: colors.tPrimary },
  { key: 'expenses', icon: 'tag', color: colors.slate, tint: colors.tNeutral },
];

export default function Home() {
  const router = useRouter();
  const { t } = useT();
  const H = t.home;
  const { me, company, workers, attendance, materials, bills, isOwner, problems, clearProblems } = useStore();
  const { toast, showToast } = useToast();

  const present = workers.filter((w) => attendance[w.id]?.status === 'p').length;
  const half = workers.filter((w) => attendance[w.id]?.status === 'h').length;
  const unmarked = workers.filter((w) => !attendance[w.id]).length;
  const pct = workers.length ? Math.round(((present + half * 0.5) / workers.length) * 100) : 0;
  const lowStock = materials.filter((m) => m.qty <= 0 || (m.min > 0 && m.qty < m.min)).length;
  const overdue = bills.filter((b) => shownStatus(b).status === 'overdue').length;

  const firstName = me?.name.split(' ')[0] ?? '';
  const h = new Date().getHours();
  const greeting = h < 12 ? H.morning : h < 17 ? H.afternoon : H.evening;

  return (
    <Screen
      toast={toast}
      footer={
        <View style={styles.micWrap}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={H.speakA11y}
            onPress={() => router.push('/voice')}
            style={({ pressed }) => [styles.mic, pressed && { transform: [{ scale: 0.95 }] }]}
          >
            <Icon name="mic" size={34} color={colors.white} />
          </Pressable>
          <AppText size={14} weight="bold" color={colors.secondary}>{H.speak}</AppText>
        </View>
      }
    >
      <View style={styles.topBar}>
        <View style={{ flex: 1 }}>
          <AppText size={15} weight="bold" color={colors.primary} numberOfLines={1}>{company?.name ?? 'ForeMan'}</AppText>
          <AppText size={14} color={colors.muted}>{isOwner ? t.common.owner : t.common.manager}</AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={H.account}
          onPress={() => router.push('/settings')}
          style={({ pressed }) => [styles.avatar, pressed && { opacity: 0.8 }]}
        >
          <AppText size={18} weight="bold" color={colors.primary}>{initialOf(me?.name || me?.email || '?')}</AppText>
        </Pressable>
      </View>

      <StatusRow />

      <AppText size={26} weight="bold" style={{ marginBottom: 12 }}>
        {greeting}{firstName ? `, ${firstName}` : ''}
      </AppText>

      {problems.length > 0 ? (
        <ErrorStrip onPress={clearProblems}>
          {problems.slice(-3).map((p, i) => (
            <AppText key={i} size={15} weight="semibold" color={colors.danger}>{H.entryFailed(p)}</AppText>
          ))}
          <AppText size={14} color={colors.muted}>{H.problemsHint}</AppText>
        </ErrorStrip>
      ) : null}

      <Pressable accessibilityRole="button" accessibilityLabel={t.attendance.title} onPress={() => router.push(workers.length ? '/attendance' : '/workers/new')}>
        {({ pressed }) => (
          <Card style={[styles.count, pressed && { transform: [{ scale: 0.99 }] }]}>
            {workers.length > 0 ? (
              <>
                <View style={styles.countTop}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, flex: 1, flexWrap: 'wrap' }}>
                    <AppText size={34} weight="bold" color={colors.success} tabular>{present}</AppText>
                    <AppText size={18} weight="semibold">{H.present(workers.length)}</AppText>
                  </View>
                  <Icon name="chev" size={22} color={colors.muted} />
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${pct}%` }]} />
                </View>
                <View style={styles.countMeta}>
                  {half > 0 ? <Pill tone="due" label={H.half(half)} /> : null}
                  {unmarked > 0 ? <Pill tone="off" icon="clock" label={H.notMarked(unmarked)} /> : <Pill tone="ok" icon="check" label={H.allMarked} />}
                </View>
              </>
            ) : (
              <View style={styles.countTop}>
                <Icon name="hat" size={28} color={colors.success} />
                <View style={{ flex: 1 }}>
                  <AppText size={17} weight="semibold">{H.noWorkers}</AppText>
                  <AppText size={15} weight="bold" color={colors.primary}>{H.addWorkers}</AppText>
                </View>
                <Icon name="chev" size={22} color={colors.muted} />
              </View>
            )}
          </Card>
        )}
      </Pressable>

      {lowStock > 0 || overdue > 0 ? (
        <View style={styles.alerts}>
          {lowStock > 0 ? (
            <Pressable accessibilityRole="button" onPress={() => router.push('/materials')} style={[styles.alert, { backgroundColor: colors.tWarning }]}>
              <Icon name="alert" size={18} color={colors.warning} strokeWidth={2.3} />
              <AppText size={14} weight="bold" color={colors.warning} style={{ flexShrink: 1 }}>{H.lowStock(lowStock)}</AppText>
            </Pressable>
          ) : null}
          {overdue > 0 ? (
            <Pressable accessibilityRole="button" onPress={() => router.push('/bills')} style={[styles.alert, { backgroundColor: colors.tDanger }]}>
              <Icon name="clock" size={18} color={colors.danger} strokeWidth={2.3} />
              <AppText size={14} weight="bold" color={colors.danger} style={{ flexShrink: 1 }}>{H.overdue(overdue)}</AppText>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View style={styles.grid}>
        {TILES.map((tile) => {
          const [title, sub] = H.tiles[tile.key];
          const live = !!tile.route;
          return (
            <Pressable
              key={tile.key}
              accessibilityRole="button"
              accessibilityLabel={live ? title : `${title}, ${t.common.soon}`}
              onPress={() => (tile.route ? router.push(tile.route as never) : showToast(H.soon(title)))}
              style={({ pressed }) => [styles.tile, !live && styles.tileSoon, pressed && { transform: [{ scale: 0.97 }] }]}
            >
              <View style={styles.tileTop}>
                <Badge icon={tile.icon} color={live ? tile.color : colors.slate} tint={live ? tile.tint : colors.tNeutral} size={46} />
                {!live ? <Pill tone="off" label={t.common.soon} /> : null}
              </View>
              <AppText size={20} weight="semibold" color={live ? colors.text : colors.muted} style={{ marginTop: 10 }}>{title}</AppText>
              <AppText size={14} color={colors.muted}>{sub}</AppText>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 12, paddingBottom: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.tPrimary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.white },
  count: { marginBottom: 12, gap: 10 },
  countTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  countMeta: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  track: { height: 8, backgroundColor: colors.tNeutral, borderRadius: 99, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 99, backgroundColor: colors.success },
  alerts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  alert: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, minHeight: 40, flexGrow: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: {
    width: '47.8%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 14,
    minHeight: 138,
    ...shadow.card,
  },
  tileSoon: { backgroundColor: '#EEF1F4', shadowOpacity: 0, elevation: 0 },
  tileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  micWrap: { alignItems: 'center', gap: 2, marginTop: -40 },
  mic: {
    width: 76,
    height: 76,
    borderRadius: radius.pill,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.white,
    shadowColor: colors.secondary,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
});
