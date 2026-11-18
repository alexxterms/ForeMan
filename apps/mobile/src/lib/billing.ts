import type { Bill, BillLine } from '@/data/types';
import { tr } from '@/i18n';
import { daysBetween, isoToDDMMYYYY, todayISO } from '@/lib/format';

// Starting rates for a new bill. The company's CA confirms the real ones; each bill stores its own.
export const DEFAULT_RATES = { gst: 0.18, retention: 0.05, tds: 0.01 };

export function billTotals(b: Pick<Bill, 'withGst' | 'gstRate' | 'retentionRate' | 'tdsRate'> & { lines: BillLine[] }) {
  const work = Math.round(b.lines.reduce((sum, l) => sum + l.qty * l.rate, 0));
  const gst = b.withGst ? Math.round(work * b.gstRate) : 0;
  const cgst = Math.round(gst / 2);
  const sgst = gst - cgst;
  const retention = Math.round(work * b.retentionRate);
  const tds = Math.round(work * b.tdsRate);
  const payable = work + gst - retention - tds;
  return { work, gst, cgst, sgst, retention, tds, payable };
}

export type ShownStatus = 'draft' | 'sent' | 'due' | 'overdue' | 'paid';

// Due and overdue come from the due date, so they stay right without anyone editing them.
export function shownStatus(b: Bill, today = todayISO()): { status: ShownStatus; note: string } {
  const t = tr().bill;
  if (b.status === 'paid') return { status: 'paid', note: b.paidOn ? t.paidOn(isoToDDMMYYYY(b.paidOn)) : t.paid };
  if (b.status === 'draft') return { status: 'draft', note: t.draft };
  if (!b.dueOn) return { status: 'sent', note: t.sent };
  const left = daysBetween(today, b.dueOn);
  if (left < 0) return { status: 'overdue', note: t.overdue(-left) };
  if (left === 0) return { status: 'due', note: t.dueToday };
  return { status: 'due', note: t.dueIn(left) };
}

export const billTitle = (b: Bill) => tr().bill.title(b.no);
