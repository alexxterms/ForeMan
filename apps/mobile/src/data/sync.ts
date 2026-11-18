// Offline-first data. Every change is an "op":
// 1. reduce() applies it to the phone's copy right away, so the screen updates with no network.
// 2. The op waits in the outbox, saved on the phone.
// 3. send() writes it to Supabase when there is network. Ops carry their own ids, so a retry never duplicates.
// After a pull from the server, waiting ops are replayed on top so nothing unsent disappears from screen.

import { isNetworkError, supabase } from '@/lib/supabase';
import { todayISO } from '@/lib/format';
import type { AttendanceMark, Bill, BillStatus, Company, Invite, Material, Member, Site, Worker } from './types';

export type Cache = {
  company: Company | null;
  me: Member | null;
  team: Member[];
  invites: Invite[];
  sites: Site[];
  workers: Worker[];
  materials: Material[];
  attendance: { day: string; marks: Record<string, AttendanceMark> };
  bills: Bill[];
};

export const emptyCache = (): Cache => ({
  company: null,
  me: null,
  team: [],
  invites: [],
  sites: [],
  workers: [],
  materials: [],
  attendance: { day: todayISO(), marks: {} },
  bills: [],
});

export type CompanyPatch = Partial<Pick<Company, 'name' | 'gstRegistered' | 'gstin' | 'proprietor' | 'upiId'>>;

type OpBody =
  | { type: 'site.add'; site: Site }
  | { type: 'worker.add'; worker: Worker }
  | { type: 'material.add'; material: Omit<Material, 'qty' | 'usedToday'> }
  | { type: 'attendance.set'; day: string; siteId: string; marks: Record<string, AttendanceMark> }
  | { type: 'stock.move'; id: string; siteId: string; materialId: string; mode: 'in' | 'out'; qty: number }
  | { type: 'bill.add'; bill: Bill }
  | { type: 'bill.status'; id: string; status: BillStatus; paidOn: string | null }
  | { type: 'company.update'; companyId: string; patch: CompanyPatch };

export type Op = OpBody & { opId: string; at: string };
export type { OpBody };

const round = (n: number) => Math.round(n * 100) / 100;

export function reduce(c: Cache, op: Op): Cache {
  switch (op.type) {
    case 'site.add':
      return c.sites.some((s) => s.id === op.site.id) ? c : { ...c, sites: [...c.sites, op.site] };
    case 'worker.add':
      return c.workers.some((w) => w.id === op.worker.id) ? c : { ...c, workers: [...c.workers, op.worker] };
    case 'material.add':
      return c.materials.some((m) => m.id === op.material.id) ? c : { ...c, materials: [...c.materials, { ...op.material, qty: 0, usedToday: 0 }] };
    case 'attendance.set': {
      const today = todayISO();
      if (op.day !== today) return c;
      const base = c.attendance.day === today ? c.attendance.marks : {};
      return { ...c, attendance: { day: today, marks: { ...base, ...op.marks } } };
    }
    case 'stock.move': {
      const usedNow = op.mode === 'out' && todayISO(new Date(op.at)) === todayISO();
      return {
        ...c,
        materials: c.materials.map((m) =>
          m.id !== op.materialId
            ? m
            : {
                ...m,
                qty: round(m.qty + (op.mode === 'in' ? op.qty : -op.qty)),
                usedToday: usedNow ? round(m.usedToday + op.qty) : m.usedToday,
              },
        ),
      };
    }
    case 'bill.add':
      return c.bills.some((b) => b.id === op.bill.id) ? c : { ...c, bills: [op.bill, ...c.bills] };
    case 'bill.status':
      return { ...c, bills: c.bills.map((b) => (b.id === op.id ? { ...b, status: op.status, paidOn: op.paidOn } : b)) };
    case 'company.update':
      return c.company ? { ...c, company: { ...c.company, ...op.patch } } : c;
  }
}

export type SendResult = { ok: true } | { ok: false; network: boolean; message: string };

type PgError = { message: string; code?: string } | null;

