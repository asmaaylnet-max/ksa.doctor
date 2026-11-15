import { useState } from 'react';
import { Play } from 'lucide-react';
import type { VideoItem } from '../../shared/types';
import { youtubeEmbed, youtubeThumb } from '../lib/youtube';

export function YouTubeEmbed({ video, title }: { video: VideoItem; title: string }) {
  const [active, setActive] = useState(false);
  if (active) {
    return (
      <div className="aspect-video overflow-hidden rounded-2xl border bg-black" style={{ borderColor: 'var(--line)' }}>
        <iframe
          src={youtubeEmbed(video.videoId)}
          title={title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setActive(true)}
      className="group relative aspect-video w-full overflow-hidden rounded-2xl border text-start"
      style={{ borderColor: 'var(--line)', background: 'var(--surface-3)' }}
      aria-label={title}
    >
      <img src={youtubeThumb(video.videoId)} alt={title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
      <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-white/95 text-[#ff0033] shadow-2xl transition-transform group-hover:scale-110">
          <Play size={24} fill="currentColor" className="ms-1" />
        </span>
      </span>
      <span className="absolute inset-x-0 bottom-0 line-clamp-2 p-3 text-sm font-bold text-white">{title}</span>
    </button>
  );
}
