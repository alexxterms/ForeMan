// Voice rules shared by the hosted function (Deno) and the local server in apps/api (Node).
// No imports on purpose, so both runtimes can load this file as it is.

export type VoiceContext = {
  date: string;
  site: string;
  workers: { id: string; name: string; trade: string }[];
  materials: { id: string; name: string; unit: string }[];
};

export type ModelResult = {
  transcript: string;
  intent: 'attendance' | 'stock_in' | 'stock_out' | 'unknown';
  workerId?: string;
  status?: 'p' | 'h' | 'a';
  hours?: number;
  materialId?: string;
  qty?: number;
  unit?: string;
  note?: string;
};

// Same shape as VoiceDraft in apps/mobile/src/lib/voice.ts.
export type Draft =
  | { kind: 'attendance'; workerId: string; hours: number | null; status: 'p' | 'h' | 'a'; transcript: string }
  | { kind: 'stock'; mode: 'in' | 'out'; materialId: string; qty: number; unit: string; transcript: string };

export type DraftOutcome = { draft: Draft | null; message?: string };

// The app's language. Messages the person reads come back in it.
export type Lang = 'en' | 'hi';
export const pickLang = (v: unknown): Lang => (v === 'hi' ? 'hi' : 'en');

export const MESSAGES = {
  en: {
    usePost: 'Use POST',
    login: 'Log in to use voice.',
    company: 'Log in to a company to use voice.',
    notSetUp: 'Voice is not set up yet. The owner needs to add the Gemini key.',
    noAnswer: 'The voice service did not answer. Try again, or type the entry.',
    badAnswer: 'The voice service gave an answer I could not read. Try again.',
    sendSomething: 'Send audio or text',
    missingLists: 'Missing workers and materials',
    tooMany: 'Too many workers or materials',
    badAudio: 'Bad audio',
    tooLong: 'Recording is too long. Keep it under 30 seconds.',
    whichWorker: 'I could not tell which worker you meant. Say the name again.',
    whichMaterial: 'I could not tell which material you meant. Say it again.',
    whatQty: 'I did not catch the quantity. Say the number again.',
    wrongUnit: (material: string, unit: string, said: string) => `${material} is counted in ${unit}. You said ${said}.`,
    unknown: 'I did not understand that. Try a worker name with hours, or a material with a quantity.',
  },
  hi: {
    usePost: 'POST भेजें',
    login: 'आवाज़ के लिए लॉग इन करें।',
    company: 'आवाज़ के लिए किसी कंपनी में लॉग इन करें।',
    notSetUp: 'आवाज़ अभी सेट नहीं है। मालिक को Gemini key डालनी होगी।',
    noAnswer: 'आवाज़ सेवा से जवाब नहीं आया। फिर बोलें, या लिखकर एंट्री करें।',
    badAnswer: 'आवाज़ सेवा का जवाब समझ नहीं आया। फिर से बोलें।',
    sendSomething: 'आवाज़ या लिखा हुआ भेजें',
    missingLists: 'मज़दूर और सामान की सूची नहीं मिली',
    tooMany: 'बहुत ज़्यादा मज़दूर या सामान',
    badAudio: 'रिकॉर्डिंग ठीक नहीं है',
    tooLong: 'रिकॉर्डिंग बहुत लंबी है। 30 सेकंड से कम रखें।',
    whichWorker: 'समझ नहीं आया कौन सा मज़दूर। नाम फिर से बोलें।',
    whichMaterial: 'समझ नहीं आया कौन सा सामान। फिर से बोलें।',
    whatQty: 'मात्रा सुनाई नहीं दी। गिनती फिर से बोलें।',
    wrongUnit: (material: string, unit: string, said: string) => `${material} ${unit} में गिना जाता है। आपने ${said} कहा।`,
    unknown: 'समझ नहीं आया। मज़दूर का नाम और घंटे बोलें, या सामान और उसकी मात्रा।',
  },
};

export const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
export const MAX_AUDIO_BASE64 = 14_000_000;

