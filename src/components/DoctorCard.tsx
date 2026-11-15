import { Link } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, MapPin, Star } from 'lucide-react';
import type { SearchResult } from '../../shared/types';
import { CITY_MAP } from '../../shared/data';
import { useI18n } from '../i18n';
import { avatarUrl } from '../lib/media';
import { clampText } from '../lib/format';

export function DoctorCard({ doctor }: { doctor: SearchResult }) {
  const { t, lang, pick } = useI18n();
  const city = CITY_MAP[doctor.city] ? (lang === 'ar' ? CITY_MAP[doctor.city].ar : CITY_MAP[doctor.city].en) : '';
  const name = pick(doctor.fullNameAr, doctor.fullNameEn);
  const specialty = pick(doctor.specialtyAr, doctor.specialtyEn);
  const bio = pick(doctor.bioAr, doctor.bioEn);
  return (
    <Link
      to={`/${doctor.handle}`}
      className="group card relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
    >
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--brand)] via-[var(--brand-bright)] to-[var(--gold)] opacity-70" />
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <img
            src={avatarUrl(doctor.avatarKey)}
            alt={name}
            loading="lazy"
            width={72}
            height={72}
            className="h-[72px] w-[72px] rounded-2xl object-cover ring-2 ring-[var(--gold)]/40"
          />
          <span className="absolute -bottom-1.5 -end-1.5 grid h-6 w-6 place-items-center rounded-full bg-[var(--surface)]">
            <BadgeCheck size={18} style={{ color: 'var(--brand)' }} />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-[17px] font-extrabold">{name}</h3>
              <p className="truncate text-sm font-medium" style={{ color: 'var(--brand)' }}>{specialty}</p>
            </div>
            {doctor.featured && (
              <span className="badge badge-gold shrink-0"><Star size={11} /> {t('common.featured')}</span>
            )}
          </div>
          {city && (
            <p className="mt-1 flex items-center gap-1 text-xs" style={{ color: 'var(--muted)' }}>
              <MapPin size={12} /> {city}
            </p>
          )}
          {bio && <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed" style={{ color: 'var(--muted)' }}>{clampText(bio, 130)}</p>}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t pt-3" style={{ borderColor: 'var(--line)' }}>
        <span className="text-[11px] font-medium tracking-wide" style={{ color: 'var(--muted-2)' }}>ksa.doctor/{doctor.handle}</span>
        <span className="inline-flex items-center gap-1 text-xs font-bold transition-transform group-hover:-translate-x-1" style={{ color: 'var(--brand)' }}>
          {t('common.preview')} <ArrowLeft size={14} className="rtl:rotate-180" />
        </span>
      </div>
    </Link>
  );
}
