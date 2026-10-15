import { e1rm, round } from './calc';
import type { Exercise, LoggedExercise, Muscle, PR, SplitTemplate, Workout } from './types';

/* ---------- dates ---------- */
export function isoDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}
export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}
/** Monday-based week key, e.g. 2026-10-12 */
export function weekStart(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = (dt.getUTCDay() + 6) % 7; // 0 = Monday
  return addDays(date, -dow);
}

/* ---------- today's suggestion ---------- */
export interface Suggestion {
  /** day key from the template, or 'rest' */
  dayKey: string;
  /** position in rotation */
  index: number;
  reason: string;
  trainedToday: boolean;
}

/**
 * Rotation-based suggestion. Walks through every finished workout of this split in order to
 * find where you are in the rotation, then suggests the next slot. Missing days never skip a
 * workout — you pick up where you left off. A planned rest slot is skipped if you have
 * already had 2+ days off since the last session (the gap already counted as rest).
 * If you already trained today, today's session is returned with trainedToday = true.
 */
export function suggestToday(split: SplitTemplate, history: Workout[], today: string, offset = 0): Suggestion {
  const rot = split.rotation;
  const done = history
    .filter((w) => w.splitId === split.id && w.dayKey && w.endedAt)
    .sort((a, b) => (a.date === b.date ? a.startedAt - b.startedAt : a.date < b.date ? -1 : 1));

  let pos = -1;
  for (const w of done) pos = nextIndexOf(rot, w.dayKey!, pos);

  const doneToday = done.filter((w) => w.date === today);
  if (doneToday.length && offset === 0) {
    return { dayKey: rot[pos], index: pos, reason: 'Done for today — nice work.', trainedToday: true };
  }

  const last = done[done.length - 1];
  let idx = (pos + 1) % rot.length;
  const gap = last ? daysBetween(last.date, today) : 0;
  if (!last || gap >= 2) {
    let guard = 0;
    while (rot[idx] === 'rest' && guard++ < rot.length) idx = (idx + 1) % rot.length;
  }
  let reason: string;
  if (!last) reason = `Start of your ${split.short} split — first session.`;
  else if (rot[idx] === 'rest') reason = 'Planned rest day — recovery is when you grow. Train anyway if you feel fresh.';
  else if (gap >= 4) reason = `${gap} days since your last session — picking up where you left off.`;
  else reason = `Next in your ${split.short} rotation after ${dayName(split, last.dayKey!)}.`;

  if (offset) {
    idx = (((idx + offset) % rot.length) + rot.length) % rot.length;
    reason = 'Swapped by you.';
  }
  return { dayKey: rot[idx], index: idx, reason, trainedToday: doneToday.length > 0 };
}

/** Next index in the rotation (cyclically after `from`) whose key matches. */
function nextIndexOf(rot: string[], key: string, from: number): number {
  for (let step = 1; step <= rot.length; step++) {
    const i = (from + step) % rot.length;
    if (rot[i] === key) return i;
  }
  return from; // key not in this split (template changed) — stay put
}

function dayName(split: SplitTemplate, key: string) {
  return split.days.find((d) => d.key === key)?.name ?? 'your last session';
}

/* ---------- progressive overload ---------- */
export interface OverloadSuggestion {
  weightKg: number;
  reps: number;
  reason: string;
  kind: 'increase-weight' | 'add-reps' | 'repeat' | 'deload' | 'new';
}

export function lastPerformance(exerciseId: string, history: Workout[], beforeId?: string): LoggedExercise | null {
  const sorted = [...history]
    .filter((w) => w.endedAt && w.id !== beforeId)
    .sort((a, b) => (a.date === b.date ? b.startedAt - a.startedAt : a.date < b.date ? 1 : -1));
  for (const w of sorted) {
    const ex = w.exercises.find((e) => e.exerciseId === exerciseId && e.sets.some((s) => s.done && !s.warmup));
    if (ex) return ex;
  }
  return null;
}

