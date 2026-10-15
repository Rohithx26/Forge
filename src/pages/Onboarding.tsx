import { useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import { ageFromBirthDate, validateProfileInput } from '../lib/calc';
import { recommendSplit, SPLIT_LIST } from '../data/splits';
import type { ActivityLevel, Experience, Goal, Profile, Sex, SplitId, UnitSystem } from '../lib/types';
import { ActivityField, GoalField, HeightField, WeightField } from '../components/fields';
import { BmiCard, CalorieCard } from '../components/Nutrition';
import { Disclaimer, Icon, NumInput, Segmented } from '../components/ui';
import { isoDate } from '../lib/training';

const STEPS = ['You', 'Body', 'Lifestyle', 'Goal', 'Split', 'Plan'] as const;

export default function Onboarding() {
  const { user, saveProfile, logWeight } = useStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(user?.displayName ?? '');
  const [sex, setSex] = useState<Sex>('male');
  const [birthDate, setBirthDate] = useState('');
  const [units, setUnits] = useState<UnitSystem>('metric');
  const [heightCm, setHeight] = useState<number | null>(null);
  const [weightKg, setWeight] = useState<number | null>(null);
  const [bodyFat, setBodyFat] = useState<number | null>(null);
  const [activity, setActivity] = useState<ActivityLevel>('moderate');
  const [experience, setExperience] = useState<Experience>('beginner');
  const [days, setDays] = useState(4);
  const [goal, setGoal] = useState<Goal>('maintain');
  const [rate, setRate] = useState(0);
  const [split, setSplit] = useState<SplitId | null>(null);
  const [saving, setSaving] = useState(false);

  const age = birthDate ? ageFromBirthDate(birthDate) : NaN;
  const errors = validateProfileInput({ heightCm: heightCm ?? NaN, weightKg: weightKg ?? NaN, age, bodyFatPct: bodyFat });
  const recommended = recommendSplit(days, experience);
  const chosenSplit = split ?? recommended;

  const profile: Profile | null = useMemo(() => {
    if (!heightCm || !weightKg || !birthDate) return null;
    return {
      name: name.trim() || 'Lifter', sex, birthDate, heightCm, weightKg, bodyFatPct: bodyFat, activity, experience,
      goal, ratePerWeekKg: rate, units, split: chosenSplit, restSeconds: 120, theme: 'dark', createdAt: Date.now()
    };
  }, [name, sex, birthDate, heightCm, weightKg, bodyFat, activity, experience, goal, rate, units, chosenSplit]);

  const canNext = [
    !!birthDate && !errors.age,
    !!heightCm && !!weightKg && !errors.heightCm && !errors.weightKg && !errors.bodyFatPct,
    true, true, true, !!profile
  ][step];

  async function finish() {
    if (!profile) return;
    setSaving(true);
    await saveProfile(profile);
    await logWeight(isoDate(), profile.weightKg);
  }

  return (
    <div className="min-h-full max-w-md mx-auto px-5 pt-6 pb-32">
      <div className="flex items-center gap-1.5 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-accent' : 'bg-raised'}`} />
        ))}
      </div>
      <div className="eyebrow">Step {step + 1} of {STEPS.length}</div>

      {step === 0 && (
        <Section title="About you" sub="Used to calculate your energy needs accurately.">
          <div><label className="label">Name</label><input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" /></div>
          <div><label className="label">Sex (for BMR formula)</label>
            <Segmented value={sex} onChange={setSex} options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]} />
          </div>
          <div>
            <label className="label">Date of birth</label>
            <input type="date" className="field" value={birthDate} max={isoDate()} onChange={(e) => setBirthDate(e.target.value)} />
            {birthDate && errors.age && <p className="text-xs text-bad mt-1">{errors.age}</p>}
            {birthDate && !errors.age && <p className="text-xs text-muted mt-1">Age {age}</p>}
          </div>
          <div><label className="label">Units</label>
            <Segmented value={units} onChange={setUnits} options={[{ value: 'metric', label: 'kg · cm' }, { value: 'imperial', label: 'lb · ft' }]} />
          </div>
        </Section>
      )}

      {step === 1 && (
        <Section title="Your body" sub="Be honest — accuracy here drives every number.">
          <HeightField cm={heightCm} units={units} onChange={setHeight} error={heightCm ? errors.heightCm : undefined} />
          <WeightField kg={weightKg} units={units} onChange={setWeight} error={weightKg ? errors.weightKg : undefined} />
          <div>
            <label className="label">Body fat % <span className="normal-case tracking-normal font-normal">(optional)</span></label>
            <div className="relative">
              <NumInput ariaLabel="Body fat percent" className="field pr-10" value={bodyFat} onChange={setBodyFat} placeholder="Leave blank if unsure" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm">%</span>
            </div>
            {errors.bodyFatPct ? <p className="text-xs text-bad mt-1">{errors.bodyFatPct}</p> : <p className="text-xs text-muted mt-1">If you know it (DEXA, calipers, smart scale), we'll use the Katch-McArdle formula — more accurate for lean or muscular people.</p>}
          </div>
        </Section>
      )}

      {step === 2 && (
        <Section title="Lifestyle" sub="Your activity outside the gym matters as much as training.">
          <ActivityField value={activity} onChange={setActivity} />
          <div><label className="label">Training experience</label>
            <Segmented value={experience} onChange={setExperience} options={[{ value: 'beginner', label: '< 1 yr' }, { value: 'intermediate', label: '1–3 yrs' }, { value: 'advanced', label: '3+ yrs' }]} />
          </div>
          <div><label className="label">Days you can train per week</label>
            <Segmented value={String(days)} onChange={(v) => { setDays(Number(v)); setSplit(null); }} options={[3, 4, 5, 6].map((d) => ({ value: String(d), label: String(d) }))} />
          </div>
        </Section>
      )}

      {step === 3 && (
        <Section title="Your goal" sub="We'll set calories and macros to match.">
          <GoalField goal={goal} rate={rate} units={units} onChange={(g, r) => { setGoal(g); setRate(r); }} />
        </Section>
      )}

      {step === 4 && (
        <Section title="Pick a split" sub="You can switch or customise it any time.">
          {SPLIT_LIST.map((s) => (
            <button key={s.id} onClick={() => setSplit(s.id)} className={`w-full text-left rounded-xl border px-4 py-3 transition ${chosenSplit === s.id ? 'border-accent bg-accent/10' : 'border-line bg-raised hover:border-muted'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{s.name}</span>
                <span className="flex gap-1.5 items-center">
                  {s.id === recommended && <span className="chip chip-on h-6">Recommended</span>}
                  <span className="chip h-6">{s.daysPerWeek}d/wk</span>
                </span>
              </div>
              <div className="text-xs text-muted mt-1">{s.description}</div>
            </button>
          ))}
        </Section>
      )}

      {step === 5 && profile && (
        <Section title="Your plan" sub="Here's where you start.">
          <BmiCard profile={profile} />
          <CalorieCard profile={profile} detailed />
          <Disclaimer />
        </Section>
      )}

      <div className="fixed bottom-0 inset-x-0 bg-bg/90 backdrop-blur border-t border-line safe-bottom">
        <div className="max-w-md mx-auto px-5 py-3 flex gap-3">
          {step > 0 && <button className="btn-ghost w-14" onClick={() => setStep(step - 1)} aria-label="Back"><Icon name="back" /></button>}
          {step < STEPS.length - 1 ? (
            <button className="btn-primary flex-1 h-12" disabled={!canNext} onClick={() => setStep(step + 1)}>Continue</button>
          ) : (
            <button className="btn-primary flex-1 h-12" disabled={!profile || saving} onClick={finish}>{saving ? 'Saving…' : "Let's train"}</button>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="animate-rise">
      <h1 className="font-display text-4xl font-extrabold uppercase tracking-tight mt-1">{title}</h1>
      <p className="text-muted text-sm mt-1 mb-6">{sub}</p>
      <div className="space-y-5">{children}</div>
    </div>
  );
}
