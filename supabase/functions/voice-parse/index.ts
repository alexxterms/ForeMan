// Hosted voice backend. The app sends audio or text with the site's workers and materials,
// Gemini turns it into one entry, and the rules in core.ts check it before the app sees it.
// Only logged-in members of a company can call it. The Gemini key is a Supabase secret.

import { GoogleGenAI } from 'npm:@google/genai@2.30.0';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { buildPrompt, checkRequest, DEFAULT_MODEL, MESSAGES, parseModelResult, pickLang, RESPONSE_SCHEMA, toDraft } from './core.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function reply(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json' } });
}

const apiKey = Deno.env.get('GEMINI_API_KEY') ?? '';
const model = Deno.env.get('GEMINI_MODEL') || DEFAULT_MODEL;
const gemini = apiKey ? new GoogleGenAI({ apiKey }) : null;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return reply(405, { message: MESSAGES.en.usePost });
  const body = await req.json().catch(() => null);
  const M = MESSAGES[pickLang((body as { lang?: unknown } | null)?.lang)];

  // Check the login token by reading the caller's membership with it. A bad or missing token reads nothing.
  const auth = req.headers.get('Authorization') ?? '';
  const publicKey = Deno.env.get('SUPABASE_ANON_KEY') || req.headers.get('apikey') || '';
  if (!auth || !publicKey) return reply(401, { message: M.login });
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, publicKey, {
    global: { headers: { Authorization: auth } },
  });
  const { data: member } = await supabase.from('members').select('company_id').maybeSingle();
  if (!member) return reply(403, { message: M.company });

  if (body && typeof body === 'object' && (body as { health?: boolean }).health) {
    return reply(200, { ok: true, voiceReady: !!gemini, model });
  }
  if (!gemini) return reply(503, { message: M.notSetUp });

  const input = checkRequest(body);
  if ('error' in input) return reply(400, { message: input.error });

  const parts: Array<{ type: 'text'; text: string } | { type: 'audio'; data: string; mime_type: string }> = [
    { type: 'text', text: buildPrompt(input.context, !!input.audio, input.lang) },
  ];
  if (input.audio) parts.push({ type: 'audio', data: input.audio.data, mime_type: input.audio.mimeType });
  else parts.push({ type: 'text', text: `Spoken text: ${input.text ?? ''}` });

  let raw: unknown;
  try {
    const interaction = await gemini.interactions.create({
      model,
      input: parts,
      response_format: { type: 'text', mime_type: 'application/json', schema: RESPONSE_SCHEMA as unknown as Record<string, unknown> },
    });
    raw = JSON.parse(interaction.output_text ?? '');
  } catch (e) {
    console.error('gemini failed', e instanceof Error ? e.message : e);
    return reply(502, { message: M.noAnswer });
  }

  const result = parseModelResult(raw);
  if (!result) return reply(502, { message: M.badAnswer });

  const outcome = toDraft(result, input.context, input.lang);
  return reply(200, { transcript: result.transcript, draft: outcome.draft, message: outcome.message ?? null });
});
