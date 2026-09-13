import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import { useAuth } from '@/auth/useAuth';
import { supabase } from '@/lib/supabase';

export function Login() {
  const archive = useLocation().pathname.startsWith('/archive');
  const { session, signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');
  const devEmail = import.meta.env.VITE_DEV_LOGIN_EMAIL;
  const devPass = import.meta.env.VITE_DEV_LOGIN_PASSWORD;
  if (session) return <Navigate to={archive ? '/archive/this-week' : '/manage'} replace />;
  async function send(e?: FormEvent) {
    e?.preventDefault();
    if (!email.trim() || status === 'sending') return;
    setError('');
    setStatus('sending');
    try {
      await signInWithMagicLink(email, archive ? '/archive/this-week' : '/manage');
      setStatus('sent');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send your link. Try again.');
      setStatus('idle');
    }
  }
  return (
    <div className="poll-app participant">
      <header className="poll-header">
        <Link className="class-name" to="/">
          Clearview Ward<span>Sunday School</span>
        </Link>
      </header>
      <main className="participant-main login-main">
        <section className="question-card">
          <p className="eyebrow">{archive ? 'Study archive' : "Teacher's desk"}</p>
          <h1>{status === 'sent' ? 'Check your email.' : 'Welcome back.'}</h1>
          <div className="gold-rule" />
          {status === 'sent' ? (
            <>
              <p className="question-detail">
                A sign-in link is on its way to <strong>{email}</strong>. Open it to return to{' '}
                {archive ? 'the study archive' : 'your questions'}.
              </p>
              <button className="text-button" onClick={() => void send()}>
                Resend sign-in link
              </button>
            </>
          ) : (
            <form onSubmit={(e) => void send(e)}>
              <p className="question-detail">
                {archive
                  ? 'Sign in to read and contribute to earlier lessons.'
                  : 'Sign in to prepare questions and listen to your class.'}
              </p>
              <label className="login-label">
                Email address
                <input
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <button className="poll-button" disabled={status === 'sending'}>
                <Mail size={17} />
                {status === 'sending' ? 'Sending…' : 'Send sign-in link'}
              </button>
            </form>
          )}
          {error && (
            <p role="alert" className="poll-notice">
              {error}
            </p>
          )}
        </section>
        <Link className="text-button" to={archive ? '/archive' : '/'}>
          <ArrowLeft size={15} />
          Back to {archive ? 'the archive' : 'class'}
        </Link>
        {import.meta.env.DEV && devEmail && devPass && (
          <button
            className="text-button"
            onClick={async () => {
              const { error } = await supabase.auth.signInWithPassword({
                email: devEmail,
                password: devPass,
              });
              if (error) setError(error.message);
            }}
          >
            Local teacher sign-in
          </button>
        )}
      </main>
    </div>
  );
}
