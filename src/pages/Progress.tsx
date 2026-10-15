import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from 'recharts';
import { useStore } from '../lib/store';
import { bmi, e1rm, round } from '../lib/calc';
import { addDays, bestsFor, isoDate, movingAverage, setsPerMuscle, TRACKED_MUSCLES, weekStart, workoutVolume } from '../lib/training';
import { prTimeline } from '../lib/session';
import { MUSCLE_LABEL } from '../data/exercises';
import { Empty, Icon, Segmented, fmtDate } from '../components/ui';
import { WeighInSheet } from './Home';

type Tab = 'body' | 'lifts' | 'weekly' | 'prs';

export default function ProgressPage() {
  const [tab, setTab] = useState<Tab>('body');
  return (
    <div className="space-y-4">
      <h1 className="font-display text-4xl font-extrabold uppercase tracking-tight">Progress</h1>
      <Segmented value={tab} onChange={setTab} options={[{ value: 'body', label: 'Body' }, { value: 'lifts', label: 'Lifts' }, { value: 'weekly', label: 'Weekly' }, { value: 'prs', label: 'PRs' }]} />
      {tab === 'body' && <BodyTab />}
      {tab === 'lifts' && <LiftsTab />}
      {tab === 'weekly' && <WeeklyTab />}
      {tab === 'prs' && <PrTab />}
    </div>
  );
}

const axis = { stroke: 'rgb(var(--muted))', fontSize: 11, tickLine: false, axisLine: false } as const;
const grid = <CartesianGrid stroke="rgb(var(--line))" strokeDasharray="0" vertical={false} />;
const tipStyle = {
  contentStyle: { background: 'rgb(var(--surface))', border: '1px solid rgb(var(--line))', borderRadius: 12, fontSize: 12, color: 'rgb(var(--ink))' },
  labelStyle: { color: 'rgb(var(--muted))', marginBottom: 4 },
  itemStyle: { color: 'rgb(var(--ink))', padding: 0 },
  cursor: { stroke: 'rgb(var(--muted))', strokeWidth: 1, fill: 'rgb(var(--raised))' }
};
const shortDate = (d: string) => fmtDate(d, { day: 'numeric', month: 'short' });

