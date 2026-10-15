import type { ActivityLevel, Goal, Profile, Sex } from './types';

/* ---------- units ---------- */
export const KG_PER_LB = 0.45359237;
export const CM_PER_IN = 2.54;

export const kgToLb = (kg: number) => kg / KG_PER_LB;
export const lbToKg = (lb: number) => lb * KG_PER_LB;
export const cmToFtIn = (cm: number) => {
  const totalIn = cm / CM_PER_IN;
  let ft = Math.floor(totalIn / 12);
  let inch = Math.round(totalIn - ft * 12);
  if (inch === 12) { ft += 1; inch = 0; }
  return { ft, inch };
};
export const ftInToCm = (ft: number, inch: number) => (ft * 12 + inch) * CM_PER_IN;

export const round = (n: number, dp = 0) => {
  const f = 10 ** dp;
  return Math.round((n + Number.EPSILON) * f) / f;
};

/* ---------- age ---------- */
export function ageFromBirthDate(birthDate: string, today: Date = new Date()): number {
  const [y, m, d] = birthDate.split('-').map(Number);
  let age = today.getFullYear() - y;
  const beforeBirthday = today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d);
  if (beforeBirthday) age -= 1;
  return age;
}

/* ---------- BMI (WHO adult categories) ---------- */
export type BmiCategory = 'Underweight' | 'Normal' | 'Overweight' | 'Obese';

export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export function bmiCategory(value: number): BmiCategory {
  const v = round(value, 1);
  if (v < 18.5) return 'Underweight';
  if (v < 25) return 'Normal';
  if (v < 30) return 'Overweight';
  return 'Obese';
}

/** Weight range (kg) that gives a BMI of 18.5–24.9 for this height. */
export function healthyWeightRange(heightCm: number) {
  const m = heightCm / 100;
  return { min: 18.5 * m * m, max: 24.9 * m * m };
}

