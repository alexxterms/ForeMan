import { z } from 'zod';

// What the app sends so the model can match names to ids.
export const contextSchema = z.object({
  date: z.string().max(20).default(''),
  site: z.string().max(80).default(''),
  workers: z.array(z.object({ id: z.string(), name: z.string(), trade: z.string().default('') })).max(200),
  materials: z.array(z.object({ id: z.string(), name: z.string(), unit: z.string() })).max(200),
});
export type VoiceContext = z.infer<typeof contextSchema>;

export const requestSchema = z
  .object({
    audio: z.object({ data: z.string().min(1), mimeType: z.string().min(1) }).optional(),
    text: z.string().max(500).optional(),
    context: contextSchema,
  })
  .refine((v) => v.audio || (v.text && v.text.trim().length > 0), { message: 'Send audio or text' });
export type VoiceRequest = z.infer<typeof requestSchema>;

// What the model returns. Everything except transcript and intent is optional.
export const modelResultSchema = z.object({
  transcript: z.string().default(''),
  intent: z.enum(['attendance', 'stock_in', 'stock_out', 'unknown']),
  workerId: z.string().optional(),
  status: z.enum(['p', 'h', 'a']).optional(),
  hours: z.number().optional(),
  materialId: z.string().optional(),
  qty: z.number().optional(),
  unit: z.string().optional(),
  note: z.string().optional(),
});
export type ModelResult = z.infer<typeof modelResultSchema>;

// What the app gets back. Same shape as VoiceDraft in apps/mobile/src/lib/voice.ts.
export type Draft =
  | { kind: 'attendance'; workerId: string; hours: number | null; status: 'p' | 'h' | 'a'; transcript: string }
  | { kind: 'stock'; mode: 'in' | 'out'; materialId: string; qty: number; unit: string; transcript: string };

export type VoiceInput = {
  audio?: { data: string; mimeType: string };
  text?: string;
  context: VoiceContext;
};

// Calls the model and returns its raw JSON result. Swapped for a fake in tests.
export type VoiceModel = (input: VoiceInput) => Promise<unknown>;
