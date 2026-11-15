import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useI18n } from '../i18n';

function FullScreenLoader() {
  return (
    <div className="grid min-h-[100dvh] place-items-center" style={{ background: 'var(--bg)' }}>
      <div className="flex flex-col items-center gap-3">
        <img src="/brand/emblem.png" alt="" className="h-14 w-14 animate-pulse" />
        <Loader2 className="animate-spin" size={22} style={{ color: 'var(--brand)' }} />
      </div>
    </div>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullScreenLoader />;
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const { t } = useI18n();
  if (loading) return <FullScreenLoader />;
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  if (user.role !== 'admin') {
    return (
      <div className="container-page grid min-h-[70dvh] place-items-center py-16">
        <div className="card max-w-md p-8 text-center">
          <img src="/brand/emblem.png" alt="" className="mx-auto h-16 w-16" />
          <h1 className="mt-4 text-xl font-extrabold">{t('adm.adminOnly')}</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>{t('common.forbidden')}</p>
          <a href="/dashboard" className="btn btn-primary mt-5">{t('common.dashboard')}</a>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
