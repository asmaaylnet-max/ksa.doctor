import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { MediaItem } from '../../shared/types';
import { mediaUrl } from '../lib/media';
import { useI18n } from '../i18n';

export function ImageLightbox({
  items,
  index,
  onIndexChange,
  onClose
}: {
  items: MediaItem[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const { t, pick } = useI18n();
  const item = items[index];

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && index < items.length - 1) onIndexChange(index + 1);
      if (e.key === 'ArrowLeft' && index > 0) onIndexChange(index - 1);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = original;
      document.removeEventListener('keydown', onKey);
    };
  }, [index, items.length, onClose, onIndexChange]);

  if (!item) return null;
  return createPortal(
    <div className="fixed inset-0 z-[140] flex flex-col bg-black/92 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={t('prof.gallery')}>
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="text-sm font-bold">{index + 1} / {items.length}</span>
        <button className="grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-white/20" onClick={onClose} aria-label={t('prof.closeGallery')}>
          <X size={20} />
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-3 pb-6">
        {index > 0 && (
          <button className="absolute start-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" onClick={() => onIndexChange(index - 1)} aria-label={t('common.previous')}>
            <ChevronRight size={24} className="rtl:hidden" />
            <ChevronLeft size={24} className="hidden rtl:block" />
          </button>
        )}
        <img src={mediaUrl(item.key)} alt={pick(item.captionAr || '', item.captionEn || '') || 'Image'} className="max-h-full max-w-full rounded-xl object-contain" />
        {index < items.length - 1 && (
          <button className="absolute end-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" onClick={() => onIndexChange(index + 1)} aria-label={t('common.next')}>
            <ChevronLeft size={24} className="rtl:hidden" />
            <ChevronRight size={24} className="hidden rtl:block" />
          </button>
        )}
      </div>
      {(item.captionAr || item.captionEn) && (
        <p className="px-6 pb-8 text-center text-sm text-white/80">{pick(item.captionAr || '', item.captionEn || '')}</p>
      )}
    </div>,
    document.body
  );
}
