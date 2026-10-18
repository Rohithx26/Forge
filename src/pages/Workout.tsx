import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, loadActive, saveActive, loadSwap } from '../lib/store';
import { detectPRs, isoDate, suggestToday, workingSets, workoutVolume } from '../lib/training';
import { blankWorkout, workoutFromDay } from '../lib/session';
import type { PR, Workout } from '../lib/types';
import { WorkoutEditor } from '../components/WorkoutEditor';
import { RestTimer, unlockAudio } from '../components/RestTimer';
import { Alert, Icon, Sheet, confirmDialog, fmtDate, fmtDuration } from '../components/ui';
import { CardioCard, cardioSummary } from '../components/Cardio';
import { warmupFor } from '../data/exercises';

export default function WorkoutPage() {
  const [active, setActiveState] = useState<Workout | null>(() => loadActive());
  const setActive = useCallback((w: Workout | null) => { saveActive(w); setActiveState(w); }, []);
  const [summary, setSummary] = useState<{ w: Workout; prs: PR[] } | null>(null);

  if (summary) return <FinishSummary w={summary.w} prs={summary.prs} onClose={() => setSummary(null)} />;
  if (!active) return <StartScreen onStart={setActive} />;
  return <ActiveSession workout={active} setWorkout={setActive} onFinished={(w, prs) => { setActive(null); setSummary({ w, prs }); }} />;
}

