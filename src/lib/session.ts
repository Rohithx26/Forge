import type { Exercise, LoggedExercise, SplitTemplate, Workout, PR } from './types';
import { isoDate, lastPerformance, overload, detectPRs } from './training';
import { uid } from './store';

/** Build a fresh workout from a template day, pre-filling each set from the overload suggestion. */
export function workoutFromDay(split: SplitTemplate, dayKey: string, history: Workout[], lib: Map<string, Exercise>): Workout {
  const day = split.days.find((d) => d.key === dayKey);
  const exercises: LoggedExercise[] = (day?.exercises ?? [])
    .filter((t) => lib.has(t.exerciseId))
    .map((t) => {
      const sug = overload(lib.get(t.exerciseId)!, lastPerformance(t.exerciseId, history), t.repMin, t.repMax);
      return {
        exerciseId: t.exerciseId, repMin: t.repMin, repMax: t.repMax,
        sets: Array.from({ length: t.sets }, () => ({ weightKg: sug.weightKg, reps: sug.reps, done: false }))
      };
    });
  return {
    id: uid(), date: isoDate(), startedAt: Date.now(), endedAt: null,
    splitId: split.id, dayKey, title: day?.name ?? 'Workout', notes: '', exercises
  };
}

export function blankWorkout(): Workout {
  return { id: uid(), date: isoDate(), startedAt: Date.now(), endedAt: null, splitId: null, dayKey: null, title: 'Freestyle', notes: '', exercises: [] };
}

export function exerciseEntry(ex: Exercise, history: Workout[], repMin = 8, repMax = 12, sets = 3): LoggedExercise {
  const sug = overload(ex, lastPerformance(ex.id, history), repMin, repMax);
  return { exerciseId: ex.id, repMin, repMax, sets: Array.from({ length: sets }, () => ({ weightKg: sug.weightKg, reps: sug.reps, done: false })) };
}

/** PRs for each workout compared only with workouts *before* it. Newest first. */
export function prTimeline(workoutsNewestFirst: Workout[], limit = 20): PR[] {
  const asc = [...workoutsNewestFirst].reverse();
  const out: PR[] = [];
  for (let i = asc.length - 1; i >= 0 && out.length < limit; i--) {
    const prs = detectPRs(asc[i], asc.slice(0, i + 1));
    out.push(...prs.filter((p) => p.kind !== 'reps' || !prs.some((q) => q.exerciseId === p.exerciseId && q.kind !== 'reps')));
  }
  return out.slice(0, limit);
}
