import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Loader2, LockKeyhole, Mail } from 'lucide-react';
import { AuthShell } from './AuthShell';
import { useAuth } from '../lib/auth';
import { useI18n } from '../i18n';
import { ApiError, fieldError, getErrorMessage } from '../lib/api';

export default function Login() {
  const { t } = useI18n();
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string> | undefined>();

  if (!loading && user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFields(undefined);
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setFields({ email: 'email_invalid' });
      return;
    }
    if (password.length < 8) {
      setFields({ password: 'password_min' });
      return;
    }
    setSubmitting(true);
    try {
      const account = await login(email, password);
      const next = params.get('next');
      const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : null;
      navigate(safeNext || (account.role === 'admin' ? '/admin' : '/dashboard'), { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(getErrorMessage(err, t));
        setFields(err.fields);
      } else {
        setError(t('err.generic'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title={t('auth.loginTitle')}
      subtitle={t('auth.loginSub')}
      footer={
        <span style={{ color: 'var(--muted)' }}>
          {t('auth.noAccount')} <Link to="/join" className="link">{t('auth.registerCta')}</Link>
        </span>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && (
          <div className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: 'var(--danger)', background: 'var(--danger-soft)', color: 'var(--danger)' }} role="alert">
            {error}
          </div>
        )}
        <label className="block">
          <span className="field-label">{t('auth.email')}</span>
          <div className="relative">
            <Mail size={17} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 opacity-50" />
            <input
              className="input ps-11"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
              autoComplete="email"
              dir="ltr"
              aria-invalid={!!fields?.email}
              required
            />
          </div>
          {fields?.email && <span className="field-error">{fieldError(fields, 'email', t)}</span>}
        </label>
        <label className="block">
          <span className="field-label">
            {t('auth.password')}
            <Link to="/forgot" className="text-xs font-medium link">{t('auth.forgot')}</Link>
          </span>
          <div className="relative">
            <LockKeyhole size={17} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 opacity-50" />
            <input
              className="input px-11"
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.passwordPlaceholder')}
              autoComplete="current-password"
              dir="ltr"
              aria-invalid={!!fields?.password}
              required
            />
            <button type="button" className="absolute end-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 opacity-60 hover:opacity-100" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'}>
              {show ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {fields?.password && <span className="field-error">{fieldError(fields, 'password', t)}</span>}
        </label>
        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={submitting}>
          {submitting ? <><Loader2 size={18} className="animate-spin" /> {t('auth.securing')}</> : t('auth.loginCta')}
        </button>
        <p className="text-center text-xs" style={{ color: 'var(--muted-2)' }}>{t('auth.adminHint')}</p>
      </form>
    </AuthShell>
  );
}
