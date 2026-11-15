import { useEffect, useRef, useState } from 'react';
import { Camera, ImageIcon, ImagePlus, Loader2, Plus, RefreshCw, Trash2, Upload } from 'lucide-react';
import type { MediaItem, UserPrivate } from '../../../shared/types';
import { useI18n } from '../../i18n';
import { useToast } from '../../lib/toast';
import { deleteMedia, mediaUrl, uploadMedia, type MediaKind } from '../../lib/media';
import { getErrorMessage } from '../../lib/api';
import { Modal } from '../../components/Modal';

type SlotKind = 'skill' | 'work';
interface SlotModalState { kind: SlotKind; index?: number; item?: MediaItem }

export function MediaEditor({ user, setUser }: { user: UserPrivate; setUser: (u: UserPrivate) => void }) {
  const { t, pick } = useI18n();
  const { toast } = useToast();
  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<{ kind: MediaKind; index?: number } | null>(null);
  const [progress, setProgress] = useState(0);
  const [slot, setSlot] = useState<SlotModalState | null>(null);
  const [slotFile, setSlotFile] = useState<File | null>(null);
  const [slotPreview, setSlotPreview] = useState('');
  const [captionAr, setCaptionAr] = useState('');
  const [captionEn, setCaptionEn] = useState('');
  const [slotError, setSlotError] = useState('');

  useEffect(() => {
    if (!slotFile) {
      setSlotPreview('');
      return;
    }
    const url = URL.createObjectURL(slotFile);
    setSlotPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [slotFile]);

  const uploadDirect = async (file: File | undefined, kind: 'avatar' | 'cover') => {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast(t('dash.imageTooLarge'), 'error');
      return;
    }
    setUploading({ kind });
    setProgress(0);
    try {
      const res = await uploadMedia(file, kind, undefined, '', '', setProgress);
      setUser(res.user);
      toast(t('dash.mediaSaved'), 'success');
    } catch (err) {
      toast(getErrorMessage(err, t), 'error');
    } finally {
      setUploading(null);
      setProgress(0);
    }
  };

  const openSlot = (kind: SlotKind, index?: number, item?: MediaItem) => {
    setSlot({ kind, index, item });
    setSlotFile(null);
    setSlotPreview('');
    setCaptionAr(item?.captionAr || '');
    setCaptionEn(item?.captionEn || '');
    setSlotError('');
  };

  const closeSlot = () => {
    if (uploading) return;
    setSlot(null);
    setSlotFile(null);
    setSlotError('');
  };

  const uploadSlot = async () => {
    if (!slot) return;
    if (!slotFile) {
      setSlotError(t('err.file_required'));
      return;
    }
    setUploading({ kind: slot.kind, index: slot.index });
    setProgress(0);
    try {
      const res = await uploadMedia(slotFile, slot.kind, slot.index, captionAr, captionEn, setProgress);
      setUser(res.user);
      toast(t('dash.uploaded'), 'success');
      setSlot(null);
      setSlotFile(null);
    } catch (err) {
      setSlotError(getErrorMessage(err, t));
    } finally {
      setUploading(null);
      setProgress(0);
    }
  };

  const remove = async (kind: MediaKind, key: string) => {
    if (!window.confirm(`${t('dash.deleteConfirm')}\n${t('dash.deleteImageConfirm')}`)) return;
    try {
      const updated = await deleteMedia(kind, key);
      setUser(updated);
      toast(t('common.success'), 'success');
    } catch (err) {
      toast(getErrorMessage(err, t), 'error');
    }
  };

  const renderSlots = (kind: SlotKind, items: MediaItem[]) => {
    const slots = [0, 1, 2, 3];
    return (
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {slots.map((index) => {
          const item = items[index];
          return item ? (
            <div key={item.key} className="group relative aspect-square overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--line)' }}>
              <img src={mediaUrl(item.key)} alt={pick(item.captionAr || '', item.captionEn || '')} loading="lazy" className="h-full w-full object-cover" />
              <div className="absolute inset-0 flex items-end justify-center gap-1.5 bg-gradient-to-t from-black/70 via-transparent to-transparent p-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                <button type="button" className="grid h-8 w-8 place-items-center rounded-lg bg-white/95 text-[#14231b]" onClick={() => openSlot(kind, index, item)} aria-label={t('dash.replace')}><RefreshCw size={14} /></button>
                <button type="button" className="grid h-8 w-8 place-items-center rounded-lg bg-white/95 text-[#b42318]" onClick={() => remove(kind, item.key)} aria-label={t('common.delete')}><Trash2 size={14} /></button>
              </div>
              <span className="absolute start-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-black/45 text-[10px] font-bold text-white">{index + 1}</span>
            </div>
          ) : (
            <button key={`empty-${index}`} type="button" onClick={() => openSlot(kind)} className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed transition-colors hover:bg-[var(--surface-2)]" style={{ borderColor: 'var(--line-strong)', color: 'var(--muted)' }}>
              <Plus size={22} />
              <span className="text-[11px] font-bold">{t('dash.upload')}</span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">{t('dash.media')}</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>{t('dash.uploadHint')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_1.35fr]">
        <section className="card p-5">
          <h2 className="text-sm font-extrabold">{t('dash.avatar')}</h2>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--muted)' }}>{t('dash.avatarSub')}</p>
          <div className="mt-4 flex flex-col items-center">
            <div className="relative">
              <img src={user.avatarKey ? mediaUrl(user.avatarKey) : '/brand/default-avatar.png'} alt="" className="h-32 w-32 rounded-[28px] object-cover ring-4 ring-[var(--gold)]/30" />
              {uploading?.kind === 'avatar' && (
                <div className="absolute inset-0 grid place-items-center rounded-[28px] bg-black/55 text-white">
                  <div className="text-center"><Loader2 size={22} className="mx-auto animate-spin" /><span className="mt-1 block text-xs">{progress}%</span></div>
                </div>
              )}
            </div>
            <input ref={avatarRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { uploadDirect(e.target.files?.[0], 'avatar'); e.target.value = ''; }} />
            <div className="mt-4 flex gap-2">
              <button type="button" className="btn btn-primary btn-sm" onClick={() => avatarRef.current?.click()} disabled={!!uploading}><Camera size={15} /> {t('dash.upload')}</button>
              {user.avatarKey && <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove('avatar', user.avatarKey)}><Trash2 size={15} /> {t('common.remove')}</button>}
            </div>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="text-sm font-extrabold">{t('dash.cover')}</h2>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--muted)' }}>{t('dash.coverSub')}</p>
          <div className="relative mt-4 overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--line)' }}>
            <img src={user.coverKey ? mediaUrl(user.coverKey) : '/brand/default-cover.webp'} alt="" className="aspect-[2.66/1] w-full object-cover" />
            {uploading?.kind === 'cover' && (
              <div className="absolute inset-0 grid place-items-center bg-black/55 text-white">
                <div className="text-center"><Loader2 size={22} className="mx-auto animate-spin" /><span className="mt-1 block text-xs">{progress}%</span></div>
              </div>
            )}
          </div>
          <input ref={coverRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { uploadDirect(e.target.files?.[0], 'cover'); e.target.value = ''; }} />
          <div className="mt-3 flex gap-2">
            <button type="button" className="btn btn-primary btn-sm" onClick={() => coverRef.current?.click()} disabled={!!uploading}><Upload size={15} /> {t('dash.upload')}</button>
            {user.coverKey && <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove('cover', user.coverKey)}><Trash2 size={15} /> {t('common.remove')}</button>}
          </div>
        </section>
      </div>

      <section className="card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold">{t('dash.skills')}</h2>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--muted)' }}>{t('dash.skillsSub')}</p>
          </div>
          <span className="badge badge-brand shrink-0">{user.skills.length}/4</span>
        </div>
        {renderSlots('skill', user.skills)}
      </section>

      <section className="card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold">{t('dash.works')}</h2>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--muted)' }}>{t('dash.worksSub')}</p>
          </div>
          <span className="badge badge-brand shrink-0">{user.works.length}/4</span>
        </div>
        {renderSlots('work', user.works)}
      </section>

      <div className="flex items-start gap-3 rounded-2xl border p-4 text-xs" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)', color: 'var(--muted)' }}>
        <ImageIcon size={17} className="mt-0.5 shrink-0" style={{ color: 'var(--gold)' }} />
        <p className="leading-relaxed">{t('dash.uploadHint')} {t('dash.max4')}</p>
      </div>

      <Modal
        open={!!slot}
        onClose={closeSlot}
        title={slot?.kind === 'work' ? t('dash.works') : t('dash.skills')}
        subtitle={slot?.item ? t('dash.replace') : t('dash.upload')}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button className="btn btn-ghost btn-sm" onClick={closeSlot} disabled={!!uploading}>{t('common.cancel')}</button>
            <button className="btn btn-primary btn-sm" onClick={uploadSlot} disabled={!!uploading || !slotFile}>
              {uploading ? <><Loader2 size={15} className="animate-spin" /> {progress}%</> : <><Upload size={15} /> {t('dash.upload')}</>}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {slotPreview ? (
            <img src={slotPreview} alt="" className="mx-auto max-h-64 rounded-2xl object-contain" />
          ) : slot?.item ? (
            <img src={mediaUrl(slot.item.key)} alt="" className="mx-auto max-h-64 rounded-2xl object-contain" />
          ) : (
            <div className="grid h-40 place-items-center rounded-2xl border-2 border-dashed" style={{ borderColor: 'var(--line-strong)', color: 'var(--muted)' }}>
              <ImagePlus size={34} />
            </div>
          )}
          <label className="btn btn-ghost w-full cursor-pointer">
            <ImagePlus size={16} /> {t('dash.upload')}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { setSlotFile(e.target.files?.[0] || null); setSlotError(''); }} />
          </label>
          <label className="block">
            <span className="field-label">{t('dash.captionAr')} <span className="font-normal opacity-50">({t('common.optional')})</span></span>
            <input className="input" value={captionAr} onChange={(e) => setCaptionAr(e.target.value)} maxLength={120} />
          </label>
          <label className="block">
            <span className="field-label">{t('dash.captionEn')} <span className="font-normal opacity-50">({t('common.optional')})</span></span>
            <input className="input" value={captionEn} onChange={(e) => setCaptionEn(e.target.value)} maxLength={120} dir="ltr" />
          </label>
          {slotError && <p className="field-error">{slotError}</p>}
        </div>
      </Modal>
    </div>
  );
}
