import type { Material, Status, Worker } from '@/data/types';
import { tr, unitLabel } from '@/i18n';

export type VoiceDraft =
  | { kind: 'attendance'; workerId: string; hours: number | null; status: Status; transcript: string }
  | { kind: 'stock'; mode: 'in' | 'out'; materialId: string; qty: number; unit: string; transcript: string };

// Hints on the voice screen, built from the site's real workers and materials, in the app's language.
export function samplePhrases(workers: Worker[], materials: Material[]): string[] {
  const p = tr().voice.phrases;
  const out: string[] = [];
  const w1 = workers[0]?.name.split(' ')[0];
  const w2 = workers[1]?.name.split(' ')[0];
  if (w1) out.push(p.hours(w1));
  if (w2) out.push(p.half(w2));
  const m = materials[0];
  if (m) {
    const unit = m.unit === 'bags' ? p.bags : unitLabel(m.unit);
    const name = m.name.split(' ')[0];
    out.push(p.in('50', unit, name), p.out('20', unit, name));
  }
  return out.length ? out : [p.hours('Ramesh'), p.in('50', p.bags, 'cement')];
}

// Hindi words (Roman and Devanagari) for common materials, mapped to a word in the material's English name.
const MATERIAL_WORDS: Record<string, string> = {
  retu: 'sand',
  ret: 'sand',
  balu: 'sand',
  रेत: 'sand',
  बालू: 'sand',
  saria: 'steel',
  sariya: 'steel',
  सरिया: 'steel',
  gitti: 'aggregate',
  गिट्टी: 'aggregate',
  int: 'brick',
  eent: 'brick',
  ईंट: 'brick',
  सीमेंट: 'cement',
  सिमेंट: 'cement',
};

const UNIT_WORDS: Record<string, string> = {
  bori: 'bags',
  bag: 'bags',
  bags: 'bags',
  बोरी: 'bags',
  बोरा: 'bags',
  बैग: 'bags',
  kg: 'kg',
  kilo: 'kg',
  किलो: 'kg',
  ton: 'tons',
  tons: 'tons',
  tonne: 'tons',
  टन: 'tons',
};

const STOCK_OUT = /(nikala|nikali|lagi|laga|used|use hua|kharch|taken out|लगी|लगा|लगे|निकाला|निकली|खर्च)/;
const STOCK_IN = /(aaya|aayi|arrived|came|received|आया|आई|आए|आये)/;
const HALF = /(half|aadha|aadhe|adha|आधा|आधे|हाफ)/;
const ABSENT = /(absent|gair|chutti|nahi aaya|गैरहाज़िर|गैरहाजिर|छुट्टी|नहीं आया)/;
const HOURS = /(\d+)\s*(ghante|ghanta|hours?|hrs?|घंटे|घंटा)/;

// Devanagari digits (०-९) to 0-9, so "५० बोरी" reads as 50.
function asciiDigits(s: string): string {
  return s.replace(/[०-९]/g, (d) => String(d.charCodeAt(0) - 0x0966));
}

function findMaterial(words: string[], materials: Material[]): Material | undefined {
  for (const raw of words) {
    const w = MATERIAL_WORDS[raw] ?? raw;
    if (w.length < 3) continue;
    const m = materials.find((x) => {
      const name = x.name.toLowerCase();
      return name.includes(raw) || name.split(/[^a-z0-9]+/).some((part) => part === w || part.startsWith(w));
    });
    if (m) return m;
  }
  return undefined;
}

// Small rule-based parser. It is only the fallback when the voice service cannot be reached,
// for example when the phone is offline and the user types. Spoken entries go to the server.
export function parseVoice(text: string, workers: Worker[], materials: Material[]): VoiceDraft | null {
  const t = asciiDigits(text.toLowerCase()).replace(/[,.।]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!t) return null;
  const words = t.split(' ');

  const num = t.match(/(\d+(?:\.\d+)?)/);
  const material = num ? findMaterial(words, materials) : undefined;
  if (num && material) {
    const unitWord = words.find((w) => UNIT_WORDS[w]);
    const unit = unitWord ? UNIT_WORDS[unitWord] : material.unit;
    if (unit !== material.unit) return null;
    const out = STOCK_OUT.test(t) && !STOCK_IN.test(t);
    return { kind: 'stock', mode: out ? 'out' : 'in', materialId: material.id, qty: parseFloat(num[1]), unit, transcript: text };
  }

  const worker = workers.find((w) => {
    const first = w.name.split(' ')[0].toLowerCase();
    return words.includes(first);
  });
  if (worker) {
    const hoursMatch = t.match(HOURS);
    const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : null;
    let status: Status = 'p';
    if (HALF.test(t)) status = 'h';
    else if (ABSENT.test(t)) status = 'a';
    else if (hours !== null) status = hours >= 7 ? 'p' : hours >= 3 ? 'h' : 'a';
    return { kind: 'attendance', workerId: worker.id, hours, status, transcript: text };
  }
  return null;
}
