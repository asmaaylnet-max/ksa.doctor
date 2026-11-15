import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole, Mail, UserRound, XCircle } from 'lucide-react';
import { AuthShell } from './AuthShell';
import { useAuth } from '../lib/auth';
import { useI18n } from '../i18n';
import { api, ApiError, fieldError, getErrorMessage } from '../lib/api';
import { passwordStrength } from '../lib/format';

type HandleState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export default function Join() {
  const { t, lang } = useI18n();
  const { user, loading, register } = useAuth();
  const navigate = useNavigate();
  const [fullNameAr, setFullNameAr] = useState('');
  const [email, setEmail] = useState('');
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string> | undefined>();
  const [handleState, setHandleState] = useState<HandleState>('idle');

  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    const clean = handle.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (clean !== handle) setHandle(clean);
    if (!clean) {
      setHandleState('idle');
      return;
    }
    if (clean.length < 3) {
      setHandleState('invalid');
      return;
    }
    let cancelled = false;
    setHandleState('checking');
    const timer = window.setTimeout(async () => {
      try {
        const res = await api<{ available: boolean; reason: string }>(`/auth/handle?value=${encodeURIComponent(clean)}`);
        if (!cancelled) setHandleState(res.available ? 'available' : 'taken');
      } catch {
        if (!cancelled) setHandleState('idle');
      }
    }, 380);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [handle]);

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  const strength = passwordStrength(password);
  const strengthLabels = [t('auth.passwordWeak'), t('auth.passwordWeak'), t('auth.passwordMedium'), t('auth.passwordStrong')];
  const strengthColors = ['var(--danger)', 'var(--danger)', 'var(--warn)', 'var(--ok)'];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFields(undefined);
    const nextFields: Record<string, string> = {};
    if (fullNameAr.trim().length < 2) nextFields.fullNameAr = 'name_min';
    if (!/^\S+@\S+\.\S+$/.test(email)) nextFields.email = 'email_invalid';
    if (!/^[a-z0-9]{3,24}$/.test(handle)) nextFields.handle = 'handle_format';
    if (handleState === 'taken') nextFields.handle = 'handle_taken';
    if (password.length < 8) nextFields.password = 'password_min';
    if (password !== confirm) nextFields.confirm = 'password_mismatch';
    if (!agree) nextFields.agree = 'required';
    if (Object.keys(nextFields).length) {
      setFields(nextFields);
      return;
    }
    setSubmitting(true);
    try {
      await register({ fullNameAr: fullNameAr.trim(), email, handle, password });
      navigate('/dashboard?welcome=1', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, t));
      if (err instanceof ApiError) setFields(err.fields);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title={t('auth.registerTitle')}
      subtitle={t('auth.registerSub')}
      footer={
        <span style={{ color: 'var(--muted)' }}>
          {t('auth.haveAccount')} <Link to="/login" className="link">{t('auth.loginCta')}</Link>
        </span>
      }
    >
      <form onSubmit={submit} className="space-y-3.5" noValidate>
        {error && (
          <div className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: 'var(--danger)', background: 'var(--danger-soft)', color: 'var(--danger)' }} role="alert">
            {error}
          </div>
        )}
        <label className="block">
          <span className="field-label">{t('auth.name')}</span>
          <div className="relative">
            <UserRound size={17} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 opacity-50" />
            <input className="input ps-11" value={fullNameAr} onChange={(e) => setFullNameAr(e.target.value)} placeholder={t('auth.namePlaceholder')} autoComplete="name" aria-invalid={!!fields?.fullNameAr} required />
          </div>
          {fields?.fullNameAr && <span className="field-error">{fieldError(fields, 'fullNameAr', t)}</span>}
        </label>
        <label className="block">
          <span className="field-label">{t('auth.email')}</span>
          <div className="relative">
            <Mail size={17} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 opacity-50" />
            <input className="input ps-11" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('auth.emailPlaceholder')} autoComplete="email" dir="ltr" aria-invalid={!!fields?.email} required />
          </div>
          {fields?.email && <span className="field-error">{fieldError(fields, 'email', t)}</span>}
        </label>
        <label className="block">
          <span className="field-label">{t('auth.handle')}</span>
          <div className="flex items-stretch overflow-hidden rounded-2xl border transition-all focus-within:shadow-[0_0_0_4px_var(--ring)]" style={{ borderColor: fields?.handle ? 'var(--danger)' : 'var(--line)', background: 'var(--surface-2)' }}>
            <span className="flex items-center border-e px-3 text-xs font-medium" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }} dir="ltr">ksa.doctor/</span>
            <input
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-[15px] outline-none"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder={t('auth.handlePlaceholder')}
              autoComplete="username"
              dir="ltr"
              aria-invalid={!!fields?.handle}
              required
            />
            <span className="flex w-9 items-center justify-center">
              {handleState === 'checking' && <Loader2 size={16} className="animate-spin opacity-60" />}
              {handleState === 'available' && <CheckCircle2 size={17} style={{ color: 'var(--ok)' }} />}
              {handleState === 'taken' && <XCircle size={17} style={{ color: 'var(--danger)' }} />}
            </span>
          </div>
          {fields?.handle ? (
            <span className="field-error">{fieldError(fields, 'handle', t)}</span>
          ) : handleState === 'available' ? (
            <span className="mt-1.5 flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--ok)' }}><CheckCircle2 size={12} /> {t('auth.handleAvailable')}</span>
          ) : handleState === 'taken' ? (
            <span className="field-error">{t('auth.handleTaken')}</span>
          ) : (
            <span className="field-hint">{t('auth.handleHint')}</span>
          )}
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="field-label">{t('auth.password')}</span>
            <div className="relative">
              <LockKeyhole size={17} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 opacity-50" />
              <input className="input px-11" type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('auth.passwordPlaceholder')} autoComplete="new-password" dir="ltr" aria-invalid={!!fields?.password} required />
              <button type="button" className="absolute end-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 opacity-60 hover:opacity-100" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'}>
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>
          <label className="block">
            <span className="field-label">{t('auth.confirmPassword')}</span>
            <input className="input" type={show ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={t('auth.confirmPassword')} autoComplete="new-password" dir="ltr" aria-invalid={!!fields?.confirm} required />
          </label>
        </div>
        {password && (
          <div className="flex items-center gap-2">
            <div className="flex h-1.5 flex-1 gap-1">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-full flex-1 rounded-full" style={{ background: i < strength ? strengthColors[strength] : 'var(--line)' }} />
              ))}
            </div>
            <span className="text-[11px] font-bold" style={{ color: strengthColors[strength] }}>{strengthLabels[strength]}</span>
          </div>
        )}
        {fields?.password && <span className="field-error">{fieldError(fields, 'password', t)}</span>}
        {fields?.confirm && <span className="field-error">{t('auth.confirmPassword')}</span>}
        <label className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 h-4 w-4 accent-[var(--brand)]" />
          <span>
            {t('auth.agreePrefix')}{' '}
            <Link to="/terms" className="link">{t('common.terms')}</Link> {t('common.or')} <Link to="/privacy" className="link">{t('common.privacy')}</Link>
          </span>
        </label>
        {fields?.agree && <span className="field-error">{t('common.required')}</span>}
        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={submitting}>
          {submitting ? <><Loader2 size={18} className="animate-spin" /> {t('auth.securing')}</> : t('auth.create')}
        </button>
      </form>
    </AuthShell>
  );
}
