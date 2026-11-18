export type Status = 'p' | 'h' | 'a' | 'n';
export type Role = 'owner' | 'manager';

export type Company = {
  id: string;
  name: string;
  gstRegistered: boolean;
  gstin: string | null;
  proprietor: string | null;
  upiId: string | null;
};

export type Member = { userId: string; role: Role; name: string; email: string };
export type Invite = { email: string; name: string };

export type Site = { id: string; name: string; clientName: string };

export type Worker = {
  id: string;
  siteId: string | null;
  name: string;
  trade: string;
  rate: number;
};

export type Material = {
  id: string;
  siteId: string;
  name: string;
  unit: string;
  min: number;
  supplier: string;
  qty: number;
  usedToday: number;
};

export type AttendanceMark = { status: Exclude<Status, 'n'>; hours: number | null };

export type BillKind = 'tax' | 'plain' | 'ra';
export type BillStatus = 'draft' | 'sent' | 'paid';

export type BillLine = { id: string; name: string; qty: number; unit: string; rate: number };

export type Bill = {
  id: string;
  no: number | null; // null until the server gives it a number
  siteId: string | null;
  kind: BillKind;
  clientName: string;
  withGst: boolean;
  gstRate: number;
  retentionRate: number;
  tdsRate: number;
  status: BillStatus;
  issuedOn: string; // YYYY-MM-DD
  dueOn: string | null;
  paidOn: string | null;
  lines: BillLine[];
};

export const initialOf = (name: string) => (name.trim()[0] ?? '?').toUpperCase();
