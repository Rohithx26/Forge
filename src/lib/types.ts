export type Sex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very' | 'extra';
export type Goal = 'lose' | 'maintain' | 'gain';
export type Experience = 'beginner' | 'intermediate' | 'advanced';
export type UnitSystem = 'metric' | 'imperial';
export type SplitId = 'ppl3' | 'ppl6' | 'bro' | 'ula' | 'ul' | 'fullbody';

export type Muscle =
  | 'chest' | 'back' | 'lats' | 'traps' | 'shoulders' | 'rear-delts'
  | 'biceps' | 'triceps' | 'forearms' | 'quads' | 'hamstrings' | 'glutes'
  | 'calves' | 'abs' | 'lower-back';

export type Equipment = 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight' | 'kettlebell' | 'smith' | 'band';

export interface Exercise {
  id: string;
  name: string;
  primary: Muscle[];
  secondary: Muscle[];
  equipment: Equipment;
  /** compound lower-body lifts progress in bigger jumps */
  region: 'upper' | 'lower' | 'core';
  compound: boolean;
  cues: string[];
  custom?: boolean;
}

export interface Profile {
  name: string;
  sex: Sex;
  birthDate: string; // YYYY-MM-DD
  heightCm: number;
  weightKg: number;
  bodyFatPct?: number | null;
  activity: ActivityLevel;
  experience: Experience;
  goal: Goal;
  /** kg per week, positive number; ignored for maintain */
  ratePerWeekKg: number;
  units: UnitSystem;
  split: SplitId;
  restSeconds: number;
  theme: 'dark' | 'light';
  createdAt: number;
}

export interface TemplateExercise {
  exerciseId: string;
  sets: number;
  repMin: number;
  repMax: number;
  restSec?: number;
}

export interface DayTemplate {
  key: string; // e.g. 'push'
  name: string; // 'Push'
  focus: string;
  exercises: TemplateExercise[];
}

export interface SplitTemplate {
  id: SplitId;
  name: string;
  short: string;
  daysPerWeek: number;
  level: Experience[];
  description: string;
  /** rotation sequence of day keys; 'rest' denotes a planned rest day */
  rotation: string[];
  days: DayTemplate[];
}

export interface LoggedSet {
  weightKg: number;
  reps: number;
  rpe?: number | null;
  warmup?: boolean;
  done: boolean;
}

export interface LoggedExercise {
  exerciseId: string;
  repMin: number;
  repMax: number;
  sets: LoggedSet[];
}

export interface Workout {
  id: string;
  date: string; // YYYY-MM-DD
  startedAt: number;
  endedAt: number | null;
  splitId: SplitId | null;
  dayKey: string | null; // template day key, null for blank
  title: string;
  notes: string;
  exercises: LoggedExercise[];
  /** post-lift cardio finisher; only kept on save when done */
  cardio?: CardioLog | null;
}

export type CardioMachine = 'treadmill' | 'bike' | 'stairmaster';

export interface CardioLog {
  machine: CardioMachine;
  minutes: number;
  done: boolean;
}

export interface WeightEntry {
  id: string; // date
  date: string;
  weightKg: number;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodItem {
  name: string;
  portion: string; // e.g. '2 rotis', '1 cup (240 ml)'
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

/** what /api/food returns for a photo or text description */
export interface FoodEstimate {
  items: FoodItem[];
  confidence: 'low' | 'medium' | 'high';
  notes: string;
}

export interface FoodEntry {
  id: string;
  date: string; // YYYY-MM-DD
  createdAt: number;
  meal: MealType;
  source: 'photo' | 'text' | 'manual';
  items: FoodItem[];
}

export interface PR {
  exerciseId: string;
  kind: 'weight' | 'e1rm' | 'reps';
  value: number;
  weightKg: number;
  reps: number;
  date: string;
}
