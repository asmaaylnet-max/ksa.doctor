import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Filter, SearchX, SlidersHorizontal, UserPlus } from 'lucide-react';
import { api } from '../lib/api';
import type { SearchResponse } from '../../shared/types';
import { CITIES, SPECIALTIES } from '../../shared/data';
import { useI18n } from '../i18n';
import { SearchBar } from '../components/SearchBar';
import { DoctorCard } from '../components/DoctorCard';
import { EmptyState } from '../components/EmptyState';

function SkeletonCard() {
  return (
    <div className="card p-5">
      <div className="flex gap-4">
        <div className="skeleton h-[72px] w-[72px] !rounded-2xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-2/3" />
          <div className="skeleton h-3 w-1/2" />
          <div className="skeleton h-3 w-3/4" />
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  const { t, lang, formatNumber } = useI18n();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const specialty = params.get('specialty') || '';
  const city = params.get('city') || '';
  const page = Math.max(1, Number(params.get('page') || 1) || 1);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const query = new URLSearchParams();
    if (q) query.set('q', q);
    if (specialty) query.set('specialty', specialty);
    if (city) query.set('city', city);
    query.set('page', String(page));
    api<SearchResponse>(`/search?${query.toString()}`)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setData({ items: [], total: 0, page: 1, pages: 1 });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [q, specialty, city, page]);

  const update = (patch: Record<string, string | number | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === '') next.delete(key);
      else next.set(key, String(value));
    }
    if (!('page' in patch)) next.delete('page');
    setParams(next);
  };

  const hasFilters = !!(q || specialty || city);
  const items = data?.items || [];

  return (
    <div className="container-page py-8 sm:py-10">
      <div className="mx-auto max-w-3xl text-center">
        <span className="kicker"><SlidersHorizontal size={13} /> {t('nav.search')}</span>
        <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">{t('search.title')}</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
          {data ? t('search.sub', { count: formatNumber(data.total) }) : t('search.loading')}
        </p>
        <div className="mt-5 flex justify-center">
          <SearchBar initial={q} onSearch={(value) => update({ q: value || null })} />
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          <button className={`chip shrink-0 ${!specialty ? 'chip-active' : ''}`} onClick={() => update({ specialty: null })}>
            {t('search.allSpecialties')}
          </button>
          {SPECIALTIES.slice(0, 8).map((s) => (
            <button key={s.key} className={`chip shrink-0 ${specialty === s.key ? 'chip-active' : ''}`} onClick={() => update({ specialty: s.key })}>
              {lang === 'ar' ? s.ar : s.en}
            </button>
          ))}
        </div>
        <button className="btn btn-ghost btn-sm sm:hidden" onClick={() => setFiltersOpen((v) => !v)}>
          <Filter size={15} /> {t('search.filters')}
        </button>
      </div>

      <div className={`mt-4 grid gap-3 rounded-2xl border p-3 sm:grid-cols-[1fr_1fr_auto] ${filtersOpen ? '' : 'hidden sm:grid'}`} style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
        <label className="flex items-center gap-2">
          <span className="shrink-0 text-xs font-bold" style={{ color: 'var(--muted)' }}>{t('search.specialty')}</span>
          <select className="input !min-h-11 flex-1 !py-2 text-sm" value={specialty} onChange={(e) => update({ specialty: e.target.value || null })}>
            <option value="">{t('search.allSpecialties')}</option>
            {SPECIALTIES.map((s) => <option key={s.key} value={s.key}>{lang === 'ar' ? s.ar : s.en}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="shrink-0 text-xs font-bold" style={{ color: 'var(--muted)' }}>{t('search.city')}</span>
          <select className="input !min-h-11 flex-1 !py-2 text-sm" value={city} onChange={(e) => update({ city: e.target.value || null })}>
            <option value="">{t('search.allCities')}</option>
            {CITIES.map((c) => <option key={c.key} value={c.key}>{lang === 'ar' ? c.ar : c.en}</option>)}
          </select>
        </label>
        {hasFilters && (
          <button className="btn btn-ghost btn-sm" onClick={() => setParams(new URLSearchParams())}>{t('search.clear')}</button>
        )}
      </div>

      <div className="mt-7">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : items.length ? (
          <>
            <div className="mb-4 flex items-center justify-between text-xs" style={{ color: 'var(--muted)' }}>
              <span>{t('search.results')} · {formatNumber(data?.total || 0)}</span>
              <span>{t('common.from')} {formatNumber((page - 1) * 12 + 1)}–{formatNumber(Math.min(page * 12, data?.total || 0))}</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((doctor) => <DoctorCard key={doctor.handle} doctor={doctor} />)}
            </div>
            {data && data.pages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => update({ page: page - 1 })}>
                  <ChevronRight size={16} className="rtl:hidden" /><ChevronLeft size={16} className="hidden rtl:block" /> {t('common.previous')}
                </button>
                <span className="px-3 text-sm font-bold">{formatNumber(page)} / {formatNumber(data.pages)}</span>
                <button className="btn btn-ghost btn-sm" disabled={page >= data.pages} onClick={() => update({ page: page + 1 })}>
                  {t('common.next')} <ChevronLeft size={16} className="rtl:hidden" /><ChevronRight size={16} className="hidden rtl:block" />
                </button>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon={SearchX}
            title={t('search.noResultsTitle')}
            body={t('search.noResultsBody')}
            action={<button className="btn btn-ghost" onClick={() => setParams(new URLSearchParams())}>{t('search.clear')}</button>}
          />
        )}
      </div>

      <div className="card mt-10 flex flex-col items-start gap-4 overflow-hidden p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl" style={{ background: 'var(--gold-soft)', color: 'var(--gold)' }}>
            <UserPlus size={21} />
          </span>
          <div>
            <h2 className="text-base font-extrabold">{t('search.joinPrompt')}</h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>{t('search.joinBody')}</p>
          </div>
        </div>
        <Link to="/join" className="btn btn-primary shrink-0">{t('search.joinCta')}</Link>
      </div>
    </div>
  );
}
