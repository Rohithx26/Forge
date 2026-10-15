import type { DayTemplate, SplitId, SplitTemplate, TemplateExercise } from '../lib/types';

const e = (exerciseId: string, sets: number, repMin: number, repMax: number, restSec?: number): TemplateExercise => ({ exerciseId, sets, repMin, repMax, restSec });

/* ---- reusable day blocks ---- */
const PUSH: DayTemplate = {
  key: 'push', name: 'Push', focus: 'Chest · Shoulders · Triceps',
  exercises: [
    e('bench-press', 4, 5, 8, 180), e('incline-db-press', 3, 8, 12, 120), e('db-shoulder-press', 3, 8, 12, 120),
    e('lateral-raise', 4, 12, 20, 60), e('cable-fly', 3, 12, 15, 60), e('rope-pushdown', 3, 10, 15, 60), e('overhead-extension', 2, 10, 15, 60)
  ]
};
const PUSH_B: DayTemplate = {
  key: 'push', name: 'Push', focus: 'Chest · Shoulders · Triceps', exercises: PUSH.exercises
};
const PULL: DayTemplate = {
  key: 'pull', name: 'Pull', focus: 'Back · Rear delts · Biceps',
  exercises: [
    e('pull-up', 3, 6, 10, 150), e('barbell-row', 4, 6, 10, 150), e('lat-pulldown', 3, 10, 12, 90),
    e('seated-cable-row', 3, 10, 12, 90), e('face-pull', 3, 12, 20, 60), e('ez-curl', 3, 8, 12, 60), e('hammer-curl', 2, 10, 15, 60)
  ]
};
const LEGS: DayTemplate = {
  key: 'legs', name: 'Legs', focus: 'Quads · Hamstrings · Glutes · Calves',
  exercises: [
    e('squat', 4, 5, 8, 180), e('rdl', 3, 8, 10, 150), e('leg-press', 3, 10, 15, 120),
    e('lying-leg-curl', 3, 10, 15, 60), e('leg-extension', 3, 12, 15, 60), e('standing-calf-raise', 4, 10, 15, 60), e('hanging-leg-raise', 3, 10, 15, 60)
  ]
};

const UPPER: DayTemplate = {
  key: 'upper', name: 'Upper', focus: 'Chest · Back · Shoulders · Arms',
  exercises: [
    e('bench-press', 4, 5, 8, 180), e('barbell-row', 4, 6, 10, 150), e('ohp', 3, 6, 10, 150),
    e('lat-pulldown', 3, 8, 12, 90), e('lateral-raise', 3, 12, 20, 60), e('ez-curl', 2, 10, 12, 60), e('tricep-pushdown', 2, 10, 15, 60)
  ]
};
const LOWER: DayTemplate = {
  key: 'lower', name: 'Lower', focus: 'Quads · Hamstrings · Glutes · Calves',
  exercises: [
    e('squat', 4, 5, 8, 180), e('rdl', 3, 6, 10, 150), e('bulgarian-split-squat', 3, 8, 12, 90),
    e('seated-leg-curl', 3, 10, 15, 60), e('standing-calf-raise', 4, 10, 15, 60), e('cable-crunch', 3, 10, 15, 60)
  ]
};
const UPPER_B: DayTemplate = {
  key: 'upper2', name: 'Upper B', focus: 'Back · Chest · Shoulders',
  exercises: [
    e('pull-up', 4, 6, 10, 150), e('incline-db-press', 4, 8, 12, 120), e('chest-supported-row', 3, 8, 12, 90),
    e('db-shoulder-press', 3, 8, 12, 90), e('cable-fly', 3, 12, 15, 60), e('face-pull', 3, 12, 20, 60)
  ]
};
const LOWER_B: DayTemplate = {
  key: 'lower2', name: 'Lower B', focus: 'Posterior chain · Quads',
  exercises: [
    e('deadlift', 3, 3, 6, 210), e('leg-press', 3, 10, 15, 120), e('hip-thrust', 3, 8, 12, 90),
    e('leg-extension', 3, 12, 15, 60), e('lying-leg-curl', 3, 10, 15, 60), e('seated-calf-raise', 4, 12, 20, 60)
  ]
};
const ARMS: DayTemplate = {
  key: 'arms', name: 'Arms', focus: 'Biceps · Triceps · Forearms · Delts',
  exercises: [
    e('close-grip-bench', 3, 6, 10, 120), e('barbell-curl', 3, 8, 12, 90), e('skull-crusher', 3, 8, 12, 90),
    e('incline-db-curl', 3, 10, 12, 60), e('rope-pushdown', 3, 10, 15, 60), e('hammer-curl', 3, 10, 15, 60),
    e('lateral-raise', 3, 12, 20, 60), e('wrist-curl', 2, 15, 20, 45)
  ]
};

