import { describe, expect, it } from 'vitest';
import {
  ageFromBirthDate, bmi, bmiCategory, cmToFtIn, e1rm, energy, ftInToCm, healthyWeightRange,
  katchMcArdle, kgToLb, lbToKg, macros, mifflinStJeor, validateProfileInput
} from './calc';

describe('units', () => {
  it('converts kg <-> lb exactly', () => {
    expect(lbToKg(1)).toBeCloseTo(0.45359237, 8);
    expect(kgToLb(100)).toBeCloseTo(220.462, 3);
    expect(lbToKg(kgToLb(72.5))).toBeCloseTo(72.5, 10);
  });
  it('converts cm <-> ft/in', () => {
    expect(ftInToCm(5, 10)).toBeCloseTo(177.8, 5);
    expect(cmToFtIn(177.8)).toEqual({ ft: 5, inch: 10 });
    expect(cmToFtIn(182.88)).toEqual({ ft: 6, inch: 0 });
    expect(cmToFtIn(182.5)).toEqual({ ft: 6, inch: 0 }); // 71.85in rounds up to 6'0"
  });
});

describe('age', () => {
  it('handles birthdays correctly', () => {
    const today = new Date(2026, 9, 15); // 15 Oct 2026
    expect(ageFromBirthDate('2000-10-15', today)).toBe(26);
    expect(ageFromBirthDate('2000-10-16', today)).toBe(25);
    expect(ageFromBirthDate('2000-01-01', today)).toBe(26);
  });
});

describe('BMI', () => {
  it('computes kg/m²', () => {
    expect(bmi(80, 180)).toBeCloseTo(24.691, 3);
    expect(bmi(70, 175)).toBeCloseTo(22.857, 3);
  });
  it('uses WHO cut-offs at the rounded value', () => {
    expect(bmiCategory(18.44)).toBe('Underweight'); // displays as 18.4
    expect(bmiCategory(18.46)).toBe('Normal'); // displays as 18.5
    expect(bmiCategory(18.5)).toBe('Normal');
    expect(bmiCategory(24.94)).toBe('Normal'); // displays as 24.9
    expect(bmiCategory(24.96)).toBe('Overweight'); // displays as 25.0
    expect(bmiCategory(29.9)).toBe('Overweight');
    expect(bmiCategory(30)).toBe('Obese');
  });
  it('healthy range matches BMI 18.5–24.9', () => {
    const r = healthyWeightRange(180);
    expect(bmi(r.min, 180)).toBeCloseTo(18.5, 6);
    expect(bmi(r.max, 180)).toBeCloseTo(24.9, 6);
  });
});

describe('BMR', () => {
  it('Mifflin-St Jeor male', () => {
    // 10*80 + 6.25*180 - 5*30 + 5
    expect(mifflinStJeor('male', 80, 180, 30)).toBe(1780);
  });
  it('Mifflin-St Jeor female', () => {
    // 10*60 + 6.25*165 - 5*25 - 161
    expect(mifflinStJeor('female', 60, 165, 25)).toBeCloseTo(1345.25, 6);
  });
  it('Katch-McArdle', () => {
    // LBM = 80 * 0.85 = 68 ; 370 + 21.6*68
    expect(katchMcArdle(80, 15)).toBeCloseTo(1838.8, 6);
  });
});

