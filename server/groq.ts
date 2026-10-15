/** Backup for when Gemini is overloaded: Groq's free API (OpenAI-compatible), same prompt and output shape. */
import { GeminiError, SYSTEM, type FoodInput } from '../src/lib/gemini.js';
import type { FoodEstimate } from '../src/lib/types.js';

const MODEL = 'qwen/qwen3.8-27b'; // Groq's vision model

const FORMAT = `Reply with only a JSON object: {"items":[{"name":string,"portion":string,"kcal":number,"proteinG":number,"carbsG":number,"fatG":number}],"confidence":"low"|"medium"|"high","notes":string}`;

export async function groqEstimate(apiKey: string, input: FoodInput, timeoutMs: number): Promise<FoodEstimate> {
  const text = input.text?.trim().slice(0, 2000) ?? '';
  const prompt = input.image ? (text ? `Note from the user: ${text}` : 'Estimate this meal.') : `What I ate: ${text}`;
  const content = input.image
    ? [{ type: 'image_url', image_url: { url: `data:${input.image.mediaType};base64,${input.image.data}` } }, { type: 'text', text: prompt }]
    : prompt;

  let res: Response;
  try {
    res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'system', content: `${SYSTEM}\n\n${FORMAT}` }, { role: 'user', content }],
        response_format: { type: 'json_object' }
      }),
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch {
    throw new GeminiError('Food estimates are busy right now. Try again in a minute, or enter it manually.', 503);
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    console.error('groq', res.status, body?.error?.message);
    throw new GeminiError(res.status === 429 ? 'Food estimates hit their free limit. Wait a minute and try again.' : 'Food estimates are busy right now. Try again in a minute, or enter it manually.', res.status === 429 ? 429 : 503);
  }
  try {
    const out = JSON.parse(body.choices[0].message.content) as FoodEstimate;
    if (!Array.isArray(out.items)) throw new Error('no items');
    return out;
  } catch {
    throw new GeminiError('Got an unreadable estimate. Please try again.', 502);
  }
}
