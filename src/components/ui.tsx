import { useEffect, useState, type ReactNode } from 'react';

export function Icon({ name, className = '' }: { name: keyof typeof PATHS; className?: string }) {
  // keep the default size unless the caller sets a width, otherwise the SVG stretches to fill its container
  const cls = /(^|\s)w-/.test(className) ? className : `w-5 h-5 shrink-0 ${className}`;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={cls} aria-hidden>
      {PATHS[name]}
    </svg>
  );
}

const PATHS = {
  home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></>,
  dumbbell: <><path d="M6.5 6.5v11M17.5 6.5v11M3 9v6M21 9v6M6.5 12h11" /></>,
  chart: <><path d="M3 3v18h18" /><path d="m7 15 4-4 3 3 6-7" /></>,
  book: <><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z" /><path d="M4 21.5V4.5" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  check: <path d="m5 12 5 5 9-10" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  chevron: <path d="m9 6 6 6-6 6" />,
  back: <path d="m15 6-6 6 6 6" />,
  timer: <><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2M9 2h6" /></>,
  trophy: <><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M17 5h3a3 3 0 0 1-3 4M7 5H4a3 3 0 0 0 3 4" /></>,
  flame: <path d="M12 22c4 0 7-3 7-7 0-5-5-7-5-12-3 2-6 6-6 9-1-1-2-2-2-4-2 2-1 5-1 7 0 4 3 7 7 7z" />,
  swap: <><path d="M7 4 3 8l4 4" /><path d="M3 8h14" /><path d="m17 20 4-4-4-4" /><path d="M21 16H7" /></>,
  trash: <><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13M9 7V4h6v3" /></>,
  edit: <><path d="M4 20h4L19 9l-4-4L4 16z" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  alert: <><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17h.01" /></>,
  up: <path d="m6 15 6-6 6 6" />,
  down: <path d="m6 9 6 6 6-6" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />,
  scale: <><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M8 9a5 5 0 0 1 8 0l-2 2h-4z" /></>,
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  bed: <><path d="M3 18V8M21 18v-5a3 3 0 0 0-3-3H10v8M3 14h18" /><circle cx="6.5" cy="11" r="1.5" /></>,
  logout: <><path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11" /></>,
  food: <><path d="M7 2v20M4 2v6a3 3 0 0 0 6 0V2" /><path d="M17 22V2c-2.5 1.5-4 4-4 8h4" /></>,
  camera: <><path d="M3 8a2 2 0 0 1 2-2h2l2-2h6l2 2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><circle cx="12" cy="13" r="3.5" /></>,
  grip: <><circle cx="9" cy="6" r="1" /><circle cx="15" cy="6" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="9" cy="18" r="1" /><circle cx="15" cy="18" r="1" /></>
} as const;

export function Sheet({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal>
      <button className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} aria-label="Close" />
      <div className={`relative w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'} max-h-[92vh] overflow-y-auto bg-surface border border-line rounded-t-3xl sm:rounded-3xl animate-rise safe-bottom`}>
        <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur flex items-center justify-between px-5 pt-4 pb-3 border-b border-line">
          <div className="font-display text-xl font-bold uppercase tracking-wide">{title}</div>
          <button onClick={onClose} className="w-9 h-9 grid place-items-center rounded-full bg-raised hover:bg-line" aria-label="Close"><Icon name="x" className="w-4 h-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange, size = 'md' }: { value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void; size?: 'sm' | 'md' }) {
  return (
    <div className="flex p-1 bg-raised rounded-xl border border-line gap-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-lg ${size === 'sm' ? 'h-8 text-xs' : 'h-9 text-sm'} font-semibold transition ${value === o.value ? 'bg-surface text-ink shadow-sm ring-1 ring-line' : 'text-muted hover:text-ink'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Stat({ label, value, unit, sub, accent }: { label: string; value: ReactNode; unit?: string; sub?: ReactNode; accent?: boolean }) {
  return (
    <div>
      <div className="eyebrow">{label}</div>
      <div className={`num text-3xl leading-none mt-1 ${accent ? 'text-accent' : ''}`}>
        {value}{unit && <span className="text-base text-muted ml-1 font-sans font-semibold">{unit}</span>}
      </div>
      {sub && <div className="text-xs text-muted mt-1">{sub}</div>}
    </div>
  );
}

export function Empty({ icon, title, children }: { icon: keyof typeof PATHS; title: string; children?: ReactNode }) {
  return (
    <div className="text-center py-10 px-6">
      <div className="w-12 h-12 rounded-2xl bg-raised grid place-items-center mx-auto mb-3 text-muted"><Icon name={icon} /></div>
      <div className="font-semibold">{title}</div>
      {children && <div className="text-sm text-muted mt-1">{children}</div>}
    </div>
  );
}

export function Toast({ message, onDone }: { message: ReactNode; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2600); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="fixed top-4 inset-x-0 z-[60] flex justify-center px-4 pointer-events-none">
      <div className="animate-rise card px-4 py-3 text-sm font-semibold shadow-2xl">{message}</div>
    </div>
  );
}

/** Numeric input that allows free typing (incl. empty / decimals) */
export function NumInput({ value, onChange, step = 1, min = 0, className = '', placeholder, ariaLabel }: {
  value: number | null; onChange: (v: number | null) => void; step?: number; min?: number; className?: string; placeholder?: string; ariaLabel?: string;
}) {
  const [text, setText] = useState(value == null ? '' : String(value));
  useEffect(() => {
    const parsed = text === '' ? null : Number(text);
    if (parsed !== value) setText(value == null ? '' : String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <input
      inputMode="decimal"
      aria-label={ariaLabel}
      placeholder={placeholder}
      className={className}
      value={text}
      step={step}
      min={min}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => {
        const t = e.target.value.replace(',', '.');
        if (!/^\d*\.?\d*$/.test(t)) return;
        setText(t);
        onChange(t === '' || t === '.' ? null : Number(t));
      }}
    />
  );
}

export function Ring({ value, max, size = 120, stroke = 10, children }: { value: number; max: number; size?: number; stroke?: number; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, max ? value / max : 0));
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgb(var(--raised))" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgb(var(--accent))" strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: 'stroke-dashoffset .6s' }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function Disclaimer() {
  return (
    <p className="text-[11px] leading-relaxed text-muted">
      Estimates use peer-reviewed formulas but are general guidance, not medical advice. Individual needs vary — adjust based on your 2–3 week weight trend, and consult a doctor or registered dietitian if you have a medical condition, are pregnant, or are under 18.
    </p>
  );
}

export function fmtDate(iso: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, opts);
}

export function fmtDuration(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
}
