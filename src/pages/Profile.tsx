import { useState } from 'react';
import { useStore } from '../lib/store';
import { backend } from '../lib/backend';
import { ageFromBirthDate, validateProfileInput } from '../lib/calc';
import { SPLIT_LIST, SPLITS } from '../data/splits';
import type { DayTemplate, Profile, SplitId } from '../lib/types';
import { ActivityField, GoalField, HeightField, WeightField } from '../components/fields';
import { BmiCard, CalorieCard } from '../components/Nutrition';
import { ExercisePicker } from '../components/ExercisePicker';
import { Disclaimer, Icon, NumInput, Segmented, Sheet } from '../components/ui';
import { isoDate } from '../lib/training';
import { estimateFood, getGeminiKey, setGeminiKey } from '../lib/food';

export default function ProfilePage() {
  const store = useStore();
  const { profile, user, saveProfile, split } = store;
  const p = profile!;
  const [editing, setEditing] = useState<'metrics' | 'goal' | 'split' | 'template' | null>(null);
  const set = (patch: Partial<Profile>) => saveProfile({ ...p, ...patch });

  function exportData() {
    const blob = new Blob([JSON.stringify({ profile: p, workouts: store.workouts, weights: store.weights, customExercises: store.customExercises, templates: store.templates }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `forge-export-${isoDate()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-accent text-black grid place-items-center font-display text-3xl font-extrabold uppercase">{p.name[0]}</div>
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight leading-none truncate">{p.name}</h1>
          <div className="text-sm text-muted truncate">{user?.email ?? 'Local profile'} · {ageFromBirthDate(p.birthDate)} yrs</div>
        </div>
      </header>

      <CalorieCard profile={p} detailed />
      <div className="grid grid-cols-2 gap-2">
        <button className="btn-ghost" onClick={() => setEditing('metrics')}><Icon name="edit" className="w-4 h-4" /> Body metrics</button>
        <button className="btn-ghost" onClick={() => setEditing('goal')}><Icon name="bolt" className="w-4 h-4" /> Goal & activity</button>
      </div>
      <BmiCard profile={p} />

      <section className="card divide-y divide-line">
        <Row label="Training split" value={split!.name} onClick={() => setEditing('split')} />
        <Row label="Customise workouts" value={store.templates[p.split] ? 'Customised' : 'Default template'} onClick={() => setEditing('template')} />
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm">Default rest timer</span>
          <div className="flex items-center gap-2">
            <button className="btn-ghost h-8 w-8 px-0" onClick={() => set({ restSeconds: Math.max(30, p.restSeconds - 15) })} aria-label="Less rest"><Icon name="minus" className="w-4 h-4" /></button>
            <span className="font-mono w-12 text-center">{Math.floor(p.restSeconds / 60)}:{String(p.restSeconds % 60).padStart(2, '0')}</span>
            <button className="btn-ghost h-8 w-8 px-0" onClick={() => set({ restSeconds: Math.min(600, p.restSeconds + 15) })} aria-label="More rest"><Icon name="plus" className="w-4 h-4" /></button>
          </div>
        </div>
      </section>

      <section className="card p-4 space-y-4">
        <div><div className="label">Units</div><Segmented value={p.units} onChange={(units) => set({ units })} options={[{ value: 'metric', label: 'kg · cm' }, { value: 'imperial', label: 'lb · ft' }]} /></div>
        <div><div className="label">Theme</div><Segmented value={p.theme} onChange={(theme) => set({ theme })} options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }]} /></div>
      </section>

      <FoodAiCard />

      <section className="card divide-y divide-line">
        <Row label="Export my data (JSON)" onClick={exportData} />
        <Row label="Sign out" onClick={() => backend.signOut()} danger />
      </section>
      <Disclaimer />

      {editing === 'metrics' && <MetricsSheet onClose={() => setEditing(null)} />}
      {editing === 'goal' && <GoalSheet onClose={() => setEditing(null)} />}
      {editing === 'split' && <SplitSheet onClose={() => setEditing(null)} />}
      {editing === 'template' && <TemplateSheet onClose={() => setEditing(null)} />}
    </div>
  );
}

function Row({ label, value, onClick, danger }: { label: string; value?: string; onClick: () => void; danger?: boolean }) {
  return (
    <button className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-raised text-left ${danger ? 'text-bad' : ''}`} onClick={onClick}>
      <span>{label}</span>
      <span className="flex items-center gap-1.5 text-muted">{value}<Icon name="chevron" className="w-4 h-4" /></span>
    </button>
  );
}

function FoodAiCard() {
  const [saved, setSaved] = useState(getGeminiKey);
  const [draft, setDraft] = useState(saved);
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [testing, setTesting] = useState(false);

  async function saveAndTest() {
    const k = draft.trim();
    setTesting(true); setStatus(null);
    try {
      await estimateFood({ text: '1 banana' }, k);
      setGeminiKey(k); setSaved(k);
      setStatus({ ok: true, msg: 'Key works. Photo and text estimates are on.' });
    } catch (e) {
      setStatus({ ok: false, msg: (e as Error).message });
    } finally {
      setTesting(false);
    }
  }

  return (
    <section className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="eyebrow">Food AI · Gemini</div>
        <span className={`chip h-6 ${saved ? 'text-good' : 'text-muted'}`}>{saved ? '● Connected' : 'Not set'}</span>
      </div>
      <p className="text-xs text-muted">
        Snap-a-meal and describe-a-meal estimates use Google Gemini. Get a free API key at{' '}
        <a className="text-accent underline" href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">aistudio.google.com</a>{' '}
        (sign in with Google → Create API key) and paste it here.
      </p>
      <div>
        <label className="label" htmlFor="gemini-key">Gemini API key</label>
        <div className="flex gap-2">
          <input id="gemini-key" className="field font-mono text-sm" type={show ? 'text' : 'password'} autoComplete="off" spellCheck={false}
            placeholder="AIza…" value={draft} onChange={(e) => { setDraft(e.target.value); setStatus(null); }} />
          <button className="btn-ghost px-3 shrink-0" onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'}</button>
        </div>
      </div>
      {status && <div className={`text-xs rounded-lg p-2.5 ${status.ok ? 'bg-good/10 text-good' : 'bg-bad/10 text-bad'}`}>{status.msg}</div>}
      <div className="flex gap-2">
        {saved && <button className="btn-ghost" onClick={() => { setGeminiKey(''); setSaved(''); setDraft(''); setStatus(null); }}>Remove</button>}
        <button className="btn-primary flex-1" disabled={!draft.trim() || testing || draft.trim() === saved} onClick={saveAndTest}>{testing ? 'Checking…' : 'Save & test key'}</button>
      </div>
      <p className="text-[11px] text-muted">The key is stored on this device only. On Gemini's free tier, Google may use your meal photos and text to improve its products.</p>
    </section>
  );
}

function MetricsSheet({ onClose }: { onClose: () => void }) {
  const { profile, saveProfile, logWeight } = useStore();
  const p = profile!;
  const [draft, setDraft] = useState({ ...p });
  const errors = validateProfileInput({ heightCm: draft.heightCm, weightKg: draft.weightKg, age: draft.birthDate ? ageFromBirthDate(draft.birthDate) : NaN, bodyFatPct: draft.bodyFatPct });
  const valid = Object.keys(errors).length === 0;
  return (
    <Sheet open onClose={onClose} title="Body metrics">
      <div className="space-y-4">
        <div><label className="label">Sex</label><Segmented value={draft.sex} onChange={(sex) => setDraft({ ...draft, sex })} options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]} /></div>
        <div><label className="label">Date of birth</label><input type="date" className="field" value={draft.birthDate} max={isoDate()} onChange={(e) => setDraft({ ...draft, birthDate: e.target.value })} />{errors.age && <p className="text-xs text-bad mt-1">{errors.age}</p>}</div>
        <HeightField cm={draft.heightCm} units={p.units} onChange={(v) => setDraft({ ...draft, heightCm: v ?? 0 })} error={errors.heightCm} />
        <WeightField kg={draft.weightKg} units={p.units} onChange={(v) => setDraft({ ...draft, weightKg: v ?? 0 })} error={errors.weightKg} />
        <div>
          <label className="label">Body fat % (optional)</label>
          <NumInput className="field" value={draft.bodyFatPct ?? null} onChange={(v) => setDraft({ ...draft, bodyFatPct: v })} placeholder="Leave blank if unsure" />
          {errors.bodyFatPct && <p className="text-xs text-bad mt-1">{errors.bodyFatPct}</p>}
        </div>
        <button className="btn-primary w-full h-12" disabled={!valid} onClick={async () => {
          await saveProfile(draft);
          if (Math.abs(draft.weightKg - p.weightKg) > 0.001) await logWeight(isoDate(), draft.weightKg);
          onClose();
        }}>Save</button>
      </div>
    </Sheet>
  );
}

