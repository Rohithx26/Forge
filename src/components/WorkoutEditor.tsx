import { useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import { lastPerformance, overload } from '../lib/training';
import { exerciseEntry } from '../lib/session';
import type { Exercise, LoggedExercise, LoggedSet, Workout } from '../lib/types';
import { Icon, NumInput, Sheet } from './ui';
import { ExercisePicker } from './ExercisePicker';
import { MUSCLE_LABEL, EQUIPMENT_LABEL } from '../data/exercises';

interface Props {
  workout: Workout;
  onChange: (w: Workout) => void;
  /** called when a set is ticked complete (for rest timer) */
  onSetDone?: (restSec: number) => void;
  restFor?: (exerciseId: string) => number;
  history: Workout[];
}

export function WorkoutEditor({ workout, onChange, onSetDone, restFor, history }: Props) {
  const { exercises } = useStore();
  const [picker, setPicker] = useState<null | { replaceIndex: number | null }>(null);

  const update = (i: number, ex: LoggedExercise) => onChange({ ...workout, exercises: workout.exercises.map((e, j) => (j === i ? ex : e)) });
  const remove = (i: number) => onChange({ ...workout, exercises: workout.exercises.filter((_, j) => j !== i) });
  const move = (i: number, d: -1 | 1) => {
    const arr = [...workout.exercises];
    const j = i + d;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    onChange({ ...workout, exercises: arr });
  };

  return (
    <div className="space-y-3">
      {workout.exercises.map((ex, i) => {
        const def = exercises.get(ex.exerciseId);
        if (!def) return null;
        return (
          <ExerciseBlock
            key={`${ex.exerciseId}-${i}`}
            def={def}
            ex={ex}
            history={history}
            workoutId={workout.id}
            onChange={(e) => update(i, e)}
            onRemove={() => remove(i)}
            onReplace={() => setPicker({ replaceIndex: i })}
            onMove={(d) => move(i, d)}
            onSetDone={() => onSetDone?.(restFor?.(ex.exerciseId) ?? 120)}
          />
        );
      })}
      <button className="btn-outline w-full h-12 border-dashed" onClick={() => setPicker({ replaceIndex: null })}>
        <Icon name="plus" /> Add exercise
      </button>
      <ExercisePicker
        open={!!picker}
        onClose={() => setPicker(null)}
        onPick={(def) => {
          const entry = exerciseEntry(def, history, def.compound ? 6 : 10, def.compound ? 10 : 15);
          if (picker?.replaceIndex != null) {
            const old = workout.exercises[picker.replaceIndex];
            entry.repMin = old.repMin; entry.repMax = old.repMax;
            entry.sets = old.sets.map((s) => ({ ...entry.sets[0], done: false, warmup: s.warmup }));
            update(picker.replaceIndex, entry);
          } else {
            onChange({ ...workout, exercises: [...workout.exercises, entry] });
          }
          setPicker(null);
        }}
      />
    </div>
  );
}

function ExerciseBlock({ def, ex, history, workoutId, onChange, onRemove, onReplace, onMove, onSetDone }: {
  def: Exercise; ex: LoggedExercise; history: Workout[]; workoutId: string;
  onChange: (e: LoggedExercise) => void; onRemove: () => void; onReplace: () => void; onMove: (d: -1 | 1) => void; onSetDone: () => void;
}) {
  const store = useStore();
  const [menu, setMenu] = useState(false);
  const [info, setInfo] = useState(false);
  const last = useMemo(() => lastPerformance(def.id, history, workoutId), [def.id, history, workoutId]);
  const sug = useMemo(() => overload(def, last, ex.repMin, ex.repMax), [def, last, ex.repMin, ex.repMax]);
  const lastWork = last?.sets.filter((s) => s.done && !s.warmup) ?? [];
  const doneCount = ex.sets.filter((s) => s.done).length;

  const setSet = (i: number, patch: Partial<LoggedSet>) => onChange({ ...ex, sets: ex.sets.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  const step = store.wUnit === 'kg' ? 2.5 : 5;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-start gap-2 p-3.5 pb-2">
        <button className="flex-1 text-left min-w-0" onClick={() => setInfo(true)}>
          <div className="font-semibold leading-tight">{def.name}</div>
          <div className="text-[11px] text-muted mt-0.5 font-mono">{ex.repMin}–{ex.repMax} reps · {doneCount}/{ex.sets.length} sets</div>
        </button>
        <button className="w-8 h-8 grid place-items-center rounded-lg hover:bg-raised text-muted" onClick={() => setMenu(true)} aria-label="Exercise options">
          <Icon name="grip" className="w-4 h-4" />
        </button>
      </div>
      <div className={`mx-3.5 mb-2 text-xs rounded-lg px-2.5 py-1.5 flex gap-1.5 items-start ${sug.kind === 'increase-weight' ? 'bg-accent/10 text-accent' : sug.kind === 'deload' ? 'bg-warn/10 text-warn' : 'bg-raised text-muted'}`}>
        <Icon name={sug.kind === 'increase-weight' ? 'up' : sug.kind === 'deload' ? 'down' : 'info'} className="w-3.5 h-3.5 shrink-0 mt-px" />
        <span>{store.wUnit === 'lb' ? sug.reason.replace(/(\d+(?:\.\d+)?) kg/g, (_, n) => `${store.w(Number(n))} lb`) : sug.reason}</span>
      </div>

      <div className="grid grid-cols-[2.25rem_1fr_1fr_1fr_2.75rem] gap-1.5 px-3.5 text-[10px] uppercase tracking-wider text-muted font-semibold pb-1">
        <span className="text-center">Set</span><span>Previous</span><span className="text-center">{store.wUnit}</span><span className="text-center">Reps</span><span />
      </div>
      <div className="px-2 pb-2 space-y-1">
        {ex.sets.map((s, i) => {
          const prev = lastWork[i - ex.sets.slice(0, i).filter((x) => x.warmup).length];
          const workIdx = ex.sets.slice(0, i + 1).filter((x) => !x.warmup).length;
          return (
            <div key={i} className={`grid grid-cols-[2.25rem_1fr_1fr_1fr_2.75rem] gap-1.5 items-center rounded-xl px-1.5 py-1 transition ${s.done ? 'bg-good/10' : ''}`}>
              <button
                className={`h-8 rounded-lg text-xs font-bold ${s.warmup ? 'text-warn bg-warn/10' : 'text-muted bg-raised'}`}
                onClick={() => setSet(i, { warmup: !s.warmup })}
                title="Tap to toggle warm-up"
              >
                {s.warmup ? 'W' : workIdx}
              </button>
              <button
                className="text-left text-xs font-mono text-muted truncate"
                disabled={!prev || s.warmup}
                onClick={() => prev && setSet(i, { weightKg: prev.weightKg, reps: prev.reps })}
                title="Tap to copy"
              >
                {prev && !s.warmup ? `${store.w(prev.weightKg)}×${prev.reps}` : '—'}
              </button>
              <NumInput
                ariaLabel={`Set ${i + 1} weight`}
                className="h-9 w-full rounded-lg bg-raised border border-line text-center font-mono text-sm outline-none focus:border-accent"
                value={store.w(s.weightKg, 2)}
                step={step}
                onChange={(v) => setSet(i, { weightKg: store.toKg(v ?? 0) })}
              />
              <NumInput
                ariaLabel={`Set ${i + 1} reps`}
                className="h-9 w-full rounded-lg bg-raised border border-line text-center font-mono text-sm outline-none focus:border-accent"
                value={s.reps}
                onChange={(v) => setSet(i, { reps: Math.round(v ?? 0) })}
              />
              <button
                className={`h-9 rounded-lg grid place-items-center transition ${s.done ? 'bg-good text-black' : 'bg-raised text-muted hover:text-ink border border-line'}`}
                onClick={() => {
                  const done = !s.done;
                  setSet(i, { done });
                  if (done && !s.warmup) onSetDone();
                }}
                aria-label={s.done ? 'Mark set not done' : 'Mark set done'}
              >
                <Icon name="check" className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
      <div className="flex border-t border-line">
        <button className="flex-1 h-10 text-xs font-semibold text-muted hover:text-ink hover:bg-raised flex items-center justify-center gap-1"
          onClick={() => { const l = ex.sets[ex.sets.length - 1]; onChange({ ...ex, sets: [...ex.sets, { weightKg: l?.weightKg ?? sug.weightKg, reps: l?.reps ?? sug.reps, done: false }] }); }}>
          <Icon name="plus" className="w-3.5 h-3.5" /> Add set
        </button>
        {ex.sets.length > 0 && (
          <button className="flex-1 h-10 text-xs font-semibold text-muted hover:text-ink hover:bg-raised border-l border-line flex items-center justify-center gap-1"
            onClick={() => onChange({ ...ex, sets: ex.sets.slice(0, -1) })}>
            <Icon name="minus" className="w-3.5 h-3.5" /> Remove set
          </button>
        )}
      </div>

      <Sheet open={menu} onClose={() => setMenu(false)} title={def.name}>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div><label className="label">Min reps</label><NumInput className="field" value={ex.repMin} onChange={(v) => onChange({ ...ex, repMin: Math.max(1, Math.round(v ?? 1)) })} /></div>
            <div><label className="label">Max reps</label><NumInput className="field" value={ex.repMax} onChange={(v) => onChange({ ...ex, repMax: Math.max(ex.repMin, Math.round(v ?? ex.repMin)) })} /></div>
          </div>
          <button className="btn-ghost w-full justify-start" onClick={() => { onMove(-1); setMenu(false); }}><Icon name="up" /> Move up</button>
          <button className="btn-ghost w-full justify-start" onClick={() => { onMove(1); setMenu(false); }}><Icon name="down" /> Move down</button>
          <button className="btn-ghost w-full justify-start" onClick={() => { onReplace(); setMenu(false); }}><Icon name="swap" /> Replace exercise</button>
          <button className="btn-danger w-full justify-start" onClick={() => { onRemove(); setMenu(false); }}><Icon name="trash" /> Remove from workout</button>
        </div>
      </Sheet>
      <ExerciseInfoSheet def={info ? def : null} onClose={() => setInfo(false)} />
    </div>
  );
}

export function ExerciseInfoSheet({ def, onClose }: { def: Exercise | null; onClose: () => void }) {
  const { workouts } = useStore();
  if (!def) return null;
  const count = workouts.filter((w) => w.exercises.some((e) => e.exerciseId === def.id)).length;
  return (
    <Sheet open onClose={onClose} title={def.name}>
      <ExerciseDetails def={def} sessions={count} />
    </Sheet>
  );
}

export function ExerciseDetails({ def, sessions }: { def: Exercise; sessions?: number }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {def.primary.map((m) => <span key={m} className="chip chip-on">{MUSCLE_LABEL[m]}</span>)}
        {def.secondary.map((m) => <span key={m} className="chip">{MUSCLE_LABEL[m]}</span>)}
        <span className="chip">{EQUIPMENT_LABEL[def.equipment]}</span>
        <span className="chip">{def.compound ? 'Compound' : 'Isolation'}</span>
      </div>
      {def.cues.length > 0 && (
        <div>
          <div className="eyebrow mb-2">Form cues</div>
          <ol className="space-y-2">
            {def.cues.map((c, i) => (
              <li key={i} className="flex gap-3 text-sm"><span className="num text-accent w-4">{i + 1}</span>{c}</li>
            ))}
          </ol>
        </div>
      )}
      {sessions != null && <p className="text-xs text-muted">Logged in {sessions} session{sessions === 1 ? '' : 's'}.</p>}
    </div>
  );
}
