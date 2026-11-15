import type { UserPublic } from '../../shared/types';
import { CITY_MAP, socialHref, SOCIAL_MAP } from '../../shared/data';

function escapeValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

export function buildVCard(profile: UserPublic, minimal = false): string {
  const origin = window.location.origin;
  const url = `${origin}/${profile.handle}`;
  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${escapeValue(profile.fullNameAr)};;;;`,
    `FN:${escapeValue(profile.fullNameAr)}`,
    `ORG:${escapeValue('أطباء المملكة العربية السعودية')}`,
    `TITLE:${escapeValue(profile.specialtyAr || 'طبيب')}`,
    `URL:${url}`,
    `REV:${new Date().toISOString()}`
  ];
  if (profile.phone) lines.push(`TEL;TYPE=CELL:${escapeValue(profile.phone)}`);
  if (profile.whatsapp) lines.push(`TEL;TYPE=WORK:${escapeValue(profile.whatsapp)}`);
  if (profile.publicEmail) lines.push(`EMAIL;TYPE=WORK:${escapeValue(profile.publicEmail)}`);
  const city = CITY_MAP[profile.city];
  if (city) lines.push(`ADR;TYPE=WORK:;;${escapeValue(city.ar)};;;${escapeValue('المملكة العربية السعودية')}`);
  if (!minimal) {
    for (const social of profile.socials) {
      if (social.platform === 'email' || social.platform === 'phone') continue;
      const href = socialHref(social.platform, social.value);
      if (href) lines.push(`URL;TYPE=${escapeValue(SOCIAL_MAP[social.platform]?.en || 'Social')}:${escapeValue(href)}`);
    }
    if (profile.bioAr) lines.push(`NOTE:${escapeValue(profile.bioAr.slice(0, 500))}`);
    if (profile.avatarKey) lines.push(`PHOTO;VALUE=URI:${origin}/media/${profile.avatarKey}`);
  }
  lines.push('END:VCARD');
  return lines.join('\r\n') + '\r\n';
}

export function downloadVCard(profile: UserPublic) {
  const blob = new Blob([buildVCard(profile)], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${profile.handle}.vcf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
