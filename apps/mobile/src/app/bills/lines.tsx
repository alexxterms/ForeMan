import { randomUUID } from 'expo-crypto';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { AppText, Button, Card, Field, Screen, ScreenHeader, Section } from '@/components/ui';
import { useStore } from '@/data/store';
import type { BillKind, BillLine } from '@/data/types';
import { useT } from '@/i18n';
import { billTotals, DEFAULT_RATES } from '@/lib/billing';
import { addDaysISO, groupIndian, rupees, todayISO } from '@/lib/format';
import { colors } from '@/theme/tokens';

const num = (v: string) => v.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');

function Row({ label, value, color, big, last }: { label: string; value: string; color?: string; big?: boolean; last?: boolean }) {
  return (
    <View style={[styles.totRow, last && { borderBottomWidth: 0 }, big && { paddingVertical: 12 }]}>
      <AppText size={big ? 21 : 16} weight={big ? 'bold' : 'regular'} color={color} style={{ flex: 1 }}>{label}</AppText>
      <AppText size={big ? 22 : 16} weight={big ? 'bold' : 'semibold'} color={big ? colors.success : color} tabular>{value}</AppText>
    </View>
  );
}

export default function Lines() {
  const router = useRouter();
  const { t: tt } = useT();
  const L = tt.billLines;
  const B = tt.billNew;
  const params = useLocalSearchParams<{ kind?: string; client?: string; due?: string }>();
  const { company, site, addBill } = useStore();
  const kind: BillKind = params.kind === 'ra' || params.kind === 'tax' ? params.kind : 'plain';
  const withGst = !!company?.gstRegistered && kind !== 'plain';
  const rates = {
    withGst,
    gstRate: withGst ? DEFAULT_RATES.gst : 0,
    retentionRate: kind === 'ra' ? DEFAULT_RATES.retention : 0,
    tdsRate: kind === 'ra' ? DEFAULT_RATES.tds : 0,
  };

  const [lines, setLines] = useState<BillLine[]>([]);
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('');
  const [rate, setRate] = useState('');

  const t = billTotals({ ...rates, lines });
  const lineOk = name.trim().length > 0 && Number(qty) > 0 && rate !== '' && Number(rate) >= 0;

  function addLine() {
    setLines((l) => [...l, { id: randomUUID(), name: name.trim(), qty: Number(qty), unit: unit.trim(), rate: Number(rate) }]);
    setName('');
    setQty('');
    setUnit('');
    setRate('');
  }

  function save() {
    const today = todayISO();
    const id = addBill({
      siteId: site?.id ?? null,
      kind,
      clientName: params.client ?? '',
      ...rates,
      issuedOn: today,
      dueOn: addDaysISO(today, Number(params.due) || 15),
      lines,
    });
    // Back from the preview should land on the bill list, not this form.
    router.dismissTo('/bills');
    router.push({ pathname: '/bills/preview', params: { id } });
  }

  return (
    <Screen footer={<Button label={L.save} variant="success" icon="check" disabled={lines.length === 0} onPress={save} />}>
      <ScreenHeader title={kind === 'ra' ? B.ra : kind === 'tax' ? B.tax : B.plain} subtitle={L.forClient(params.client ?? '')} />

      {lines.length > 0 ? (
        <Section style={{ marginTop: 0 }}>{L.items}</Section>
      ) : null}
      {lines.map((l) => (
        <Card key={l.id} style={{ marginBottom: 10 }}>
          <View style={styles.lt}>
            <View style={{ flex: 1 }}>
              <AppText size={18} weight="semibold">{l.name}</AppText>
              <AppText size={14} color={colors.muted} tabular>
                {groupIndian(l.qty)} {l.unit} × ₹{groupIndian(l.rate)}
              </AppText>
            </View>
            <AppText size={20} weight="bold" tabular>{rupees(l.qty * l.rate)}</AppText>
            <Pressable accessibilityRole="button" accessibilityLabel={tt.common.remove(l.name)} onPress={() => setLines((x) => x.filter((y) => y.id !== l.id))} style={styles.remove} hitSlop={6}>
              <Icon name="x" size={20} color={colors.danger} />
            </Pressable>
          </View>
        </Card>
      ))}

      <Card style={{ marginBottom: 12 }}>
        <AppText size={17} weight="semibold" style={{ marginBottom: 8 }}>{lines.length === 0 ? L.addFirst : L.addAnother}</AppText>
        <Field label={L.item} value={name} onChangeText={setName} placeholder={L.itemPh} autoCapitalize="sentences" />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field label={L.qty} value={qty} onChangeText={(v) => setQty(num(v))} placeholder="65" keyboardType="decimal-pad" maxLength={10} />
          </View>
          <View style={{ flex: 1 }}>
            <Field label={L.unit} value={unit} onChangeText={setUnit} placeholder="sq m" autoCapitalize="none" maxLength={12} />
          </View>
        </View>
        <Field label={L.rate} value={rate} onChangeText={(v) => setRate(num(v))} placeholder="1150" keyboardType="decimal-pad" maxLength={10} />
        <Button label={L.addItem} variant="secondary" icon="plus" disabled={!lineOk} onPress={addLine} />
      </Card>

      {lines.length > 0 ? (
        <Card style={{ paddingVertical: 4, paddingHorizontal: 16 }}>
          <Row label={L.workTotal} value={rupees(t.work)} />
          {withGst ? <Row label={L.gst(`${rates.gstRate * 100}%`)} value={`+ ${rupees(t.gst)}`} /> : null}
          {kind === 'ra' ? <Row label={L.retention(`${rates.retentionRate * 100}%`)} value={`- ${rupees(t.retention)}`} color={colors.danger} /> : null}
          {kind === 'ra' ? <Row label={L.tds(`${rates.tdsRate * 100}%`)} value={`- ${rupees(t.tds)}`} color={colors.danger} /> : null}
          <Row label={L.youGet} value={rupees(t.payable)} big last />
        </Card>
      ) : null}
      <AppText size={13} color={colors.muted} style={{ marginTop: 10 }}>
        {L.rateNote}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  lt: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  remove: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.tDanger, alignItems: 'center', justifyContent: 'center' },
  totRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line },
});
