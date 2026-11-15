import { useState } from 'react';
import { AtSign, Check, Globe2, Link2, Loader2, MapPin, Palette, Phone, Save, Sparkles, UserRound } from 'lucide-react';
import type { UserPrivate } from '../../../shared/types';
import { CITIES, DEFAULT_ACCENT, SPECIALTIES } from '../../../shared/data';
import { useI18n } from '../../i18n';
import { api, ApiError, fieldError, getErrorMessage } from '../../lib/api';
import { useToast } from '../../lib/toast';

const ACCENTS = ['#006830', '#0f766e', '#1d4ed8', '#7c3aed', '#b45309', '#be123c', '#0f172a'];

function specialtyKeyFor(user: UserPrivate): string {
  const found = SPECIALTIES.find((s) => s.ar === user.specialtyAr || s.en === user.specialtyEn);
  return found?.key || 'custom';
}

export function ProfileEditor({ user, setUser }: { user: UserPrivate; setUser: (u: UserPrivate) => void }) {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const [form, setForm] = useState({
    fullNameAr: user.fullNameAr,
    fullNameEn: user.fullNameEn,
    specialtyAr: user.specialtyAr,
    specialtyEn: user.specialtyEn,
    titleAr: user.titleAr,
    titleEn: user.titleEn,
    bioAr: user.bioAr,
    bioEn: user.bioEn,
    city: user.city,
    phone: user.phone,
    whatsapp: user.whatsapp,
    publicEmail: user.publicEmail,
    website: user.website,
    accent: user.accent || DEFAULT_ACCENT
  });
  const [specialtyKey, setSpecialtyKey] = useState(specialtyKeyFor(user));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string> | undefined>();
  const [handle, setHandle] = useState(user.handle);
  const [handleSaving, setHandleSaving] = useState(false);
  const [handleError, setHandleError] = useState('');

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  const onSpecialty = (key: string) => {
    setSpecialtyKey(key);
    const item = SPECIALTIES.find((s) => s.key === key);
    if (item) setForm((prev) => ({ ...prev, specialtyAr: item.ar, specialtyEn: item.en }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(undefined);
    const next: Record<string, string> = {};
    if (form.fullNameAr.trim().length < 2) next.fullNameAr = 'name_min';
    if (form.specialtyAr.trim().length < 2) next.specialtyAr = 'specialty_required';
    if (form.publicEmail && !/^\S+@\S+\.\S+$/.test(form.publicEmail)) next.publicEmail = 'email_invalid';
    if (form.website && !/^https?:\/\//i.test(form.website)) next.website = 'url_invalid';
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }
    setSaving(true);
    try {
      const res = await api<{ user: UserPrivate }>('/me/profile', { method: 'PUT', body: JSON.stringify(form) });
      setUser(res.user);
      toast(t('dash.profileSaved'), 'success');
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fields);
      toast(getErrorMessage(err, t), 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveHandle = async () => {
    setHandleError('');
    const clean = handle.trim().toLowerCase();
    if (!/^[a-z0-9]{3,24}$/.test(clean)) {
      setHandleError(t('err.handle_format'));
      return;
    }
    if (clean === user.handle) return;
    setHandleSaving(true);
    try {
      const res = await api<{ user: UserPrivate }>('/auth/handle', { method: 'PATCH', body: JSON.stringify({ handle: clean }) });
      setUser(res.user);
      setHandle(res.user.handle);
      toast(t('dash.saved'), 'success');
    } catch (err) {
      setHandleError(getErrorMessage(err, t));
    } finally {
      setHandleSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">{t('dash.myProfile')}</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>{t('dash.basicInfoSub')}</p>
        </div>
        <button form="profile-form" type="submit" className="btn btn-primary hidden sm:inline-flex" disabled={saving}>
          {saving ? <><Loader2 size={17} className="animate-spin" /> {t('common.saving')}</> : <><Save size={17} /> {t('dash.saveChanges')}</>}
        </button>
      </div>

      <form id="profile-form" onSubmit={save} className="space-y-5" noValidate>
        <section className="card p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-base font-extrabold"><span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}><UserRound size={16} /></span> {t('dash.basicInfo')}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="field-label">{t('dash.nameAr')}</span>
              <input className="input" value={form.fullNameAr} onChange={(e) => set('fullNameAr', e.target.value)} placeholder="د. عبدالله بن محمد" aria-invalid={!!errors?.fullNameAr} />
              {errors?.fullNameAr && <span className="field-error">{fieldError(errors, 'fullNameAr', t)}</span>}
            </label>
            <label className="block">
              <span className="field-label">{t('dash.nameEn')} <span className="font-normal opacity-50">({t('common.optional')})</span></span>
              <input className="input" value={form.fullNameEn} onChange={(e) => set('fullNameEn', e.target.value)} placeholder="Dr. Abdullah Al-Qahtani" dir="ltr" />
            </label>
            <label className="block">
              <span className="field-label">{t('dash.specialtyAr')}</span>
              <select className="input" value={specialtyKey} onChange={(e) => onSpecialty(e.target.value)}>
                {SPECIALTIES.map((s) => <option key={s.key} value={s.key}>{lang === 'ar' ? s.ar : s.en}</option>)}
                <option value="custom">{lang === 'ar' ? 'تخصص مخصص…' : 'Custom specialty…'}</option>
              </select>
              {errors?.specialtyAr && <span className="field-error">{fieldError(errors, 'specialtyAr', t)}</span>}
            </label>
            <label className="block">
              <span className="field-label">{t('dash.specialtyEn')}</span>
              <input className="input" value={form.specialtyEn} onChange={(e) => set('specialtyEn', e.target.value)} placeholder="Family Medicine" dir="ltr" disabled={specialtyKey !== 'custom'} />
            </label>
            {specialtyKey === 'custom' && (
              <label className="block sm:col-span-2">
                <span className="field-label">{t('dash.specialtyAr')}</span>
                <input className="input" value={form.specialtyAr} onChange={(e) => set('specialtyAr', e.target.value)} placeholder="تخصصك الدقيق" />
              </label>
            )}
            <label className="block">
              <span className="field-label">{t('dash.titleAr')} <span className="font-normal opacity-50">({t('common.optional')})</span></span>
              <input className="input" value={form.titleAr} onChange={(e) => set('titleAr', e.target.value)} placeholder="استشاري طب الأسرة" />
            </label>
            <label className="block">
              <span className="field-label">{t('dash.titleEn')} <span className="font-normal opacity-50">({t('common.optional')})</span></span>
              <input className="input" value={form.titleEn} onChange={(e) => set('titleEn', e.target.value)} placeholder="Consultant, Family Medicine" dir="ltr" />
            </label>
            <label className="block sm:col-span-2">
              <span className="field-label"><MapPin size={13} className="inline" /> {t('dash.city')}</span>
              <select className="input" value={form.city} onChange={(e) => set('city', e.target.value)}>
                <option value="">{t('common.selectPlaceholder')}</option>
                {CITIES.map((c) => <option key={c.key} value={c.key}>{lang === 'ar' ? c.ar : c.en}</option>)}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="field-label flex items-center justify-between"><span>{t('dash.bioAr')}</span><span className="text-[11px] font-normal opacity-50">{form.bioAr.length}/1200</span></span>
              <textarea className="input min-h-32 resize-y leading-7" value={form.bioAr} onChange={(e) => set('bioAr', e.target.value)} placeholder={t('dash.bioAr')} maxLength={1200} />
            </label>
            <label className="block sm:col-span-2">
              <span className="field-label flex items-center justify-between"><span>{t('dash.bioEn')} <span className="font-normal opacity-50">({t('common.optional')})</span></span><span className="text-[11px] font-normal opacity-50">{form.bioEn.length}/1200</span></span>
              <textarea className="input min-h-24 resize-y leading-7" value={form.bioEn} onChange={(e) => set('bioEn', e.target.value)} placeholder="A short professional bio in English" maxLength={1200} dir="ltr" />
            </label>
          </div>
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-base font-extrabold"><span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: 'var(--gold-soft)', color: 'var(--gold)' }}><Phone size={16} /></span> {t('dash.contactInfo')}</h2>
          <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>{t('dash.contactSub')}</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="field-label">{t('dash.phone')} <span className="font-normal opacity-50">({t('common.optional')})</span></span>
              <input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+966 5x xxx xxxx" dir="ltr" inputMode="tel" />
            </label>
            <label className="block">
              <span className="field-label">{t('dash.whatsapp')} <span className="font-normal opacity-50">({t('common.optional')})</span></span>
              <input className="input" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="9665xxxxxxxx" dir="ltr" inputMode="tel" />
            </label>
            <label className="block">
              <span className="field-label"><AtSign size={13} className="inline" /> {t('dash.publicEmail')} <span className="font-normal opacity-50">({t('common.optional')})</span></span>
              <input className="input" value={form.publicEmail} onChange={(e) => set('publicEmail', e.target.value)} placeholder="clinic@example.com" dir="ltr" inputMode="email" aria-invalid={!!errors?.publicEmail} />
              {errors?.publicEmail && <span className="field-error">{fieldError(errors, 'publicEmail', t)}</span>}
            </label>
            <label className="block">
              <span className="field-label"><Globe2 size={13} className="inline" /> {t('dash.website')} <span className="font-normal opacity-50">({t('common.optional')})</span></span>
              <input className="input" value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://example.com" dir="ltr" inputMode="url" aria-invalid={!!errors?.website} />
              {errors?.website && <span className="field-error">{fieldError(errors, 'website', t)}</span>}
            </label>
          </div>
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-base font-extrabold"><span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}><Palette size={16} /></span> {t('dash.accent')}</h2>
          <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>{t('dash.accentSub')}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {ACCENTS.map((color) => (
              <button key={color} type="button" className="relative h-11 w-11 rounded-2xl border-2 transition-transform hover:scale-105" style={{ background: color, borderColor: form.accent === color ? 'var(--text)' : 'transparent' }} onClick={() => set('accent', color)} aria-label={color}>
                {form.accent === color && <Check size={17} className="absolute inset-0 m-auto text-white" />}
              </button>
            ))}
            <label className="flex h-11 cursor-pointer items-center gap-2 rounded-2xl border px-3 text-xs font-bold" style={{ borderColor: 'var(--line)' }}>
              <input type="color" value={form.accent} onChange={(e) => set('accent', e.target.value)} className="h-6 w-6 cursor-pointer border-0 bg-transparent p-0" />
              {form.accent}
            </label>
          </div>
        </section>

        <button type="submit" className="btn btn-primary btn-lg w-full sm:hidden" disabled={saving}>
          {saving ? <><Loader2 size={17} className="animate-spin" /> {t('common.saving')}</> : <><Save size={17} /> {t('dash.saveChanges')}</>}
        </button>
      </form>

      <section className="card p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-base font-extrabold"><span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}><Link2 size={16} /></span> {t('dash.handle')}</h2>
        <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>{t('dash.handleSub')}</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <div className="flex flex-1 items-stretch overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}>
            <span className="flex items-center border-e px-3 text-xs" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }} dir="ltr">ksa.doctor/</span>
            <input className="min-w-0 flex-1 bg-transparent px-3 py-3 text-[15px] outline-none" value={handle} onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))} dir="ltr" maxLength={24} />
          </div>
          <button type="button" className="btn btn-primary shrink-0" onClick={saveHandle} disabled={handleSaving || handle === user.handle}>
            {handleSaving ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} {t('dash.changeHandle')}
          </button>
        </div>
        {handleError && <p className="field-error">{handleError}</p>}
      </section>
    </div>
  );
}
