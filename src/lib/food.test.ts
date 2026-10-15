import { describe, expect, it } from 'vitest';
import { dayTotals, mealForHour, weekSummary } from './food';
import type { FoodEntry } from './types';

const entry = (date: string, kcal: number): FoodEntry => ({
  id: date + kcal, date, createdAt: 0, meal: 'lunch', source: 'manual',
  items: [{ name: 'x', portion: '', kcal, proteinG: 10, carbsG: 20, fatG: 5 }]
});

describe('food totals', () => {
  it('sums all entries on a day', () => {
    const t = dayTotals([entry('2026-10-14', 500), entry('2026-10-14', 300), entry('2026-10-13', 900)], '2026-10-14');
    expect(t).toEqual({ kcal: 800, proteinG: 20, carbsG: 40, fatG: 10 });
  });

  it('picks a meal from the hour', () => {
    expect(mealForHour(8)).toBe('breakfast');
    expect(mealForHour(13)).toBe('lunch');
    expect(mealForHour(20)).toBe('dinner');
    expect(mealForHour(16)).toBe('snack');
  });
});

describe('weekSummary', () => {
  // 2026-10-12 is a Monday
  const food = [entry('2026-10-12', 2000), entry('2026-10-13', 2400), entry('2026-10-19', 1800)];

  it('covers Monday to Sunday and compares only logged days against target', () => {
    // Wednesday, with Wednesday itself not logged: target is 2 days, not 3
    const w = weekSummary(food, '2026-10-14', 2200, '2026-10-14');
    expect(w.days.map((d) => d.date)).toEqual(['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18']);
    expect(w.total).toBe(4400);
    expect(w.loggedDays).toBe(2);
    expect(w.avgPerLoggedDay).toBe(2200);
    expect(w.targetLogged).toBe(2200 * 2);
  });

  it('does not count future entries as logged', () => {
    expect(weekSummary([entry('2026-10-16', 500)], '2026-10-14', 2000, '2026-10-14').loggedDays).toBe(0);
  });
});
