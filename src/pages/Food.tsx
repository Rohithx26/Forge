import { useMemo, useRef, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useStore, uid } from '../lib/store';
import { energyForProfile } from '../lib/calc';
import { addDays, isoDate } from '../lib/training';
import { MEALS, dayTotals, estimateFood, mealForHour, photoToJpeg, sumItems, weekSummary, type Totals } from '../lib/food';
import type { FoodEntry, FoodEstimate, FoodItem, MealType } from '../lib/types';
import { Alert, Empty, Icon, NumInput, Ring, Segmented, Sheet, Toast, confirmDialog, fmtDate } from '../components/ui';
import { FOOD_HISTORY_DAYS } from '../lib/backend';

type Mode = 'photo' | 'text' | 'manual';

export default function FoodPage() {
  const { profile, food, deleteFood } = useStore();
  const today = isoDate();
  const [date, setDate] = useState(today);
  const [logMode, setLogMode] = useState<Mode | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const oldest = addDays(today, -FOOD_HISTORY_DAYS); // nothing older is loaded
  const target = Math.round(energyForProfile(profile!).target);
  const macros = energyForProfile(profile!).macros;

  const eaten = useMemo(() => dayTotals(food, date), [food, date]);
  const entries = food.filter((e) => e.date === date);
  const left = target - Math.round(eaten.kcal);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-4xl font-extrabold uppercase tracking-tight">Food</h1>
        <div className="flex items-center gap-1">
          <button className="w-9 h-9 grid place-items-center rounded-full bg-raised hover:bg-line disabled:opacity-30" aria-label="Previous day" disabled={date <= oldest} onClick={() => setDate(addDays(date, -1))}><Icon name="back" className="w-4 h-4" /></button>
          <button className="text-sm font-semibold w-28 text-center" onClick={() => setDate(today)}>{date === today ? 'Today' : fmtDate(date)}</button>
          <button className="w-9 h-9 grid place-items-center rounded-full bg-raised hover:bg-line disabled:opacity-30" aria-label="Next day" disabled={date >= today} onClick={() => setDate(addDays(date, 1))}><Icon name="chevron" className="w-4 h-4" /></button>
        </div>
      </header>

      <section className="card p-4">
        <div className="flex items-center gap-4">
          <Ring value={eaten.kcal} max={target} size={124} stroke={11}>
            <div>
              <div className="num text-3xl leading-none">{Math.round(eaten.kcal).toLocaleString()}</div>
              <div className="text-[11px] text-muted mt-0.5">of {target.toLocaleString()} kcal</div>
            </div>
          </Ring>
          <div className="flex-1 min-w-0">
            <div className="eyebrow">{left >= 0 ? 'Remaining' : 'Over target'}</div>
            <div className={`num text-3xl leading-none mt-1 ${left >= 0 ? 'text-accent' : 'text-bad'}`}>{Math.abs(left).toLocaleString()}<span className="text-sm text-muted font-sans ml-1">kcal</span></div>
            <div className="space-y-1.5 mt-3">
              <MacroBar label="Protein" g={eaten.proteinG} target={macros.proteinG} color="bg-accent" />
              <MacroBar label="Carbs" g={eaten.carbsG} target={macros.carbsG} color="bg-[#60a5fa]" />
              <MacroBar label="Fat" g={eaten.fatG} target={macros.fatG} color="bg-[#f59e0b]" />
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-3 gap-2">
        <button className="btn-primary h-14 flex-col gap-0.5 text-xs" onClick={() => setLogMode('photo')}><Icon name="camera" />Snap meal</button>
        <button className="btn-ghost h-14 flex-col gap-0.5 text-xs" onClick={() => setLogMode('text')}><Icon name="edit" />Describe</button>
        <button className="btn-ghost h-14 flex-col gap-0.5 text-xs" onClick={() => setLogMode('manual')}><Icon name="plus" />Manual</button>
      </div>

      {entries.length === 0 ? (
        <div className="card"><Empty icon="food" title={date === today ? 'Nothing logged yet today' : 'Nothing logged this day'}>Snap a photo of your meal or describe what you ate, and the calories are estimated for you.</Empty></div>
      ) : (
        MEALS.filter((m) => entries.some((e) => e.meal === m.value)).map((m) => {
          const list = entries.filter((e) => e.meal === m.value);
          const t = sumItems(list.flatMap((e) => e.items));
          return (
            <section key={m.value} className="card">
              <div className="flex items-center justify-between px-4 pt-3 pb-2">
                <div className="eyebrow">{m.label}</div>
                <div className="font-mono text-xs text-muted">{Math.round(t.kcal)} kcal</div>
              </div>
              <div className="divide-y divide-line border-t border-line">
                {list.map((e) => (
                  <div key={e.id} className="px-4 py-2.5">
                    {e.items.map((it, i) => (
                      <div key={i} className="flex items-baseline gap-3 text-sm py-0.5">
                        <span className="flex-1 min-w-0 truncate">{it.name}{it.portion && <span className="text-muted"> · {it.portion}</span>}</span>
                        <span className="font-mono text-xs shrink-0">{Math.round(it.kcal)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between mt-1 text-[11px] text-muted">
                      <span>{e.source === 'photo' ? 'From photo' : e.source === 'text' ? 'From description' : 'Manual'} · P {Math.round(sumItems(e.items).proteinG)} · C {Math.round(sumItems(e.items).carbsG)} · F {Math.round(sumItems(e.items).fatG)}</span>
                      <button className="hover:text-bad" aria-label="Delete entry" onClick={async () => (await confirmDialog({ title: 'Delete this meal?', message: `${e.items.map((i) => i.name).join(', ')} · ${Math.round(sumItems(e.items).kcal)} kcal`, confirmLabel: 'Delete', danger: true })) && deleteFood(e.id)}><Icon name="trash" className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })
      )}

      <WeekCard date={date} target={target} />

      {logMode && <LogFoodSheet key={logMode} date={date} initialMode={logMode} onClose={() => setLogMode(null)} onSaveError={setToast} />}
      {toast && <Toast message={<Alert tone="error" className="border-0 p-0 bg-transparent">{toast}</Alert>} onDone={() => setToast(null)} />}
    </div>
  );
}

function MacroBar({ label, g, target, color }: { label: string; g: number; target: number; color: string }) {
  const pct = Math.min(100, target ? (g / target) * 100 : 0);
  return (
    <div>
      <div className="flex justify-between text-[11px]"><span className="text-muted font-semibold">{label}</span><span className="font-mono">{Math.round(g)}<span className="text-muted">/{target}g</span></span></div>
      <div className="h-1.5 rounded-full bg-raised overflow-hidden mt-0.5"><div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

const axis = { stroke: 'rgb(var(--muted))', fontSize: 11, tickLine: false, axisLine: false } as const;

function WeekCard({ date, target }: { date: string; target: number }) {
  const { food } = useStore();
  const today = isoDate();
  const w = useMemo(() => weekSummary(food, date, target, today), [food, date, target, today]);
  // only logged days up to today; future-dated entries don't count toward the comparison
  const loggedKcal = w.days.filter((d) => d.date <= today).reduce((a, d) => a + d.kcal, 0);
  const diff = Math.round(loggedKcal - w.targetLogged);
  const data = w.days.map((d) => ({ ...d, label: fmtDate(d.date, { weekday: 'narrow' }) }));

  return (
    <section className="card p-4">
      <div className="eyebrow">Week of {fmtDate(w.days[0].date, { day: 'numeric', month: 'short' })}</div>
      <div className="grid grid-cols-3 gap-2 mt-2">
        <div><div className="text-[11px] text-muted">Total</div><div className="num text-2xl leading-none mt-0.5">{Math.round(w.total).toLocaleString()}</div></div>
        <div><div className="text-[11px] text-muted">Daily avg</div><div className="num text-2xl leading-none mt-0.5">{Math.round(w.avgPerLoggedDay).toLocaleString()}</div></div>
        <div>
          <div className="text-[11px] text-muted">vs target</div>
          <div className={`num text-2xl leading-none mt-0.5 ${w.loggedDays === 0 ? '' : diff > 0 ? 'text-warn' : 'text-good'}`}>{w.loggedDays === 0 ? '–' : `${diff > 0 ? '+' : ''}${diff.toLocaleString()}`}</div>
        </div>
      </div>
      <div className="h-40 mt-3 -ml-3">
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid stroke="rgb(var(--line))" vertical={false} />
            <XAxis dataKey="label" {...axis} />
            <YAxis {...axis} width={44} />
            <Tooltip
              contentStyle={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--line))', borderRadius: 12, fontSize: 12, color: 'rgb(var(--ink))' }}
              cursor={{ fill: 'rgb(var(--raised))' }}
              labelFormatter={(_, p) => (p?.[0] ? fmtDate(p[0].payload.date) : '')}
              formatter={(v: number) => [`${Math.round(v)} kcal`, 'Eaten']}
            />
            <ReferenceLine y={target} stroke="rgb(var(--muted))" strokeDasharray="4 4" />
            <Bar dataKey="kcal" radius={[6, 6, 0, 0]}>
              {data.map((d) => <Cell key={d.date} fill={d.kcal > target * 1.05 ? 'rgb(var(--warn))' : 'rgb(var(--accent))'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[11px] text-muted mt-1">Dashed line is your daily target. "vs target" compares what you ate with your target on the {w.loggedDays} day{w.loggedDays === 1 ? '' : 's'} you logged this week.</p>
    </section>
  );
}

/* ---------------- logging ---------------- */
const blankItem = (): FoodItem => ({ name: '', portion: '', kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 });

function LogFoodSheet({ date, initialMode, onClose, onSaveError }: { date: string; initialMode: Mode; onClose: () => void; onSaveError: (msg: string) => void }) {
  const { saveFood } = useStore();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [meal, setMeal] = useState<MealType>(mealForHour(new Date().getHours()));
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState<Awaited<ReturnType<typeof photoToJpeg>> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [estimate, setEstimate] = useState<Pick<FoodEstimate, 'confidence' | 'notes'> | null>(null);
  const [items, setItems] = useState<FoodItem[] | null>(initialMode === 'manual' ? [blankItem()] : null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function pickPhoto(f: File | undefined) {
    if (!f) return;
    setError('');
    try { setPhoto(await photoToJpeg(f)); } catch { setError("Couldn't read that image. Try a JPEG or PNG."); }
  }

  async function analyse() {
    setBusy(true); setError('');
    try {
      const r = await estimateFood(mode === 'photo' && photo ? { image: { data: photo.data, mediaType: photo.mediaType }, text: text || undefined } : { text });
      if (!r.items.length) { setError(r.notes || 'No food found. Try another photo or describe it.'); return; }
      setItems(r.items);
      setEstimate({ confidence: r.confidence, notes: r.notes });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const valid = items && items.length > 0 && items.every((i) => i.name.trim() && i.kcal >= 0);
  function save() {
    if (!valid) return;
    const entry: FoodEntry = { id: uid(), date, createdAt: Date.now(), meal, source: mode, items: items!.map((i) => ({ ...i, name: i.name.trim(), portion: i.portion.trim() })) };
    // don't wait: Firestore only confirms once the server has it, which never happens offline.
    // The write is kept locally and synced later; a refusal (e.g. rules) still surfaces.
    saveFood(entry).catch((e) => onSaveError(`Couldn't save that meal (${(e as { code?: string }).code ?? 'error'}).`));
    onClose();
  }

  const update = (i: number, patch: Partial<FoodItem>) => setItems((xs) => xs!.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const totals: Totals | null = items ? sumItems(items) : null;

  return (
    <Sheet open onClose={onClose} title="Log food">
      <div className="space-y-4">
        <Segmented size="sm" value={meal} onChange={setMeal} options={MEALS} />

        {!items && (
          <>
            <Segmented value={mode} onChange={(m) => { setMode(m); setError(''); if (m === 'manual') setItems([blankItem()]); }} options={[{ value: 'photo', label: 'Photo' }, { value: 'text', label: 'Describe' }, { value: 'manual', label: 'Manual' }]} />

            {mode === 'photo' && (
              <div>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => pickPhoto(e.target.files?.[0])} />
                {photo ? (
                  <button className="block w-full rounded-2xl overflow-hidden border border-line" onClick={() => fileRef.current?.click()} aria-label="Retake photo">
                    <img src={photo.preview} alt="Your meal" className="w-full max-h-72 object-cover" />
                  </button>
                ) : (
                  <button className="w-full h-40 rounded-2xl border-2 border-dashed border-line grid place-items-center text-muted hover:text-ink hover:border-muted" onClick={() => fileRef.current?.click()}>
                    <div className="text-center"><Icon name="camera" className="w-8 h-8 mx-auto" /><div className="text-sm font-semibold mt-2">Take or choose a photo</div></div>
                  </button>
                )}
                <label className="label mt-3">Anything the photo doesn't show? (optional)</label>
                <input className="field" placeholder="e.g. cooked in ghee, 3 rotis, no sugar in tea" value={text} onChange={(e) => setText(e.target.value)} />
              </div>
            )}

            {mode === 'text' && (
              <div>
                <label className="label">What did you eat?</label>
                <textarea className="field h-28 py-2.5 resize-none" placeholder="e.g. 2 boiled eggs, 2 slices brown bread with peanut butter, black coffee" value={text} onChange={(e) => setText(e.target.value)} autoFocus />
              </div>
            )}

            {error && <Alert tone="error" title="Couldn't estimate that">{error} {mode !== 'manual' && <button className="underline font-semibold" onClick={() => { setMode('manual'); setItems([blankItem()]); setError(''); }}>Enter manually</button>}</Alert>}

            <button className="btn-primary w-full h-12" disabled={busy || (mode === 'photo' ? !photo : text.trim().length < 2)} onClick={analyse}>
              {busy ? 'Estimating…' : <><Icon name="bolt" className="w-4 h-4" /> Estimate calories</>}
            </button>
          </>
        )}

        {items && (
          <>
            {estimate && (
              <Alert tone={estimate.confidence === 'low' ? 'warn' : 'info'} title={<span className="capitalize">{estimate.confidence} confidence</span>}>
                {estimate.notes} Check the portions and edit anything that's off.
              </Alert>
            )}
            <div className="space-y-3">
              {items.map((it, i) => (
                <div key={i} className="bg-raised rounded-xl p-3 space-y-2">
                  <div className="flex gap-2">
                    <input className="field h-10 bg-surface" placeholder="Food" value={it.name} onChange={(e) => update(i, { name: e.target.value })} aria-label="Food name" />
                    <button className="w-10 h-10 shrink-0 grid place-items-center rounded-xl text-muted hover:text-bad" aria-label="Remove item" onClick={() => setItems(items.filter((_, j) => j !== i))}><Icon name="x" className="w-4 h-4" /></button>
                  </div>
                  <input className="field h-9 text-sm bg-surface" placeholder="Portion (e.g. 1 bowl)" value={it.portion} onChange={(e) => update(i, { portion: e.target.value })} aria-label="Portion" />
                  <div className="grid grid-cols-4 gap-2">
                    {([['kcal', 'kcal'], ['proteinG', 'P g'], ['carbsG', 'C g'], ['fatG', 'F g']] as const).map(([k, l]) => (
                      <label key={k} className="block">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">{l}</span>
                        <NumInput className="field h-9 text-sm font-mono bg-surface px-2" value={it[k]} onChange={(v) => update(i, { [k]: v ?? 0 })} ariaLabel={l} />
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <button className="btn-outline w-full h-10" onClick={() => setItems([...items, blankItem()])}><Icon name="plus" className="w-4 h-4" /> Add item</button>
            </div>
            {totals && (
              <div className="flex justify-between items-baseline px-1">
                <span className="eyebrow">Total</span>
                <span><span className="num text-2xl">{Math.round(totals.kcal)}</span><span className="text-xs text-muted ml-1">kcal · P {Math.round(totals.proteinG)} · C {Math.round(totals.carbsG)} · F {Math.round(totals.fatG)}</span></span>
              </div>
            )}
            <div className="flex gap-2">
              {mode !== 'manual' && <button className="btn-ghost flex-1 h-12" onClick={() => { setItems(null); setEstimate(null); }}>Back</button>}
              <button className="btn-primary flex-[2] h-12" disabled={!valid || busy} onClick={save}>Save to {fmtDate(date, { weekday: 'short' })}</button>
            </div>
          </>
        )}
      </div>
    </Sheet>
  );
}
