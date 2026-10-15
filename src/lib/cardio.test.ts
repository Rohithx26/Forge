import { describe, expect, it } from 'vitest';
import { cardioPlan, hrMax, isLowerDay } from './cardio';
import type { Exercise, Profile } from './types';

const ex = (id: string, region: Exercise['region']): Exercise => ({ id, name: id, primary: [], secondary: [], equipment: 'barbell', region, compound: true, cues: [] });
const lib = new Map([ex('squat', 'lower'), ex('rdl', 'lower'), ex('bench', 'upper'), ex('row', 'upper'), ex('curl', 'upper')].map((e) => [e.id, e]));

const profile: Profile = {
  name: 'T', sex: 'male', birthDate: '1996-01-01', heightCm: 178, weightKg: 80, activity: 'moderate', experience: 'intermediate',
  goal: 'lose', ratePerWeekKg: 0.5, units: 'metric', split: 'ppl3', restSeconds: 120, theme: 'dark', createdAt: 0
};
const today = new Date(2026, 9, 15);

describe('cardio', () => {
  it('detects leg days by lower-body share', () => {
    expect(isLowerDay(['squat', 'rdl', 'curl'], lib)).toBe(true);
    expect(isLowerDay(['squat', 'bench', 'row'], lib)).toBe(false);
    expect(isLowerDay([], lib)).toBe(false);
  });

  it('uses the Tanaka max heart rate', () => {
    expect(hrMax(30)).toBe(187);
  });

  it('gives a full zone-2 session on upper days', () => {
    const p = cardioPlan({ lower: false, date: '2026-10-15', profile, machine: 'treadmill', today });
    expect(p.light).toBe(false);
    expect(p.minutes).toBe(20);
    expect(p.hr).toEqual({ min: Math.round(hrMax(30) * 0.6), max: Math.round(hrMax(30) * 0.7) });
    expect(p.settings.join(' ')).toMatch(/8–12%/);
  });

  it('keeps leg days light and never on the StairMaster', () => {
    for (let i = 0; i < 6; i++) {
      const p = cardioPlan({ lower: true, date: `2026-10-1${i}`, profile, machine: 'stairmaster', today });
      expect(p.light).toBe(true);
      expect(p.minutes).toBe(10);
      expect(p.machine).not.toBe('stairmaster');
    }
  });

  it('shortens cardio when bulking and shows mph in imperial', () => {
    const p = cardioPlan({ lower: false, date: '2026-10-15', profile: { ...profile, goal: 'gain', units: 'imperial' }, machine: 'treadmill', today });
    expect(p.minutes).toBe(10);
    expect(p.settings[0]).toMatch(/mph/);
  });
});
