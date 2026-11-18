import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, before, describe, test } from 'node:test';
import { createApp, normaliseMime } from '../src/app.js';
import { toDraft } from '../src/draft.js';
import { buildPrompt } from '../src/gemini.js';
import type { ModelResult, VoiceContext } from '../src/types.js';

const ctx: VoiceContext = {
  date: '19/10/2026',
  site: 'Sector 21',
  workers: [
    { id: 'ramesh', name: 'Ramesh Kumar', trade: 'Mason' },
    { id: 'sunil', name: 'Sunil', trade: 'Helper' },
  ],
  materials: [
    { id: 'cement', name: 'Cement (OPC 53)', unit: 'bags' },
    { id: 'sand', name: 'River sand', unit: 'tons' },
  ],
};

const r = (o: Partial<ModelResult> & Pick<ModelResult, 'intent'>): ModelResult => ({ transcript: 'x', ...o });

describe('toDraft', () => {
  test('attendance with hours and no status becomes present', () => {
    const { draft } = toDraft(r({ intent: 'attendance', workerId: 'ramesh', hours: 8 }), ctx);
    assert.deepEqual(draft, { kind: 'attendance', workerId: 'ramesh', hours: 8, status: 'p', transcript: 'x' });
  });

  test('attendance with 4 hours becomes half day, 2 hours absent', () => {
    assert.equal((toDraft(r({ intent: 'attendance', workerId: 'sunil', hours: 4 }), ctx).draft as { status: string }).status, 'h');
    assert.equal((toDraft(r({ intent: 'attendance', workerId: 'sunil', hours: 2 }), ctx).draft as { status: string }).status, 'a');
  });

  test('a stated status wins over hours', () => {
    const { draft } = toDraft(r({ intent: 'attendance', workerId: 'sunil', status: 'h', hours: 8 }), ctx);
    assert.equal((draft as { status: string }).status, 'h');
  });

  test('a worker id that is not in the list is refused', () => {
    const out = toDraft(r({ intent: 'attendance', workerId: 'made-up' }), ctx);
    assert.equal(out.draft, null);
    assert.match(out.message ?? '', /which worker/);
  });

  test('stock in becomes a stock draft', () => {
    const { draft } = toDraft(r({ intent: 'stock_in', materialId: 'cement', qty: 50, unit: 'bags' }), ctx);
    assert.deepEqual(draft, { kind: 'stock', mode: 'in', materialId: 'cement', qty: 50, unit: 'bags', transcript: 'x' });
  });

  test('stock out keeps the mode', () => {
    const { draft } = toDraft(r({ intent: 'stock_out', materialId: 'sand', qty: 1.5 }), ctx);
    assert.equal((draft as { mode: string }).mode, 'out');
  });

  test('missing or zero quantity is refused', () => {
    assert.equal(toDraft(r({ intent: 'stock_in', materialId: 'cement' }), ctx).draft, null);
    assert.equal(toDraft(r({ intent: 'stock_in', materialId: 'cement', qty: 0 }), ctx).draft, null);
    assert.equal(toDraft(r({ intent: 'stock_in', materialId: 'cement', qty: -5 }), ctx).draft, null);
  });

  test('a unit that does not match the material is refused with a clear message', () => {
    const out = toDraft(r({ intent: 'stock_in', materialId: 'cement', qty: 2, unit: 'tons' }), ctx);
    assert.equal(out.draft, null);
    assert.match(out.message ?? '', /counted in bags/);
  });

  test('unknown intent returns the model note', () => {
    const out = toDraft(r({ intent: 'unknown', note: 'That was not about work.' }), ctx);
    assert.equal(out.draft, null);
    assert.equal(out.message, 'That was not about work.');
  });
});

describe('helpers', () => {
  test('normaliseMime maps phone and browser labels', () => {
    assert.equal(normaliseMime('audio/mp4'), 'audio/m4a');
    assert.equal(normaliseMime('audio/webm;codecs=opus'), 'audio/webm');
    assert.equal(normaliseMime('audio/x-wav'), 'audio/wav');
  });

  test('the prompt lists every worker and material id', () => {
    const p = buildPrompt(ctx, true);
    for (const id of ['ramesh', 'sunil', 'cement', 'sand']) assert.ok(p.includes(`${id}:`), id);
  });
});

