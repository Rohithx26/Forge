import { ageFromBirthDate } from './calc';
import { daysBetween } from './training';
import type { CardioMachine, Exercise, Profile } from './types';

export const MACHINE_LABEL: Record<CardioMachine, string> = { treadmill: 'Treadmill', bike: 'Bike', stairmaster: 'StairMaster' };

export interface CardioPlan {
  machine: CardioMachine;
  /** light = recovery pace after a leg day */
  light: boolean;
  minutes: number;
  title: string;
  settings: string[];
  hr: { min: number; max: number };
  kcal: number;
  /** machines offered for this day (no StairMaster after legs) */
  options: CardioMachine[];
}

/** A day counts as legs when at least half its exercises are lower-body. */
export function isLowerDay(exerciseIds: string[], lib: Map<string, Exercise>): boolean {
  const known = exerciseIds.map((id) => lib.get(id)).filter(Boolean) as Exercise[];
  if (!known.length) return false;
  return known.filter((e) => e.region === 'lower').length / known.length >= 0.5;
}

/** Tanaka et al. (2001): HRmax = 208 − 0.7 × age, more accurate than 220 − age for adults. */
export const hrMax = (age: number) => Math.round(208 - 0.7 * age);

// Compendium of Physical Activities METs
const MET = {
  treadmill: { full: 6.0, light: 3.5 }, // 5–5.5 km/h at 8–12% incline / flat walk
  bike: { full: 6.8, light: 3.5 }, // 100–150 W / 50–80 W
  stairmaster: { full: 9.0, light: 9.0 }
} as const;

function minutesFor(p: Profile, light: boolean): number {
  if (light) return 10;
  if (p.goal === 'lose') return p.experience === 'beginner' ? 15 : 20;
  if (p.goal === 'gain') return 10; // keep the surplus; this is for heart health, not burn
  return 15;
}

export function cardioPlan(opts: { lower: boolean; date: string; profile: Profile; machine?: CardioMachine; today?: Date }): CardioPlan {
  const { lower: light, date, profile: p } = opts;
  const options: CardioMachine[] = light ? ['bike', 'treadmill'] : ['treadmill', 'bike', 'stairmaster'];
  // rotate machines day to day for variety
  const machine = opts.machine && options.includes(opts.machine) ? opts.machine : options[Math.abs(daysBetween('2024-01-01', date)) % options.length];
  const minutes = minutesFor(p, light);
  const max = hrMax(ageFromBirthDate(p.birthDate, opts.today));
  const hr = light ? { min: Math.round(max * 0.5), max: Math.round(max * 0.6) } : { min: Math.round(max * 0.6), max: Math.round(max * 0.7) };
  const imp = p.units === 'imperial';
  const beginner = p.experience === 'beginner';
  const kcal = Math.round((MET[machine][light ? 'light' : 'full'] * p.weightKg * minutes) / 60 / 5) * 5;

  let title: string;
  let settings: string[];
  if (machine === 'treadmill') {
    title = light ? 'Easy flat walk' : 'Incline walk';
    settings = light
      ? [`Speed ${imp ? '2.8–3.1 mph' : '4.5–5.0 km/h'}`, 'Incline 0–2%', 'Relaxed pace to loosen the legs. Stop if your knees or hips feel worse']
      : [`Speed ${imp ? '3.1–3.4 mph' : '5.0–5.5 km/h'}`, `Incline ${beginner ? '5–8%' : '8–12%'}`, "Don't hold the handrails. If you need to, lower the incline"];
  } else if (machine === 'bike') {
    title = light ? 'Recovery spin' : 'Steady ride';
    settings = light
      ? ['Resistance level 3–5 of 20 (≈50–80 W)', 'Cadence 80–90 RPM', 'Light spin to flush the legs, with almost no push against the pedals']
      : [`Resistance level ${beginner ? '6–9' : '8–12'} of 20 (≈${beginner ? '80–120' : '100–150'} W)`, 'Cadence 80–90 RPM', 'Seat at hip height, knee slightly bent at the bottom of the stroke'];
  } else {
    title = 'Steady climb';
    settings = [`Level ${beginner ? '3–5 (≈40–50 steps/min)' : '5–7 (≈50–65 steps/min)'}`, 'Stand upright with fingertips resting lightly on the rails, without leaning your weight on them', 'Take full steps and push through your whole foot'];
  }
  settings.push(
    `Heart rate ${hr.min}–${hr.max} bpm (${light ? 'zone 1, 50–60%' : 'zone 2, 60–70%'} of your max)`,
    light ? 'Breathing should feel barely raised' : 'Talk test: you can speak in full sentences but not sing',
    'Take the first 2 minutes easier as a warm-up'
  );
  return { machine, light, minutes, title, settings, hr, kcal, options };
}
