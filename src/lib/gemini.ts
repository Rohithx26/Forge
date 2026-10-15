/**
 * Meal photo / text → calories via the Google Gemini API (free tier available at aistudio.google.com).
 * Runs in the browser (with the user's own key) and on the server (with GEMINI_API_KEY): fetch only, no SDK.
 */
import type { FoodEstimate } from './types';

export const GEMINI_MODEL = 'gemini-3.8-flash';
/** tried in order when a model is overloaded (503) or errors (500) */
const MODELS = [GEMINI_MODEL, 'gemini-3.5-flash-lite'];
const BUSY = new Set([500, 503]);

export interface FoodInput {
  text?: string;
  image?: { data: string; mediaType: string };
}

export class GeminiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

const SYSTEM = `You are a nutrition estimator inside a gym tracking app. The user logs what they ate, either as a photo of the meal or a text description.

Break the meal into its individual foods and estimate, for each one, the portion and its calories, protein, carbohydrate and fat in grams. Base values on standard food composition data (USDA, and the Indian Food Composition Tables for Indian dishes). Account for cooking oil, ghee, butter, sugar and sauces that are typically used in a dish even when they aren't visible, because these are the most common source of under-counting.

For photos, judge portion size from plate size, utensils and hands in frame. For text, use the quantities given; when none are given, assume one typical serving and say so in the portion. If the user adds a note alongside a photo, trust the note over what you see.

Round calories to the nearest 5 and grams to the nearest whole number. Set confidence to "low" when portions or ingredients are hard to judge. Use notes for one short sentence on your main assumption, or to say the image contains no food (in that case return no items).`;

const SCHEMA = {
  type: 'OBJECT',
  required: ['items', 'confidence', 'notes'],
  properties: {
    items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        required: ['name', 'portion', 'kcal', 'proteinG', 'carbsG', 'fatG'],
        properties: {
          name: { type: 'STRING' },
          portion: { type: 'STRING' },
          kcal: { type: 'NUMBER' },
          proteinG: { type: 'NUMBER' },
          carbsG: { type: 'NUMBER' },
          fatG: { type: 'NUMBER' }
        }
      }
    },
    confidence: { type: 'STRING', enum: ['low', 'medium', 'high'] },
    notes: { type: 'STRING' }
  }
};

/** budgetMs caps the total time across all models (serverless hosts kill slow functions) */
export async function geminiEstimate(apiKey: string, input: FoodInput, budgetMs = 40_000): Promise<FoodEstimate> {
  const deadline = Date.now() + budgetMs;
  const text = input.text?.trim().slice(0, 2000) ?? '';
  const parts: unknown[] = [];
  if (input.image) parts.push({ inline_data: { mime_type: input.image.mediaType, data: input.image.data } });
  parts.push({ text: input.image ? (text ? `Note from the user: ${text}` : 'Estimate this meal.') : `What I ate: ${text}` });

  const request = JSON.stringify({
    system_instruction: { parts: [{ text: SYSTEM }] },
    contents: [{ role: 'user', parts }],
    generationConfig: { response_mime_type: 'application/json', response_schema: SCHEMA }
  });

  // an overloaded or slow model falls through to the next one
  let res: Response | null = null;
  let body: any = null;
  for (const model of MODELS) {
    const left = Math.min(20_000, deadline - Date.now());
    if (left < 1_000) break;
    try {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
        body: request,
        signal: AbortSignal.timeout(left)
      });
    } catch (e) {
      if ((e as Error).name === 'TimeoutError') { res = null; continue; }
      throw new GeminiError("Couldn't reach Gemini. Check your connection.", 503);
    }
    body = await res.json().catch(() => null);
    if (!BUSY.has(res.status)) break;
  }

  if (!res || !res.ok) {
    const msg: string = body?.error?.message ?? '';
    if (!res || BUSY.has(res.status)) throw new GeminiError('Gemini is overloaded right now (this is on Google’s side). Try again in a minute, or enter it manually.', 503);
    if (res.status === 429) throw new GeminiError("You've hit Gemini's free-tier limit. Wait a minute and try again.", 429);
    if (res.status === 400 && /api key/i.test(msg)) throw new GeminiError('Your Gemini API key is invalid. Check it in Profile → Food AI.', 401);
    if (res.status === 403) throw new GeminiError("This Gemini API key doesn't have access. Create a new key at aistudio.google.com.", 403);
    throw new GeminiError(`Estimate failed (${res.status}). Please try again.`, 502);
  }
  if (body?.promptFeedback?.blockReason) throw new GeminiError("Couldn't analyse that. Try describing the meal in text instead.", 422);
  const out: string | undefined = body?.candidates?.[0]?.content?.parts?.find((p: { text?: string }) => typeof p.text === 'string')?.text;
  if (!out) throw new GeminiError('No estimate came back. Please try again.', 502);
  try {
    return JSON.parse(out) as FoodEstimate;
  } catch {
    throw new GeminiError('Got an unreadable estimate. Please try again.', 502);
  }
}
