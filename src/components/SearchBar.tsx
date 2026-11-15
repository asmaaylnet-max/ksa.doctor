import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Search, Sparkles } from 'lucide-react';
import { SPECIALTIES } from '../../shared/data';
import { api } from '../lib/api';
import { useI18n } from '../i18n';
import { avatarUrl } from '../lib/media';

interface Suggestion {
  handle: string;
  fullNameAr: string;
  fullNameEn: string;
  specialtyAr: string;
  specialtyEn: string;
  avatarKey: string;
}

export function SearchBar({
  initial = '',
  variant = 'hero',
  autoFocus = false,
  onSearch
}: {
  initial?: string;
  variant?: 'hero' | 'compact';
  autoFocus?: boolean;
  onSearch?: (value: string) => void;
}) {
  const { t, lang, pick } = useI18n();
  const navigate = useNavigate();
  const [value, setValue] = useState(initial);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setValue(initial), [initial]);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) {
      setItems([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const data = await api<{ items: Suggestion[] }>(`/search/suggest?q=${encodeURIComponent(q)}`);
        if (!cancelled) {
          setItems(data.items || []);
          setOpen(true);
          setActive(-1);
        }
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 260);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [value]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const submit = (raw?: string) => {
    const q = (raw ?? value).trim();
    setOpen(false);
    if (onSearch) {
      onSearch(q);
      return;
    }
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && items.length) {
      e.preventDefault();
      setActive((prev) => (prev + 1) % items.length);
    } else if (e.key === 'ArrowUp' && items.length) {
      e.preventDefault();
      setActive((prev) => (prev <= 0 ? items.length - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (open && active >= 0 && items[active]) {
        navigate(`/${items[active].handle}`);
        setOpen(false);
      } else {
        submit();
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const specialtyMatches = value.trim().length >= 2
    ? SPECIALTIES.filter((s) => s.ar.includes(value.trim()) || s.en.toLowerCase().includes(value.trim().toLowerCase())).slice(0, 4)
    : [];

  return (
    <div ref={wrapRef} className={`relative w-full ${variant === 'hero' ? 'max-w-2xl' : 'max-w-xl'}`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className={`flex items-center gap-2 rounded-full border p-1.5 transition-all focus-within:shadow-[0_0_0_5px_var(--ring)] ${variant === 'hero' ? 'shadow-xl' : ''}`}
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--line-strong)',
          boxShadow: variant === 'hero' ? '0 18px 50px -18px rgba(0,0,0,.35)' : undefined
        }}
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full" style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>
          {loading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
        </span>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => value.trim().length >= 2 && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={t('home.searchPlaceholder')}
          className="h-11 min-w-0 flex-1 bg-transparent px-1 text-[15px] outline-none placeholder:opacity-60 sm:text-base"
          aria-label={t('common.search')}
          autoComplete="off"
          enterKeyHint="search"
          dir="auto"
        />
        <button type="submit" className="btn btn-primary h-11 shrink-0 px-4 sm:px-6" aria-label={t('common.search')}>
          <span className="hidden sm:inline">{t('common.search')}</span>
          <ArrowLeft size={18} className="rtl:rotate-180 sm:hidden" />
        </button>
      </form>

      {open && (items.length > 0 || specialtyMatches.length > 0) && (
        <div
          className="absolute inset-x-0 top-[calc(100%+10px)] z-50 overflow-hidden rounded-3xl border p-2 shadow-2xl"
          style={{ background: 'var(--surface)', borderColor: 'var(--line-strong)' }}
        >
          {items.map((item, index) => (
            <button
              key={item.handle}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                navigate(`/${item.handle}`);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-start transition-colors ${active === index ? 'bg-[var(--surface-2)]' : 'hover:bg-[var(--surface-2)]'}`}
            >
              <img src={avatarUrl(item.avatarKey)} alt="" className="h-10 w-10 rounded-full object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{pick(item.fullNameAr, item.fullNameEn)}</span>
                <span className="block truncate text-xs" style={{ color: 'var(--muted)' }}>
                  {pick(item.specialtyAr, item.specialtyEn)} · ksa.doctor/{item.handle}
                </span>
              </span>
              <ArrowLeft size={16} className="opacity-40 rtl:rotate-180" />
            </button>
          ))}
          {specialtyMatches.length > 0 && (
            <div className="border-t px-3 pb-1 pt-2" style={{ borderColor: 'var(--line)' }}>
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--gold)' }}>
                <Sparkles size={12} /> {t('home.popular')}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {specialtyMatches.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => submit(lang === 'ar' ? s.ar : s.en)}
                    className="chip !min-h-8 !px-3 !py-1 text-xs"
                  >
                    {lang === 'ar' ? s.ar : s.en}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
