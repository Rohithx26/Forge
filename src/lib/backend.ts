import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, sendPasswordResetEmail, signOut as fbSignOut, updateProfile, type Auth
} from 'firebase/auth';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, setDoc, deleteDoc,
  collection, onSnapshot, query, where, type Firestore
} from 'firebase/firestore';
import { addDays, isoDate } from './training';

export const FOOD_HISTORY_DAYS = 56;
import type { DayTemplate, Exercise, FoodEntry, Profile, SplitId, WeightEntry, Workout } from './types';

export interface AppUser { uid: string; email: string | null; displayName: string | null }
export interface UserDoc { profile: Profile | null; templates: Partial<Record<SplitId, DayTemplate[]>> }

type Unsub = () => void;
type OnErr = (e: { code?: string; message: string }) => void;

export interface Backend {
  mode: 'firebase' | 'local';
  onAuth(cb: (u: AppUser | null) => void): Unsub;
  signInGoogle(): Promise<void>;
  signInEmail(email: string, pw: string): Promise<void>;
  signUpEmail(name: string, email: string, pw: string): Promise<void>;
  resetPassword(email: string): Promise<void>;
  signOut(): Promise<void>;
  /** Firebase ID token for calling our own server functions; null in demo mode */
  idToken(): Promise<string | null>;
  subscribeUser(uid: string, cb: (d: UserDoc) => void, onErr?: OnErr): Unsub;
  saveProfile(uid: string, p: Profile): Promise<void>;
  saveTemplates(uid: string, t: UserDoc['templates']): Promise<void>;
  subscribeWorkouts(uid: string, cb: (w: Workout[]) => void, onErr?: OnErr): Unsub;
  saveWorkout(uid: string, w: Workout): Promise<void>;
  deleteWorkout(uid: string, id: string): Promise<void>;
  subscribeWeights(uid: string, cb: (w: WeightEntry[]) => void, onErr?: OnErr): Unsub;
  saveWeight(uid: string, w: WeightEntry): Promise<void>;
  deleteWeight(uid: string, id: string): Promise<void>;
  subscribeExercises(uid: string, cb: (e: Exercise[]) => void): Unsub;
  saveExercise(uid: string, e: Exercise): Promise<void>;
  /** only the last FOOD_HISTORY_DAYS — the whole history would be re-read on every app open */
  subscribeFood(uid: string, cb: (f: FoodEntry[]) => void, onErr?: OnErr): Unsub;
  saveFood(uid: string, f: FoodEntry): Promise<void>;
  deleteFood(uid: string, id: string): Promise<void>;
}

/** Firestore rejects `undefined`; strip it deeply. */
function clean<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

/* ======================= Firebase ======================= */
const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
export const firebaseConfigured = Boolean(cfg.apiKey && cfg.projectId && cfg.appId);

function firebaseBackend(): Backend {
  const app: FirebaseApp = initializeApp(cfg);
  const auth: Auth = getAuth(app);
  // offline-first: writes queue locally and sync when back online
  const db: Firestore = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  });
  const toUser = (u: any): AppUser | null => (u ? { uid: u.uid, email: u.email, displayName: u.displayName } : null);

  const subCol = <T,>(uid: string, name: string, cb: (rows: T[]) => void, onErr?: OnErr) =>
    onSnapshot(collection(db, 'users', uid, name), (snap) => cb(snap.docs.map((d) => d.data() as T)), (err) => { console.error(name, err); onErr?.(err); });

  return {
    mode: 'firebase',
    onAuth: (cb) => onAuthStateChanged(auth, (u) => cb(toUser(u))),
    signInGoogle: async () => { await signInWithPopup(auth, new GoogleAuthProvider()); },
    signInEmail: async (e, p) => { await signInWithEmailAndPassword(auth, e, p); },
    signUpEmail: async (name, e, p) => {
      const cred = await createUserWithEmailAndPassword(auth, e, p);
      if (name) await updateProfile(cred.user, { displayName: name });
    },
    resetPassword: (e) => sendPasswordResetEmail(auth, e),
    signOut: () => fbSignOut(auth),
    idToken: async () => (auth.currentUser ? auth.currentUser.getIdToken() : null),
    subscribeUser: (uid, cb, onErr) =>
      onSnapshot(doc(db, 'users', uid), (snap) => {
        const d = snap.data() as any;
        cb({ profile: d?.profile ?? null, templates: d?.templates ?? {} });
      }, (err) => { console.error('user', err); onErr?.(err); }),
    saveProfile: (uid, p) => setDoc(doc(db, 'users', uid), { profile: clean(p) }, { merge: true }),
    saveTemplates: (uid, t) => setDoc(doc(db, 'users', uid), { templates: clean(t) }, { merge: true }),
    subscribeWorkouts: (uid, cb, onErr) => subCol<Workout>(uid, 'workouts', cb, onErr),
    saveWorkout: (uid, w) => setDoc(doc(db, 'users', uid, 'workouts', w.id), clean(w)),
    deleteWorkout: (uid, id) => deleteDoc(doc(db, 'users', uid, 'workouts', id)),
    subscribeWeights: (uid, cb, onErr) => subCol<WeightEntry>(uid, 'weights', cb, onErr),
    saveWeight: (uid, w) => setDoc(doc(db, 'users', uid, 'weights', w.id), clean(w)),
    deleteWeight: (uid, id) => deleteDoc(doc(db, 'users', uid, 'weights', id)),
    subscribeExercises: (uid, cb) => subCol<Exercise>(uid, 'exercises', cb),
    saveExercise: (uid, e) => setDoc(doc(db, 'users', uid, 'exercises', e.id), clean(e)),
    subscribeFood: (uid, cb, onErr) =>
      onSnapshot(
        query(collection(db, 'users', uid, 'food'), where('date', '>=', addDays(isoDate(), -FOOD_HISTORY_DAYS))),
        (snap) => cb(snap.docs.map((d) => d.data() as FoodEntry)),
        (err) => { console.error('food', err); onErr?.(err); }
      ),
    saveFood: (uid, f) => setDoc(doc(db, 'users', uid, 'food', f.id), clean(f)),
    deleteFood: (uid, id) => deleteDoc(doc(db, 'users', uid, 'food', id))
  };
}

