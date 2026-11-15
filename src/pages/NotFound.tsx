import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import { useI18n } from '../i18n';
import { SearchBar } from '../components/SearchBar';

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div className="container-page flex min-h-[70dvh] max-w-2xl flex-col items-center justify-center py-16 text-center">
      <img src="/brand/emblem.png" alt="" className="h-24 w-24 opacity-90" />
      <p className="mt-6 text-6xl font-extrabold tracking-tight" style={{ color: 'var(--brand)' }}>404</p>
      <h1 className="mt-2 text-2xl font-extrabold">{t('common.notFound')}</h1>
      <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>{t('prof.notFoundBody')}</p>
      <div className="mt-6 w-full"><SearchBar variant="compact" /></div>
      <div className="mt-5 flex gap-2">
        <Link to="/" className="btn btn-primary"><Home size={17} /> {t('common.backHome')}</Link>
        <Link to="/search" className="btn btn-ghost"><Compass size={17} /> {t('home.explore')}</Link>
      </div>
    </div>
  );
}