/** smallest practical plate jump */
export function increment(ex: Pick<Exercise, 'region' | 'equipment' | 'compound'>): number {
  if (ex.equipment === 'dumbbell' || ex.equipment === 'kettlebell') return 2;
  if (ex.region === 'lower' && ex.compound) return 5;
  return 2.5;
}

/**
 * Double progression: work inside a rep range. When every working set reaches the top
 * of the range, add weight and drop back to the bottom. If two sets fall below the
 * bottom of the range, repeat the weight; after a clear miss (most sets far below), deload 10%.
 */
export function overload(
  ex: Pick<Exercise, 'region' | 'equipment' | 'compound'>,
  last: LoggedExercise | null,
  repMin: number,
  repMax: number
): OverloadSuggestion {
  const work = last?.sets.filter((s) => s.done && !s.warmup) ?? [];
  if (!last || work.length === 0) {
    return { weightKg: 0, reps: repMin, kind: 'new', reason: `First time — pick a weight you can lift for ${repMin}–${repMax} clean reps.` };
  }
  const top = Math.max(...work.map((s) => s.weightKg));
  const atTop = work.filter((s) => s.weightKg === top);
  const minReps = Math.min(...atTop.map((s) => s.reps));
  const bodyweight = top === 0;

  if (atTop.every((s) => s.reps >= repMax)) {
    if (bodyweight) {
      return { weightKg: 0, reps: repMax + 1, kind: 'add-reps', reason: `Hit ${repMax} on every set — push for ${repMax + 1}, or add load.` };
    }
    const inc = increment(ex);
    return {
      weightKg: round(top + inc, 2),
      reps: repMin,
      kind: 'increase-weight',
      reason: `All sets hit ${repMax} reps last time — add ${inc} kg and work back up from ${repMin}.`
    };
  }
  const failing = atTop.filter((s) => s.reps < repMin).length;
  if (failing >= Math.ceil(atTop.length / 2) && minReps <= repMin - 3 && !bodyweight) {
    const w = round(Math.floor((top * 0.9) / 2.5) * 2.5, 2);
    return { weightKg: w, reps: repMin, kind: 'deload', reason: `Missed the rep range on most sets — drop ~10% to ${w} kg and rebuild.` };
  }
  if (failing > 0) {
    return { weightKg: top, reps: repMin, kind: 'repeat', reason: `Some sets fell under ${repMin} reps — keep ${top} kg and aim for ${repMin}+ on every set.` };
  }
  const target = Math.min(repMax, minReps + 1);
  return {
    weightKg: top,
    reps: target,
    kind: 'add-reps',
    reason: `Same weight, aim for ${target} reps on every set (top of range is ${repMax}).`
  };
}

/* ---------- PRs ---------- */
export function bestsFor(exerciseId: string, history: Workout[], excludeId?: string) {
  let weight = 0, best1rm = 0;
  const repsAt = new Map<number, number>();
  for (const w of history) {
    if (!w.endedAt || w.id === excludeId) continue;
    for (const ex of w.exercises) {
      if (ex.exerciseId !== exerciseId) continue;
      for (const s of ex.sets) {
        if (!s.done || s.warmup || s.reps <= 0) continue;
        weight = Math.max(weight, s.weightKg);
        best1rm = Math.max(best1rm, e1rm(s.weightKg, s.reps));
        repsAt.set(s.weightKg, Math.max(repsAt.get(s.weightKg) ?? 0, s.reps));
      }
    }
  }
  return { weight, e1rm: best1rm, repsAt };
}