/* ---- bro split ---- */
const CHEST: DayTemplate = {
  key: 'chest', name: 'Chest', focus: 'Chest',
  exercises: [e('bench-press', 4, 5, 8, 180), e('incline-db-press', 4, 8, 12, 120), e('machine-chest-press', 3, 10, 12, 90), e('cable-fly', 3, 12, 15, 60), e('dips-chest', 3, 8, 12, 90)]
};
const BACK: DayTemplate = {
  key: 'back', name: 'Back', focus: 'Back · Lats · Traps',
  exercises: [e('deadlift', 3, 3, 6, 210), e('pull-up', 4, 6, 10, 150), e('barbell-row', 4, 6, 10, 150), e('lat-pulldown', 3, 10, 12, 90), e('seated-cable-row', 3, 10, 12, 90), e('db-shrug', 3, 10, 15, 60)]
};
const SHOULDERS: DayTemplate = {
  key: 'shoulders', name: 'Shoulders', focus: 'Delts · Traps',
  exercises: [e('ohp', 4, 5, 8, 180), e('db-shoulder-press', 3, 8, 12, 120), e('lateral-raise', 4, 12, 20, 60), e('cable-lateral-raise', 3, 12, 15, 60), e('reverse-pec-deck', 3, 12, 20, 60), e('face-pull', 3, 15, 20, 60)]
};
const BRO_ARMS: DayTemplate = {
  key: 'arms', name: 'Arms', focus: 'Biceps · Triceps',
  exercises: [e('close-grip-bench', 3, 6, 10, 120), e('barbell-curl', 4, 8, 12, 90), e('skull-crusher', 3, 8, 12, 90), e('incline-db-curl', 3, 10, 12, 60), e('rope-pushdown', 3, 10, 15, 60), e('hammer-curl', 3, 10, 15, 60), e('overhead-extension', 2, 12, 15, 60)]
};
const BRO_LEGS: DayTemplate = {
  key: 'legs', name: 'Legs', focus: 'Quads · Hamstrings · Glutes · Calves',
  exercises: [e('squat', 4, 5, 8, 180), e('leg-press', 4, 10, 15, 120), e('rdl', 3, 8, 10, 150), e('leg-extension', 3, 12, 15, 60), e('lying-leg-curl', 3, 10, 15, 60), e('standing-calf-raise', 5, 10, 15, 60)]
};

