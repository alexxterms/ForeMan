// Indian digit grouping: 1250000 -> 12,50,000
export function groupIndian(n: number): string {
  const sign = n < 0 ? '-' : '';
  const [whole, frac] = Math.abs(n).toString().split('.');
  let out: string;
  if (whole.length <= 3) {
    out = whole;
  } else {
    const last3 = whole.slice(-3);
    const rest = whole.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    out = `${rest},${last3}`;
  }
  return sign + out + (frac ? `.${frac}` : '');
}

export function rupees(n: number): string {
  return `₹${groupIndian(Math.round(n))}`;
}

export function todayDDMMYYYY(d = new Date()): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

// Phone's local date as YYYY-MM-DD, the format the database uses.
export function todayISO(d = new Date()): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return todayISO(new Date(y, m - 1, d + days));
}

// 2026-11-18 -> 18/11/2026
export function isoToDDMMYYYY(iso: string | null | undefined): string {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

// Whole days from a to b (b - a), both YYYY-MM-DD.
export function daysBetween(a: string, b: string): number {
  const t = (s: string) => {
    const [y, m, d] = s.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((t(b) - t(a)) / 86_400_000);
}
