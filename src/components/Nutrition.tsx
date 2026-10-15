import { bmi, bmiCategory, energyForProfile, healthyWeightRange, round, ACTIVITY } from '../lib/calc';
import type { Profile } from '../lib/types';
import { Alert } from './ui';

const CAT_COLOR = { Underweight: 'text-warn', Normal: 'text-good', Overweight: 'text-warn', Obese: 'text-bad' } as const;

export function BmiCard({ profile, compact }: { profile: Profile; compact?: boolean }) {
  const v = bmi(profile.weightKg, profile.heightCm);
  const cat = bmiCategory(v);
  const range = healthyWeightRange(profile.heightCm);
  const imperial = profile.units === 'imperial';
  const fmtW = (kg: number) => (imperial ? `${Math.round(kg / 0.45359237)} lb` : `${round(kg, 1)} kg`);
  // scale 15 → 40
  const pos = Math.max(0, Math.min(1, (v - 15) / 25));
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="eyebrow">BMI</div>
          <div className="num text-4xl leading-none mt-1">{round(v, 1).toFixed(1)}</div>
          <div className={`text-sm font-semibold mt-1 ${CAT_COLOR[cat]}`}>{cat}</div>
        </div>
        {!compact && (
          <div className="text-right text-xs text-muted">
            Healthy range for your height
            <div className="font-mono text-ink text-sm mt-0.5">{fmtW(range.min)} – {fmtW(range.max)}</div>
          </div>
        )}
      </div>
      <div className="mt-4">
        <div className="relative h-2 rounded-full overflow-hidden flex">
          <div className="bg-warn/70" style={{ width: `${(3.5 / 25) * 100}%` }} />
          <div className="bg-good/80" style={{ width: `${(6.5 / 25) * 100}%` }} />
          <div className="bg-warn/70" style={{ width: `${(5 / 25) * 100}%` }} />
          <div className="bg-bad/70 flex-1" />
        </div>
        <div className="relative h-3">
          <div className="absolute -top-3.5 w-1 h-5 rounded-full bg-ink ring-2 ring-surface" style={{ left: `calc(${pos * 100}% - 2px)` }} />
        </div>
        <div className="relative h-3 text-[10px] font-mono text-muted -mt-1">
          {[18.5, 25, 30].map((t) => (
            <span key={t} className="absolute -translate-x-1/2" style={{ left: `${((t - 15) / 25) * 100}%` }}>{t}</span>
          ))}
        </div>
      </div>
      {!compact && <p className="text-[11px] text-muted mt-3">BMI doesn't account for muscle. If you lift seriously, a "high" BMI may still be lean — track waist and body-fat trends too.</p>}
    </div>
  );
}

export function CalorieCard({ profile, detailed }: { profile: Profile; detailed?: boolean }) {
  const r = energyForProfile(profile);
  const m = r.macros;
  const total = m.proteinKcal + m.fatKcal + m.carbsKcal || 1;
  const goalLabel = profile.goal === 'lose' ? 'Fat loss' : profile.goal === 'gain' ? 'Lean gain' : 'Maintenance';
  const weekly = r.expectedWeeklyChangeKg;
  const imperial = profile.units === 'imperial';
  const fmtRate = (kg: number) => (imperial ? `${round(Math.abs(kg) / 0.45359237, 2)} lb` : `${round(Math.abs(kg), 2)} kg`);

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="eyebrow">Daily target · {goalLabel}</div>
          <div className="num text-5xl leading-none mt-1 text-accent">{Math.round(r.target).toLocaleString()}<span className="text-base text-muted font-sans ml-1">kcal</span></div>
          <div className="text-xs text-muted mt-1.5">
            {profile.goal === 'maintain' ? 'Hold your weight steady' : `${weekly < 0 ? 'Lose' : 'Gain'} ≈ ${fmtRate(weekly)} / week`}
          </div>
        </div>
        <div className="text-right text-xs text-muted leading-relaxed">
          <div>Maintenance</div>
          <div className="font-mono text-ink">{Math.round(r.tdee).toLocaleString()}</div>
          <div className="mt-1">{r.target < r.tdee ? 'Deficit' : r.target > r.tdee ? 'Surplus' : 'Adj.'}</div>
          <div className="font-mono text-ink">{r.target - r.tdee > 0 ? '+' : ''}{Math.round(r.target - r.tdee)}</div>
        </div>
      </div>

      <div className="flex h-2.5 rounded-full overflow-hidden mt-4 gap-0.5">
        <div className="bg-accent" style={{ width: `${(m.proteinKcal / total) * 100}%` }} />
        <div className="bg-[#60a5fa]" style={{ width: `${(m.carbsKcal / total) * 100}%` }} />
        <div className="bg-[#f59e0b]" style={{ width: `${(m.fatKcal / total) * 100}%` }} />
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3">
        <Macro label="Protein" g={m.proteinG} dot="bg-accent" />
        <Macro label="Carbs" g={m.carbsG} dot="bg-[#60a5fa]" />
        <Macro label="Fat" g={m.fatG} dot="bg-[#f59e0b]" />
      </div>

      {r.warnings.map((w) => (
        <Alert key={w} tone="warn" className="mt-3">{w}</Alert>
      ))}

      {detailed && (
        <div className="mt-4 pt-4 border-t border-line text-xs space-y-1.5 font-mono">
          <Row k={`BMR (${r.formula})`} v={`${Math.round(r.bmr)} kcal`} />
          <Row k={`× ${ACTIVITY[profile.activity].label} (${ACTIVITY[profile.activity].factor})`} v={`${Math.round(r.tdee)} kcal`} />
          {profile.goal !== 'maintain' && <Row k={`${profile.goal === 'lose' ? '−' : '+'} ${profile.ratePerWeekKg} kg/wk × 7700 ÷ 7`} v={`${Math.round(r.requestedAdjustment)} kcal`} />}
          {r.floored && <Row k="Safety floor applied" v={`${Math.round(r.floor)} kcal`} />}
          <Row k="Protein" v={`${profile.goal === 'lose' ? '2.2' : '1.8'} g/kg`} />
          <Row k="Fat" v="25% kcal (≥0.6 g/kg)" />
        </div>
      )}
    </div>
  );
}

function Macro({ label, g, dot }: { label: string; g: number; dot: string }) {
  return (
    <div className="bg-raised rounded-xl p-2.5">
      <div className="flex items-center gap-1.5 text-[11px] text-muted font-semibold uppercase tracking-wider"><span className={`w-2 h-2 rounded-full ${dot}`} />{label}</div>
      <div className="num text-2xl mt-0.5">{g}<span className="text-xs text-muted font-sans ml-0.5">g</span></div>
    </div>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-3"><span className="text-muted">{k}</span><span>{v}</span></div>;
}