function result(error: PgError, status?: number): SendResult {
  if (!error) return { ok: true };
  // A duplicate id means an earlier try already got through.
  if (error.code === '23505') return { ok: true };
  return { ok: false, network: isNetworkError({ status, message: error.message }), message: error.message };
}

export async function send(op: Op): Promise<SendResult> {
  switch (op.type) {
    case 'site.add': {
      const { error, status } = await supabase
        .from('sites')
        .upsert({ id: op.site.id, name: op.site.name, client_name: op.site.clientName }, { onConflict: 'id', ignoreDuplicates: true });
      return result(error, status);
    }
    case 'worker.add': {
      const w = op.worker;
      const { error, status } = await supabase
        .from('workers')
        .upsert({ id: w.id, site_id: w.siteId, name: w.name, trade: w.trade, daily_rate: w.rate }, { onConflict: 'id', ignoreDuplicates: true });
      return result(error, status);
    }
    case 'material.add': {
      const m = op.material;
      const { error, status } = await supabase
        .from('materials')
        .upsert({ id: m.id, site_id: m.siteId, name: m.name, unit: m.unit, min_qty: m.min, supplier: m.supplier }, { onConflict: 'id', ignoreDuplicates: true });
      return result(error, status);
    }
    case 'attendance.set': {
      const rows = Object.entries(op.marks).map(([workerId, mark]) => ({
        site_id: op.siteId,
        worker_id: workerId,
        day: op.day,
        status: mark.status,
        hours: mark.hours,
        updated_at: op.at,
      }));
      if (rows.length === 0) return { ok: true };
      const { error, status } = await supabase.from('attendance').upsert(rows, { onConflict: 'worker_id,day' });
      return result(error, status);
    }
    case 'stock.move': {
      const { error, status } = await supabase
        .from('stock_moves')
        .upsert(
          { id: op.id, site_id: op.siteId, material_id: op.materialId, mode: op.mode, qty: op.qty, created_at: op.at },
          { onConflict: 'id', ignoreDuplicates: true },
        );
      return result(error, status);
    }
    case 'bill.add': {
      const b = op.bill;
      const head = await supabase.from('bills').upsert(
        {
          id: b.id,
          site_id: b.siteId,
          kind: b.kind,
          client_name: b.clientName,
          with_gst: b.withGst,
          gst_rate: b.gstRate,
          retention_rate: b.retentionRate,
          tds_rate: b.tdsRate,
          status: b.status,
          issued_on: b.issuedOn,
          due_on: b.dueOn,
        },
        { onConflict: 'id', ignoreDuplicates: true },
      );
      if (head.error) return result(head.error, head.status);
      const lines = b.lines.map((l, i) => ({ id: l.id, bill_id: b.id, position: i, name: l.name, qty: l.qty, unit: l.unit, rate: l.rate }));
      if (lines.length === 0) return { ok: true };
      const { error, status } = await supabase.from('bill_lines').upsert(lines, { onConflict: 'id', ignoreDuplicates: true });
      return result(error, status);
    }
    case 'bill.status': {
      const { error, status } = await supabase.from('bills').update({ status: op.status, paid_on: op.paidOn }).eq('id', op.id);
      return result(error, status);
    }
    case 'company.update': {
      const p = op.patch;
      const row: Record<string, unknown> = {};
      if (p.name !== undefined) row.name = p.name;
      if (p.gstRegistered !== undefined) row.gst_registered = p.gstRegistered;
      if (p.gstin !== undefined) row.gstin = p.gstin;
      if (p.proprietor !== undefined) row.proprietor = p.proprietor;
      if (p.upiId !== undefined) row.upi_id = p.upiId;
      const { error, status } = await supabase.from('companies').update(row).eq('id', op.companyId);
      return result(error, status);
    }
  }
}

/* ---------- Pull everything this login can see ---------- */

export class PullError extends Error {
  constructor(message: string, public network: boolean) {
    super(message);
  }
}

const n = (v: unknown) => Number(v ?? 0);

type Row = Record<string, unknown>;

