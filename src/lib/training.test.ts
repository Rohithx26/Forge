import { describe, expect, it } from 'vitest';
import { detectPRs, neglectedMuscles, movingAverage, overload, suggestToday, weekStreak, daysBetween, weekStart } from './training';
import { SPLITS } from '../data/splits';
import type { Workout } from './types';
import { EXERCISES } from '../data/exercises';

const W = (id: string, date: string, dayKey: string, splitId = 'ppl3', ex: Workout['exercises'] = []): Workout => ({
  id, date, startedAt: Date.parse(date), endedAt: Date.parse(date) + 3600000, splitId: splitId as any, dayKey, title: dayKey, notes: '', exercises: ex
});

describe('dates', () => {
  it('daysBetween and weekStart', () => {
    expect(daysBetween('2026-10-01', '2026-10-15')).toBe(14);
    expect(weekStart('2026-10-15')).toBe('2026-10-12'); // Thursday -> Monday
    expect(weekStart('2026-10-12')).toBe('2026-10-12');
    expect(weekStart('2026-10-18')).toBe('2026-10-12'); // Sunday
  });
});

describe('suggestToday', () => {
  const ppl = SPLITS.ppl3;
  it('starts at day one', () => {
    expect(suggestToday(ppl, [], '2026-10-15').dayKey).toBe('push');
  });
  it('advances after push', () => {
    expect(suggestToday(ppl, [W('a', '2026-10-14', 'push')], '2026-10-15').dayKey).toBe('pull');
  });
  it('picks up where you left off after a long gap', () => {
    const s = suggestToday(ppl, [W('a', '2026-10-01', 'push'), W('b', '2026-10-03', 'pull')], '2026-10-15');
    expect(s.dayKey).toBe('legs');
  });
  it('returns today\'s day once trained', () => {
    const s = suggestToday(ppl, [W('a', '2026-10-14', 'push'), W('b', '2026-10-15', 'pull')], '2026-10-15');
    expect(s.trainedToday).toBe(true);
    expect(s.dayKey).toBe('pull');
  });
  it('handles PPL x2 rotation with repeated keys', () => {
    const ppl6 = SPLITS.ppl6;
    const hist = ['push', 'pull', 'legs', 'push'].map((k, i) => W(String(i), `2026-10-0${i + 1}`, k, 'ppl6'));
    const s = suggestToday(ppl6, hist, '2026-10-05');
    expect(s.dayKey).toBe('pull');
    expect(s.index).toBe(4);
  });
  it('honours a planned rest after consecutive training, skips it after a gap', () => {
    const ppl6 = SPLITS.ppl6;
    const hist = ['push', 'pull', 'legs', 'push', 'pull', 'legs'].map((k, i) => W(String(i), `2026-10-0${i + 1}`, k, 'ppl6'));
    expect(suggestToday(ppl6, hist, '2026-10-07').dayKey).toBe('rest');
    expect(suggestToday(ppl6, hist, '2026-10-09').dayKey).toBe('push');
  });
  it('swap offset moves to the next day', () => {
    expect(suggestToday(ppl, [], '2026-10-15', 1).dayKey).toBe('pull');
  });
  it('ignores workouts from other splits', () => {
    expect(suggestToday(ppl, [W('a', '2026-10-14', 'upper', 'ul')], '2026-10-15').dayKey).toBe('push');
  });
});

