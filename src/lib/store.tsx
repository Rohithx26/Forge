import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { backend, type AppUser, type UserDoc } from './backend';
import { EXERCISES } from '../data/exercises';
import { SPLITS } from '../data/splits';
import { kgToLb, lbToKg, round } from './calc';
import type { DayTemplate, Exercise, FoodEntry, Profile, SplitId, SplitTemplate, WeightEntry, Workout } from './types';

interface Store {
  user: AppUser | null;
  authReady: boolean;
  dataReady: boolean;
  /** Firestore error code (e.g. 'permission-denied') when the user's data can't load */
  loadError: string | null;
  profile: Profile | null;
  workouts: Workout[]; // finished, newest first
  weights: WeightEntry[]; // oldest first
  exercises: Map<string, Exercise>;
  customExercises: Exercise[];
  templates: UserDoc['templates'];
  split: SplitTemplate | null;
  getSplit(id: SplitId): SplitTemplate;
  saveProfile(p: Profile): Promise<void>;
  saveTemplates(id: SplitId, days: DayTemplate[] | null): Promise<void>;
  saveWorkout(w: Workout): Promise<void>;
  deleteWorkout(id: string): Promise<void>;
  logWeight(date: string, kg: number): Promise<void>;
  deleteWeight(id: string): Promise<void>;
  saveExercise(e: Exercise): Promise<void>;
  food: FoodEntry[]; // oldest first
  saveFood(f: FoodEntry): Promise<void>;
  deleteFood(id: string): Promise<void>;
  /** display helpers respecting unit preference */
  w(kg: number, dp?: number): number;
  toKg(display: number): number;
  wUnit: 'kg' | 'lb';
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [workoutsRaw, setWorkouts] = useState<Workout[] | null>(null);
  const [weightsRaw, setWeights] = useState<WeightEntry[] | null>(null);
  const [customExercises, setCustom] = useState<Exercise[]>([]);
  const [foodRaw, setFood] = useState<FoodEntry[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => backend.onAuth((u) => { setUser(u); setAuthReady(true); }), []);

  useEffect(() => {
    if (!user) { setUserDoc(null); setWorkouts(null); setWeights(null); setCustom([]); setFood([]); return; }
    const uid = user.uid;
    setLoadError(null);
    const onErr = (e: { code?: string; message: string }) => setLoadError(e.code ?? e.message);
    const subs = [
      backend.subscribeUser(uid, setUserDoc, onErr),
      backend.subscribeWorkouts(uid, setWorkouts, onErr),
      backend.subscribeWeights(uid, setWeights, onErr),
      backend.subscribeExercises(uid, setCustom),
      backend.subscribeFood(uid, setFood, onErr)
    ];
    return () => subs.forEach((u) => u());
  }, [user]);

  const profile = userDoc?.profile ?? null;
  const templates = userDoc?.templates ?? {};

  useEffect(() => {
    const theme = profile?.theme ?? 'dark';
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [profile?.theme]);

  const workouts = useMemo(
    () => (workoutsRaw ?? []).filter((w) => w.endedAt).sort((a, b) => (a.date === b.date ? b.startedAt - a.startedAt : a.date < b.date ? 1 : -1)),
    [workoutsRaw]
  );
  const weights = useMemo(() => [...(weightsRaw ?? [])].sort((a, b) => (a.date < b.date ? -1 : 1)), [weightsRaw]);
  const food = useMemo(() => [...foodRaw].sort((a, b) => a.createdAt - b.createdAt), [foodRaw]);
  const exercises = useMemo(() => {
    const m = new Map<string, Exercise>();
    EXERCISES.forEach((e) => m.set(e.id, e));
    customExercises.forEach((e) => m.set(e.id, e));
    return m;
  }, [customExercises]);

  const getSplit = useCallback(
    (id: SplitId): SplitTemplate => {
      const base = SPLITS[id];
      const custom = templates[id];
      return custom && custom.length ? { ...base, days: custom } : base;
    },
    [templates]
  );
  const split = profile ? getSplit(profile.split) : null;

  const uid = user?.uid ?? '';
  const imperial = profile?.units === 'imperial';

  const value: Store = {
    user, authReady,
    dataReady: !user || (userDoc !== null && workoutsRaw !== null && weightsRaw !== null),
    loadError,
    profile, workouts, weights, exercises, customExercises, templates, split, getSplit,
    saveProfile: (p) => backend.saveProfile(uid, p),
    saveTemplates: (id, days) => {
      const next = { ...templates };
      if (days) next[id] = days; else delete next[id];
      return backend.saveTemplates(uid, next);
    },
    saveWorkout: (w) => backend.saveWorkout(uid, w),
    deleteWorkout: (id) => backend.deleteWorkout(uid, id),
    logWeight: async (date, kg) => {
      await backend.saveWeight(uid, { id: date, date, weightKg: round(kg, 2) });
      // keep profile weight in sync with the most recent entry so calorie targets stay current
      const latest = [...weights.filter((x) => x.date !== date), { date, weightKg: kg }].sort((a, b) => (a.date < b.date ? -1 : 1)).pop();
      if (profile && latest && latest.date === date) await backend.saveProfile(uid, { ...profile, weightKg: round(kg, 2) });
    },
    deleteWeight: (id) => backend.deleteWeight(uid, id),
    saveExercise: (e) => backend.saveExercise(uid, e),
    food,
    saveFood: (f) => backend.saveFood(uid, f),
    deleteFood: (id) => backend.deleteFood(uid, id),
    w: (kg, dp = 1) => round(imperial ? kgToLb(kg) : kg, dp),
    toKg: (v) => (imperial ? lbToKg(v) : v),
    wUnit: imperial ? 'lb' : 'kg'
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside provider');
  return s;
}

/* -------- active (in-progress) workout lives on-device until finished -------- */
const ACTIVE_KEY = 'forge-active-workout';
export function loadActive(): Workout | null {
  try { const raw = localStorage.getItem(ACTIVE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
export function saveActive(w: Workout | null) {
  try { if (w) localStorage.setItem(ACTIVE_KEY, JSON.stringify(w)); else localStorage.removeItem(ACTIVE_KEY); } catch { /* ignore */ }
}

export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
