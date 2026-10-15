import { useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import { MUSCLE_LABEL } from '../data/exercises';
import type { Exercise, Muscle } from '../lib/types';
import { Icon, Sheet } from './ui';

export function useExerciseFilter() {
  const { exercises } = useStore();
  const [q, setQ] = useState('');
  const [muscle, setMuscle] = useState<Muscle | 'all'>('all');
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return [...exercises.values()]
      .filter((e) => (muscle === 'all' ? true : e.primary.includes(muscle)))
      .filter((e) => !term || e.name.toLowerCase().includes(term) || e.equipment.includes(term) || e.primary.some((m) => m.includes(term)))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [exercises, q, muscle]);
  return { q, setQ, muscle, setMuscle, list };
}

export function MuscleChips({ value, onChange }: { value: Muscle | 'all'; onChange: (m: Muscle | 'all') => void }) {
  const muscles: (Muscle | 'all')[] = ['all', 'chest', 'back', 'lats', 'shoulders', 'rear-delts', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes', 'calves', 'abs', 'traps', 'forearms', 'lower-back'];
  return (
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
      {muscles.map((m) => (
        <button key={m} className={`chip ${value === m ? 'chip-on' : ''}`} onClick={() => onChange(m)}>{m === 'all' ? 'All' : MUSCLE_LABEL[m]}</button>
      ))}
    </div>
  );
}

export function ExercisePicker({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (e: Exercise) => void }) {
  const { q, setQ, muscle, setMuscle, list } = useExerciseFilter();
  return (
    <Sheet open={open} onClose={onClose} title="Add exercise">
      <div className="space-y-3">
        <div className="relative">
          <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input autoFocus className="field pl-9" placeholder="Search exercises" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <MuscleChips value={muscle} onChange={setMuscle} />
        <div className="divide-y divide-line -mx-1">
          {list.map((e) => (
            <button key={e.id} className="w-full text-left px-1 py-2.5 hover:bg-raised rounded-lg flex items-center justify-between gap-2" onClick={() => onPick(e)}>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{e.name}{e.custom && <span className="text-[10px] text-accent ml-1.5">CUSTOM</span>}</div>
                <div className="text-xs text-muted">{e.primary.map((m) => MUSCLE_LABEL[m]).join(', ')} · {e.equipment}</div>
              </div>
              <Icon name="plus" className="w-4 h-4 text-muted shrink-0" />
            </button>
          ))}
          {list.length === 0 && <p className="text-sm text-muted text-center py-6">No matches. Add a custom exercise from the Library tab.</p>}
        </div>
      </div>
    </Sheet>
  );
}