/* ---------------- body ---------------- */
function BodyTab() {
  const { weights, profile, w, wUnit, deleteWeight } = useStore();
  const [range, setRange] = useState<'30' | '90' | '365' | 'all'>('90');
  const [open, setOpen] = useState(false);
  const data = useMemo(() => {
    const from = range === 'all' ? '0000' : addDays(isoDate(), -Number(range));
    const all = weights.map((x) => x.weightKg);
    const ma = movingAverage(all, 7);
    return weights
      .map((x, i) => ({ date: x.date, weight: w(x.weightKg), trend: w(ma[i]), bmi: round(bmi(x.weightKg, profile!.heightCm), 1) }))
      .filter((x) => x.date >= from);
  }, [weights, range, profile, w]);

  const first = data[0], last = data[data.length - 1];
  const change = first && last ? round(last.trend - first.trend, 1) : 0;

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="eyebrow">Body weight</div>
            <div className="num text-4xl leading-none mt-1">{last ? last.weight : w(profile!.weightKg)}<span className="text-base text-muted font-sans ml-1">{wUnit}</span></div>
            {data.length > 1 && <div className={`text-xs mt-1 font-semibold ${change === 0 ? 'text-muted' : (change < 0) === (profile!.goal === 'lose') ? 'text-good' : profile!.goal === 'maintain' ? 'text-muted' : 'text-warn'}`}>{change > 0 ? '+' : ''}{change} {wUnit} trend over period</div>}
          </div>
          <button className="btn-primary h-9" onClick={() => setOpen(true)}><Icon name="plus" className="w-4 h-4" /> Log</button>
        </div>
        <div className="mt-3"><Segmented size="sm" value={range} onChange={setRange} options={[{ value: '30', label: '30D' }, { value: '90', label: '90D' }, { value: '365', label: '1Y' }, { value: 'all', label: 'All' }]} /></div>
        {data.length < 2 ? (
          <Empty icon="scale" title="Log a few weigh-ins">Your trend line appears after two entries. Daily weigh-ins give the smoothest trend.</Empty>
        ) : (
          <>
            <div className="h-56 mt-3 -ml-3">
              <ResponsiveContainer>
                <ComposedChart data={data}>
                  {grid}
                  <XAxis dataKey="date" tickFormatter={shortDate} {...axis} minTickGap={30} />
                  <YAxis domain={['dataMin - 1', 'dataMax + 1']} {...axis} width={44} tickFormatter={(v) => round(v, 1).toString()} />
                  <Tooltip {...tipStyle} labelFormatter={(d) => fmtDate(String(d))} formatter={(v: number, n) => [`${v} ${wUnit}`, n === 'trend' ? '7-day avg' : 'Weigh-in']} />
                  <Scatter dataKey="weight" fill="rgb(var(--muted))" r={3} />
                  <Line dataKey="trend" stroke="rgb(var(--accent))" strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: 'rgb(var(--surface))', strokeWidth: 2 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 text-xs text-muted mt-1 ml-1">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-muted" />Weigh-in</span>
              <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-accent rounded" />7-day average</span>
            </div>
          </>
        )}
      </div>

      {data.length >= 2 && (
        <div className="card p-4">
          <div className="eyebrow">BMI over time</div>
          <div className="h-36 mt-2 -ml-3">
            <ResponsiveContainer>
              <ComposedChart data={data}>
                {grid}
                <XAxis dataKey="date" tickFormatter={shortDate} {...axis} minTickGap={30} />
                <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} {...axis} width={44} tickFormatter={(v) => round(v, 1).toString()} />
                <Tooltip {...tipStyle} labelFormatter={(d) => fmtDate(String(d))} formatter={(v: number) => [v, 'BMI']} />
                <Line dataKey="bmi" stroke="rgb(var(--accent))" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {weights.length > 0 && (
        <div className="card divide-y divide-line">
          {[...weights].reverse().slice(0, 20).map((x) => (
            <div key={x.id} className="flex items-center px-4 py-2.5 text-sm">
              <span className="flex-1 text-muted">{fmtDate(x.date)}</span>
              <span className="font-mono mr-3">{w(x.weightKg)} {wUnit}</span>
              <button className="text-muted hover:text-bad" aria-label="Delete entry" onClick={() => confirm('Delete this weigh-in?') && deleteWeight(x.id)}><Icon name="trash" className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
      <WeighInSheet open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

/* ---------------- lifts ---------------- */
function LiftsTab() {
  const { workouts, exercises, w, wUnit } = useStore();
  const logged = useMemo(() => {
    const count = new Map<string, number>();
    workouts.forEach((wk) => wk.exercises.forEach((e) => e.sets.some((s) => s.done && !s.warmup) && count.set(e.exerciseId, (count.get(e.exerciseId) ?? 0) + 1)));
    return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id).filter((id) => exercises.has(id));
  }, [workouts, exercises]);
  const [sel, setSel] = useState<string>('');
  const [metric, setMetric] = useState<'e1rm' | 'top' | 'volume'>('e1rm');
  const id = sel || logged[0];

  const series = useMemo(() => {
    if (!id) return [];
    return [...workouts].reverse().flatMap((wk) => {
      const ex = wk.exercises.filter((e) => e.exerciseId === id);
      const sets = ex.flatMap((e) => e.sets.filter((s) => s.done && !s.warmup && s.reps > 0));
      if (!sets.length) return [];
      const best = sets.reduce((a, b) => (e1rm(b.weightKg, b.reps) > e1rm(a.weightKg, a.reps) ? b : a));
      return [{
        date: wk.date,
        e1rm: w(e1rm(best.weightKg, best.reps)),
        top: w(Math.max(...sets.map((s) => s.weightKg))),
        volume: w(sets.reduce((a, s) => a + s.weightKg * s.reps, 0), 0),
        best: `${w(best.weightKg)}×${best.reps}`
      }];
    });
  }, [workouts, id, w]);

  if (!logged.length) return <div className="card"><Empty icon="chart" title="No lifts logged yet">Finish a workout and your strength trends show up here.</Empty></div>;
  const bests = bestsFor(id, workouts);
  const label = { e1rm: 'Estimated 1RM', top: 'Heaviest set', volume: 'Session volume' }[metric];

  return (
    <div className="space-y-4">
      <select className="field" value={id} onChange={(e) => setSel(e.target.value)} aria-label="Exercise">
        {logged.map((x) => <option key={x} value={x}>{exercises.get(x)!.name}</option>)}
      </select>
      <div className="grid grid-cols-3 gap-2">
        <div className="card p-3"><div className="eyebrow">Best e1RM</div><div className="num text-2xl">{w(bests.e1rm)}<span className="text-xs text-muted font-sans"> {wUnit}</span></div></div>
        <div className="card p-3"><div className="eyebrow">Heaviest</div><div className="num text-2xl">{w(bests.weight)}<span className="text-xs text-muted font-sans"> {wUnit}</span></div></div>
        <div className="card p-3"><div className="eyebrow">Sessions</div><div className="num text-2xl">{series.length}</div></div>
      </div>
      <div className="card p-4">
        <Segmented size="sm" value={metric} onChange={setMetric} options={[{ value: 'e1rm', label: 'e1RM' }, { value: 'top', label: 'Top set' }, { value: 'volume', label: 'Volume' }]} />
        <div className="eyebrow mt-4">{label} ({wUnit})</div>
        {series.length < 2 ? (
          <p className="text-sm text-muted py-8 text-center">Log this exercise in at least two sessions to see a trend.</p>
        ) : (
          <div className="h-56 mt-2 -ml-3">
            <ResponsiveContainer>
              <ComposedChart data={series}>
                {grid}
                <XAxis dataKey="date" tickFormatter={shortDate} {...axis} minTickGap={30} />
                <YAxis domain={metric === 'volume' ? [0, 'auto'] : ['dataMin - 5', 'dataMax + 5']} {...axis} width={44} tickFormatter={(v) => Math.round(v).toLocaleString()} />
                <Tooltip {...tipStyle} labelFormatter={(d) => fmtDate(String(d))} formatter={(v: number, _n, p: any) => [`${v.toLocaleString()} ${wUnit}${metric === 'e1rm' ? ` (best ${p.payload.best})` : ''}`, label]} />
                <Line dataKey={metric} stroke="rgb(var(--accent))" strokeWidth={2} dot={{ r: 4, fill: 'rgb(var(--accent))', stroke: 'rgb(var(--surface))', strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
        <p className="text-[11px] text-muted mt-2">Estimated 1RM uses the Epley formula: weight × (1 + reps ÷ 30). Most accurate for sets of 10 reps or fewer.</p>
      </div>
      <div className="card divide-y divide-line">
        {[...series].reverse().slice(0, 12).map((s) => (
          <div key={s.date + s.best} className="flex items-center px-4 py-2.5 text-sm">
            <span className="flex-1 text-muted">{fmtDate(s.date)}</span>
            <span className="font-mono w-20 text-right">{s.best}</span>
            <span className="font-mono w-24 text-right text-muted">{s.e1rm} e1RM</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- weekly ---------------- */
function WeeklyTab() {
  const { workouts, exercises, w, wUnit, split } = useStore();
  const thisWeek = weekStart(isoDate());
  const weeks = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => addDays(thisWeek, -7 * (7 - i))).map((ws) => {
      const list = workouts.filter((wk) => weekStart(wk.date) === ws);
      return { week: ws, sessions: list.length, volume: w(list.reduce((a, wk) => a + workoutVolume(wk), 0), 0) };
    });
  }, [workouts, thisWeek, w]);
  const muscleSets = useMemo(() => setsPerMuscle(workouts.filter((wk) => weekStart(wk.date) === thisWeek), exercises), [workouts, exercises, thisWeek]);
  const [view, setView] = useState<'sessions' | 'volume'>('sessions');

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <Segmented size="sm" value={view} onChange={setView} options={[{ value: 'sessions', label: 'Workouts' }, { value: 'volume', label: `Volume (${wUnit})` }]} />
        <div className="h-48 mt-3 -ml-3">
          <ResponsiveContainer>
            <BarChart data={weeks} barCategoryGap="25%">
              {grid}
              <XAxis dataKey="week" tickFormatter={shortDate} {...axis} />
              <YAxis {...axis} width={44} allowDecimals={false} tickFormatter={(v) => Number(v).toLocaleString()} />
              <Tooltip {...tipStyle} labelFormatter={(d) => `Week of ${fmtDate(String(d))}`} formatter={(v: number) => [view === 'sessions' ? `${v} of ${split!.daysPerWeek} planned` : `${v.toLocaleString()} ${wUnit}`, view === 'sessions' ? 'Workouts' : 'Volume']} />
              <Bar dataKey={view} fill="rgb(var(--accent))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card p-4">
        <div className="flex items-baseline justify-between">
          <div className="eyebrow">Hard sets per muscle · this week</div>
          <div className="text-[11px] text-muted">target 10–20</div>
        </div>
        <div className="space-y-2 mt-3">
          {TRACKED_MUSCLES.map((m) => {
            const v = round(muscleSets[m] ?? 0, 1);
            const pct = Math.min(1, v / 20);
            return (
              <div key={m} className="flex items-center gap-3 text-sm">
                <span className="w-24 shrink-0 text-muted">{MUSCLE_LABEL[m]}</span>
                <div className="flex-1 h-2 bg-raised rounded-full relative overflow-hidden">
                  <div className="absolute inset-y-0 left-1/2 w-px bg-line" />
                  <div className={`h-full rounded-full ${v >= 10 ? 'bg-accent' : 'bg-muted'}`} style={{ width: `${pct * 100}%` }} />
                </div>
                <span className="font-mono text-xs w-8 text-right">{v}</span>
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-muted mt-3">Primary muscle = 1 set, secondary = ½ set. Around 10–20 hard sets per muscle per week is the range most research supports for growth.</p>
      </div>
    </div>
  );
}

/* ---------------- PRs ---------------- */
function PrTab() {
  const { workouts, exercises, w, wUnit } = useStore();
  const timeline = useMemo(() => prTimeline(workouts, 50), [workouts]);
  const bests = useMemo(() => {
    const ids = new Set<string>();
    workouts.forEach((wk) => wk.exercises.forEach((e) => ids.add(e.exerciseId)));
    return [...ids].filter((id) => exercises.has(id)).map((id) => ({ id, ...bestsFor(id, workouts) })).filter((b) => b.e1rm > 0).sort((a, b) => b.e1rm - a.e1rm);
  }, [workouts, exercises]);

  if (!bests.length) return <div className="card"><Empty icon="trophy" title="No records yet">PRs are detected automatically from your second session of each exercise onward.</Empty></div>;
  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-4 py-2 text-[10px] uppercase tracking-wider text-muted font-semibold border-b border-line">
          <span>All-time best</span><span className="text-right">Heaviest</span><span className="text-right w-16">e1RM</span>
        </div>
        {bests.map((b) => (
          <div key={b.id} className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-4 py-2.5 text-sm border-b border-line last:border-0">
            <span className="truncate">{exercises.get(b.id)!.name}</span>
            <span className="font-mono text-right">{w(b.weight)}</span>
            <span className="font-mono text-right w-16 text-accent">{w(b.e1rm)}</span>
          </div>
        ))}
        <div className="px-4 py-2 text-[11px] text-muted">Weights in {wUnit}</div>
      </div>
      {timeline.length > 0 && (
        <div className="card p-4">
          <div className="eyebrow mb-3">PR timeline</div>
          <div className="space-y-3">
            {timeline.map((p, i) => (
              <div key={i} className="flex gap-3 items-center">
                <Icon name="trophy" className="w-4 h-4 text-accent shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{exercises.get(p.exerciseId)?.name}</div>
                  <div className="text-xs text-muted">{fmtDate(p.date)} · {p.kind === 'weight' ? 'Heaviest weight' : p.kind === 'e1rm' ? `e1RM ${w(p.value)} ${wUnit}` : 'Rep PR'}</div>
                </div>
                <span className="font-mono text-sm">{w(p.weightKg)}×{p.reps}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
