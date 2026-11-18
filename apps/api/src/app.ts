import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import { normaliseMime, toDraft } from '../../../supabase/functions/voice-parse/core.ts';
import { modelResultSchema, requestSchema, VoiceModel } from './types.js';

type Options = {
  // Undefined when GEMINI_API_KEY is not set. The server still starts and says so.
  model?: VoiceModel;
  // If set, requests must send it in the x-demo-token header.
  token?: string;
  modelName?: string;
  timeoutMs?: number;
};

const MAX_AUDIO_BASE64_CHARS = 14_000_000; // about 10 MB of audio

export { normaliseMime };

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('The model took too long to answer')), ms);
    p.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); },
    );
  });
}

export function createApp(opts: Options = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '15mb' }));

  app.get('/health', (_req, res) => {
    res.json({ ok: true, voiceReady: !!opts.model, model: opts.modelName ?? null });
  });

  function requireToken(req: Request, res: Response, next: NextFunction) {
    if (opts.token && req.header('x-demo-token') !== opts.token) {
      res.status(401).json({ error: 'unauthorized', message: 'Missing or wrong demo token.' });
      return;
    }
    next();
  }

  app.post('/voice/parse', requireToken, async (req, res) => {
    if (!opts.model) {
      res.status(503).json({ error: 'voice_not_configured', message: 'Voice is not set up on the server. Add GEMINI_API_KEY to apps/api/.env and restart.' });
      return;
    }

    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'bad_request', message: parsed.error.issues.map((i) => i.message).join('; ') });
      return;
    }
    const { audio, text, context } = parsed.data;
    if (audio && audio.data.length > MAX_AUDIO_BASE64_CHARS) {
      res.status(413).json({ error: 'too_large', message: 'That recording is too long. Keep it under a minute.' });
      return;
    }

    try {
      const raw = await withTimeout(
        opts.model({
          audio: audio ? { data: audio.data, mimeType: normaliseMime(audio.mimeType) } : undefined,
          text: audio ? undefined : text,
          context,
        }),
        opts.timeoutMs ?? 30_000,
      );
      const result = modelResultSchema.safeParse(raw);
      if (!result.success) {
        res.status(502).json({ error: 'bad_model_answer', message: 'The voice service gave an answer I could not read. Try again.' });
        return;
      }
      const outcome = toDraft(result.data, context);
      res.json({ transcript: result.data.transcript, draft: outcome.draft, message: outcome.message ?? null });
    } catch (err) {
      // Log the detail on the server. Send the app a short message only.
      console.error('voice/parse failed:', err instanceof Error ? err.message : err);
      res.status(502).json({ error: 'model_error', message: 'The voice service is not answering. Try again in a moment.' });
    }
  });

  return app;
}
