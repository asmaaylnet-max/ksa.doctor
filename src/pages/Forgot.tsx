import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { AuthShell } from './AuthShell';
import { api, getErrorMessage } from '../lib/api';
import { useI18n } from '../i18n';

export default function Forgot() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api('/auth/forgot', { method: 'POST', body: JSON.stringify({ email }) });
      setSent(true);
    } catch (err) {
      setError(getErrorMessage(err, t));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title={t('auth.forgotTitle')}
      subtitle={t('auth.forgotSub')}
      footer={<Link to="/login" className="link">{t('auth.backToLogin')}</Link>}
    >
      {sent ? (
        <div className="card p-6 text-center">
          <CheckCircle2 size={44} className="mx-auto" style={{ color: 'var(--ok)' }} />
          <h2 className="mt-3 text-lg font-extrabold">{t('auth.resetSent')}</h2>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{t('auth.forgotSub')}</p>
          <Link to="/login" className="btn btn-primary mt-5 w-full">
            {t('auth.backToLogin')} <ArrowRight size={16} className="rtl:rotate-180" />
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          {error && <div className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: 'var(--danger)', background: 'var(--danger-soft)', color: 'var(--danger)' }}>{error}</div>}
          <label className="block">
            <span className="field-label">{t('auth.email')}</span>
            <div className="relative">
              <Mail size={17} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 opacity-50" />
              <input className="input ps-11" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('auth.emailPlaceholder')} autoComplete="email" dir="ltr" required />
            </div>
          </label>
          <button className="btn btn-primary btn-lg w-full" disabled={submitting}>
            {submitting ? <><Loader2 size={18} className="animate-spin" /> {t('auth.sending')}</> : t('auth.sendReset')}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