/* ======================= Local (demo / no config) ======================= */
function localBackend(): Backend {
  const KEY = 'forge-local-v1';
  type State = { user: AppUser | null; doc: UserDoc; workouts: Record<string, Workout>; weights: Record<string, WeightEntry>; exercises: Record<string, Exercise>; food: Record<string, FoodEntry> };
  const empty: State = { user: null, doc: { profile: null, templates: {} }, workouts: {}, weights: {}, exercises: {}, food: {} };
  const load = (): State => {
    try { return { ...empty, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { ...empty }; }
  };
  let state = load();
  const listeners = new Set<() => void>();
  const commit = () => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
    listeners.forEach((l) => l());
  };
  const sub = (fn: () => void): Unsub => { listeners.add(fn); fn(); return () => listeners.delete(fn); };
  const login = (u: AppUser) => { state = { ...state, user: u }; commit(); };

  return {
    mode: 'local',
    onAuth: (cb) => sub(() => cb(state.user)),
    signInGoogle: async () => login({ uid: 'local', email: null, displayName: 'Demo user' }),
    signInEmail: async (email) => login({ uid: 'local', email, displayName: null }),
    signUpEmail: async (name, email) => login({ uid: 'local', email, displayName: name }),
    resetPassword: async () => {},
    signOut: async () => { state = { ...state, user: null }; commit(); },
    idToken: async () => null,
    subscribeUser: (_u, cb) => sub(() => cb(state.doc)),
    saveProfile: async (_u, p) => { state = { ...state, doc: { ...state.doc, profile: clean(p) } }; commit(); },
    saveTemplates: async (_u, t) => { state = { ...state, doc: { ...state.doc, templates: clean(t) } }; commit(); },
    subscribeWorkouts: (_u, cb) => sub(() => cb(Object.values(state.workouts))),
    saveWorkout: async (_u, w) => { state = { ...state, workouts: { ...state.workouts, [w.id]: clean(w) } }; commit(); },
    deleteWorkout: async (_u, id) => { const { [id]: _, ...rest } = state.workouts; state = { ...state, workouts: rest }; commit(); },
    subscribeWeights: (_u, cb) => sub(() => cb(Object.values(state.weights))),
    saveWeight: async (_u, w) => { state = { ...state, weights: { ...state.weights, [w.id]: clean(w) } }; commit(); },
    deleteWeight: async (_u, id) => { const { [id]: _, ...rest } = state.weights; state = { ...state, weights: rest }; commit(); },
    subscribeExercises: (_u, cb) => sub(() => cb(Object.values(state.exercises))),
    saveExercise: async (_u, e) => { state = { ...state, exercises: { ...state.exercises, [e.id]: clean(e) } }; commit(); },
    subscribeFood: (_u, cb) => sub(() => cb(Object.values(state.food))),
    saveFood: async (_u, f) => { state = { ...state, food: { ...state.food, [f.id]: clean(f) } }; commit(); },
    deleteFood: async (_u, id) => { const { [id]: _, ...rest } = state.food; state = { ...state, food: rest }; commit(); }
  };
}

export const backend: Backend = firebaseConfigured ? firebaseBackend() : localBackend();

export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  const map: Record<string, string> = {
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/wrong-password': 'Email or password is incorrect.',
    'auth/user-not-found': 'No account with that email.',
    'auth/email-already-in-use': 'An account already exists with that email.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/invalid-email': 'That email address looks wrong.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed.',
    'auth/too-many-requests': 'Too many attempts. Try again in a few minutes.',
    'auth/network-request-failed': 'Network error — check your connection.',
    'auth/unauthorized-domain': 'This domain isn\'t authorised in Firebase. Add it under Authentication → Settings → Authorized domains.'
  };
  return map[code] ?? (err as Error)?.message ?? 'Something went wrong.';
}