function GoalSheet({ onClose }: { onClose: () => void }) {
  const { profile, saveProfile } = useStore();
  const [draft, setDraft] = useState({ ...profile! });
  return (
    <Sheet open onClose={onClose} title="Goal & activity">
      <div className="space-y-5">
        <GoalField goal={draft.goal} rate={draft.ratePerWeekKg} units={draft.units} onChange={(goal, ratePerWeekKg) => setDraft({ ...draft, goal, ratePerWeekKg })} />
        <div><div className="label">Activity level</div><ActivityField value={draft.activity} onChange={(activity) => setDraft({ ...draft, activity })} /></div>
        <CalorieCard profile={draft} />
        <button className="btn-primary w-full h-12" onClick={async () => { await saveProfile(draft); onClose(); }}>Save</button>
      </div>
    </Sheet>
  );
}

function SplitSheet({ onClose }: { onClose: () => void }) {
  const { profile, saveProfile } = useStore();
  return (
    <Sheet open onClose={onClose} title="Training split">
      <div className="space-y-2">
        {SPLIT_LIST.map((s) => (
          <button key={s.id} onClick={async () => { await saveProfile({ ...profile!, split: s.id }); onClose(); }}
            className={`w-full text-left rounded-xl border px-4 py-3 transition ${profile!.split === s.id ? 'border-accent bg-accent/10' : 'border-line bg-raised hover:border-muted'}`}>
            <div className="flex justify-between"><span className="font-semibold">{s.name}</span><span className="chip h-6">{s.daysPerWeek}d/wk</span></div>
            <div className="text-xs text-muted mt-1">{s.description}</div>
            <div className="text-[11px] font-mono text-muted mt-1.5">{s.rotation.map((k) => (k === 'rest' ? 'Rest' : s.days.find((d) => d.key === k)?.name)).join(' → ')}</div>
          </button>
        ))}
        <p className="text-xs text-muted pt-2">Switching keeps all your history. Your rotation restarts from day one of the new split.</p>
      </div>
    </Sheet>
  );
}