/* ---------------- start ---------------- */
function StartScreen({ onStart }: { onStart: (w: Workout) => void }) {
  const { split, workouts, exercises, wUnit, w } = useStore();
  const sug = suggestToday(split!, workouts, isoDate(), loadSwap(isoDate()));
  const [view, setView] = useState<Workout | null>(null);
  const start = (wk: Workout) => { unlockAudio(); onStart(wk); };

  return (
    <div className="space-y-5">
      <h1 className="font-display text-4xl font-extrabold uppercase tracking-tight">Train</h1>

      <section>
        <div className="eyebrow mb-2">{split!.name}</div>
        <div className="grid gap-2">
          {split!.days.map((d) => {
            const isNext = d.key === sug.dayKey && !sug.trainedToday;
            return (
              <button key={d.key} onClick={() => start(workoutFromDay(split!, d.key, workouts, exercises))}
                className={`card p-4 text-left flex items-center gap-3 hover:border-muted transition ${isNext ? 'border-accent/70' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-2xl font-bold uppercase leading-none">{d.name}</span>
                    {isNext && <span className="chip chip-on h-5 text-[10px]">Up next</span>}
                  </div>
                  <div className="text-xs text-muted mt-1 truncate">{d.focus} · {d.exercises.length} exercises</div>
                </div>
                <Icon name="chevron" className="w-5 h-5 text-muted" />
              </button>
            );
          })}
          <button onClick={() => start(blankWorkout())} className="card p-4 text-left flex items-center gap-3 border-dashed hover:border-muted">
            <div className="flex-1"><div className="font-semibold">Empty workout</div><div className="text-xs text-muted">Build it as you go</div></div>
            <Icon name="plus" className="w-5 h-5 text-muted" />
          </button>
        </div>
      </section>

      <section>
        <div className="eyebrow mb-2">History</div>
        {workouts.length === 0 ? (
          <div className="card text-sm text-muted p-4">No workouts yet. Your finished sessions will show up here.</div>
        ) : (
          <div className="card divide-y divide-line">
            {workouts.slice(0, 30).map((wk) => (
              <button key={wk.id} className="w-full text-left p-3.5 flex items-center gap-3 hover:bg-raised" onClick={() => setView(wk)}>
                <div className="w-11 text-center">
                  <div className="text-[10px] uppercase text-muted font-semibold">{fmtDate(wk.date, { month: 'short' })}</div>
                  <div className="num text-xl leading-none">{fmtDate(wk.date, { day: 'numeric' })}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{wk.title}</div>
                  <div className="text-xs text-muted">{workingSets(wk)} sets · {w(workoutVolume(wk), 0).toLocaleString()} {wUnit}{wk.endedAt ? ` · ${fmtDuration(wk.endedAt - wk.startedAt)}` : ''}</div>
                </div>
                <Icon name="chevron" className="w-4 h-4 text-muted" />
              </button>
            ))}
          </div>
        )}
      </section>
      {view && <HistorySheet workout={view} onClose={() => setView(null)} />}
    </div>
  );
}

/* ---------------- history view/edit ---------------- */
function HistorySheet({ workout, onClose }: { workout: Workout; onClose: () => void }) {
  const { workouts, saveWorkout, deleteWorkout, exercises, w, wUnit } = useStore();
  const [edit, setEdit] = useState<Workout | null>(null);
  const others = useMemo(() => workouts.filter((x) => x.id !== workout.id), [workouts, workout.id]);
  return (
    <Sheet open onClose={onClose} title={workout.title} wide>
      {edit ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div><label className="label">Title</label><input className="field" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></div>
            <div><label className="label">Date</label><input type="date" className="field" max={isoDate()} value={edit.date} onChange={(e) => setEdit({ ...edit, date: e.target.value })} /></div>
          </div>
          <WorkoutEditor workout={edit} onChange={setEdit} history={others} />
          <textarea className="field h-20 py-2" placeholder="Notes" value={edit.notes} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} />
          <div className="flex gap-2">
            <button className="btn-ghost flex-1" onClick={() => setEdit(null)}>Cancel</button>
            <button className="btn-primary flex-1" onClick={async () => { await saveWorkout(edit); onClose(); }}>Save changes</button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-muted">{fmtDate(workout.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}{workout.endedAt ? ` · ${fmtDuration(workout.endedAt - workout.startedAt)}` : ''}</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-raised rounded-xl p-3"><div className="eyebrow">Volume</div><div className="num text-2xl">{w(workoutVolume(workout), 0).toLocaleString()} <span className="text-xs text-muted font-sans">{wUnit}</span></div></div>
            <div className="bg-raised rounded-xl p-3"><div className="eyebrow">Working sets</div><div className="num text-2xl">{workingSets(workout)}</div></div>
          </div>
          {workout.exercises.map((ex, i) => (
            <div key={i}>
              <div className="font-semibold text-sm">{exercises.get(ex.exerciseId)?.name ?? ex.exerciseId}</div>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {ex.sets.filter((s) => s.done).map((s, j) => (
                  <span key={j} className={`font-mono text-xs px-2 py-1 rounded-md ${s.warmup ? 'bg-warn/10 text-warn' : 'bg-raised'}`}>{w(s.weightKg)}×{s.reps}</span>
                ))}
                {!ex.sets.some((s) => s.done) && <span className="text-xs text-muted">No completed sets</span>}
              </div>
            </div>
          ))}
          {cardioSummary(workout) && <div className="text-sm"><span className="font-semibold">Cardio</span> <span className="text-muted">· {cardioSummary(workout)}</span></div>}
          {workout.notes && <p className="text-sm bg-raised rounded-xl p-3 whitespace-pre-wrap">{workout.notes}</p>}
          <div className="flex gap-2 pt-2">
            <button className="btn-danger" onClick={async () => { if (await confirmDialog({ title: 'Delete this workout?', message: `${workout.title} on ${fmtDate(workout.date)}. This can't be undone.`, confirmLabel: 'Delete', danger: true })) { await deleteWorkout(workout.id); onClose(); } }}><Icon name="trash" className="w-4 h-4" /> Delete</button>
            <button className="btn-ghost flex-1" onClick={() => setEdit(structuredClone(workout))}><Icon name="edit" className="w-4 h-4" /> Edit</button>
          </div>
        </div>
      )}
    </Sheet>
  );
}

/* ---------------- active session ---------------- */
function ActiveSession({ workout, setWorkout, onFinished }: { workout: Workout; setWorkout: (w: Workout) => void; onFinished: (w: Workout, prs: PR[]) => void }) {
  const { profile, workouts, saveWorkout, getSplit } = useStore();
  const [now, setNow] = useState(Date.now());
  const [rest, setRest] = useState<{ endsAt: number; total: number } | null>(null);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [saving, setSaving] = useState(false);
  const nav = useNavigate();
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  const restFor = useCallback((exerciseId: string) => {
    if (workout.splitId && workout.dayKey) {
      const t = getSplit(workout.splitId).days.find((d) => d.key === workout.dayKey)?.exercises.find((e) => e.exerciseId === exerciseId);
      if (t?.restSec) return t.restSec;
    }
    return profile!.restSeconds;
  }, [workout.splitId, workout.dayKey, getSplit, profile]);

  const done = workingSets(workout);
  const total = workout.exercises.reduce((a, e) => a + e.sets.filter((s) => !s.warmup).length, 0);

  async function finish() {
    setSaving(true);
    const finished: Workout = {
      ...workout,
      endedAt: Date.now(),
      // drop sets never completed and exercises with nothing logged
      exercises: workout.exercises.map((e) => ({ ...e, sets: e.sets.filter((s) => s.done) })).filter((e) => e.sets.length > 0),
      cardio: workout.cardio?.done && workout.cardio.minutes > 0 ? workout.cardio : null
    };
    const prs = detectPRs(finished, [...workouts, finished]);
    await saveWorkout(finished);
    setSaving(false);
    onFinished(finished, prs);
  }

  return (
    <div className="space-y-4">
      <header className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-bg/90 backdrop-blur border-b border-line flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <input className="bg-transparent font-display text-2xl font-extrabold uppercase w-full outline-none" value={workout.title} onChange={(e) => setWorkout({ ...workout, title: e.target.value })} aria-label="Workout title" />
          <div className="text-xs text-muted font-mono">{fmtDuration(now - workout.startedAt)} · {done}/{total} sets</div>
        </div>
        <button className="btn-primary h-10" onClick={() => setConfirmFinish(true)}>Finish</button>
      </header>

      <WarmupCard workout={workout} />

      <WorkoutEditor
        workout={workout}
        onChange={setWorkout}
        history={workouts}
        restFor={restFor}
        onSetDone={(sec) => setRest({ endsAt: Date.now() + sec * 1000, total: sec })}
      />

      <CardioCard workout={workout} onChange={setWorkout} />

      <textarea className="field h-20 py-2" placeholder="Session notes (sleep, energy, pain…)" value={workout.notes} onChange={(e) => setWorkout({ ...workout, notes: e.target.value })} />

      <button className="btn-danger w-full" onClick={async () => { if (await confirmDialog({ title: 'Discard this workout?', message: 'Nothing from this session will be saved.', confirmLabel: 'Discard', danger: true })) { saveActive(null); setWorkout(null as any); nav('/'); } }}>
        Discard workout
      </button>

      {rest && (
        <RestTimer
          endsAt={rest.endsAt}
          total={rest.total}
          onAdjust={(d) => setRest((r) => (r ? { endsAt: Math.max(Date.now(), r.endsAt + d * 1000), total: Math.max(5, r.total + d) } : r))}
          onSkip={() => setRest(null)}
        />
      )}

      <Sheet open={confirmFinish} onClose={() => setConfirmFinish(false)} title="Finish workout?">
        <div className="space-y-4">
          {done === 0
            ? <Alert tone="warn" title="No sets completed yet">Tick off at least one set to save this workout.</Alert>
            : done < total && <Alert tone="info">{total - done} set{total - done === 1 ? '' : 's'} not ticked off. Unticked sets won't be saved.</Alert>}
          <div className="flex gap-2">
            <button className="btn-ghost flex-1" onClick={() => setConfirmFinish(false)}>Keep going</button>
            <button className="btn-primary flex-1" disabled={done === 0 || saving} onClick={finish}>{saving ? 'Saving…' : 'Save workout'}</button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

/* ---------------- warm-up ---------------- */
function WarmupCard({ workout }: { workout: Workout }) {
  const { exercises } = useStore();
  const { title, drills } = warmupFor(workout.exercises.map((e) => exercises.get(e.exerciseId)?.region ?? 'core'));
  // shortcut: ticks live in component state and reset on reload; store them on the Workout if that bothers users
  const [ticked, setTicked] = useState<Set<number>>(new Set());
  const [open, setOpen] = useState(true);
  const allDone = ticked.size === drills.length;
  const toggle = (i: number) => {
    const n = new Set(ticked);
    if (n.has(i)) n.delete(i); else n.add(i);
    setTicked(n);
    if (n.size === drills.length) setOpen(false);
  };

  return (
    <section className={`card p-4 ${allDone ? 'border-good/60' : ''}`}>
      <button className="w-full flex items-start justify-between gap-3 text-left" onClick={() => setOpen(!open)} aria-expanded={open}>
        <div>
          <div className="eyebrow">Warm-up · 5 min</div>
          <div className="font-display text-2xl font-bold uppercase leading-none mt-1">{title}</div>
          <div className="text-xs text-muted mt-1">{allDone ? 'Loosened up. Go lift.' : `${ticked.size}/${drills.length} drills · loosen up before your first set`}</div>
        </div>
        <Icon name="chevron" className={`w-5 h-5 text-muted shrink-0 transition ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <ul className="mt-3 space-y-1.5">
          {drills.map((d, i) => (
            <li key={d.name}>
              <button className="w-full flex items-center gap-3 text-left py-1" onClick={() => toggle(i)} aria-pressed={ticked.has(i)}>
                <span className={`w-6 h-6 shrink-0 rounded-md grid place-items-center ${ticked.has(i) ? 'bg-good text-black' : 'bg-raised text-muted'}`}><Icon name="check" className="w-4 h-4" /></span>
                <span className="flex-1 min-w-0">
                  <span className={`block text-sm font-semibold ${ticked.has(i) ? 'line-through text-muted' : ''}`}>{d.name}</span>
                  <span className="block text-xs text-muted">{d.how}</span>
                </span>
                <span className="font-mono text-xs text-muted">{d.sec}s</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ---------------- summary ---------------- */
function FinishSummary({ w: wk, prs, onClose }: { w: Workout; prs: PR[]; onClose: () => void }) {
  const { exercises, w, wUnit } = useStore();
  const nav = useNavigate();
  return (
    <div className="min-h-[70vh] flex flex-col justify-center text-center space-y-6 py-6">
      <div className="animate-pop">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-accent text-black grid place-items-center"><Icon name={prs.length ? 'trophy' : 'check'} className="w-10 h-10" /></div>
        <h1 className="font-display text-5xl font-extrabold uppercase tracking-tight mt-5">{prs.length ? `${prs.length} new PR${prs.length > 1 ? 's' : ''}!` : 'Workout saved'}</h1>
        <p className="text-muted mt-1">{wk.title} · {fmtDate(wk.date)}{cardioSummary(wk) ? ` · + ${cardioSummary(wk)}` : ''}</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="card p-3"><div className="eyebrow">Time</div><div className="num text-2xl">{fmtDuration((wk.endedAt ?? Date.now()) - wk.startedAt)}</div></div>
        <div className="card p-3"><div className="eyebrow">Sets</div><div className="num text-2xl">{workingSets(wk)}</div></div>
        <div className="card p-3"><div className="eyebrow">Volume</div><div className="num text-2xl">{w(workoutVolume(wk), 0).toLocaleString()}<span className="text-xs text-muted font-sans"> {wUnit}</span></div></div>
      </div>
      {prs.length > 0 && (
        <div className="card p-4 text-left space-y-2.5">
          {prs.map((p, i) => (
            <div key={i} className="flex items-center gap-3 animate-rise" style={{ animationDelay: `${i * 80}ms` }}>
              <Icon name="trophy" className="w-5 h-5 text-accent shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{exercises.get(p.exerciseId)?.name}</div>
                <div className="text-xs text-muted">{p.kind === 'weight' ? 'Heaviest weight ever' : p.kind === 'e1rm' ? `New est. 1RM: ${w(p.value)} ${wUnit}` : 'Most reps at this weight'}</div>
              </div>
              <span className="font-mono text-sm">{w(p.weightKg)}×{p.reps}</span>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <button className="btn-ghost flex-1" onClick={onClose}>Done</button>
        <button className="btn-primary flex-1" onClick={() => { onClose(); nav('/progress'); }}>See progress</button>
      </div>
    </div>
  );
}