/* ---------- BMR ---------- */
export function mifflinStJeor(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

export function katchMcArdle(weightKg: number, bodyFatPct: number): number {
  const lbm = weightKg * (1 - bodyFatPct / 100);
  return 370 + 21.6 * lbm;
}

export const ACTIVITY: Record<ActivityLevel, { factor: number; label: string; hint: string }> = {
  sedentary: { factor: 1.2, label: 'Sedentary', hint: 'Desk job, little or no exercise' },
  light: { factor: 1.375, label: 'Lightly active', hint: 'Exercise 1–3 days/week' },
  moderate: { factor: 1.55, label: 'Moderately active', hint: 'Exercise 3–5 days/week' },
  very: { factor: 1.725, label: 'Very active', hint: 'Hard exercise 6–7 days/week' },
  extra: { factor: 1.9, label: 'Extra active', hint: 'Physical job + daily training' }
};

/** Energy content of 1 kg of body-weight change (widely used approximation). */
export const KCAL_PER_KG = 7700;

export const CALORIE_FLOOR: Record<Sex, number> = { male: 1500, female: 1200 };

export const RATE_OPTIONS: Record<Exclude<Goal, 'maintain'>, number[]> = {
  lose: [0.25, 0.5, 0.75, 1],
  gain: [0.25, 0.5]
};

export interface EnergyInput {
  sex: Sex;
  age: number;
  weightKg: number;
  heightCm: number;
  bodyFatPct?: number | null;
  activity: ActivityLevel;
  goal: Goal;
  ratePerWeekKg: number;
}

export interface MacroTargets {
  proteinG: number;
  fatG: number;
  carbsG: number;
  proteinKcal: number;
  fatKcal: number;
  carbsKcal: number;
}

export interface EnergyResult {
  bmr: number;
  formula: 'Mifflin-St Jeor' | 'Katch-McArdle';
  tdee: number;
  /** signed daily adjustment requested (negative = deficit) */
  requestedAdjustment: number;
  target: number;
  /** true when the safety floor overrode the requested deficit */
  floored: boolean;
  floor: number;
  /** actual expected weekly change in kg after flooring (signed) */
  expectedWeeklyChangeKg: number;
  macros: MacroTargets;
  warnings: string[];
}

export function bmr(input: Pick<EnergyInput, 'sex' | 'age' | 'weightKg' | 'heightCm' | 'bodyFatPct'>) {
  const useKatch = input.bodyFatPct != null && input.bodyFatPct > 0;
  return useKatch
    ? { value: katchMcArdle(input.weightKg, input.bodyFatPct as number), formula: 'Katch-McArdle' as const }
    : { value: mifflinStJeor(input.sex, input.weightKg, input.heightCm, input.age), formula: 'Mifflin-St Jeor' as const };
}

export function dailyAdjustment(goal: Goal, ratePerWeekKg: number): number {
  if (goal === 'maintain') return 0;
  const kcal = (Math.abs(ratePerWeekKg) * KCAL_PER_KG) / 7;
  return goal === 'lose' ? -kcal : kcal;
}

/**
 * Protein: 2.2 g/kg when cutting, 1.8 g/kg otherwise (within the 1.6–2.2 g/kg evidence range).
 * For BMI >= 30 protein is based on the weight at BMI 25 to avoid inflated targets.
 * Fat: 25% of calories, never below 0.6 g/kg. Carbs: remaining calories (never negative).
 */
export function macros(targetKcal: number, weightKg: number, heightCm: number, goal: Goal): MacroTargets {
  const m = heightCm / 100;
  const refWeight = bmi(weightKg, heightCm) >= 30 ? 25 * m * m : weightKg;
  const perKg = goal === 'lose' ? 2.2 : 1.8;
  let proteinG = refWeight * perKg;
  let fatG = Math.max((targetKcal * 0.25) / 9, weightKg * 0.6);
  let carbsKcal = targetKcal - proteinG * 4 - fatG * 9;
  if (carbsKcal < 0) {
    // squeeze fat back to its minimum first, then protein to its 1.6 g/kg floor
    fatG = Math.max(weightKg * 0.6, (targetKcal - proteinG * 4) / 9);
    carbsKcal = targetKcal - proteinG * 4 - fatG * 9;
    if (carbsKcal < 0) {
      proteinG = Math.max(refWeight * 1.6, (targetKcal - fatG * 9) / 4);
      carbsKcal = Math.max(0, targetKcal - proteinG * 4 - fatG * 9);
    }
  }
  const p = Math.round(proteinG);
  const f = Math.round(fatG);
  const c = Math.round(carbsKcal / 4);
  return { proteinG: p, fatG: f, carbsG: c, proteinKcal: p * 4, fatKcal: f * 9, carbsKcal: c * 4 };
}

export function energy(input: EnergyInput): EnergyResult {
  const warnings: string[] = [];
  const { value: bmrValue, formula } = bmr(input);
  const tdee = bmrValue * ACTIVITY[input.activity].factor;
  const requestedAdjustment = dailyAdjustment(input.goal, input.ratePerWeekKg);
  let target = tdee + requestedAdjustment;
  let floored = false;
  const floor = Math.max(CALORIE_FLOOR[input.sex], input.goal === 'lose' ? bmrValue : 0);

  if (input.goal === 'lose' && target < floor) {
    floored = true;
    if (floor >= tdee) {
      // never tell someone trying to lose weight to eat above maintenance
      target = tdee;
      warnings.push('Your maintenance calories are already at or below the safe minimum, so no deficit is recommended. Focus on activity and training instead, and consider talking to a dietitian.');
    } else {
      target = floor;
      warnings.push(
        `Your chosen pace would put you below a safe minimum, so your target is capped at ${Math.round(floor)} kcal. Expect slower, more sustainable loss.`
      );
    }
  }

  const b = bmi(input.weightKg, input.heightCm);
  if (input.goal === 'lose' && round(b, 1) < 18.5) {
    warnings.push('Your BMI is in the underweight range. Losing weight is not recommended — please talk to a doctor or dietitian.');
  }
  if (input.goal === 'lose' && input.ratePerWeekKg / input.weightKg > 0.01) {
    warnings.push('Losing more than ~1% of body weight per week can cost muscle. Consider a slower pace.');
  }
  if (input.age < 18) {
    warnings.push('Calorie formulas are designed for adults. Teens should get guidance from a doctor or coach.');
  }

  const adj = target - tdee;
  const expectedWeeklyChangeKg = (adj * 7) / KCAL_PER_KG;

  return {
    bmr: bmrValue,
    formula,
    tdee,
    requestedAdjustment,
    target,
    floored,
    floor,
    expectedWeeklyChangeKg,
    macros: macros(target, input.weightKg, input.heightCm, input.goal),
    warnings
  };
}

export function energyForProfile(p: Profile, today: Date = new Date()) {
  return energy({
    sex: p.sex,
    age: ageFromBirthDate(p.birthDate, today),
    weightKg: p.weightKg,
    heightCm: p.heightCm,
    bodyFatPct: p.bodyFatPct,
    activity: p.activity,
    goal: p.goal,
    ratePerWeekKg: p.ratePerWeekKg
  });
}

/* ---------- strength ---------- */
/** Epley estimated 1-rep max. A single rep returns the weight itself. */
export function e1rm(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

/* ---------- validation ---------- */
export const LIMITS = {
  heightCm: [100, 250],
  weightKg: [30, 300],
  age: [14, 100],
  bodyFatPct: [3, 60]
} as const;

export function validateProfileInput(p: { heightCm: number; weightKg: number; age: number; bodyFatPct?: number | null }) {
  const errors: Record<string, string> = {};
  const inRange = (v: number, [lo, hi]: readonly [number, number]) => Number.isFinite(v) && v >= lo && v <= hi;
  if (!inRange(p.heightCm, LIMITS.heightCm)) errors.heightCm = 'Height must be between 100 and 250 cm (3′3″–8′2″).';
  if (!inRange(p.weightKg, LIMITS.weightKg)) errors.weightKg = 'Weight must be between 30 and 300 kg (66–661 lb).';
  if (!inRange(p.age, LIMITS.age)) errors.age = 'Age must be between 14 and 100.';
  if (p.bodyFatPct != null && !Number.isNaN(p.bodyFatPct) && !inRange(p.bodyFatPct, LIMITS.bodyFatPct))
    errors.bodyFatPct = 'Body fat must be between 3% and 60%, or left blank.';
  return errors;
}