function TemplateSheet({ onClose }: { onClose: () => void }) {
  const { profile, getSplit, saveTemplates, exercises, templates } = useStore();
  const id: SplitId = profile!.split;
  const [days, setDays] = useState<DayTemplate[]>(() => structuredClone(getSplit(id).days));
  const [dayIdx, setDayIdx] = useState(0);
  const [picking, setPicking] = useState(false);
  const day = days[dayIdx];
  const setDay = (d: DayTemplate) => setDays(days.map((x, i) => (i === dayIdx ? d : x)));
  const move = (i: number, dir: -1 | 1) => {
    const arr = [...day.exercises]; const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setDay({ ...day, exercises: arr });
  };

  return (
    <Sheet open onClose={onClose} title={`Edit ${SPLITS[id].short}`} wide>
      <div className="space-y-4">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {days.map((d, i) => <button key={d.key} className={`chip h-8 px-3 ${i === dayIdx ? 'chip-on' : ''}`} onClick={() => setDayIdx(i)}>{d.name}</button>)}
        </div>
        <div className="space-y-2">
          {day.exercises.map((t, i) => (
            <div key={`${t.exerciseId}-${i}`} className="bg-raised rounded-xl p-3">
              <div className="flex items-center gap-2">
                <span className="flex-1 font-semibold text-sm truncate">{exercises.get(t.exerciseId)?.name ?? t.exerciseId}</span>
                <button className="text-muted hover:text-ink" onClick={() => move(i, -1)} aria-label="Move up"><Icon name="up" className="w-4 h-4" /></button>
                <button className="text-muted hover:text-ink" onClick={() => move(i, 1)} aria-label="Move down"><Icon name="down" className="w-4 h-4" /></button>
                <button className="text-muted hover:text-bad" onClick={() => setDay({ ...day, exercises: day.exercises.filter((_, j) => j !== i) })} aria-label="Remove"><Icon name="trash" className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {([['sets', 'Sets'], ['repMin', 'Min reps'], ['repMax', 'Max reps'], ['restSec', 'Rest s']] as const).map(([k, label]) => (
                  <div key={k}>
                    <div className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-1">{label}</div>
                    <NumInput className="h-9 w-full rounded-lg bg-surface border border-line text-center font-mono text-sm outline-none focus:border-accent" value={t[k] ?? null}
                      onChange={(v) => setDay({ ...day, exercises: day.exercises.map((x, j) => (j === i ? { ...x, [k]: Math.max(k === 'restSec' ? 0 : 1, Math.round(v ?? 0)) } : x)) })} />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button className="btn-outline w-full border-dashed" onClick={() => setPicking(true)}><Icon name="plus" className="w-4 h-4" /> Add exercise to {day.name}</button>
        </div>
        <div className="flex gap-2 pt-2">
          {templates[id] && <button className="btn-ghost" onClick={async () => { await saveTemplates(id, null); onClose(); }}>Reset to default</button>}
          <button className="btn-primary flex-1" onClick={async () => {
            const cleaned = days.map((d) => ({ ...d, exercises: d.exercises.map((e) => ({ ...e, repMax: Math.max(e.repMin, e.repMax) })) }));
            await saveTemplates(id, cleaned); onClose();
          }}>Save template</button>
        </div>
      </div>
      <ExercisePicker open={picking} onClose={() => setPicking(false)} onPick={(e) => {
        setDay({ ...day, exercises: [...day.exercises, { exerciseId: e.id, sets: 3, repMin: e.compound ? 6 : 10, repMax: e.compound ? 10 : 15, restSec: e.compound ? 150 : 75 }] });
        setPicking(false);
      }} />
    </Sheet>
  );
}
