import { useState } from 'react';
import { Link2, ListPlus, Loader2, MousePointerClick, Plus, Save, Share2, Sparkles, Trash2, Youtube } from 'lucide-react';
import type { CustomButton, Service, SocialLink, UserPrivate, VideoItem } from '../../../shared/types';
import { SOCIALS } from '../../../shared/data';
import { useI18n } from '../../i18n';
import { useToast } from '../../lib/toast';
import { api, ApiError, getErrorMessage } from '../../lib/api';
import { ICON_OPTIONS, getIcon } from '../../lib/icons';
import { parseYouTubeId, youtubeThumb } from '../../lib/youtube';

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

export function LinksEditor({ user, setUser }: { user: UserPrivate; setUser: (u: UserPrivate) => void }) {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const [socials, setSocials] = useState<SocialLink[]>(() => user.socials.map((s) => ({ ...s })));
  const [services, setServices] = useState<Service[]>(() => user.services.map((s) => ({ ...s })));
  const [buttons, setButtons] = useState<CustomButton[]>(() => user.buttons.map((b) => ({ ...b })));
  const [videos, setVideos] = useState<VideoItem[]>(() => user.videos.map((v) => ({ ...v })));
  const [saving, setSaving] = useState(false);

  const addSocial = () => {
    const used = new Set(socials.map((s) => s.platform));
    const next = SOCIALS.find((s) => !used.has(s.id));
    if (!next) return;
    setSocials((prev) => [...prev, { platform: next.id, value: '' }]);
  };

  const save = async () => {
    for (const service of services) {
      if (!service.titleAr.trim()) {
        toast(t('dash.serviceTitleAr'), 'error');
        return;
      }
    }
    for (const button of buttons) {
      if (!button.labelAr.trim() || !/^https?:\/\//i.test(button.url)) {
        toast(t('err.url_invalid'), 'error');
        return;
      }
    }
    for (const video of videos) {
      if (!parseYouTubeId(video.url)) {
        toast(t('dash.invalidYoutube'), 'error');
        return;
      }
    }
    setSaving(true);
    try {
      const payload = {
        socials: socials.filter((s) => s.value.trim()),
        services,
        buttons,
        videos: videos.map((v) => ({ ...v, videoId: parseYouTubeId(v.url) || v.videoId }))
      };
      const res = await api<{ user: UserPrivate }>('/me/links', { method: 'PUT', body: JSON.stringify(payload) });
      setUser(res.user);
      toast(t('dash.linksSaved'), 'success');
    } catch (err) {
      if (err instanceof ApiError) toast(getErrorMessage(err, t), 'error');
      else toast(t('err.generic'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateSocial = (index: number, patch: Partial<SocialLink>) => {
    setSocials((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };
  const updateService = (index: number, patch: Partial<Service>) => {
    setServices((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };
  const updateButton = (index: number, patch: Partial<CustomButton>) => {
    setButtons((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };
  const updateVideo = (index: number, patch: Partial<VideoItem>) => {
    setVideos((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">{t('dash.links')}</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>{t('dash.socialsSub')}</p>
        </div>
        <button className="btn btn-primary hidden sm:inline-flex" onClick={save} disabled={saving}>
          {saving ? <><Loader2 size={17} className="animate-spin" /> {t('common.saving')}</> : <><Save size={17} /> {t('dash.saveLinks')}</>}
        </button>
      </div>

      <section className="card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-extrabold"><Share2 size={17} style={{ color: 'var(--brand)' }} /> {t('common.links')}</h2>
            <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>{t('dash.socialsSub')}</p>
          </div>
          <button className="btn btn-ghost btn-sm shrink-0" onClick={addSocial} disabled={socials.length >= 12}><Plus size={14} /> {t('dash.addSocial')}</button>
        </div>
        <div className="mt-4 space-y-2">
          {socials.length === 0 && <p className="rounded-xl border border-dashed p-4 text-center text-xs" style={{ borderColor: 'var(--line-strong)', color: 'var(--muted)' }}>{t('prof.noLinks')}</p>}
          {socials.map((social, index) => {
            const meta = SOCIALS.find((s) => s.id === social.platform);
            return (
              <div key={`${social.platform}-${index}`} className="flex flex-col gap-2 rounded-2xl border p-2.5 sm:flex-row sm:items-center" style={{ borderColor: 'var(--line)' }}>
                <select className="input !min-h-11 !w-full !py-2 text-sm sm:!w-44" value={social.platform} onChange={(e) => updateSocial(index, { platform: e.target.value as SocialLink['platform'], value: '' })}>
                  {SOCIALS.map((s) => <option key={s.id} value={s.id}>{lang === 'ar' ? s.ar : s.en}</option>)}
                </select>
                <input className="input !min-h-11 flex-1 !py-2 text-sm" value={social.value} onChange={(e) => updateSocial(index, { value: e.target.value })} placeholder={meta?.placeholder} dir="ltr" />
                <button className="icon-btn h-9 w-9 shrink-0 self-end text-[var(--danger)] sm:self-auto" onClick={() => setSocials((prev) => prev.filter((_, i) => i !== index))} aria-label={t('common.remove')}><Trash2 size={16} /></button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-extrabold"><Sparkles size={17} style={{ color: 'var(--gold)' }} /> {t('common.services')}</h2>
            <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>{t('dash.servicesSub')}</p>
          </div>
          <button className="btn btn-ghost btn-sm shrink-0" onClick={() => setServices((prev) => [...prev, { id: uid(), titleAr: '', titleEn: '', descAr: '', descEn: '', icon: 'stethoscope' }])} disabled={services.length >= 8}><Plus size={14} /> {t('dash.addService')}</button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {services.length === 0 && <p className="rounded-xl border border-dashed p-4 text-center text-xs sm:col-span-2" style={{ borderColor: 'var(--line-strong)', color: 'var(--muted)' }}>{t('prof.noServices')}</p>}
          {services.map((service, index) => {
            const Icon = getIcon(service.icon);
            return (
              <div key={service.id} className="rounded-2xl border p-3" style={{ borderColor: 'var(--line)' }}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}><Icon size={17} /></span>
                  <select className="input !min-h-9 !py-1 text-xs" value={service.icon} onChange={(e) => updateService(index, { icon: e.target.value })} aria-label={t('dash.serviceIcon')}>
                    {ICON_OPTIONS.map((option) => <option key={option.key} value={option.key}>{option.key}</option>)}
                  </select>
                  <button className="icon-btn ms-auto h-8 w-8 text-[var(--danger)]" onClick={() => setServices((prev) => prev.filter((_, i) => i !== index))} aria-label={t('common.remove')}><Trash2 size={15} /></button>
                </div>
                <input className="input !min-h-10 !py-1.5 text-sm" value={service.titleAr} onChange={(e) => updateService(index, { titleAr: e.target.value })} placeholder={t('dash.serviceTitleAr')} maxLength={80} />
                <input className="input mt-2 !min-h-10 !py-1.5 text-sm" value={service.titleEn} onChange={(e) => updateService(index, { titleEn: e.target.value })} placeholder={t('dash.serviceTitleEn')} dir="ltr" maxLength={80} />
                <textarea className="input mt-2 min-h-16 !py-1.5 text-xs" value={service.descAr} onChange={(e) => updateService(index, { descAr: e.target.value })} placeholder={t('dash.serviceDescAr')} maxLength={240} />
                <textarea className="input mt-2 min-h-14 !py-1.5 text-xs" value={service.descEn} onChange={(e) => updateService(index, { descEn: e.target.value })} placeholder={t('dash.serviceDescEn')} maxLength={240} dir="ltr" />
              </div>
            );
          })}
        </div>
      </section>

      <section className="card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-extrabold"><MousePointerClick size={17} style={{ color: 'var(--brand)' }} /> {t('common.buttons')}</h2>
            <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>{t('dash.buttonsSub')}</p>
          </div>
          <button className="btn btn-ghost btn-sm shrink-0" onClick={() => setButtons((prev) => [...prev, { id: uid(), labelAr: '', labelEn: '', url: '', icon: 'link', color: '#006830' }])} disabled={buttons.length >= 6}><Plus size={14} /> {t('dash.addButton')}</button>
        </div>
        <div className="mt-4 space-y-3">
          {buttons.length === 0 && <p className="rounded-xl border border-dashed p-4 text-center text-xs" style={{ borderColor: 'var(--line-strong)', color: 'var(--muted)' }}>{t('prof.noLinks')}</p>}
          {buttons.map((button, index) => {
            const Icon = getIcon(button.icon);
            return (
              <div key={button.id} className="rounded-2xl border p-3" style={{ borderColor: 'var(--line)' }}>
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-xl text-white" style={{ background: button.color }}><Icon size={17} /></span>
                  <input className="input !min-h-10 flex-1 !py-1.5 text-sm" value={button.labelAr} onChange={(e) => updateButton(index, { labelAr: e.target.value })} placeholder={t('dash.buttonLabelAr')} maxLength={60} />
                  <button className="icon-btn h-8 w-8 text-[var(--danger)]" onClick={() => setButtons((prev) => prev.filter((_, i) => i !== index))} aria-label={t('common.remove')}><Trash2 size={15} /></button>
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <input className="input !min-h-10 !py-1.5 text-sm" value={button.labelEn} onChange={(e) => updateButton(index, { labelEn: e.target.value })} placeholder={t('dash.buttonLabelEn')} dir="ltr" maxLength={60} />
                  <input className="input !min-h-10 !py-1.5 text-sm" value={button.url} onChange={(e) => updateButton(index, { url: e.target.value })} placeholder="https://…" dir="ltr" inputMode="url" />
                  <select className="input !min-h-10 !py-1.5 text-xs" value={button.icon} onChange={(e) => updateButton(index, { icon: e.target.value })}>
                    {ICON_OPTIONS.map((option) => <option key={option.key} value={option.key}>{option.key}</option>)}
                  </select>
                  <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
                    {t('dash.buttonColor')}
                    <input type="color" className="h-9 w-14 cursor-pointer rounded-lg border-0 bg-transparent p-0" value={button.color} onChange={(e) => updateButton(index, { color: e.target.value })} />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-extrabold"><Youtube size={18} style={{ color: '#ff0033' }} /> {t('common.videos')}</h2>
            <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>{t('dash.videosSub')}</p>
          </div>
          <button className="btn btn-ghost btn-sm shrink-0" onClick={() => setVideos((prev) => [...prev, { id: uid(), url: '', videoId: '', titleAr: '', titleEn: '' }])} disabled={videos.length >= 6}><Plus size={14} /> {t('dash.addVideo')}</button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {videos.length === 0 && <p className="rounded-xl border border-dashed p-4 text-center text-xs sm:col-span-2" style={{ borderColor: 'var(--line-strong)', color: 'var(--muted)' }}>{t('prof.noVideos')}</p>}
          {videos.map((video, index) => {
            const id = parseYouTubeId(video.url);
            return (
              <div key={video.id} className="rounded-2xl border p-3" style={{ borderColor: 'var(--line)' }}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold"><Youtube size={15} style={{ color: '#ff0033' }} /> YouTube</span>
                  <button className="icon-btn h-8 w-8 text-[var(--danger)]" onClick={() => setVideos((prev) => prev.filter((_, i) => i !== index))} aria-label={t('common.remove')}><Trash2 size={15} /></button>
                </div>
                <input className="input !min-h-10 !py-1.5 text-sm" value={video.url} onChange={(e) => updateVideo(index, { url: e.target.value })} placeholder={t('dash.videoUrl')} dir="ltr" />
                {video.url && !id && <p className="field-error">{t('dash.invalidYoutube')}</p>}
                {id && <img src={youtubeThumb(id)} alt="" className="mt-2 aspect-video w-full rounded-xl object-cover" loading="lazy" />}
                <input className="input mt-2 !min-h-10 !py-1.5 text-sm" value={video.titleAr} onChange={(e) => updateVideo(index, { titleAr: e.target.value })} placeholder={t('dash.videoTitleAr')} maxLength={120} />
                <input className="input mt-2 !min-h-10 !py-1.5 text-sm" value={video.titleEn} onChange={(e) => updateVideo(index, { titleEn: e.target.value })} placeholder={t('dash.videoTitleEn')} dir="ltr" maxLength={120} />
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex items-center justify-between gap-3 rounded-2xl border p-4" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}>
        <p className="text-xs" style={{ color: 'var(--muted)' }}><Link2 size={13} className="inline" /> {t('dash.unsaved')}</p>
        <button className="btn btn-primary btn-sm shrink-0" onClick={save} disabled={saving}>
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} {t('dash.saveLinks')}
        </button>
      </div>
    </div>
  );
}
