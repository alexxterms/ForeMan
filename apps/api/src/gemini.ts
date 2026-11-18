import { GoogleGenAI } from '@google/genai';
import { buildPrompt, DEFAULT_MODEL, RESPONSE_SCHEMA } from '../../../supabase/functions/voice-parse/core.ts';
import { VoiceInput, VoiceModel } from './types.js';

export { buildPrompt, DEFAULT_MODEL };

// Real model. Needs GEMINI_API_KEY. The key stays on the server and is never sent to the app.
export function createGeminiModel(apiKey: string, model = DEFAULT_MODEL): VoiceModel {
  const client = new GoogleGenAI({ apiKey });

  return async (input: VoiceInput) => {
    const parts: Array<{ type: 'text'; text: string } | { type: 'audio'; data: string; mime_type: string }> = [
      { type: 'text', text: buildPrompt(input.context, !!input.audio) },
    ];
    if (input.audio) parts.push({ type: 'audio', data: input.audio.data, mime_type: input.audio.mimeType });
    else parts.push({ type: 'text', text: `Spoken text: ${input.text ?? ''}` });

    const interaction = await client.interactions.create({
      model,
      input: parts,
      response_format: { type: 'text', mime_type: 'application/json', schema: RESPONSE_SCHEMA as unknown as Record<string, unknown> },
    });

    const text = interaction.output_text;
    if (!text) throw new Error('The model returned no text');
    return JSON.parse(text);
  };
}
