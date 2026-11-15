import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useI18n } from '../i18n';

export function OfflineBanner() {
  const { t } = useI18n();
  const [offline, setOffline] = useState(!navigator.onLine);
  const [justOnline, setJustOnline] = useState(false);

  useEffect(() => {
    const onOffline = () => {
      setOffline(true);
      setJustOnline(false);
    };
    const onOnline = () => {
      setOffline(false);
      setJustOnline(true);
      window.setTimeout(() => setJustOnline(false), 2800);
    };
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  if (!offline && !justOnline) return null;
  return (
    <div
      className="fixed inset-x-0 top-0 z-[130] flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-bold text-white"
      style={{ background: offline ? '#7a271a' : '#067647' }}
      role="status"
    >
      <WifiOff size={14} />
      {offline ? t('common.offline') : t('common.online')}
    </div>
  );
}
