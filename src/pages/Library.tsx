import { useState } from 'react';
import { useStore, uid } from '../lib/store';
import { EQUIPMENT_LABEL, MUSCLE_LABEL } from '../data/exercises';
import type { Equipment, Exercise, Muscle } from '../lib/types';
import { MuscleChips, useExerciseFilter } from '../components/ExercisePicker';
import { ExerciseDetails } from '../components/WorkoutEditor';
import { Icon, Segmented, Sheet } from '../components/ui';

export default function LibraryPage() {
  const { q, setQ, muscle, setMuscle, list } = useExerciseFilter();
  const { workouts } = useStore();
  const [equip, setEquip] = useState<Equipment | 'all'>('all');
  const [open, setOpen] = useState<Exercise | null>(null);
  const [adding, setAdding] = useState(false);
  const filtered = list.filter((e) => equip === 'all' || e.equipment === equip);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <h1 className="font-display text-4xl font-extrabold uppercase tracking-tight">Library</h1>
        <button className="btn-ghost h-9" onClick={() => setAdding(true)}><Icon name="plus" className="w-4 h-4" /> Custom</button>
      </div>
      <div className="relative">
        <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input className="field pl-9" placeholder={`Search ${list.length} exercises`} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <MuscleChips value={muscle} onChange={setMuscle} />
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
        {(['all', 'barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'smith', 'kettlebell'] as const).map((e) => (
          <button key={e} className={`chip ${equip === e ? 'chip-on' : ''}`} onClick={() => setEquip(e)}>{e === 'all' ? 'Any equipment' : EQUIPMENT_LABEL[e]}</button>
        ))}
      </div>
      <div className="card divide-y divide-line">
        {filtered.map((e) => (
          <button key={e.id} className="w-full text-left px-4 py-3 hover:bg-raised flex items-center gap-3" onClick={() => setOpen(e)}>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{e.name}{e.custom && <span className="text-[10px] text-accent ml-1.5">CUSTOM</span>}</div>
              <div className="text-xs text-muted truncate">{e.primary.map((m) => MUSCLE_LABEL[m]).join(', ')} · {EQUIPMENT_LABEL[e.equipment]}</div>
            </div>
            <Icon name="chevron" className="w-4 h-4 text-muted" />
          </button>
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted text-center py-8">No exercises match.</p>}
      </div>
      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.name}>
        {open && <ExerciseDetails def={open} sessions={workouts.filter((w) => w.exercises.some((x) => x.exerciseId === open.id)).length} />}
      </Sheet>
      <CustomExerciseSheet open={adding} onClose={() => setAdding(false)} />
    </div>
  );
}

const ALL_MUSCLES = Object.keys(MUSCLE_LABEL) as Muscle[];

function CustomExerciseSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { saveExercise } = useStore();
  const [name, setName] = useState('');
  const [primary, setPrimary] = useState<Muscle[]>([]);
  const [secondary, setSecondary] = useState<Muscle[]>([]);
  const [equipment, setEquipment] = useState<Equipment>('dumbbell');
  const [compound, setCompound] = useState<'yes' | 'no'>('no');
  const [cues, setCues] = useState('');
  const toggle = (arr: Muscle[], set: (m: Muscle[]) => void, m: Muscle) => set(arr.includes(m) ? arr.filter((x) => x !== m) : [...arr, m]);
  const valid = name.trim().length >= 2 && primary.length > 0;

  async function save() {
    const lowerMuscles: Muscle[] = ['quads', 'hamstrings', 'glutes', 'calves'];
    const region: Exercise['region'] = primary.some((m) => lowerMuscles.includes(m)) ? 'lower' : primary.every((m) => m === 'abs' || m === 'lower-back') ? 'core' : 'upper';
    await saveExercise({
      id: `custom-${uid()}`, name: name.trim(), primary, secondary: secondary.filter((m) => !primary.includes(m)), equipment, region,
      compound: compound === 'yes', cues: cues.split('\n').map((c) => c.trim()).filter(Boolean), custom: true
    });
    setName(''); setPrimary([]); setSecondary([]); setCues('');
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title="Custom exercise">
      <div className="space-y-4">
        <div><label className="label">Name</label><input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Landmine Press" /></div>
        <div>
          <label className="label">Primary muscles</label>
          <div className="flex flex-wrap gap-1.5">{ALL_MUSCLES.map((m) => <button key={m} className={`chip ${primary.includes(m) ? 'chip-on' : ''}`} onClick={() => toggle(primary, setPrimary, m)}>{MUSCLE_LABEL[m]}</button>)}</div>
        </div>
        <div>
          <label className="label">Secondary muscles</label>
          <div className="flex flex-wrap gap-1.5">{ALL_MUSCLES.filter((m) => !primary.includes(m)).map((m) => <button key={m} className={`chip ${secondary.includes(m) ? 'chip-on' : ''}`} onClick={() => toggle(secondary, setSecondary, m)}>{MUSCLE_LABEL[m]}</button>)}</div>
        </div>
        <div>
          <label className="label">Equipment</label>
          <select className="field" value={equipment} onChange={(e) => setEquipment(e.target.value as Equipment)}>
            {(Object.keys(EQUIPMENT_LABEL) as Equipment[]).map((e) => <option key={e} value={e}>{EQUIPMENT_LABEL[e]}</option>)}
          </select>
        </div>
        <div><label className="label">Type</label><Segmented value={compound} onChange={setCompound} options={[{ value: 'yes', label: 'Compound' }, { value: 'no', label: 'Isolation' }]} /></div>
        <div><label className="label">Form cues (one per line)</label><textarea className="field h-24 py-2" value={cues} onChange={(e) => setCues(e.target.value)} /></div>
        <button className="btn-primary w-full h-12" disabled={!valid} onClick={save}>Save exercise</button>
      </div>
    </Sheet>
  );
}
