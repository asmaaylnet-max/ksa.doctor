import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole } from 'lucide-react';
import { AuthShell } from './AuthShell';
import { api, ApiError, getErrorMessage } from '../lib/api';
import { deriveProof } from '../../shared/auth';
import { useI18n } from '../i18n';
import { useAuth } from '../lib/auth';
import { passwordStrength } from '../lib/format';

export default function Reset() {
  const { t } = useI18n();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const token = params.get('token') || '';
  const email = params.get('email') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const validLink = !!token && !!email;
  const strength = passwordStrength(password);
  const strengthColors = ['var(--danger)', 'var(--danger)', 'var(--warn)', 'var(--ok)'];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError(t('err.password_min'));
      return;
    }
    if (password !== confirm) {
      setError(t('auth.passwordHint'));
      return;
    }
    setSubmitting(true);
    try {
      const proof = await deriveProof(password, email);
      await api('/auth/reset', { method: 'POST', body: JSON.stringify({ token, email, proof }) });
      await refresh();
      setDone(true);
      window.setTimeout(() => navigate('/dashboard', { replace: true }), 1400);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'invalid_token') setError(t('err.invalid_token'));
      else setError(getErrorMessage(err, t));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title={t('auth.resetTitle')}
      subtitle={t('auth.resetSub')}
      footer={<Link to="/login" className="link">{t('auth.backToLogin')}</Link>}
    >
      {!validLink ? (
        <div className="card p-6 text-center">
          <h2 className="text-lg font-extrabold">{t('err.invalid_token')}</h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>{t('auth.forgotSub')}</p>
          <Link to="/forgot" className="btn btn-primary mt-5 w-full">{t('auth.forgotTitle')}</Link>
        </div>
      ) : done ? (
        <div className="card p-6 text-center">
          <CheckCircle2 size={44} className="mx-auto" style={{ color: 'var(--ok)' }} />
          <h2 className="mt-3 text-lg font-extrabold">{t('auth.resetDone')}</h2>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          {error && <div className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: 'var(--danger)', background: 'var(--danger-soft)', color: 'var(--danger)' }}>{error}</div>}
          <div className="rounded-2xl border px-4 py-2.5 text-xs" style={{ borderColor: 'var(--line)', color: 'var(--muted)', background: 'var(--surface-2)' }} dir="ltr">
            {email}
          </div>
          <label className="block">
            <span className="field-label">{t('auth.password')}</span>
            <div className="relative">
              <LockKeyhole size={17} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 opacity-50" />
              <input className="input px-11" type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('auth.passwordPlaceholder')} autoComplete="new-password" dir="ltr" required />
              <button type="button" className="absolute end-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 opacity-60 hover:opacity-100" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'}>
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>
          {password && (
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => <span key={i} className="h-1.5 flex-1 rounded-full" style={{ background: i < strength ? strengthColors[strength] : 'var(--line)' }} />)}
            </div>
          )}
          <label className="block">
            <span className="field-label">{t('auth.confirmPassword')}</span>
            <input className="input" type={show ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={t('auth.confirmPassword')} autoComplete="new-password" dir="ltr" required />
          </label>
          <button className="btn btn-primary btn-lg w-full" disabled={submitting}>
            {submitting ? <><Loader2 size={18} className="animate-spin" /> {t('auth.securing')}</> : t('auth.resetCta')}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
