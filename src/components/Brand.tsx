import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';

export function Emblem({ className = '', alt = '' }: { className?: string; alt?: string }) {
  return <img src="/brand/emblem.png" alt={alt} className={className} width={512} height={512} decoding="async" />;
}

export function BrandMark({ compact = false, linked = true }: { compact?: boolean; linked?: boolean }) {
  const { t } = useI18n();
  const content = (
    <span className="flex items-center gap-2.5">
      <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#f8f4e9] shadow-[0_0_0_1px_rgba(200,164,92,.55),0_6px_18px_-8px_rgba(0,0,0,.4)]">
        <Emblem className="h-8 w-8 object-contain" />
      </span>
      {!compact && (
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-[15px] font-extrabold tracking-tight">{t('app.short')}</span>
          <span className="text-[9px] font-bold uppercase tracking-[.28em]" style={{ color: 'var(--gold)' }}>
            KSA.DOCTOR
          </span>
        </span>
      )}
    </span>
  );
  return linked ? (
    <Link to="/" aria-label={t('app.name')} className="inline-flex items-center rounded-2xl focus-visible:outline-none">
      {content}
    </Link>
  ) : (
    content
  );
}