describe('energy', () => {
  const base = { sex: 'male' as const, age: 30, weightKg: 80, heightCm: 180, activity: 'moderate' as const, bodyFatPct: null };

  it('maintenance = BMR × activity', () => {
    const r = energy({ ...base, goal: 'maintain', ratePerWeekKg: 0 });
    expect(r.formula).toBe('Mifflin-St Jeor');
    expect(r.tdee).toBeCloseTo(1780 * 1.55, 6);
    expect(r.target).toBeCloseTo(2759, 6);
    expect(r.floored).toBe(false);
  });

  it('0.5 kg/week loss = 550 kcal/day deficit', () => {
    const r = energy({ ...base, goal: 'lose', ratePerWeekKg: 0.5 });
    expect(r.requestedAdjustment).toBeCloseTo(-550, 6);
    expect(r.target).toBeCloseTo(2759 - 550, 6);
    expect(r.expectedWeeklyChangeKg).toBeCloseTo(-0.5, 6);
  });

  it('0.25 kg/week gain = 275 kcal/day surplus', () => {
    const r = energy({ ...base, goal: 'gain', ratePerWeekKg: 0.25 });
    expect(r.target).toBeCloseTo(2759 + 275, 6);
  });

  it('uses Katch-McArdle when body fat is given', () => {
    const r = energy({ ...base, bodyFatPct: 15, goal: 'maintain', ratePerWeekKg: 0 });
    expect(r.formula).toBe('Katch-McArdle');
    expect(r.bmr).toBeCloseTo(1838.8, 6);
  });

  it('caps aggressive deficits at the safety floor (max of sex floor and BMR)', () => {
    // small sedentary woman, 1 kg/week
    const r = energy({ sex: 'female', age: 40, weightKg: 55, heightCm: 158, activity: 'sedentary', goal: 'lose', ratePerWeekKg: 1 });
    const bmr = 10 * 55 + 6.25 * 158 - 5 * 40 - 161; // 1176.5
    expect(r.bmr).toBeCloseTo(bmr, 6);
    expect(r.floor).toBe(1200);
    expect(r.target).toBe(1200);
    expect(r.floored).toBe(true);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it('floor uses BMR when BMR is above the sex minimum', () => {
    const r = energy({ ...base, weightKg: 110, activity: 'sedentary', goal: 'lose', ratePerWeekKg: 1 });
    const bmr = 10 * 110 + 6.25 * 180 - 150 + 5; // 2080
    expect(r.target).toBeCloseTo(bmr, 6);
    expect(r.target).toBeGreaterThanOrEqual(1500);
  });

  it('never recommends eating above maintenance to lose weight', () => {
    const r = energy({ sex: 'female', age: 70, weightKg: 42, heightCm: 148, activity: 'sedentary', goal: 'lose', ratePerWeekKg: 0.5 });
    expect(r.target).toBeLessThanOrEqual(r.tdee + 1e-9);
  });

  it('warns when underweight wants to lose', () => {
    const r = energy({ ...base, weightKg: 55, goal: 'lose', ratePerWeekKg: 0.25 });
    expect(r.warnings.some((w) => w.includes('underweight'))).toBe(true);
  });
});

describe('macros', () => {
  it('sum of macro kcal ≈ target (within rounding)', () => {
    for (const [kcal, w, h, g] of [[2209, 80, 180, 'lose'], [3034, 80, 180, 'gain'], [1800, 60, 165, 'maintain']] as const) {
      const m = macros(kcal, w, h, g);
      expect(Math.abs(m.proteinKcal + m.fatKcal + m.carbsKcal - kcal)).toBeLessThanOrEqual(12);
      expect(m.carbsG).toBeGreaterThanOrEqual(0);
    }
  });
  it('protein 2.2 g/kg when cutting, 1.8 g/kg otherwise', () => {
    expect(macros(2200, 80, 180, 'lose').proteinG).toBe(176);
    expect(macros(2800, 80, 180, 'maintain').proteinG).toBe(144);
  });
  it('fat at least 0.6 g/kg', () => {
    expect(macros(1500, 100, 180, 'lose').fatG).toBeGreaterThanOrEqual(60);
  });
  it('caps protein for BMI ≥ 30 using BMI-25 reference weight', () => {
    const m = macros(2400, 130, 175, 'lose');
    expect(m.proteinG).toBe(Math.round(25 * 1.75 * 1.75 * 2.2));
  });
});

describe('e1RM (Epley)', () => {
  it('computes estimated max', () => {
    expect(e1rm(100, 5)).toBeCloseTo(116.667, 3);
    expect(e1rm(100, 1)).toBe(100);
    expect(e1rm(0, 10)).toBe(0);
  });
});

describe('validation', () => {
  it('flags out-of-range values', () => {
    expect(validateProfileInput({ heightCm: 90, weightKg: 70, age: 25 })).toHaveProperty('heightCm');
    expect(validateProfileInput({ heightCm: 175, weightKg: 400, age: 25 })).toHaveProperty('weightKg');
    expect(validateProfileInput({ heightCm: 175, weightKg: 70, age: 10 })).toHaveProperty('age');
    expect(validateProfileInput({ heightCm: 175, weightKg: 70, age: 25, bodyFatPct: 80 })).toHaveProperty('bodyFatPct');
    expect(validateProfileInput({ heightCm: 175, weightKg: 70, age: 25, bodyFatPct: null })).toEqual({});
  });
});
