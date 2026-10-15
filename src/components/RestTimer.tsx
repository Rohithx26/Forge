import { useEffect, useRef, useState } from 'react';
import { Icon } from './ui';

/** Timer keyed on an absolute end time so it survives tab switches and screen locks. */
export function RestTimer({ endsAt, total, onAdjust, onSkip }: { endsAt: number; total: number; onAdjust: (deltaSec: number) => void; onSkip: () => void }) {
  const [now, setNow] = useState(Date.now());
  const fired = useRef(false);
  useEffect(() => { fired.current = false; }, [endsAt]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);
  const left = Math.max(0, Math.ceil((endsAt - now) / 1000));
  useEffect(() => {
    if (left === 0 && !fired.current) {
      fired.current = true;
      beep();
      try { navigator.vibrate?.([200, 100, 200]); } catch { /* unsupported */ }
      const t = setTimeout(onSkip, 2500);
      return () => clearTimeout(t);
    }
  }, [left, onSkip]);
  const pct = total ? 1 - left / total : 1;
  const m = Math.floor(left / 60), s = left % 60;
  return (
    <div className="fixed bottom-[68px] inset-x-0 z-40 px-3 safe-bottom pointer-events-none">
      <div className="max-w-xl mx-auto card shadow-2xl overflow-hidden pointer-events-auto animate-rise">
        <div className="h-1 bg-raised"><div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${pct * 100}%` }} /></div>
        <div className="flex items-center gap-2 p-2.5">
          <Icon name="timer" className={`w-5 h-5 ml-1 ${left === 0 ? 'text-good' : 'text-accent'}`} />
          <div className="num text-3xl w-20">{left === 0 ? 'GO' : `${m}:${String(s).padStart(2, '0')}`}</div>
          <div className="text-xs text-muted flex-1">{left === 0 ? 'Next set!' : 'Rest'}</div>
          <button className="btn-ghost h-9 px-3 font-mono" onClick={() => onAdjust(-15)}>−15</button>
          <button className="btn-ghost h-9 px-3 font-mono" onClick={() => onAdjust(15)}>+15</button>
          <button className="btn-ghost h-9 px-3" onClick={onSkip}>Skip</button>
        </div>
      </div>
    </div>
  );
}

let ctx: AudioContext | null = null;
function beep() {
  try {
    ctx = ctx ?? new (window.AudioContext || (window as any).webkitAudioContext)();
    const c = ctx!;
    [0, 0.25].forEach((offset) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.frequency.value = 880;
      o.connect(g); g.connect(c.destination);
      const t = c.currentTime + offset;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.start(t); o.stop(t + 0.2);
    });
  } catch { /* audio blocked */ }
}
/** Call from a user gesture so iOS allows later beeps. */
export function unlockAudio() {
  try { ctx = ctx ?? new (window.AudioContext || (window as any).webkitAudioContext)(); ctx.resume(); } catch { /* ignore */ }
}
