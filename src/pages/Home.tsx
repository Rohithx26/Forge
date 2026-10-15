import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore, loadActive, saveActive, loadSwap, saveSwap } from '../lib/store';
import { isoDate, neglectedMuscles, suggestToday, weekStart, weekStreak, workoutVolume } from '../lib/training';
import { workoutFromDay, prTimeline } from '../lib/session';
import { MUSCLE_LABEL } from '../data/exercises';
import { BmiCard, CalorieCard } from '../components/Nutrition';
import { Icon, Ring, Sheet, confirmDialog, fmtDate } from '../components/ui';
import { dayTotals } from '../lib/food';
import { cardioPlan, isLowerDay } from '../lib/cardio';
import { energyForProfile } from '../lib/calc';
import { WeightField } from '../components/fields';

export default function Home() {
  const store = useStore();
  const { profile, split, workouts, exercises, weights } = store;
  const nav = useNavigate();
  const today = isoDate();
  const [offset, setOffsetState] = useState(() => loadSwap(today));
  const setOffset = (o: number) => { saveSwap(today, o); setOffsetState(o); };
  const [weighIn, setWeighIn] = useState(false);
  const active = loadActive();

  const sug = useMemo(() => suggestToday(split!, workouts, today, offset), [split, workouts, today, offset]);
  const day = split!.days.find((d) => d.key === sug.dayKey);
  const streak = weekStreak(workouts, today);
  const neglected = useMemo(() => neglectedMuscles(workouts, exercises, today), [workouts, exercises, today]);
  const prs = useMemo(() => prTimeline(workouts, 4), [workouts]);
  const thisWeek = workouts.filter((w) => weekStart(w.date) === weekStart(today));
  const weekVolume = thisWeek.reduce((a, w) => a + workoutVolume(w), 0);
  const loggedToday = weights.some((w) => w.date === today);
  const eatenToday = dayTotals(store.food, today).kcal;
  const target = Math.round(energyForProfile(profile!).target);

  async function swap() {
    const next = suggestToday(split!, workouts, today, offset + 1).dayKey;
    const name = next === 'rest' ? 'a rest day' : split!.days.find((d) => d.key === next)?.name ?? next;
    if (await confirmDialog({ title: "Swap today's workout?", message: <>From <b className="text-ink">{day?.name ?? 'Rest'}</b> to <b className="text-ink">{name}</b>. It stays swapped for the rest of today.</>, confirmLabel: 'Swap' })) setOffset(offset + 1);
  }

  async function start(dayKey: string) {
    if (active && !(await confirmDialog({ title: 'Discard workout in progress?', message: `"${active.title}" hasn't been saved. Starting a new workout throws it away.`, confirmLabel: 'Discard & start', danger: true }))) return;
    const w = workoutFromDay(split!, dayKey, workouts, exercises);
    saveActive(w);
    nav('/workout');
  }

  const hour = new Date().getHours();
  const greet = hour < 5 ? 'Late session' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between">
        <div>
          <div className="eyebrow">{fmtDate(today, { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          <h1 className="font-display text-4xl font-extrabold uppercase tracking-tight leading-none mt-1">{greet}, {profile!.name.split(' ')[0]}</h1>
        </div>
        <div className="flex items-center gap-1.5 chip h-8 px-3" title="Consecutive weeks with at least one workout">
          <Icon name="flame" className="w-4 h-4 text-accent" />
          <span className="num text-lg">{streak}</span>
          <span className="text-muted">wk</span>
        </div>
      </header>

      {active ? (
        <Link to="/workout" className="block card p-4 border-accent/60 bg-accent/5">
          <div className="eyebrow text-accent">In progress</div>
          <div className="flex items-center justify-between mt-1">
            <div className="font-display text-2xl font-bold uppercase">{active.title}</div>
            <span className="btn-primary h-9">Resume <Icon name="chevron" className="w-4 h-4" /></span>
          </div>
        </Link>
      ) : (
        <section className="card overflow-hidden">
          <div className="p-4 pb-3">
            <div className="flex items-center justify-between">
              <div className="eyebrow">{sug.trainedToday ? 'Today · done' : "Today's workout"} · {split!.short}</div>
              {!sug.trainedToday && (
                <button className="text-xs font-semibold text-muted hover:text-ink flex items-center gap-1" onClick={swap}>
                  <Icon name="swap" className="w-3.5 h-3.5" /> Swap
                </button>
              )}
            </div>
            {sug.dayKey === 'rest' ? (
              <>
                <div className="flex items-center gap-3 mt-2">
                  <div className="w-11 h-11 rounded-xl bg-raised grid place-items-center text-muted"><Icon name="bed" /></div>
                  <div>
                    <div className="font-display text-3xl font-extrabold uppercase leading-none">Rest day</div>
                    <div className="text-xs text-muted mt-1">{sug.reason}</div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="font-display text-4xl font-extrabold uppercase leading-none mt-1.5">{day?.name}</div>
                <div className="text-sm text-muted mt-1">{day?.focus}</div>
                <div className="text-xs text-muted mt-2 flex items-center gap-1.5"><Icon name="info" className="w-3.5 h-3.5" />{sug.reason}</div>
              </>
            )}
          </div>
          {sug.dayKey !== 'rest' && day && (
            <div className="border-t border-line divide-y divide-line">
              {day.exercises.slice(0, 7).map((t) => (
                <div key={t.exerciseId} className="flex justify-between items-center px-4 py-2 text-sm">
                  <span className="truncate">{exercises.get(t.exerciseId)?.name ?? t.exerciseId}</span>
                  <span className="font-mono text-xs text-muted shrink-0 ml-3">{t.sets} × {t.repMin}–{t.repMax}</span>
                </div>
              ))}
              {(() => {
                const c = cardioPlan({ lower: isLowerDay(day.exercises.map((t) => t.exerciseId), exercises), date: today, profile: profile! });
                return (
                  <div className="flex justify-between items-center px-4 py-2 text-sm">
                    <span className="truncate text-accent">+ {c.light ? 'Light cardio' : 'Cardio'}: {c.title.toLowerCase()}</span>
                    <span className="font-mono text-xs text-muted shrink-0 ml-3">{c.minutes} min</span>
                  </div>
                );
              })()}
            </div>
          )}
          <div className="p-3 border-t border-line flex gap-2">
            {sug.dayKey === 'rest' ? (
              <button className="btn-ghost flex-1" onClick={() => setOffset(offset + 1)}>Train anyway</button>
            ) : sug.trainedToday ? (
              <Link to="/progress" className="btn-ghost flex-1">See today's session</Link>
            ) : (
              <button className="btn-primary flex-1 h-12 text-base" onClick={() => start(sug.dayKey)}>
                <Icon name="bolt" className="w-5 h-5" /> Start {day?.name}
              </button>
            )}
          </div>
        </section>
      )}

      {neglected.length > 0 && workouts.length >= 2 && (
        <div className="card p-3.5 flex gap-3 items-start">
          <Icon name="alert" className="w-5 h-5 text-warn shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold">Not trained in 7+ days: </span>
            <span className="text-muted">{neglected.map((m) => MUSCLE_LABEL[m]).join(', ')}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <MiniStat label="This week" value={thisWeek.length} unit={`/${split!.daysPerWeek}`} />
        <MiniStat label="Volume" value={store.w(weekVolume, 0).toLocaleString()} unit={store.wUnit} />
        <button onClick={() => setWeighIn(true)} className="card p-3 text-left hover:border-muted transition">
          <div className="eyebrow">Weight</div>
          <div className="num text-2xl leading-none mt-1">{store.w(profile!.weightKg)}<span className="text-xs text-muted font-sans ml-0.5">{store.wUnit}</span></div>
          <div className={`text-[11px] mt-1 font-semibold ${loggedToday ? 'text-good' : 'text-accent'}`}>{loggedToday ? '✓ Logged today' : '+ Log today'}</div>
        </button>
      </div>

      <Link to="/food" className="card p-4 flex items-center gap-4 hover:border-muted transition">
        <Ring value={eatenToday} max={target} size={64} stroke={7}><Icon name="food" className="w-5 h-5 text-muted" /></Ring>
        <div className="flex-1">
          <div className="eyebrow">Food today</div>
          <div className="num text-2xl leading-none mt-1">{Math.round(eatenToday).toLocaleString()}<span className="text-sm text-muted font-sans ml-1">/ {target.toLocaleString()} kcal</span></div>
          <div className="text-[11px] text-accent font-semibold mt-1">+ Snap or log a meal</div>
        </div>
        <Icon name="chevron" className="w-4 h-4 text-muted" />
      </Link>

      <CalorieCard profile={profile!} />
      <BmiCard profile={profile!} compact />

      {prs.length > 0 && (
        <section className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="eyebrow">Recent PRs</div>
            <Link to="/progress" className="text-xs text-muted hover:text-ink">All</Link>
          </div>
          <div className="space-y-2">
            {prs.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent grid place-items-center"><Icon name="trophy" className="w-4 h-4" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{exercises.get(p.exerciseId)?.name}</div>
                  <div className="text-xs text-muted">{p.kind === 'e1rm' ? `Est. 1RM ${store.w(p.value)} ${store.wUnit}` : p.kind === 'weight' ? 'Heaviest weight' : 'Most reps at weight'} · {fmtDate(p.date)}</div>
                </div>
                <div className="font-mono text-sm">{store.w(p.weightKg)}×{p.reps}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <WeighInSheet open={weighIn} onClose={() => setWeighIn(false)} />
    </div>
  );
}

function MiniStat({ label, value, unit }: { label: string; value: React.ReactNode; unit?: string }) {
  return (
    <div className="card p-3">
      <div className="eyebrow">{label}</div>
      <div className="num text-2xl leading-none mt-1">{value}<span className="text-xs text-muted font-sans ml-0.5">{unit}</span></div>
    </div>
  );
}

export function WeighInSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile, logWeight, weights } = useStore();
  const [date, setDate] = useState(isoDate());
  const existing = weights.find((w) => w.date === date);
  const [kg, setKg] = useState<number | null>(existing?.weightKg ?? profile!.weightKg);
  const [saving, setSaving] = useState(false);
  const valid = kg != null && kg >= 30 && kg <= 300;
  return (
    <Sheet open={open} onClose={onClose} title="Log weight">
      <div className="space-y-4">
        <div><label className="label">Date</label><input type="date" className="field" value={date} max={isoDate()} onChange={(e) => setDate(e.target.value)} /></div>
        <WeightField kg={kg} units={profile!.units} onChange={setKg} error={kg != null && !valid ? 'Enter a weight between 30 and 300 kg.' : undefined} />
        <p className="text-xs text-muted">Weigh yourself in the morning, after the bathroom, before eating — same conditions every time. Your latest weigh-in updates your calorie targets.</p>
        <button className="btn-primary w-full h-12" disabled={!valid || saving} onClick={async () => { setSaving(true); await logWeight(date, kg!); setSaving(false); onClose(); }}>
          {existing ? 'Update' : 'Save'}
        </button>
      </div>
    </Sheet>
  );
}
