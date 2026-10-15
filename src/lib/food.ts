import { addDays, isoDate, weekStart } from './training';
import { geminiEstimate, type FoodInput } from './gemini';
import type { FoodEntry, FoodEstimate, FoodItem, MealType } from './types';

export interface Totals { kcal: number; proteinG: number; carbsG: number; fatG: number }
const ZERO: Totals = { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 };

export const MEALS: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' }
];

/** sensible default meal for the time of day */
export function mealForHour(h: number): MealType {
  if (h >= 4 && h < 11) return 'breakfast';
  if (h >= 11 && h < 16) return 'lunch';
  if (h >= 18 && h < 23) return 'dinner';
  return 'snack';
}

export function sumItems(items: FoodItem[]): Totals {
  return items.reduce((t, i) => ({ kcal: t.kcal + i.kcal, proteinG: t.proteinG + i.proteinG, carbsG: t.carbsG + i.carbsG, fatG: t.fatG + i.fatG }), ZERO);
}

export function dayTotals(entries: FoodEntry[], date: string): Totals {
  return sumItems(entries.filter((e) => e.date === date).flatMap((e) => e.items));
}

export interface WeekSummary {
  days: { date: string; kcal: number }[]; // Monday → Sunday
  total: number;
  /** days up to and including today that have at least one entry */
  loggedDays: number;
  avgPerLoggedDay: number;
  /** target × logged days — unlogged days would otherwise count as a 0 kcal "deficit" */
  targetLogged: number;
}

export function weekSummary(entries: FoodEntry[], anyDateInWeek: string, dailyTarget: number, today = isoDate()): WeekSummary {
  const start = weekStart(anyDateInWeek);
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i);
    return { date, kcal: dayTotals(entries, date).kcal };
  });
  const elapsed = days.filter((d) => d.date <= today);
  const logged = elapsed.filter((d) => entries.some((e) => e.date === d.date));
  const total = days.reduce((a, d) => a + d.kcal, 0);
  return {
    days,
    total,
    loggedDays: logged.length,
    avgPerLoggedDay: logged.length ? total / logged.length : 0,
    targetLogged: dailyTarget * logged.length
  };
}

/** Shrinks a camera photo to ≤1280px JPEG so uploads are fast and fit serverless payload limits. */
export async function photoToJpeg(file: File, maxSide = 1280): Promise<{ data: string; mediaType: 'image/jpeg'; preview: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const preview = canvas.toDataURL('image/jpeg', 0.82);
  return { data: preview.slice(preview.indexOf(',') + 1), mediaType: 'image/jpeg', preview };
}

/* the user's own Gemini key lives on this device only, never in Firestore */
const KEY = 'forge-gemini-key';
export function getGeminiKey(): string {
  try { return localStorage.getItem(KEY) ?? ''; } catch { return ''; }
}
export function setGeminiKey(k: string) {
  try { if (k) localStorage.setItem(KEY, k); else localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
}

/** Uses the user's own key directly when set, otherwise the server's shared key via /api/food. */
export async function estimateFood(input: FoodInput, apiKey = getGeminiKey()): Promise<FoodEstimate> {
  if (!navigator.onLine) throw new Error("You're offline. Food estimates need a connection — add it manually instead.");
  if (apiKey) return geminiEstimate(apiKey, input);
  // lazy: keeps this module (and its unit tests) free of Firebase start-up
  const { backend } = await import('./backend');
  const token = await backend.idToken();
  let res: Response;
  try {
    res = await fetch('/api/food', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(input)
    });
  } catch {
    throw new Error("You're offline. Food estimates need a connection — add it manually instead.");
  }
  const body = await res.json().catch(() => null);
  if (!res.ok || !body) throw new Error(body?.error ?? `Estimate failed (${res.status}).`);
  return body as FoodEstimate;
}