describe('POST /voice/parse', () => {
  let server: ReturnType<ReturnType<typeof createApp>['listen']>;
  let base = '';
  let lastInput: unknown = null;

  before(async () => {
    const app = createApp({
      modelName: 'fake',
      token: 'secret',
      model: async (input) => {
        lastInput = input;
        if (input.text === 'boom') throw new Error('upstream exploded with a secret detail');
        if (input.text === 'garbage') return { nope: true };
        if (input.text?.includes('cement')) return { transcript: input.text, intent: 'stock_in', materialId: 'cement', qty: 50, unit: 'bags' };
        return { transcript: 'Ramesh 8 hours', intent: 'attendance', workerId: 'ramesh', hours: 8 };
      },
    });
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => resolve());
    });
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  after(() => {
    server.close();
  });

  const post = (body: unknown, token: string | null = 'secret') =>
    fetch(`${base}/voice/parse`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(token ? { 'x-demo-token': token } : {}) },
      body: JSON.stringify(body),
    });

  test('health reports the model', async () => {
    const res = await fetch(`${base}/health`);
    assert.deepEqual(await res.json(), { ok: true, voiceReady: true, model: 'fake' });
  });

  test('rejects a missing token', async () => {
    const res = await post({ text: 'hi', context: ctx }, null);
    assert.equal(res.status, 401);
  });

  test('parses audio and normalises the mime type', async () => {
    const res = await post({ audio: { data: 'AAAA', mimeType: 'audio/webm;codecs=opus' }, context: ctx });
    assert.equal(res.status, 200);
    const body = (await res.json()) as { draft: { kind: string; workerId: string } };
    assert.equal(body.draft.kind, 'attendance');
    assert.equal(body.draft.workerId, 'ramesh');
    assert.equal((lastInput as { audio: { mimeType: string } }).audio.mimeType, 'audio/webm');
  });

  test('parses typed text for stock', async () => {
    const res = await post({ text: '50 bori cement aaya', context: ctx });
    const body = (await res.json()) as { draft: { kind: string; mode: string; qty: number } };
    assert.equal(body.draft.kind, 'stock');
    assert.equal(body.draft.mode, 'in');
    assert.equal(body.draft.qty, 50);
  });

  test('rejects a request with neither audio nor text', async () => {
    const res = await post({ context: ctx });
    assert.equal(res.status, 400);
  });

  test('a model failure returns a short message without the upstream detail', async () => {
    const res = await post({ text: 'boom', context: ctx });
    assert.equal(res.status, 502);
    const body = JSON.stringify(await res.json());
    assert.ok(!body.includes('secret detail'));
  });

  test('an unreadable model answer returns 502', async () => {
    const res = await post({ text: 'garbage', context: ctx });
    assert.equal(res.status, 502);
  });
});

describe('without a key', () => {
  test('returns 503 with the setup instruction', async () => {
    const app = createApp({});
    const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
      const s = app.listen(0, '127.0.0.1', () => resolve(s));
    });
    try {
      const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
      const res = await fetch(`${base}/voice/parse`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: 'hi', context: ctx }),
      });
      assert.equal(res.status, 503);
      assert.match(((await res.json()) as { message: string }).message, /GEMINI_API_KEY/);
    } finally {
      server.close();
    }
  });
});

describe('Hindi', () => {
  test('messages come back in Hindi when the app is in Hindi', () => {
    const { message } = toDraft(r({ intent: 'attendance', workerId: 'nobody' }), ctx, 'hi');
    assert.match(message ?? '', /मज़दूर/);
    assert.match(toDraft(r({ intent: 'unknown' }), ctx, 'en').message ?? '', /did not understand/);
  });

  test('the prompt asks for a Devanagari transcript and a Hindi note', () => {
    const p = buildPrompt(ctx, true, 'hi');
    assert.match(p, /Devanagari/);
    assert.match(p, /note field in simple Hindi/);
    assert.doesNotMatch(buildPrompt(ctx, true), /note field in simple Hindi/);
  });
});
