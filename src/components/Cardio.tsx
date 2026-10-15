import { useStore } from '../lib/store';
import { MACHINE_LABEL, cardioPlan, isLowerDay } from '../lib/cardio';
import type { Workout } from '../lib/types';
import { Icon, NumInput, Segmented } from './ui';

/** Cardio finisher shown under the lifts of an active workout. */
export function CardioCard({ workout, onChange }: { workout: Workout; onChange: (w: Workout) => void }) {
  const { profile, exercises } = useStore();
  const lower = isLowerDay(workout.exercises.map((e) => e.exerciseId), exercises);
  const plan = cardioPlan({ lower, date: workout.date, profile: profile!, machine: workout.cardio?.machine });
  const log = workout.cardio ?? { machine: plan.machine, minutes: plan.minutes, done: false };
  const set = (patch: Partial<typeof log>) => onChange({ ...workout, cardio: { ...log, ...patch } });

  return (
    <section className={`card p-4 ${log.done ? 'border-good/60' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="eyebrow">{plan.light ? 'Light cardio · leg day' : 'Cardio finisher'}</div>
          <div className="font-display text-2xl font-bold uppercase leading-none mt-1">{plan.title}</div>
          <div className="text-xs text-muted mt-1">{plan.minutes} min on the {MACHINE_LABEL[plan.machine].toLowerCase()} · ≈{plan.kcal} kcal</div>
        </div>
        <button
          className={`w-11 h-11 shrink-0 rounded-xl grid place-items-center transition ${log.done ? 'bg-good text-black' : 'bg-raised text-muted hover:text-ink'}`}
          onClick={() => set({ done: !log.done })}
          aria-label={log.done ? 'Mark cardio not done' : 'Mark cardio done'}
          aria-pressed={log.done}
        >
          <Icon name="check" />
        </button>
      </div>

      <div className="mt-3">
        <Segmented size="sm" value={plan.machine} onChange={(m) => set({ machine: m, minutes: plan.minutes })} options={plan.options.map((m) => ({ value: m, label: MACHINE_LABEL[m] }))} />
      </div>

      <ul className="mt-3 space-y-1.5 text-sm">
        {plan.settings.map((s) => (
          <li key={s} className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" /><span>{s}</span></li>
        ))}
      </ul>

      <div className="flex items-center gap-2 mt-3 text-sm">
        <span className="text-muted">Minutes done</span>
        <NumInput className="field h-9 w-20 font-mono text-center" value={log.minutes} onChange={(v) => set({ minutes: v ?? 0 })} ariaLabel="Cardio minutes" />
      </div>
    </section>
  );
}

export function cardioSummary(w: Workout): string | null {
  return w.cardio?.done ? `${w.cardio.minutes} min ${MACHINE_LABEL[w.cardio.machine].toLowerCase()}` : null;
}
