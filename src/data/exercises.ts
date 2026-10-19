import type { Equipment, Exercise, Muscle } from '../lib/types';

type Row = [id: string, name: string, primary: Muscle[], secondary: Muscle[], equipment: Equipment, region: Exercise['region'], compound: boolean, cues: string[]];

const rows: Row[] = [
  // ---------- CHEST ----------
  ['bench-press', 'Barbell Bench Press', ['chest'], ['triceps', 'shoulders'], 'barbell', 'upper', true, ['Shoulder blades pinned back and down', 'Bar touches lower chest, elbows ~45°', 'Drive feet into the floor']],
  ['incline-bench', 'Incline Barbell Bench Press', ['chest'], ['shoulders', 'triceps'], 'barbell', 'upper', true, ['Bench at 30–45°', 'Bar to upper chest', 'Keep wrists stacked over elbows']],
  ['db-bench', 'Dumbbell Bench Press', ['chest'], ['triceps', 'shoulders'], 'dumbbell', 'upper', true, ['Full stretch at the bottom', 'Press up and slightly in', 'Control the descent']],
  ['incline-db-press', 'Incline Dumbbell Press', ['chest'], ['shoulders', 'triceps'], 'dumbbell', 'upper', true, ['30° incline targets upper chest', 'Elbows slightly tucked', 'Don\'t clang the dumbbells']],
  ['decline-bench', 'Decline Bench Press', ['chest'], ['triceps'], 'barbell', 'upper', true, ['Secure legs', 'Bar to lower chest', 'Use a spotter']],
  ['machine-chest-press', 'Machine Chest Press', ['chest'], ['triceps', 'shoulders'], 'machine', 'upper', true, ['Handles at mid-chest', 'Keep back on the pad', 'Smooth 2-sec lowering']],
  ['cable-fly', 'Cable Fly', ['chest'], ['shoulders'], 'cable', 'upper', false, ['Slight bend in elbows, fixed', 'Hug a big tree', 'Squeeze at the midline']],
  ['pec-deck', 'Pec Deck', ['chest'], [], 'machine', 'upper', false, ['Elbows at chest height', 'Pause at the squeeze', 'Don\'t let the stack slam']],
  ['db-fly', 'Dumbbell Fly', ['chest'], ['shoulders'], 'dumbbell', 'upper', false, ['Light weight, deep stretch', 'Arc, not a press', 'Stop when you feel the stretch']],
  ['push-up', 'Push-Up', ['chest'], ['triceps', 'shoulders', 'abs'], 'bodyweight', 'upper', true, ['Body in one straight line', 'Chest to the floor', 'Elbows ~45°']],
  ['dips-chest', 'Chest Dip', ['chest'], ['triceps', 'shoulders'], 'bodyweight', 'upper', true, ['Lean forward', 'Go to shoulder-comfortable depth', 'Lock out at the top']],
  ['smith-incline', 'Smith Machine Incline Press', ['chest'], ['shoulders', 'triceps'], 'smith', 'upper', true, ['Bench positioned so bar hits upper chest', 'Controlled tempo', 'Full range']],

  // ---------- BACK ----------
  ['deadlift', 'Conventional Deadlift', ['back', 'hamstrings', 'glutes'], ['lower-back', 'traps', 'forearms'], 'barbell', 'lower', true, ['Bar over mid-foot', 'Brace, then push the floor away', 'Bar stays in contact with legs']],
  ['barbell-row', 'Barbell Row', ['back', 'lats'], ['biceps', 'rear-delts', 'lower-back'], 'barbell', 'upper', true, ['Hinge to ~45°', 'Pull to lower ribs', 'No torso swinging']],
  ['pendlay-row', 'Pendlay Row', ['back', 'lats'], ['biceps', 'rear-delts'], 'barbell', 'upper', true, ['Bar starts on the floor each rep', 'Torso parallel to floor', 'Explosive pull']],
  ['db-row', 'One-Arm Dumbbell Row', ['lats', 'back'], ['biceps', 'rear-delts'], 'dumbbell', 'upper', true, ['Pull elbow to hip', 'Keep hips square', 'Full stretch at the bottom']],
  ['chest-supported-row', 'Chest-Supported Row', ['back', 'lats'], ['rear-delts', 'biceps'], 'machine', 'upper', true, ['Chest stays on pad', 'Squeeze shoulder blades', 'Slow negative']],
  ['seated-cable-row', 'Seated Cable Row', ['back', 'lats'], ['biceps', 'rear-delts'], 'cable', 'upper', true, ['Tall chest', 'Pull to belly button', 'Don\'t rock']],
  ['t-bar-row', 'T-Bar Row', ['back', 'lats'], ['biceps', 'rear-delts'], 'barbell', 'upper', true, ['Neutral spine', 'Pull handle to chest', 'Control the stretch']],
  ['pull-up', 'Pull-Up', ['lats'], ['biceps', 'back', 'forearms'], 'bodyweight', 'upper', true, ['Dead hang start', 'Chest to bar', 'No kipping']],
  ['chin-up', 'Chin-Up', ['lats', 'biceps'], ['back'], 'bodyweight', 'upper', true, ['Palms facing you', 'Chin over bar', 'Full extension each rep']],
  ['lat-pulldown', 'Lat Pulldown', ['lats'], ['biceps', 'back'], 'cable', 'upper', true, ['Slight lean back', 'Pull bar to upper chest', 'Elbows drive down']],
  ['close-grip-pulldown', 'Close-Grip Pulldown', ['lats'], ['biceps'], 'cable', 'upper', true, ['V-handle', 'Elbows tight to body', 'Stretch at the top']],
  ['machine-pullover', 'Machine Lat Pullover', ['lats'], ['chest', 'triceps'], 'machine', 'upper', false, ['Adjust seat so shoulders line up with the pivot', 'Drive with the elbows, not the hands', 'Sweep down until the pad nears your torso, squeeze lats', 'Control the stretch overhead — don\'t let the stack yank you']],
  ['straight-arm-pulldown', 'Straight-Arm Pulldown', ['lats'], [], 'cable', 'upper', false, ['Arms nearly straight', 'Sweep bar to thighs', 'Feel the lats']],
  ['rack-pull', 'Rack Pull', ['back', 'traps'], ['glutes', 'hamstrings', 'forearms'], 'barbell', 'lower', true, ['Bar just below knees', 'Lock out with glutes', 'Neutral spine']],
  ['shrug', 'Barbell Shrug', ['traps'], ['forearms'], 'barbell', 'upper', false, ['Straight up toward ears', 'Pause at top', 'No rolling']],
  ['db-shrug', 'Dumbbell Shrug', ['traps'], ['forearms'], 'dumbbell', 'upper', false, ['Arms long', 'Shrug and hold 1 sec', 'Control down']],
  ['back-extension', 'Back Extension', ['lower-back'], ['glutes', 'hamstrings'], 'bodyweight', 'core', false, ['Hinge at the hips', 'Don\'t hyperextend', 'Squeeze glutes at top']],

  // ---------- SHOULDERS ----------
  ['ohp', 'Overhead Press', ['shoulders'], ['triceps', 'traps'], 'barbell', 'upper', true, ['Squeeze glutes, brace abs', 'Head through at the top', 'Bar path straight up']],
  ['db-shoulder-press', 'Seated Dumbbell Shoulder Press', ['shoulders'], ['triceps'], 'dumbbell', 'upper', true, ['Back on the pad', 'Lower to ear level', 'Press up and slightly in']],
  ['arnold-press', 'Arnold Press', ['shoulders'], ['triceps'], 'dumbbell', 'upper', true, ['Rotate palms as you press', 'Controlled tempo', 'Full lockout']],
  ['machine-shoulder-press', 'Machine Shoulder Press', ['shoulders'], ['triceps'], 'machine', 'upper', true, ['Handles at shoulder height', 'Don\'t arch', 'Smooth reps']],
  ['lateral-raise', 'Dumbbell Lateral Raise', ['shoulders'], [], 'dumbbell', 'upper', false, ['Lead with elbows', 'Raise to shoulder height', 'Slow negative']],
  ['cable-lateral-raise', 'Cable Lateral Raise', ['shoulders'], [], 'cable', 'upper', false, ['Cable behind body', 'Constant tension', 'Stop at shoulder height']],
  ['rear-delt-fly', 'Rear Delt Fly', ['rear-delts'], ['back'], 'dumbbell', 'upper', false, ['Hinge forward', 'Arms wide, pinkies up', 'No momentum']],
  ['reverse-pec-deck', 'Reverse Pec Deck', ['rear-delts'], ['back'], 'machine', 'upper', false, ['Chest on pad', 'Sweep arms back', 'Pause at end']],
  ['face-pull', 'Face Pull', ['rear-delts'], ['traps', 'back'], 'cable', 'upper', false, ['Rope at face height', 'Pull to forehead, elbows high', 'Externally rotate at the end']],
  ['upright-row', 'Cable Upright Row', ['shoulders', 'traps'], ['biceps'], 'cable', 'upper', false, ['Wide grip', 'Elbows lead', 'Stop at mid-chest height']],
  ['front-raise', 'Front Raise', ['shoulders'], [], 'dumbbell', 'upper', false, ['Raise to eye level', 'No swinging', 'Thumbs slightly up']],

  // ---------- BICEPS ----------
  ['barbell-curl', 'Barbell Curl', ['biceps'], ['forearms'], 'barbell', 'upper', false, ['Elbows pinned', 'Full range', 'No hip drive']],
  ['ez-curl', 'EZ-Bar Curl', ['biceps'], ['forearms'], 'barbell', 'upper', false, ['Wrist-friendly grip', 'Squeeze at the top', 'Slow lowering']],
  ['db-curl', 'Dumbbell Curl', ['biceps'], ['forearms'], 'dumbbell', 'upper', false, ['Supinate as you lift', 'Elbows still', 'Alternate or together']],
  ['hammer-curl', 'Hammer Curl', ['biceps', 'forearms'], [], 'dumbbell', 'upper', false, ['Neutral grip', 'Curl across or straight', 'Control down']],
  ['incline-db-curl', 'Incline Dumbbell Curl', ['biceps'], [], 'dumbbell', 'upper', false, ['Arms hang behind body', 'Big stretch', 'Don\'t let shoulders roll forward']],
  ['preacher-curl', 'Preacher Curl', ['biceps'], [], 'machine', 'upper', false, ['Armpits on pad', 'Don\'t fully relax at bottom', 'Squeeze top']],
  ['cable-curl', 'Cable Curl', ['biceps'], ['forearms'], 'cable', 'upper', false, ['Constant tension', 'Elbows by your sides', 'Full extension']],
  ['bayesian-curl', 'Bayesian Cable Curl', ['biceps'], [], 'cable', 'upper', false, ['Face away from cable', 'Arm behind torso', 'Curl without moving elbow']],
  ['concentration-curl', 'Concentration Curl', ['biceps'], [], 'dumbbell', 'upper', false, ['Elbow on inner thigh', 'Slow reps', 'Peak squeeze']],

  // ---------- TRICEPS ----------
  ['close-grip-bench', 'Close-Grip Bench Press', ['triceps'], ['chest', 'shoulders'], 'barbell', 'upper', true, ['Hands shoulder-width', 'Elbows tucked', 'Touch lower chest']],
  ['tricep-pushdown', 'Triceps Pushdown', ['triceps'], [], 'cable', 'upper', false, ['Elbows pinned', 'Lock out fully', 'Don\'t lean over the bar']],
  ['rope-pushdown', 'Rope Pushdown', ['triceps'], [], 'cable', 'upper', false, ['Split the rope at the bottom', 'Elbows fixed', 'Slow return']],
  ['overhead-extension', 'Overhead Cable Extension', ['triceps'], [], 'cable', 'upper', false, ['Face away from cable', 'Deep stretch behind head', 'Elbows point forward']],
  ['skull-crusher', 'EZ-Bar Skull Crusher', ['triceps'], [], 'barbell', 'upper', false, ['Lower to forehead/behind head', 'Elbows stay in', 'Extend fully']],
  ['db-overhead-extension', 'Dumbbell Overhead Extension', ['triceps'], [], 'dumbbell', 'upper', false, ['Hold one dumbbell with both hands', 'Lower behind head', 'Keep elbows narrow']],
  ['dips-triceps', 'Triceps Dip', ['triceps'], ['chest', 'shoulders'], 'bodyweight', 'upper', true, ['Torso upright', 'Elbows back', 'Full lockout']],
  ['kickback', 'Cable Kickback', ['triceps'], [], 'cable', 'upper', false, ['Hinge forward', 'Upper arm parallel to floor', 'Squeeze at lockout']],

  // ---------- FOREARMS ----------
  ['wrist-curl', 'Wrist Curl', ['forearms'], [], 'barbell', 'upper', false, ['Forearms on bench', 'Let bar roll to fingers', 'Curl up']],
  ['farmer-carry', 'Farmer\'s Carry', ['forearms', 'traps'], ['abs'], 'dumbbell', 'core', true, ['Heavy and tall', 'Short quick steps', 'Don\'t lean']],

  // ---------- QUADS ----------
  ['squat', 'Back Squat', ['quads', 'glutes'], ['hamstrings', 'lower-back', 'abs'], 'barbell', 'lower', true, ['Brace before descending', 'Knees track over toes', 'Hips to at least parallel']],
  ['front-squat', 'Front Squat', ['quads'], ['glutes', 'abs'], 'barbell', 'lower', true, ['Elbows high', 'Upright torso', 'Sit straight down']],
  ['hack-squat', 'Hack Squat', ['quads'], ['glutes'], 'machine', 'lower', true, ['Feet mid-platform', 'Full depth', 'Don\'t lock knees hard']],
  ['leg-press', 'Leg Press', ['quads', 'glutes'], ['hamstrings'], 'machine', 'lower', true, ['Lower back stays on pad', 'Deep but controlled', 'Push through whole foot']],
  ['goblet-squat', 'Goblet Squat', ['quads', 'glutes'], ['abs'], 'dumbbell', 'lower', true, ['Hold DB at chest', 'Elbows inside knees', 'Upright chest']],
  ['bulgarian-split-squat', 'Bulgarian Split Squat', ['quads', 'glutes'], ['hamstrings'], 'dumbbell', 'lower', true, ['Rear foot on bench', 'Front shin vertical-ish', 'Drop straight down']],
  ['walking-lunge', 'Walking Lunge', ['quads', 'glutes'], ['hamstrings'], 'dumbbell', 'lower', true, ['Long stride', 'Back knee near floor', 'Stay tall']],
  ['leg-extension', 'Leg Extension', ['quads'], [], 'machine', 'lower', false, ['Knee aligned with pivot', 'Squeeze at top', 'Slow down']],
  ['smith-squat', 'Smith Machine Squat', ['quads', 'glutes'], [], 'smith', 'lower', true, ['Feet slightly forward', 'Full depth', 'Controlled tempo']],
  ['step-up', 'Dumbbell Step-Up', ['quads', 'glutes'], [], 'dumbbell', 'lower', true, ['Knee-height box', 'Drive through front heel', 'Don\'t push off back leg']],

  // ---------- HAMSTRINGS / GLUTES ----------
  ['rdl', 'Romanian Deadlift', ['hamstrings', 'glutes'], ['lower-back', 'forearms'], 'barbell', 'lower', true, ['Soft knees, push hips back', 'Bar close to legs', 'Stop at hamstring stretch']],
  ['db-rdl', 'Dumbbell Romanian Deadlift', ['hamstrings', 'glutes'], ['lower-back'], 'dumbbell', 'lower', true, ['Hips back', 'Neutral spine', 'Feel the stretch']],
  ['lying-leg-curl', 'Lying Leg Curl', ['hamstrings'], [], 'machine', 'lower', false, ['Hips pressed down', 'Curl fully', 'Slow eccentric']],
  ['seated-leg-curl', 'Seated Leg Curl', ['hamstrings'], [], 'machine', 'lower', false, ['Thigh pad snug', 'Lean slightly forward for stretch', 'Squeeze at bottom']],
  ['hip-thrust', 'Barbell Hip Thrust', ['glutes'], ['hamstrings'], 'barbell', 'lower', true, ['Upper back on bench', 'Chin tucked', 'Full hip lockout, pause']],
  ['glute-bridge', 'Glute Bridge', ['glutes'], ['hamstrings'], 'bodyweight', 'lower', false, ['Heels close to glutes', 'Drive through heels', 'Squeeze at top']],
  ['good-morning', 'Good Morning', ['hamstrings', 'lower-back'], ['glutes'], 'barbell', 'lower', true, ['Light weight', 'Hinge with flat back', 'Knees soft']],
  ['cable-pull-through', 'Cable Pull-Through', ['glutes', 'hamstrings'], [], 'cable', 'lower', false, ['Face away from cable', 'Hinge, then snap hips', 'Arms stay passive']],
  ['hip-abduction', 'Hip Abduction Machine', ['glutes'], [], 'machine', 'lower', false, ['Lean forward slightly', 'Push knees out', 'Control return']],
  ['kb-swing', 'Kettlebell Swing', ['glutes', 'hamstrings'], ['lower-back', 'abs'], 'kettlebell', 'lower', true, ['Hip hinge, not squat', 'Snap hips', 'Bell floats to chest height']],

  // ---------- CALVES ----------
  ['standing-calf-raise', 'Standing Calf Raise', ['calves'], [], 'machine', 'lower', false, ['Full stretch at bottom', 'Pause at top', 'Knees straight']],
  ['seated-calf-raise', 'Seated Calf Raise', ['calves'], [], 'machine', 'lower', false, ['Targets soleus', 'Slow reps', 'Deep stretch']],
  ['leg-press-calf', 'Leg Press Calf Raise', ['calves'], [], 'machine', 'lower', false, ['Balls of feet on edge', 'Don\'t bounce', 'Full range']],

  // ---------- ABS ----------
  ['plank', 'Plank', ['abs'], [], 'bodyweight', 'core', false, ['Squeeze glutes', 'Ribs down', 'Log seconds as reps']],
  ['hanging-leg-raise', 'Hanging Leg Raise', ['abs'], ['forearms'], 'bodyweight', 'core', false, ['No swinging', 'Curl pelvis up', 'Slow down']],
  ['cable-crunch', 'Cable Crunch', ['abs'], [], 'cable', 'core', false, ['Kneel, rope by head', 'Crunch ribs to hips', 'Hips stay still']],
  ['ab-wheel', 'Ab Wheel Rollout', ['abs'], ['lats'], 'bodyweight', 'core', false, ['Posterior pelvic tilt', 'Roll as far as you control', 'Don\'t let hips sag']],
  ['russian-twist', 'Russian Twist', ['abs'], [], 'bodyweight', 'core', false, ['Lean back slightly', 'Rotate from torso', 'Controlled']],
  ['decline-crunch', 'Decline Crunch', ['abs'], [], 'bodyweight', 'core', false, ['Curl, don\'t yank neck', 'Exhale at top', 'Slow down']],
  ['pallof-press', 'Pallof Press', ['abs'], [], 'cable', 'core', false, ['Resist rotation', 'Press straight out', 'Hold 2 sec']]
];

