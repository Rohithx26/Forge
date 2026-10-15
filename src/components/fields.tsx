import { cmToFtIn, ftInToCm, kgToLb, lbToKg, round, ACTIVITY, RATE_OPTIONS } from '../lib/calc';
import type { ActivityLevel, Goal, UnitSystem } from '../lib/types';
import { NumInput, Segmented } from './ui';

export function HeightField({ cm, units, onChange, error }: { cm: number | null; units: UnitSystem; onChange: (cm: number | null) => void; error?: string }) {
  const fi = cm ? cmToFtIn(cm) : null;
  return (
    <div>
      <label className="label">Height</label>
      {units === 'metric' ? (
        <div className="relative">
          <NumInput ariaLabel="Height in cm" className="field pr-12" value={cm == null ? null : round(cm, 1)} onChange={onChange} placeholder="175" />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm">cm</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <NumInput ariaLabel="Feet" className="field pr-10" value={fi?.ft ?? null} onChange={(ft) => onChange(ft == null ? null : ftInToCm(ft, fi?.inch ?? 0))} placeholder="5" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm">ft</span>
          </div>
          <div className="relative">
            <NumInput ariaLabel="Inches" className="field pr-10" value={fi?.inch ?? null} onChange={(inch) => onChange(ftInToCm(fi?.ft ?? 0, Math.min(11, inch ?? 0)))} placeholder="9" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm">in</span>
          </div>
        </div>
      )}
      {error && <p className="text-xs text-bad mt-1">{error}</p>}
    </div>
  );
}

export function WeightField({ kg, units, onChange, error, label = 'Weight' }: { kg: number | null; units: UnitSystem; onChange: (kg: number | null) => void; error?: string; label?: string }) {
  const display = kg == null ? null : units === 'metric' ? round(kg, 1) : round(kgToLb(kg), 1);
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <NumInput ariaLabel={label} className="field pr-12" value={display} onChange={(v) => onChange(v == null ? null : units === 'metric' ? v : lbToKg(v))} placeholder={units === 'metric' ? '72' : '160'} />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm">{units === 'metric' ? 'kg' : 'lb'}</span>
      </div>
      {error && <p className="text-xs text-bad mt-1">{error}</p>}
    </div>
  );
}

export function ActivityField({ value, onChange }: { value: ActivityLevel; onChange: (v: ActivityLevel) => void }) {
  return (
    <div className="space-y-2">
      {(Object.keys(ACTIVITY) as ActivityLevel[]).map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onChange(k)}
          className={`w-full text-left rounded-xl border px-4 py-3 transition ${value === k ? 'border-accent bg-accent/10' : 'border-line bg-raised hover:border-muted'}`}
        >
          <div className="flex justify-between items-center">
            <span className="font-semibold">{ACTIVITY[k].label}</span>
            <span className="text-xs font-mono text-muted">×{ACTIVITY[k].factor}</span>
          </div>
          <div className="text-xs text-muted mt-0.5">{ACTIVITY[k].hint}</div>
        </button>
      ))}
    </div>
  );
}

export function GoalField({ goal, rate, units, onChange }: { goal: Goal; rate: number; units: UnitSystem; onChange: (goal: Goal, rate: number) => void }) {
  const goals: { v: Goal; label: string; hint: string }[] = [
    { v: 'lose', label: 'Lose weight', hint: 'Calorie deficit, high protein to keep muscle' },
    { v: 'maintain', label: 'Maintain', hint: 'Recomp — eat at maintenance, get stronger' },
    { v: 'gain', label: 'Gain weight', hint: 'Lean bulk — small surplus to build muscle' }
  ];
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {goals.map((g) => (
          <button
            key={g.v}
            type="button"
            onClick={() => onChange(g.v, g.v === 'maintain' ? 0 : g.v === 'lose' ? 0.5 : 0.25)}
            className={`w-full text-left rounded-xl border px-4 py-3 transition ${goal === g.v ? 'border-accent bg-accent/10' : 'border-line bg-raised hover:border-muted'}`}
          >
            <div className="font-semibold">{g.label}</div>
            <div className="text-xs text-muted mt-0.5">{g.hint}</div>
          </button>
        ))}
      </div>
      {goal !== 'maintain' && (
        <div>
          <label className="label">Pace per week</label>
          <Segmented
            value={String(rate)}
            onChange={(v) => onChange(goal, Number(v))}
            options={RATE_OPTIONS[goal].map((r) => ({
              value: String(r),
              label: units === 'metric' ? `${r} kg` : `${round(kgToLb(r), 1)} lb`
            }))}
          />
          <p className="text-xs text-muted mt-2">
            {goal === 'lose' ? '0.5 kg/week is a sustainable default. Faster paces are capped by safety limits.' : 'Slow gains keep fat gain low. 0.25 kg/week suits most lifters past their first year.'}
          </p>
        </div>
      )}
    </div>
  );
}