// JSON schema for the model's answer. Optional fields are left out when they do not apply.
export const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    transcript: { type: 'string', description: 'Exactly what the person said, written as text.' },
    intent: { type: 'string', enum: ['attendance', 'stock_in', 'stock_out', 'unknown'] },
    workerId: { type: 'string', description: 'Id of the worker from the list. Only for attendance.' },
    status: { type: 'string', enum: ['p', 'h', 'a'], description: 'p present, h half day, a absent. Only for attendance.' },
    hours: { type: 'number', description: 'Hours worked, if said. Only for attendance.' },
    materialId: { type: 'string', description: 'Id of the material from the list. Only for stock entries.' },
    qty: { type: 'number', description: 'Quantity as a number. Only for stock entries.' },
    unit: { type: 'string', description: 'Unit said or implied, using the material unit from the list. Only for stock entries.' },
    note: { type: 'string', description: 'Short plain sentence explaining why intent is unknown. Only when unknown.' },
  },
  required: ['transcript', 'intent'],
} as const;

export function buildPrompt(ctx: VoiceContext, hasAudio: boolean, lang: Lang = 'en'): string {
  const workers = ctx.workers.map((w) => `- ${w.id}: ${w.name}${w.trade ? ` (${w.trade})` : ''}`).join('\n') || '- (none)';
  const materials = ctx.materials.map((m) => `- ${m.id}: ${m.name}, counted in ${m.unit}`).join('\n') || '- (none)';
  return `You are the voice entry assistant for ForeMan, a construction site app used in India.
The speaker is a site manager or contractor. They speak Hindi, Hinglish, English, or a mix.
${hasAudio ? `Listen to the audio and write what was said in the transcript field. ${lang === 'hi' ? 'Write Hindi words in Devanagari script (for example "रमेश आज 8 घंटे"). Keep numbers as digits and English words like cement or half day as they are.' : 'Hindi may be written in Roman letters.'}` : 'The text below is what the person said. It may be in Devanagari or Roman letters.'}
Then turn it into ONE entry.

Site: ${ctx.site || 'unknown'}. Today: ${ctx.date || 'unknown'}.

Workers (use these ids only):
${workers}

Materials (use these ids only):
${materials}

Intents:
- attendance: a worker was present, on half day, or absent. Example: "Ramesh aaj 8 ghante" means Ramesh worked 8 hours.
- stock_in: material arrived or was received. Example: "50 bori cement aaya".
- stock_out: material was used or taken out. Example: "20 bori cement lagi" or "used 2 tons sand".
- unknown: anything else, or the audio is unclear, or no listed worker or material matches.

Rules:
- Match worker and material names loosely by sound and spelling, but only to a listed id. If nothing fits, use unknown.
- Attendance status: p = present, h = half day (words like half, aadha, aadhe), a = absent (words like absent, gair hazir, chutti, nahi aaya). If hours are said and no status word, use p for 7 or more hours, h for 3 to 6, a for under 3.
- Understand Hindi number words such as ek, do, teen, paanch, das, pachaas, sau (एक, दो, तीन, पाँच, दस, पचास, सौ) and Devanagari digits. Write quantities as digits.
- bori and bag mean bags. ton, tonne mean tons. kg means kg. Write the unit the way the material list writes it. If no unit is said, leave unit out.
- Never invent a worker, material, or quantity. Leave fields out when they were not said.
- Worker and material names in the list may be in English letters while the speech is Hindi. Match them by sound.
- Do not return more than one entry.
- ${lang === 'hi' ? 'Write the note field in simple Hindi (Devanagari).' : 'Write the note field in simple English.'}`;
}

const INTENTS = ['attendance', 'stock_in', 'stock_out', 'unknown'];

// Checks the model's JSON by hand. Returns null if it is not usable.
export function parseModelResult(raw: unknown): ModelResult | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.intent !== 'string' || !INTENTS.includes(o.intent)) return null;
  const str = (v: unknown) => (typeof v === 'string' ? v : undefined);
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
  const status = str(o.status);
  return {
    transcript: str(o.transcript) ?? '',
    intent: o.intent as ModelResult['intent'],
    workerId: str(o.workerId),
    status: status === 'p' || status === 'h' || status === 'a' ? status : undefined,
    hours: num(o.hours),
    materialId: str(o.materialId),
    qty: num(o.qty),
    unit: str(o.unit),
    note: str(o.note),
  };
}

