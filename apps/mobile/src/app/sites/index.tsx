import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { AppText, Badge, Button, Card, Pill, Screen, ScreenHeader } from '@/components/ui';
import { useStore } from '@/data/store';
import { useT } from '@/i18n';
import { colors } from '@/theme/tokens';

export default function Sites() {
  const router = useRouter();
  const { t } = useT();
  const S = t.sites;
  const { sites, site, setSite } = useStore();

  return (
    <Screen footer={<Button label={S.add} icon="plus" onPress={() => router.push('/sites/new')} />}>
      <ScreenHeader title={S.title} subtitle={S.sub} />
      {sites.map((s) => {
        const current = s.id === site?.id;
        return (
          <Pressable
            key={s.id}
            accessibilityRole="button"
            accessibilityState={{ selected: current }}
            accessibilityLabel={`${s.name}${current ? `, ${S.currentA11y}` : ''}`}
            onPress={() => {
              setSite(s.id);
              router.back();
            }}
          >
            {({ pressed }) => (
              <Card style={[styles.row, current && styles.current, pressed && { transform: [{ scale: 0.99 }] }]}>
                <Badge icon="building" color={current ? colors.primary : colors.secondary} tint={current ? colors.tPrimary : colors.tTeal} size={44} />
                <View style={{ flex: 1 }}>
                  <AppText size={19} weight="semibold" numberOfLines={1}>{s.name}</AppText>
                  {s.clientName ? <AppText size={14} color={colors.muted} numberOfLines={1}>{S.client(s.clientName)}</AppText> : null}
                </View>
                {current ? <Pill tone="sent" icon="check" label={S.current} /> : <Icon name="chev" size={22} color={colors.muted} />}
              </Card>
            )}
          </Pressable>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, borderWidth: 2, borderColor: 'transparent' },
  current: { borderColor: colors.primary },
});
