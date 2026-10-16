import { useEffect, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { useStore } from './lib/store';
import { backend } from './lib/backend';
import { Alert, Icon } from './components/ui';
import AuthPage from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import WorkoutPage from './pages/Workout';
import ProgressPage from './pages/Progress';
import FoodPage from './pages/Food';
import LibraryPage from './pages/Library';
import ProfilePage from './pages/Profile';

export default function App() {
  const { user, authReady, dataReady, profile, loadError } = useStore();

  if (user && loadError) return <LoadError code={loadError} />;
  if (!authReady || (user && !dataReady)) return <Splash slowHint={!!user} />;
  if (!user) return <AuthPage />;
  if (!profile) return <Onboarding />;

  return (
    <div className="min-h-full">
      {backend.mode === 'local' && (
        <div className="bg-warn/15 text-warn text-[11px] font-semibold text-center py-1 px-3">Demo mode — data is saved on this device only. Add Firebase keys to enable accounts &amp; sync.</div>
      )}
      <main className="max-w-xl mx-auto px-4 pt-5 pb-28">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/workout" element={<WorkoutPage />} />
          <Route path="/food" element={<FoodPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
      <Analytics />
    </div>
  );
}

function BottomNav() {
  const loc = useLocation();
  const items = [
    { to: '/', icon: 'home', label: 'Home' },
    { to: '/workout', icon: 'dumbbell', label: 'Workout' },
    { to: '/food', icon: 'food', label: 'Food' },
    { to: '/progress', icon: 'chart', label: 'Progress' },
    { to: '/library', icon: 'book', label: 'Library' },
    { to: '/profile', icon: 'user', label: 'Profile' }
  ] as const;
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-surface/90 backdrop-blur-lg border-t border-line safe-bottom">
      <div className="max-w-xl mx-auto grid grid-cols-6">
        {items.map((it) => {
          const active = it.to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(it.to);
          return (
            <NavLink key={it.to} to={it.to} className={`flex flex-col items-center gap-1 pt-2.5 pb-2 text-[10px] font-semibold uppercase tracking-wider ${active ? 'text-accent' : 'text-muted hover:text-ink'}`}>
              <Icon name={it.icon} className="w-5 h-5" />
              {it.label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

function Splash({ slowHint }: { slowHint?: boolean }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!slowHint) return;
    const t = setTimeout(() => setSlow(true), 12000);
    return () => clearTimeout(t);
  }, [slowHint]);
  return (
    <div className="h-full grid place-items-center px-6">
      <div className="text-center">
        <Logo className="w-14 h-14 mx-auto animate-pulse" />
        <div className="font-display text-2xl font-extrabold uppercase tracking-widest mt-3">Forge</div>
        {slow && (
          <div className="mt-6 text-sm text-muted max-w-xs space-y-3">
            <p>Loading your data is taking longer than usual. Check your connection.</p>
            <div className="flex gap-2 justify-center">
              <button className="btn-ghost h-9" onClick={() => location.reload()}>Retry</button>
              <button className="btn-ghost h-9" onClick={() => backend.signOut()}>Sign out</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadError({ code }: { code: string }) {
  const denied = code === 'permission-denied';
  return (
    <div className="h-full grid place-items-center px-6">
      <div className="card p-5 max-w-md space-y-3">
        <Alert tone="error" title="Couldn't load your data">
          {denied ? <>Firestore refused access (<span className="font-mono">permission-denied</span>).</> : <>Error: <span className="font-mono">{code}</span></>}
        </Alert>
        {denied && (
          <>
            <p className="text-sm text-muted">The project's security rules haven't been published yet. To fix it:</p>
            <ol className="text-sm list-decimal pl-5 space-y-1">
              <li>Open the Firebase console → <b>Firestore Database → Rules</b>.</li>
              <li>Replace the rules with the contents of <span className="font-mono">firestore.rules</span> from this project.</li>
              <li>Click <b>Publish</b>, then Retry.</li>
            </ol>
          </>
        )}
        <div className="flex gap-2 pt-1">
          <button className="btn-primary flex-1" onClick={() => location.reload()}>Retry</button>
          <button className="btn-ghost" onClick={() => backend.signOut()}>Sign out</button>
        </div>
      </div>
    </div>
  );
}

export function Logo({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden>
      <rect width="512" height="512" rx="112" fill="rgb(var(--raised))" />
      <g fill="rgb(var(--accent))">
        <rect x="96" y="196" width="40" height="120" rx="10" /><rect x="376" y="196" width="40" height="120" rx="10" />
        <rect x="146" y="166" width="44" height="180" rx="12" /><rect x="322" y="166" width="44" height="180" rx="12" />
        <rect x="190" y="240" width="132" height="32" rx="6" />
      </g>
    </svg>
  );
}
