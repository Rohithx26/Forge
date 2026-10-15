import { useState } from 'react';
import { backend, authErrorMessage } from '../lib/backend';
import { Logo } from '../App';

type Mode = 'signin' | 'signup' | 'reset';

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  async function run(fn: () => Promise<void>) {
    setBusy(true); setError(''); setInfo('');
    try { await fn(); } catch (e) { setError(authErrorMessage(e)); } finally { setBusy(false); }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'signin') run(() => backend.signInEmail(email.trim(), pw));
    else if (mode === 'signup') run(() => backend.signUpEmail(name.trim(), email.trim(), pw));
    else run(async () => { await backend.resetPassword(email.trim()); setInfo('Check your inbox for a reset link.'); });
  };

  return (
    <div className="min-h-full flex flex-col">
      <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto px-6 py-10">
        <div className="mb-10">
          <Logo className="w-12 h-12" />
          <h1 className="font-display text-5xl font-extrabold uppercase leading-[0.9] mt-6 tracking-tight">
            Show up.<br />Log it.<br /><span className="text-accent">Get stronger.</span>
          </h1>
          <p className="text-muted mt-4 text-sm">Your split, your numbers, your progress — tracked set by set.</p>
        </div>

        {mode !== 'reset' && (
          <>
            <button className="btn-outline w-full h-12" disabled={busy} onClick={() => run(() => backend.signInGoogle())}>
              <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden><path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.4-1.6 4-5.4 4-3.3 0-5.9-2.7-5.9-6s2.6-6 5.9-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.5 14.6 2.5 12 2.5 6.8 2.5 2.6 6.7 2.6 12s4.2 9.5 9.4 9.5c5.4 0 9-3.8 9-9.2 0-.6-.1-1.1-.2-1.6H12z" /></svg>
              Continue with Google
            </button>
            <div className="flex items-center gap-3 my-5 text-xs text-muted"><div className="h-px flex-1 bg-line" />or<div className="h-px flex-1 bg-line" /></div>
          </>
        )}

        <form onSubmit={submit} className="space-y-3">
          {mode === 'signup' && <input className="field" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />}
          <input className="field" type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          {mode !== 'reset' && (
            <input className="field" type="password" placeholder="Password" required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
          )}
          {error && <p className="text-sm text-bad">{error}</p>}
          {info && <p className="text-sm text-good">{info}</p>}
          <button className="btn-primary w-full h-12" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
          </button>
        </form>

        <div className="mt-5 text-sm text-center text-muted space-y-2">
          {mode === 'signin' && (
            <>
              <button className="hover:text-ink" onClick={() => setMode('reset')}>Forgot password?</button>
              <div>New here? <button className="text-accent font-semibold" onClick={() => setMode('signup')}>Create an account</button></div>
            </>
          )}
          {mode !== 'signin' && <button className="text-accent font-semibold" onClick={() => setMode('signin')}>Back to sign in</button>}
        </div>
      </div>
    </div>
  );
}