export const EXERCISES: Exercise[] = rows.map(([id, name, primary, secondary, equipment, region, compound, cues]) => ({
  id, name, primary, secondary, equipment, region, compound, cues
}));

export const MUSCLE_LABEL: Record<Muscle, string> = {
  chest: 'Chest', back: 'Upper back', lats: 'Lats', traps: 'Traps', shoulders: 'Shoulders', 'rear-delts': 'Rear delts',
  biceps: 'Biceps', triceps: 'Triceps', forearms: 'Forearms', quads: 'Quads', hamstrings: 'Hamstrings', glutes: 'Glutes',
  calves: 'Calves', abs: 'Abs', 'lower-back': 'Lower back'
};

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  barbell: 'Barbell', dumbbell: 'Dumbbell', machine: 'Machine', cable: 'Cable', bodyweight: 'Bodyweight', kettlebell: 'Kettlebell', smith: 'Smith', band: 'Band'
};

export interface WarmupDrill { name: string; sec: number; how: string }

const PULSE: WarmupDrill = { name: 'Jumping jacks', sec: 60, how: 'Easy pace, get the heart rate up' };
const ARM_CIRCLES: WarmupDrill = { name: 'Arm circles', sec: 30, how: '15 sec forward, 15 sec back, small to big' };
const CAT_COW: WarmupDrill = { name: 'Cat-cow', sec: 30, how: 'On all fours, slowly round then arch the spine' };
const HIP_CIRCLES: WarmupDrill = { name: 'Hip circles', sec: 30, how: 'Hands on hips, big slow circles both ways' };
const BW_SQUAT: WarmupDrill = { name: 'Bodyweight squats', sec: 45, how: 'Slow, full depth, pause at the bottom' };