/* ---- full body ---- */
const FB_A: DayTemplate = {
  key: 'fbA', name: 'Full Body A', focus: 'Squat · Bench · Row',
  exercises: [e('squat', 3, 5, 8, 180), e('bench-press', 3, 5, 8, 150), e('barbell-row', 3, 6, 10, 120), e('lateral-raise', 2, 12, 15, 60), e('plank', 3, 30, 60, 45)]
};
const FB_B: DayTemplate = {
  key: 'fbB', name: 'Full Body B', focus: 'Deadlift · Press · Pulldown',
  exercises: [e('deadlift', 3, 3, 5, 180), e('ohp', 3, 5, 8, 150), e('lat-pulldown', 3, 8, 12, 90), e('goblet-squat', 2, 10, 12, 90), e('db-curl', 2, 10, 12, 60)]
};
const FB_C: DayTemplate = {
  key: 'fbC', name: 'Full Body C', focus: 'Legs · Incline · Rows',
  exercises: [e('leg-press', 3, 8, 12, 120), e('incline-db-press', 3, 8, 12, 120), e('db-row', 3, 8, 12, 90), e('rdl', 2, 8, 10, 120), e('tricep-pushdown', 2, 10, 15, 60)]
};

export const SPLITS: Record<SplitId, SplitTemplate> = {
  ppl3: {
    id: 'ppl3', name: 'Push / Pull / Legs', short: 'PPL', daysPerWeek: 3, level: ['beginner', 'intermediate'],
    description: 'Each muscle once a week across three focused sessions. Great if you can train 3 days.',
    rotation: ['push', 'pull', 'legs', 'rest'], days: [PUSH, PULL, LEGS]
  },
  ppl6: {
    id: 'ppl6', name: 'Push / Pull / Legs ×2', short: 'PPL×2', daysPerWeek: 6, level: ['intermediate', 'advanced'],
    description: 'The classic 6-day PPL — every muscle twice a week. High volume, high commitment.',
    rotation: ['push', 'pull', 'legs', 'push', 'pull', 'legs', 'rest'], days: [PUSH_B, PULL, LEGS]
  },
  bro: {
    id: 'bro', name: 'Bro Split', short: 'Bro', daysPerWeek: 5, level: ['intermediate', 'advanced'],
    description: 'One muscle group per day, five days a week. Lots of volume per session, long recovery per muscle.',
    rotation: ['chest', 'back', 'shoulders', 'arms', 'legs', 'rest', 'rest'], days: [CHEST, BACK, SHOULDERS, BRO_ARMS, BRO_LEGS]
  },
  ula: {
    id: 'ula', name: 'Upper / Lower / Arms', short: 'ULA', daysPerWeek: 5, level: ['intermediate', 'advanced'],
    description: 'Upper and lower twice a week plus a dedicated arm day for extra biceps and triceps growth.',
    rotation: ['upper', 'lower', 'rest', 'upper2', 'lower2', 'arms', 'rest'], days: [UPPER, LOWER, UPPER_B, LOWER_B, ARMS]
  },
  ul: {
    id: 'ul', name: 'Upper / Lower', short: 'U/L', daysPerWeek: 4, level: ['beginner', 'intermediate', 'advanced'],
    description: 'Four days, each muscle twice a week. A balanced, proven split for strength and size.',
    rotation: ['upper', 'lower', 'rest', 'upper2', 'lower2', 'rest', 'rest'], days: [UPPER, LOWER, UPPER_B, LOWER_B]
  },
  fullbody: {
    id: 'fullbody', name: 'Full Body', short: 'Full Body', daysPerWeek: 3, level: ['beginner'],
    description: 'Three whole-body sessions on alternating days. Best starting point for beginners.',
    rotation: ['fbA', 'rest', 'fbB', 'rest', 'fbC', 'rest', 'rest'], days: [FB_A, FB_B, FB_C]
  }
};

export const SPLIT_LIST: SplitTemplate[] = [SPLITS.ppl3, SPLITS.ppl6, SPLITS.bro, SPLITS.ula, SPLITS.ul, SPLITS.fullbody];

export function recommendSplit(daysPerWeek: number, experience: string): SplitId {
  if (experience === 'beginner') return daysPerWeek >= 4 ? 'ul' : 'fullbody';
  if (daysPerWeek >= 6) return 'ppl6';
  if (daysPerWeek === 5) return 'ula';
  if (daysPerWeek === 4) return 'ul';
  return 'ppl3';
}