describe('overload (double progression)', () => {
  const bench = { region: 'upper' as const, equipment: 'barbell' as const, compound: true };
  const squat = { region: 'lower' as const, equipment: 'barbell' as const, compound: true };
  const sets = (w: number, reps: number[]) => ({ exerciseId: 'x', repMin: 6, repMax: 10, sets: reps.map((r) => ({ weightKg: w, reps: r, done: true })) });

  it('new exercise', () => expect(overload(bench, null, 6, 10).kind).toBe('new'));
  it('adds 2.5 kg upper when all sets hit top', () => {
    const s = overload(bench, sets(60, [10, 10, 10]), 6, 10);
    expect(s).toMatchObject({ kind: 'increase-weight', weightKg: 62.5, reps: 6 });
  });
  it('adds 5 kg for lower-body compounds', () => {
    expect(overload(squat, sets(100, [10, 10, 10]), 6, 10).weightKg).toBe(105);
  });
  it('adds reps when in range', () => {
    expect(overload(bench, sets(60, [8, 8, 7]), 6, 10)).toMatchObject({ kind: 'add-reps', weightKg: 60, reps: 8 });
  });
  it('repeats when a set falls below range', () => {
    expect(overload(bench, sets(60, [7, 6, 5]), 6, 10).kind).toBe('repeat');
  });
  it('deloads ~10% after a clear miss', () => {
    const s = overload(bench, sets(100, [3, 3, 6]), 6, 10);
    expect(s.kind).toBe('deload');
    expect(s.weightKg).toBe(90);
  });
  it('ignores warm-up sets', () => {
    const ex = { exerciseId: 'x', repMin: 6, repMax: 10, sets: [{ weightKg: 20, reps: 10, done: true, warmup: true }, { weightKg: 60, reps: 10, done: true }, { weightKg: 60, reps: 10, done: true }] };
    expect(overload(bench, ex, 6, 10).weightKg).toBe(62.5);
  });
});

describe('PRs', () => {
  const ex = (w: number, r: number) => [{ exerciseId: 'bench', repMin: 6, repMax: 10, sets: [{ weightKg: w, reps: r, done: true }] }];
  it('no PR on first ever session', () => {
    const w = W('a', '2026-10-01', 'push', 'ppl3', ex(60, 8));
    expect(detectPRs(w, [w])).toEqual([]);
  });
  it('detects weight and e1RM PRs', () => {
    const a = W('a', '2026-10-01', 'push', 'ppl3', ex(60, 8));
    const b = W('b', '2026-10-04', 'push', 'ppl3', ex(65, 6));
    const kinds = detectPRs(b, [a, b]).map((p) => p.kind).sort();
    expect(kinds).toEqual(['e1rm', 'weight']);
  });
  it('detects rep PR at same weight', () => {
    const a = W('a', '2026-10-01', 'push', 'ppl3', ex(60, 8));
    const b = W('b', '2026-10-04', 'push', 'ppl3', ex(60, 9));
    expect(detectPRs(b, [a, b]).map((p) => p.kind).sort()).toEqual(['e1rm', 'reps']);
  });
});

describe('stats', () => {
  it('week streak', () => {
    const h = [W('a', '2026-10-14', 'push'), W('b', '2026-10-07', 'pull'), W('c', '2026-09-29', 'legs'), W('d', '2026-09-15', 'push')];
    expect(weekStreak(h, '2026-10-15')).toBe(3);
    expect(weekStreak([W('b', '2026-10-07', 'pull')], '2026-10-15')).toBe(1); // this week not yet trained, last week counts
  });
  it('moving average', () => {
    expect(movingAverage([1, 2, 3, 4], 2)).toEqual([1, 1.5, 2.5, 3.5]);
  });
});

describe('neglected muscles', () => {
  const lib = new Map(EXERCISES.map((e) => [e.id, e]));
  const benchOnly = (id: string, date: string) => W(id, date, 'push', 'ppl3', [{ exerciseId: 'bench-press', repMin: 5, repMax: 8, sets: [{ weightKg: 60, reps: 8, done: true }] }]);
  it('stays quiet during the first week', () => {
    expect(neglectedMuscles([benchOnly('a', '2026-10-14')], lib, '2026-10-15')).toEqual([]);
  });
  it('flags muscles not trained in 7+ days once history is long enough', () => {
    const r = neglectedMuscles([benchOnly('a', '2026-10-01'), benchOnly('b', '2026-10-14')], lib, '2026-10-15');
    expect(r).toContain('quads');
    expect(r).not.toContain('chest');
  });
});