// Each routine is 5 min (300 sec) of light, dynamic movement — no static holds before lifting.
const WARMUPS: Record<'upper' | 'lower' | 'full', WarmupDrill[]> = {
  upper: [
    PULSE, ARM_CIRCLES, CAT_COW,
    { name: 'Band pull-aparts / dislocates', sec: 45, how: 'Band or broomstick, arms straight, over and back' },
    { name: 'Thoracic rotations', sec: 45, how: 'On all fours, hand behind head, rotate elbow to the ceiling' },
    { name: 'Scap push-ups', sec: 45, how: 'Arms locked, let the chest sink then push the floor away' },
    { name: 'Push-up to down dog', sec: 45, how: 'One easy push-up, then hips up and back' }
  ],
  lower: [
    { name: 'March / jog in place', sec: 60, how: 'Knees up, easy pace' },
    { name: 'Leg swings (front–back)', sec: 45, how: 'Hold a wall, ~10 per leg, grow the range' },
    { name: 'Leg swings (side–side)', sec: 45, how: 'Face the wall, ~10 per leg' },
    HIP_CIRCLES, BW_SQUAT,
    { name: 'Glute bridges', sec: 30, how: 'Squeeze glutes 1 sec at the top' },
    { name: 'Walking lunges', sec: 45, how: 'Bodyweight, long stride, stay tall' }
  ],
  full: [
    PULSE, ARM_CIRCLES, CAT_COW,
    { name: 'Leg swings', sec: 45, how: 'Hold a wall, front–back, ~10 per leg' },
    HIP_CIRCLES, BW_SQUAT,
    { name: 'Inchworms', sec: 60, how: 'Walk hands out to a plank, walk feet in, stand' }
  ]
};

/** 5-min warm-up matched to the body regions trained today (core-only/mixed/empty → full body). */
export function warmupFor(regions: Exercise['region'][]): { title: string; drills: WarmupDrill[] } {
  const up = regions.includes('upper'), low = regions.includes('lower');
  const key = up && !low ? 'upper' : low && !up ? 'lower' : 'full';
  return { title: { upper: 'Upper-body warm-up', lower: 'Lower-body warm-up', full: 'Full-body warm-up' }[key], drills: WARMUPS[key] };
}