function check<T>(res: { data: T | null; error: PgError; status?: number }): T {
  if (res.error) throw new PullError(res.error.message, isNetworkError({ status: res.status, message: res.error.message }));
  return res.data as T;
}

// Returns null when the login is not part of any company yet.
export async function pull(userId: string): Promise<Cache | null> {
  const members = check(await supabase.from('members').select('user_id, company_id, role, name, email')) as Row[];
  const mine = members.find((m) => m.user_id === userId);
  if (!mine) return null;

  const day = todayISO();
  const [company, invites, sites, workers, materials, stock, attendance, bills] = await Promise.all([
    supabase.from('companies').select('*').eq('id', mine.company_id as string).single(),
    supabase.from('invites').select('email, name').order('created_at'),
    supabase.from('sites').select('id, name, client_name').eq('archived', false).order('created_at'),
    supabase.from('workers').select('id, site_id, name, trade, daily_rate').eq('active', true).order('created_at'),
    supabase.from('materials').select('id, site_id, name, unit, min_qty, supplier').order('created_at'),
    supabase.from('material_stock').select('material_id, qty, used_today'),
    supabase.from('attendance').select('worker_id, status, hours').eq('day', day),
    supabase.from('bills').select('*, bill_lines(*)').order('created_at', { ascending: false }).limit(300),
  ]);

  const co = check(company) as Row;
  const stockBy = new Map((check(stock) as Row[]).map((s) => [s.material_id as string, s]));
  const toMember = (m: Row): Member => ({ userId: m.user_id as string, role: m.role as Member['role'], name: (m.name as string) ?? '', email: (m.email as string) ?? '' });

  return {
    company: {
      id: co.id as string,
      name: co.name as string,
      gstRegistered: !!co.gst_registered,
      gstin: (co.gstin as string) ?? null,
      proprietor: (co.proprietor as string) ?? null,
      upiId: (co.upi_id as string) ?? null,
    },
    me: toMember(mine),
    team: members.map(toMember),
    invites: (check(invites) as Row[]).map((i) => ({ email: i.email as string, name: (i.name as string) ?? '' })),
    sites: (check(sites) as Row[]).map((s) => ({ id: s.id as string, name: s.name as string, clientName: (s.client_name as string) ?? '' })),
    workers: (check(workers) as Row[]).map((w) => ({
      id: w.id as string,
      siteId: (w.site_id as string) ?? null,
      name: w.name as string,
      trade: (w.trade as string) ?? '',
      rate: n(w.daily_rate),
    })),
    materials: (check(materials) as Row[]).map((m) => {
      const s = stockBy.get(m.id as string);
      return {
        id: m.id as string,
        siteId: m.site_id as string,
        name: m.name as string,
        unit: m.unit as string,
        min: n(m.min_qty),
        supplier: (m.supplier as string) ?? '',
        qty: n(s?.qty),
        usedToday: n(s?.used_today),
      };
    }),
    attendance: {
      day,
      marks: Object.fromEntries(
        (check(attendance) as Row[]).map((a) => [a.worker_id as string, { status: a.status as AttendanceMark['status'], hours: a.hours == null ? null : n(a.hours) }]),
      ),
    },
    bills: (check(bills) as Row[]).map((b) => ({
      id: b.id as string,
      no: b.no == null ? null : n(b.no),
      siteId: (b.site_id as string) ?? null,
      kind: b.kind as Bill['kind'],
      clientName: (b.client_name as string) ?? '',
      withGst: !!b.with_gst,
      gstRate: n(b.gst_rate),
      retentionRate: n(b.retention_rate),
      tdsRate: n(b.tds_rate),
      status: b.status as BillStatus,
      issuedOn: b.issued_on as string,
      dueOn: (b.due_on as string) ?? null,
      paidOn: (b.paid_on as string) ?? null,
      lines: ((b.bill_lines as Row[]) ?? [])
        .sort((x, y) => n(x.position) - n(y.position))
        .map((l) => ({ id: l.id as string, name: l.name as string, qty: n(l.qty), unit: (l.unit as string) ?? '', rate: n(l.rate) })),
    })),
  };
}
