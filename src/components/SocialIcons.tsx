import { AtSign, Facebook, Ghost, Instagram, Linkedin, Mail, MessageCircle, Music2, Phone, Send, Twitter, Youtube } from 'lucide-react';
import type { SocialPlatform } from '../../shared/types';
import { SOCIAL_MAP, socialHref } from '../../shared/data';

const ICONS: Record<SocialPlatform, typeof Mail> = {
  x: Twitter,
  linkedin: Linkedin,
  instagram: Instagram,
  snapchat: Ghost,
  tiktok: Music2,
  facebook: Facebook,
  youtube: Youtube,
  whatsapp: MessageCircle,
  telegram: Send,
  threads: AtSign,
  email: Mail,
  phone: Phone
};

export function SocialIcon({ platform, size = 18 }: { platform: SocialPlatform; size?: number }) {
  const Icon = ICONS[platform] || Mail;
  return <Icon size={size} />;
}

export function SocialLinkButton({ platform, value, compact = false }: { platform: SocialPlatform; value: string; compact?: boolean }) {
  const meta = SOCIAL_MAP[platform];
  if (!meta) return null;
  const href = socialHref(platform, value);
  if (!href) return null;
  return (
    <a
      href={href}
      target={platform === 'email' || platform === 'phone' ? undefined : '_blank'}
      rel="noopener noreferrer"
      className={`group inline-flex items-center gap-2 rounded-full border font-medium transition-all hover:-translate-y-0.5 ${compact ? 'h-10 w-10 justify-center' : 'px-4 py-2 text-sm'}`}
      style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}
      title={meta.ar}
      aria-label={meta.ar}
    >
      <span className="grid h-7 w-7 place-items-center rounded-full text-white" style={{ background: meta.color }}>
        <SocialIcon platform={platform} size={15} />
      </span>
      {!compact && <span className="truncate">{meta.ar}</span>}
    </a>
  );
}
