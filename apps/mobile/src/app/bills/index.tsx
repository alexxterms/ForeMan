import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { AppText, Badge, Button, Card, Empty, Pill, PillTone, Screen, ScreenHeader, Segmented, StatusRow, useToast } from '@/components/ui';
import { useStore } from '@/data/store';
import type { Bill, Company, Site } from '@/data/types';
import { tr, useT } from '@/i18n';
import { billTitle, billTotals, ShownStatus, shownStatus } from '@/lib/billing';
import { isoToDDMMYYYY, rupees } from '@/lib/format';
import { colors } from '@/theme/tokens';

type Filter = 'all' | 'due' | 'paid';

const PILL: Record<ShownStatus, { tone: PillTone; icon: 'pencil' | 'plane' | 'clock' | 'alert' | 'check' }> = {
  draft: { tone: 'draft', icon: 'pencil' },
  sent: { tone: 'sent', icon: 'plane' },
  due: { tone: 'due', icon: 'clock' },
  overdue: { tone: 'over', icon: 'alert' },
  paid: { tone: 'paid', icon: 'check' },
};

function BillCard({ bill, site, onOpen, onShare }: { bill: Bill; site?: Site; onOpen: () => void; onShare: () => void }) {
  const shown = shownStatus(bill);
  const p = PILL[shown.status];
  const amount = billTotals(bill).payable;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${billTitle(bill)}, ${bill.clientName}, ${rupees(amount)}, ${shown.note}`} onPress={onOpen}>
      {({ pressed }) => (
      <Card style={[{ marginBottom: 10 }, pressed && { transform: [{ scale: 0.99 }] }]}>
        <View style={styles.top}>
          <Badge icon="doc" color={colors.darkSlate} tint={colors.tNeutral} size={46} />
          <View style={{ flex: 1 }}>
            <AppText size={19} weight="semibold" style={{ lineHeight: 22 }}>{billTitle(bill)}</AppText>
            <AppText size={14} color={colors.muted}>{[bill.clientName, site?.name].filter(Boolean).join(' · ')}</AppText>
          </View>
          <AppText size={22} weight="bold" tabular>{rupees(amount)}</AppText>
        </View>
        <View style={styles.bottom}>
          <Pill tone={p.tone} icon={p.icon} label={shown.note} />
          {shown.status !== 'paid' && shown.status !== 'draft' ? (
            <Pressable accessibilityRole="button" accessibilityLabel={tr().bills.share} onPress={onShare} style={styles.share}>
              <Icon name="share" size={22} color={colors.primary} />
            </Pressable>
          ) : null}
        </View>
      </Card>
      )}
    </Pressable>
  );
}

function shareText(b: Bill, company: Company | null): string {
  const amount = billTotals(b).payable;
  const X = tr().bill.shareText;
  return [
    X.from(billTitle(b), company?.name ?? ''),
    X.amount(rupees(amount)),
    b.dueOn ? X.due(isoToDDMMYYYY(b.dueOn)) : '',
    company?.upiId ? X.upi(company.upiId) : '',
  ].filter(Boolean).join('\n');
}

export default function Bills() {
  const router = useRouter();
  const { t } = useT();
  const B = t.bills;
  const { bills, sites, company } = useStore();
  const { toast, showToast } = useToast();
  const [filter, setFilter] = useState<Filter>('all');

  const open = bills.filter((b) => b.status === 'sent');
  const owed = open.reduce((s, b) => s + billTotals(b).payable, 0);
  const overdue = open.filter((b) => shownStatus(b).status === 'overdue').reduce((s, b) => s + billTotals(b).payable, 0);
  const shown = bills.filter((b) => (filter === 'all' ? true : filter === 'paid' ? b.status === 'paid' : b.status === 'sent'));

  function share(b: Bill) {
    const text = shareText(b, company);
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`).catch(() => showToast(B.noWhatsApp));
  }

  return (
    <Screen toast={toast} footer={<Button label={B.new} icon="plus" onPress={() => router.push('/bills/new')} />}>
      <ScreenHeader title={B.title} subtitle={B.sub} />
      <StatusRow />

      <Card style={styles.owed}>
        <View>
          <AppText size={15} weight="semibold" color={colors.muted}>{B.owed}</AppText>
          <AppText size={32} weight="bold" color={colors.success} tabular style={{ lineHeight: 36 }}>{rupees(owed)}</AppText>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <AppText size={14} color={colors.muted}>{B.overdue}</AppText>
          <AppText size={20} weight="bold" color={colors.danger} tabular>{rupees(overdue)}</AppText>
        </View>
      </Card>

      <View style={{ marginBottom: 12 }}>
        <Segmented<Filter>
          options={[{ value: 'all', label: B.all }, { value: 'due', label: B.due }, { value: 'paid', label: B.paid }]}
          value={filter}
          onChange={setFilter}
        />
      </View>

      {bills.length === 0 ? (
        <Empty icon="doc" title={B.emptyTitle} body={B.emptyBody} />
      ) : shown.length === 0 ? (
        <AppText size={16} color={colors.muted} style={{ marginLeft: 2 }}>{B.nothing}</AppText>
      ) : null}
      {shown.map((b) => (
        <BillCard
          key={b.id}
          bill={b}
          site={sites.find((s) => s.id === b.siteId)}
          onOpen={() => router.push({ pathname: '/bills/preview', params: { id: b.id } })}
          onShare={() => share(b)}
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  owed: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, marginBottom: 14, borderLeftWidth: 4, borderLeftColor: colors.success },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  share: { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
});
