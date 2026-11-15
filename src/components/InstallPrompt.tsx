import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Download, MonitorSmartphone, MoreVertical, Share, Smartphone, X } from 'lucide-react';
import { canInstall, isIOS, isInstalled, openInstallModal, promptInstall, subscribeInstall } from '../lib/install';
import { useI18n } from '../i18n';
import { useConsent } from '../lib/consent';
import { useToast } from '../lib/toast';
import { Modal } from './Modal';

const DISMISS_KEY = 'ksd_install_dismissed_at';

export function InstallPrompt() {
  const { t } = useI18n();
  const { showBanner } = useConsent();
  const { toast } = useToast();
  const { pathname } = useLocation();
  const [ready, setReady] = useState(canInstall());
  const [installed, setInstalled] = useState(isInstalled());
  const [visible, setVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const privateRoute = /^\/(dashboard|admin|login|join|forgot|reset)(\/|$)/.test(pathname) || /\/print$/.test(pathname);

  useEffect(() => {
    const update = () => {
      setReady(canInstall());
      setInstalled(isInstalled());
    };
    const unsubscribe = subscribeInstall(update);
    const onOpen = () => setModalOpen(true);
    window.addEventListener('ksd:open-install', onOpen);
    return () => {
      unsubscribe();
      window.removeEventListener('ksd:open-install', onOpen);
    };
  }, []);

  useEffect(() => {
    if (showBanner || installed) {
      setVisible(false);
      return;
    }
    const dismissed = Number(localStorage.getItem(DISMISS_KEY) || 0);
    const recentlyDismissed = dismissed && Date.now() - dismissed < 14 * 86400 * 1000;
    if (recentlyDismissed) return;
    const timer = window.setTimeout(() => setVisible(true), 4500);
    return () => window.clearTimeout(timer);
  }, [showBanner, installed]);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  };

  const install = async () => {
    const result = await promptInstall();
    if (result === 'accepted') {
      toast(t('inst.installedTitle'));
      setModalOpen(false);
      setInstalled(true);
    } else if (result === 'unavailable') {
      setModalOpen(true);
    }
  };

  return (
    <>
      {visible && !showBanner && !installed && !privateRoute && (
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+84px)] start-3 end-3 z-[70] mx-auto flex max-w-sm items-center gap-3 rounded-2xl border p-3 shadow-2xl backdrop-blur-xl sm:bottom-6 sm:start-auto sm:end-6" style={{ background: 'var(--glass)', borderColor: 'var(--line-strong)' }}>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>
            <Download size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-extrabold">{t('inst.title')}</p>
            <p className="truncate text-[11px]" style={{ color: 'var(--muted)' }}>{t('common.installApp')}</p>
          </div>
          <button className="btn btn-primary btn-sm shrink-0 !px-3" onClick={install}>{t('inst.installNow')}</button>
          <button className="rounded-full p-1.5 opacity-50 hover:opacity-100" onClick={dismiss} aria-label={t('common.close')}>
            <X size={15} />
          </button>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={t('inst.title')}
        subtitle={t('inst.body')}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button className="btn btn-ghost btn-sm" onClick={() => setModalOpen(false)}>{t('inst.later')}</button>
            {ready && <button className="btn btn-primary btn-sm" onClick={install}><Download size={16} /> {t('inst.installNow')}</button>}
          </div>
        }
      >
        {installed ? (
          <div className="py-4 text-center">
            <MonitorSmartphone className="mx-auto mb-3" size={34} style={{ color: 'var(--brand)' }} />
            <p className="font-bold">{t('inst.installedTitle')}</p>
            <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>{t('inst.installedBody')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}>
              <div className="mb-1 flex items-center gap-2 text-sm font-bold"><Share size={16} style={{ color: 'var(--brand)' }} /> {t('inst.iosTitle')}</div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{t('inst.iosBody')}</p>
            </div>
            <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--line)' }}>
              <div className="mb-1 flex items-center gap-2 text-sm font-bold"><MoreVertical size={16} style={{ color: 'var(--brand)' }} /> {t('inst.androidTitle')}</div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{t('inst.androidBody')}</p>
            </div>
            <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--line)' }}>
              <div className="mb-1 flex items-center gap-2 text-sm font-bold"><Smartphone size={16} style={{ color: 'var(--brand)' }} /> {t('inst.desktopTitle')}</div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{t('inst.desktopBody')}</p>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

export { openInstallModal };
