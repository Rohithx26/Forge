/**
 * POST /api/food — estimates calories & macros from a meal photo or a text description, using the
 * server's GEMINI_API_KEY. Only used when the user hasn't saved their own key in Profile → Food AI.
 * Callers must send their Firebase ID token, so only signed-in users of this app can spend the key.
 * Host-agnostic (Web Request → Response); wrapped by netlify/functions/food.ts, api/food.ts
 * and the Vite dev middleware.
 */
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { GeminiError, geminiEstimate, type FoodInput } from '../src/lib/gemini.js';
import { groqEstimate } from './groq.js';

const MAX_BODY_BYTES = 5 * 1024 * 1024; // keeps us under Netlify's 6 MB function payload limit
// Netlify kills functions at 10 s; leave room to send the response
const TIME_BUDGET_MS = 9_000;
// shortcut: Gemini gets 6 s so the Groq backup has ~3 s left; raise both if hosting allows longer (Vercel does)
const GEMINI_BUDGET_MS = 6_000;

type Env = { apiKey?: string; groqKey?: string; projectId?: string };

/** Gemini first; when it's overloaded or slow (503) and a Groq key is set, Groq answers instead. */
async function estimate(env: Env, input: FoodInput) {
  const start = Date.now();
  if (env.apiKey) {
    try {
      return await geminiEstimate(env.apiKey, input, env.groqKey ? GEMINI_BUDGET_MS : TIME_BUDGET_MS);
    } catch (e) {
      if (!env.groqKey || !(e instanceof GeminiError) || e.status !== 503) throw e;
    }
  }
  return groqEstimate(env.groqKey!, input, Math.max(1_000, TIME_BUDGET_MS - (Date.now() - start)));
}

// Firebase signs ID tokens with these rotating Google keys; jose caches them
const FIREBASE_KEYS = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

async function signedIn(req: Request, projectId: string): Promise<boolean> {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return false;
  try {
    await jwtVerify(token, FIREBASE_KEYS, { issuer: `https://securetoken.google.com/${projectId}`, audience: projectId });
    return true;
  } catch {
    return false;
  }
}

export async function handleFoodRequest(req: Request, env: Env): Promise<Response> {
  if (req.method !== 'POST') return json(405, { error: 'Use POST.' });
  // without Firebase there is no way to tell who is calling, so the shared keys stay off
  if (!(env.apiKey || env.groqKey) || !env.projectId) return json(503, { error: 'Add your free Gemini API key in Profile → Food AI to estimate meals. You can still add food manually.' });
  if (!(await signedIn(req, env.projectId))) return json(401, { error: 'Please sign in again to estimate meals.' });

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return json(413, { error: 'That photo is too large. Try again with a smaller one.' });
  let body: FoodInput;
  try { body = JSON.parse(raw); } catch { return json(400, { error: 'Invalid request.' }); }

  const text = typeof body.text === 'string' ? body.text : '';
  // the app always converts photos to JPEG before upload
  const image = body.image?.mediaType === 'image/jpeg' && typeof body.image.data === 'string' ? body.image : undefined;
  if (!text.trim() && !image) return json(400, { error: 'Send a photo or describe what you ate.' });

  try {
    return json(200, await estimate(env, { text, image }));
  } catch (err) {
    if (err instanceof GeminiError) return json(err.status === 401 ? 500 : err.status, { error: err.status === 401 ? 'The server Gemini API key is invalid.' : err.message });
    console.error('food estimate', err);
    return json(500, { error: 'Something went wrong.' });
  }
}
