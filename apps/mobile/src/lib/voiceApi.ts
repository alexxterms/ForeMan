import { FunctionsFetchError, FunctionsHttpError } from '@supabase/supabase-js';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';
import type { Material, Worker } from '@/data/types';
import type { VoiceDraft } from '@/lib/voice';
import { currentLang, tr } from '@/i18n';
import { supabase } from '@/lib/supabase';

// Voice goes to the Supabase function "voice-parse". It holds the Gemini key and checks the login.

export type VoiceReply = { transcript: string; draft: VoiceDraft | null; message: string | null };

// 'offline' = could not reach the service. 'server' = the service answered with an error.
export class VoiceApiError extends Error {
  constructor(public kind: 'offline' | 'server', message: string, public status?: number) {
    super(message);
  }
}

async function call(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.functions.invoke('voice-parse', { body: { ...body, lang: currentLang() } });
  if (!error) return (data ?? {}) as Record<string, unknown>;
  if (error instanceof FunctionsHttpError) {
    const res = error.context as Response;
    const json = (await res.json().catch(() => ({}))) as { message?: string };
    throw new VoiceApiError('server', json.message ?? tr().voice.serverError, res.status);
  }
  if (error instanceof FunctionsFetchError) throw new VoiceApiError('offline', tr().voice.unreachable);
  // Function not deployed yet, or the relay failed.
  throw new VoiceApiError('server', tr().voice.unavailable, 404);
}

export type VoiceHealth = 'ready' | 'not_configured' | 'unreachable';

export async function checkVoiceServer(): Promise<VoiceHealth> {
  try {
    const body = await call({ health: true });
    return body.voiceReady ? 'ready' : 'not_configured';
  } catch (e) {
    if (e instanceof VoiceApiError && e.status === 503) return 'not_configured';
    return 'unreachable';
  }
}

export async function readAudio(uri: string): Promise<{ data: string; mimeType: string }> {
  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    return { data: dataUrl.split(',')[1] ?? '', mimeType: (blob.type || 'audio/webm').split(';')[0] };
  }
  const data = await new File(uri).base64();
  return { data, mimeType: 'audio/m4a' };
}

export async function parseOnServer(
  input: { audio?: { data: string; mimeType: string }; text?: string },
  ctx: { date: string; site: string; workers: Worker[]; materials: Material[] },
): Promise<VoiceReply> {
  const json = await call({
    ...input,
    context: {
      date: ctx.date,
      site: ctx.site,
      workers: ctx.workers.map((w) => ({ id: w.id, name: w.name, trade: w.trade })),
      materials: ctx.materials.map((m) => ({ id: m.id, name: m.name, unit: m.unit })),
    },
  });
  return {
    transcript: (json.transcript as string) ?? '',
    draft: (json.draft as VoiceDraft) ?? null,
    message: (json.message as string) ?? null,
  };
}
