import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, Card, Empty, Screen, ScreenHeader, Segmented, StatusRow } from '@/components/ui';
import { useStore } from '@/data/store';
import { AttendanceMark, initialOf, Status } from '@/data/types';
import { useT } from '@/i18n';
import { rupees } from '@/lib/format';
import { colors } from '@/theme/tokens';

const ACTIVE = { p: colors.success, h: colors.warning, a: colors.danger, n: colors.muted };
const AVATAR = { p: colors.tSuccess, h: colors.tWarning, a: colors.tDanger, n: colors.tPrimary };
const AVATAR_TEXT = { p: colors.success, h: colors.warning, a: colors.danger, n: colors.primary };

export default function Attendance() {
  const router = useRouter();
  const { t } = useT();
  const A = t.attendance;
  const { workers, attendance, saveAttendance, date } = useStore();
  // Changes stay on this screen until Save.
  const [changes, setChanges] = useState<Record<string, AttendanceMark>>({});

  const statusOf = (id: string): Status => changes[id]?.status ?? attendance[id]?.status ?? 'n';
  const changed = Object.keys(changes).length;
  const count = (s: Status) => workers.filter((w) => statusOf(w.id) === s).length;

  function set(id: string, status: Status) {
    if (status === 'n') return;
    setChanges((c) => ({ ...c, [id]: { status, hours: null } }));
  }

  function allPresent() {
    setChanges(Object.fromEntries(workers.map((w) => [w.id, { status: 'p' as const, hours: null }])));
  }

  const options: { value: Status; label: string }[] = [
    { value: 'p', label: A.present },
    { value: 'h', label: A.half },
    { value: 'a', label: A.absent },
  ];

  return (
    <Screen
      footer={
        workers.length > 0 ? (
          <Button
            label={changed > 0 ? A.saveN(changed) : A.save}
            icon="check"
            disabled={changed === 0}
            onPress={() => {
              saveAttendance(changes);
              router.replace('/');
            }}
          />
        ) : undefined
      }
    >
      <ScreenHeader title={A.title} subtitle={t.common.today(date)} />
      <StatusRow />

      {workers.length === 0 ? (
        <Empty
          icon="hat"
          title={A.emptyTitle}
          body={A.emptyBody}
          action={<Button label={A.addWorker} icon="plus" onPress={() => router.push('/workers/new')} />}
        />
      ) : (
        <>
          <View style={styles.summary}>
            <AppText size={15} weight="semibold" color={colors.muted} style={{ flex: 1 }}>
              {A.counts(count('p'), count('h'), count('a'))}
            </AppText>
          </View>
          <Button label={A.allPresent} variant="success" icon="check" onPress={allPresent} style={{ marginBottom: 14 }} />
          {workers.map((w) => {
            const s = statusOf(w.id);
            return (
              <Card key={w.id} style={styles.card}>
                <View style={styles.row}>
                  <View style={[styles.avatar, { backgroundColor: AVATAR[s] }]}>
                    <AppText size={21} weight="bold" color={AVATAR_TEXT[s]}>{initialOf(w.name)}</AppText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText size={20} weight="semibold" numberOfLines={1}>{w.name}</AppText>
                    <AppText size={14} color={colors.muted} numberOfLines={1}>
                      {[w.trade, w.rate > 0 ? A.perDay(rupees(w.rate)) : ''].filter(Boolean).join(' · ')}
                    </AppText>
                  </View>
                </View>
                <Segmented<Status> options={options} value={s} onChange={(v) => set(w.id, v)} activeColors={ACTIVE} />
              </Card>
            );
          })}
          <Button label={A.addWorker} variant="secondary" icon="plus" onPress={() => router.push('/workers/new')} style={{ marginTop: 4 }} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginLeft: 2 },
  card: { marginBottom: 10, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});
