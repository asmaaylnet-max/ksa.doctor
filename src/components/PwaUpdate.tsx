import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';
import { useI18n } from '../i18n';

export function PwaUpdate() {
  const { t } = useI18n();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        window.setInterval(() => {
          registration.update().catch(() => undefined);
        }, 60 * 60 * 1000);
      }
    }
  });

  if (!needRefresh) return null;
  return (
    <div className="fixed inset-x-3 bottom-3 z-[125] mx-auto flex max-w-lg items-center gap-3 rounded-2xl border p-3 shadow-2xl sm:bottom-6" style={{ background: 'var(--surface)', borderColor: 'var(--line-strong)' }}>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>
        <RefreshCw size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{t('inst.updateTitle')}</p>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>{t('inst.updateBody')}</p>
      </div>
      <button className="btn btn-primary btn-sm" onClick={() => updateServiceWorker(true)}>{t('inst.updateNow')}</button>
      <button className="rounded-full p-1 opacity-50 hover:opacity-100" onClick={() => setNeedRefresh(false)} aria-label={t('inst.later')}>
        <X size={16} />
      </button>
    </div>
  );
}
