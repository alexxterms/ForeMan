import 'dotenv/config';
import { createApp } from './app.js';
import { createGeminiModel, DEFAULT_MODEL } from './gemini.js';

const port = Number(process.env.PORT ?? 8787);
const apiKey = process.env.GEMINI_API_KEY?.trim();
const modelName = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
const token = process.env.DEMO_TOKEN?.trim() || undefined;

const app = createApp({
  model: apiKey ? createGeminiModel(apiKey, modelName) : undefined,
  modelName,
  token,
});

// Listen on all interfaces so a phone on the same Wi-Fi can reach it.
app.listen(port, '0.0.0.0', () => {
  console.log(`ForeMan API listening on http://localhost:${port}`);
  console.log(apiKey ? `Voice ready with model ${modelName}` : 'Voice NOT ready: set GEMINI_API_KEY in apps/api/.env');
  if (token) console.log('Demo token is required on requests.');
});
