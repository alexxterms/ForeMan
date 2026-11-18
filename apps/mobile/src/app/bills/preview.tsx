import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { AppText, Button, Pill, Screen, ScreenHeader, useToast } from '@/components/ui';
import { useStore } from '@/data/store';
import { useT } from '@/i18n';
import { billTitle, billTotals, shownStatus } from '@/lib/billing';
import { groupIndian, isoToDDMMYYYY, rupees } from '@/lib/format';
import { colors } from '@/theme/tokens';

function Sum({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={[styles.sum, strong && styles.sumStrong]}>
      <AppText size={strong ? 17 : 13} weight={strong ? 'bold' : 'regular'}>{label}</AppText>
      <AppText size={strong ? 17 : 13} weight={strong ? 'bold' : 'regular'} tabular>{value}</AppText>
    </View>
  );
}

const pct = (r: number) => `${Math.round(r * 10000) / 100}%`;

export default function Preview() {
  const router = useRouter();
  const { t: tt } = useT();
  const P = tt.billPreview;
  const X = tt.bill.shareText;
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { bills, company, sites, setBillStatus } = useStore();
  const { toast, showToast } = useToast();
  const bill = bills.find((b) => b.id === id);

  if (!bill || !company) {
    return (
      <Screen footer={<Button label={P.backToBills} onPress={() => router.replace('/bills')} />}>
        <ScreenHeader title={P.notFound} />
      </Screen>
    );
  }

  const t = billTotals(bill);
  const site = sites.find((s) => s.id === bill.siteId);
  const shown = shownStatus(bill);
  const heading = bill.kind === 'tax' ? P.taxInvoice : bill.kind === 'ra' ? P.raBill : P.plainBill;

  function shareWhatsApp() {
    if (!bill || !company) return;
    const parts = [
      X.from(billTitle(bill), company.name),
      X.amount(rupees(t.payable)),
      bill.dueOn ? X.due(isoToDDMMYYYY(bill.dueOn)) : '',
      company.upiId ? X.upi(company.upiId) : '',
    ].filter(Boolean);
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(parts.join('\n'))}`)
      .then(() => {
        if (bill.status === 'draft') setBillStatus(bill.id, 'sent');
      })
      .catch(() => showToast(tt.bills.noWhatsApp));
  }

  return (
    <Screen
      toast={toast}
      footer={
        <>
          {bill.status !== 'paid' ? <Button label={tt.bills.share} variant="success" icon="share" onPress={shareWhatsApp} /> : null}
          {bill.status === 'sent' ? (
            <Button label={P.markPaid} variant="secondary" icon="check" onPress={() => { setBillStatus(bill.id, 'paid'); showToast(P.markedPaid); }} />
          ) : null}
          {bill.status === 'draft' ? (
            <Button label={P.markSent} variant="secondary" icon="plane" onPress={() => { setBillStatus(bill.id, 'sent'); showToast(P.markedSent); }} />
          ) : null}
        </>
      }
    >
      <ScreenHeader title={billTitle(bill)} subtitle={bill.no ? P.clientSees : P.numberLater} />
      <View style={{ marginBottom: 10 }}>
        <Pill tone={shown.status === 'overdue' ? 'over' : shown.status} icon={shown.status === 'paid' ? 'check' : shown.status === 'overdue' ? 'alert' : shown.status === 'draft' ? 'pencil' : 'clock'} label={shown.note} />
      </View>

      <View style={styles.paper}>
        <View style={styles.hd}>
          <View style={{ flex: 1 }}>
            <AppText size={18} weight="bold">{company.name}</AppText>
            <AppText size={12} color={colors.muted}>
              {bill.withGst && company.gstin ? P.gstin(company.gstin) : company.proprietor ? P.proprietor(company.proprietor) : ''}
            </AppText>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <AppText size={14} weight="bold">{heading}</AppText>
            <AppText size={12} color={colors.muted}>
              {bill.no ? `${P.no(bill.no)} · ` : ''}{isoToDDMMYYYY(bill.issuedOn)}
            </AppText>
          </View>
        </View>

        <AppText size={12} color={colors.muted}>{P.billTo}</AppText>
        <AppText size={14} weight="semibold" style={{ marginBottom: 6 }}>
          {bill.clientName}{site ? `, ${P.siteSuffix(site.name)}` : ''}
        </AppText>

        <View style={styles.thead}>
          <AppText size={11} color={colors.muted} style={{ flex: 2 }}>{P.item}</AppText>
          <AppText size={11} color={colors.muted} style={styles.num}>{P.qty}</AppText>
          <AppText size={11} color={colors.muted} style={styles.num}>{P.rate}</AppText>
          <AppText size={11} color={colors.muted} style={[styles.num, { flex: 1.3 }]}>{P.amount}</AppText>
        </View>
        {bill.lines.map((l) => (
          <View key={l.id} style={styles.trow}>
            <AppText size={13} style={{ flex: 2 }}>{l.name}</AppText>
            <AppText size={13} tabular style={styles.num}>{groupIndian(l.qty)}{l.unit ? ` ${l.unit}` : ''}</AppText>
            <AppText size={13} tabular style={styles.num}>{groupIndian(l.rate)}</AppText>
            <AppText size={13} tabular style={[styles.num, { flex: 1.3 }]}>{groupIndian(Math.round(l.qty * l.rate))}</AppText>
          </View>
        ))}

        <View style={{ marginTop: 6 }}>
          <Sum label={tt.billLines.workTotal} value={rupees(t.work)} />
          {bill.withGst ? <Sum label={P.cgst(pct(bill.gstRate / 2))} value={rupees(t.cgst)} /> : null}
          {bill.withGst ? <Sum label={P.sgst(pct(bill.gstRate / 2))} value={rupees(t.sgst)} /> : null}
          {bill.retentionRate > 0 ? <Sum label={tt.billLines.retention(pct(bill.retentionRate))} value={`- ${rupees(t.retention)}`} /> : null}
          {bill.tdsRate > 0 ? <Sum label={tt.billLines.tds(pct(bill.tdsRate))} value={`- ${rupees(t.tds)}`} /> : null}
          <Sum label={P.payable} value={rupees(t.payable)} strong />
        </View>

        {company.upiId || bill.dueOn ? (
          <View style={styles.pay}>
            {company.upiId ? <AppText size={14} weight="bold">{P.payUpi(company.upiId)}</AppText> : null}
            {bill.dueOn ? <AppText size={12} color={colors.muted}>{P.due(isoToDDMMYYYY(bill.dueOn))}</AppText> : null}
          </View>
        ) : null}
      </View>
      {!company.upiId ? (
        <AppText size={13} color={colors.muted} style={{ marginTop: 10 }}>
          {P.addUpi}
        </AppText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  paper: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
    borderTopWidth: 4,
    borderTopColor: colors.primary,
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  hd: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: colors.text, marginBottom: 8 },
  thead: { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: colors.line },
  trow: { flexDirection: 'row', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: colors.line },
  num: { flex: 1, textAlign: 'right' },
  sum: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  sumStrong: { borderTopWidth: 2, borderTopColor: colors.text, marginTop: 4, paddingTop: 6 },
  pay: { gap: 2, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.line },
});