/** PRs set in `workout` compared to all *other* finished workouts. */
export function detectPRs(workout: Workout, history: Workout[]): PR[] {
  const prs: PR[] = [];
  for (const ex of workout.exercises) {
    const prev = bestsFor(ex.exerciseId, history, workout.id);
    const hadHistory = prev.weight > 0 || prev.repsAt.size > 0;
    if (!hadHistory) continue; // first time is a baseline, not a PR
    const work = ex.sets.filter((s) => s.done && !s.warmup && s.reps > 0);
    if (!work.length) continue;
    const heaviest = work.reduce((a, b) => (b.weightKg > a.weightKg || (b.weightKg === a.weightKg && b.reps > a.reps) ? b : a));
    if (heaviest.weightKg > prev.weight) {
      prs.push({ exerciseId: ex.exerciseId, kind: 'weight', value: heaviest.weightKg, weightKg: heaviest.weightKg, reps: heaviest.reps, date: workout.date });
    }
    const best = work.reduce((a, b) => (e1rm(b.weightKg, b.reps) > e1rm(a.weightKg, a.reps) ? b : a));
    const bestE = e1rm(best.weightKg, best.reps);
    if (bestE > prev.e1rm + 0.01 && best.weightKg > 0) {
      prs.push({ exerciseId: ex.exerciseId, kind: 'e1rm', value: round(bestE, 1), weightKg: best.weightKg, reps: best.reps, date: workout.date });
    }
    for (const s of work) {
      const prevReps = prev.repsAt.get(s.weightKg);
      if (prevReps != null && s.reps > prevReps && !prs.some((p) => p.exerciseId === ex.exerciseId && p.kind === 'reps')) {
        prs.push({ exerciseId: ex.exerciseId, kind: 'reps', value: s.reps, weightKg: s.weightKg, reps: s.reps, date: workout.date });
      }
    }
  }
  return prs;
}

/* ---------- stats ---------- */
export function workoutVolume(w: Workout): number {
  return w.exercises.reduce(
    (t, ex) => t + ex.sets.filter((s) => s.done && !s.warmup).reduce((a, s) => a + s.weightKg * s.reps, 0),
    0
  );
}
export function workingSets(w: Workout): number {
  return w.exercises.reduce((t, ex) => t + ex.sets.filter((s) => s.done && !s.warmup).length, 0);
}

/** Hard sets per muscle (primary = 1, secondary = 0.5) */
export function setsPerMuscle(workouts: Workout[], lib: Map<string, Exercise>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const w of workouts) {
    for (const ex of w.exercises) {
      const def = lib.get(ex.exerciseId);
      if (!def) continue;
      const n = ex.sets.filter((s) => s.done && !s.warmup).length;
      def.primary.forEach((m) => (out[m] = (out[m] ?? 0) + n));
      def.secondary.forEach((m) => (out[m] = (out[m] ?? 0) + n * 0.5));
    }
  }
  return out;
}

export const TRACKED_MUSCLES: Muscle[] = ['chest', 'back', 'lats', 'shoulders', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes', 'calves', 'abs'];

export function neglectedMuscles(history: Workout[], lib: Map<string, Exercise>, today: string, days = 7): Muscle[] {
  const last: Partial<Record<Muscle, string>> = {};
  for (const w of history) {
    if (!w.endedAt) continue;
    for (const ex of w.exercises) {
      const def = lib.get(ex.exerciseId);
      if (!def || !ex.sets.some((s) => s.done && !s.warmup)) continue;
      for (const m of def.primary) if (!last[m] || last[m]! < w.date) last[m] = w.date;
    }
  }
  const finished = history.filter((w) => w.endedAt);
  if (!finished.length) return [];
  // only meaningful once you've been training for at least `days`
  const first = finished.reduce((a, w) => (w.date < a ? w.date : a), finished[0].date);
  if (daysBetween(first, today) < days) return [];
  return TRACKED_MUSCLES.filter((m) => !last[m] || daysBetween(last[m]!, today) >= days);
}

/** Consecutive weeks (Mon–Sun) with ≥1 workout, counting back from the current week (current week counts only if trained). */
export function weekStreak(history: Workout[], today: string): number {
  const weeks = new Set(history.filter((w) => w.endedAt).map((w) => weekStart(w.date)));
  let cur = weekStart(today);
  if (!weeks.has(cur)) cur = addDays(cur, -7);
  let n = 0;
  while (weeks.has(cur)) { n++; cur = addDays(cur, -7); }
  return n;
}

/** trailing moving average (window in entries) */
export function movingAverage(values: number[], window = 7): number[] {
  return values.map((_, i) => {
    const slice = values.slice(Math.max(0, i - window + 1), i + 1);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}