// Checks what the app sent. Returns an error message, or null when it is fine.
export function checkRequest(body: unknown): { error: string } | { audio?: { data: string; mimeType: string }; text?: string; context: VoiceContext; lang: Lang } {
  if (!body || typeof body !== 'object') return { error: MESSAGES.en.sendSomething };
  const b = body as Record<string, unknown>;
  const lang = pickLang(b.lang);
  const M = MESSAGES[lang];
  const c = b.context as Record<string, unknown> | undefined;
  if (!c || !Array.isArray(c.workers) || !Array.isArray(c.materials)) return { error: M.missingLists };
  if (c.workers.length > 300 || c.materials.length > 300) return { error: M.tooMany };
  const s = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');
  const context: VoiceContext = {
    date: s(c.date, 20),
    site: s(c.site, 80),
    workers: c.workers.map((w: Record<string, unknown>) => ({ id: s(w?.id, 64), name: s(w?.name, 80), trade: s(w?.trade, 40) })).filter((w) => w.id && w.name),
    materials: c.materials.map((m: Record<string, unknown>) => ({ id: s(m?.id, 64), name: s(m?.name, 80), unit: s(m?.unit, 12) })).filter((m) => m.id && m.name),
  };
  const a = b.audio as Record<string, unknown> | undefined;
  if (a) {
    if (typeof a.data !== 'string' || !a.data || typeof a.mimeType !== 'string') return { error: M.badAudio };
    if (a.data.length > MAX_AUDIO_BASE64) return { error: M.tooLong };
    return { audio: { data: a.data, mimeType: normaliseMime(a.mimeType) }, context, lang };
  }
  const text = typeof b.text === 'string' ? b.text.trim().slice(0, 500) : '';
  if (!text) return { error: M.sendSomething };
  return { text, context, lang };
}

// Phones report m4a in several ways. Gemini wants one name, without codec details.
export function normaliseMime(mime: string): string {
  const base = mime.split(';')[0].trim().toLowerCase();
  if (base === 'audio/mp4' || base === 'audio/x-m4a') return 'audio/m4a';
  if (base === 'audio/x-wav' || base === 'audio/wave') return 'audio/wav';
  return base;
}

// Turns the model's answer into a draft the app can show, and refuses anything
// that does not match a real worker or material. The model is never trusted with ids.
export function toDraft(result: ModelResult, ctx: VoiceContext, lang: Lang = 'en'): DraftOutcome {
  const transcript = result.transcript.trim();
  const M = MESSAGES[lang];

  if (result.intent === 'attendance') {
    const worker = ctx.workers.find((w) => w.id === result.workerId);
    if (!worker) {
      return { draft: null, message: M.whichWorker };
    }
    const hours = typeof result.hours === 'number' && result.hours > 0 && result.hours <= 24 ? result.hours : null;
    let status = result.status;
    if (!status) status = hours === null ? 'p' : hours >= 7 ? 'p' : hours >= 3 ? 'h' : 'a';
    return { draft: { kind: 'attendance', workerId: worker.id, hours, status, transcript } };
  }

  if (result.intent === 'stock_in' || result.intent === 'stock_out') {
    const material = ctx.materials.find((m) => m.id === result.materialId);
    if (!material) {
      return { draft: null, message: M.whichMaterial };
    }
    const qty = result.qty;
    if (typeof qty !== 'number' || !(qty > 0) || qty > 1_000_000) {
      return { draft: null, message: M.whatQty };
    }
    if (result.unit && result.unit.toLowerCase() !== material.unit.toLowerCase()) {
      return { draft: null, message: M.wrongUnit(material.name, material.unit, result.unit) };
    }
    return {
      draft: {
        kind: 'stock',
        mode: result.intent === 'stock_in' ? 'in' : 'out',
        materialId: material.id,
        qty: Math.round(qty * 100) / 100,
        unit: material.unit,
        transcript,
      },
    };
  }

  return { draft: null, message: result.note?.trim() || M.unknown };
}
