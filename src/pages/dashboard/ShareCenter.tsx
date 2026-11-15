import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Download, ExternalLink, FileDown, Loader2, Printer, QrCode, Share2 } from 'lucide-react';
import type { UserPrivate } from '../../../shared/types';
import { useI18n } from '../../i18n';
import { useToast } from '../../lib/toast';
import { absoluteUrl, copyText, shareUrl } from '../../lib/format';
import { buildVCard, downloadVCard } from '../../lib/vcard';
import { downloadCanvas, downloadQrSvg, makeBrandedQr, makeShareCard, qrDataUrl } from '../../lib/qr';

export function ShareCenter({ user }: { user: UserPrivate }) {
  const { t, lang, pick } = useI18n();
  const { toast } = useToast();
  const [siteQr, setSiteQr] = useState('');
  const [vcardQr, setVcardQr] = useState('');
  const [busy, setBusy] = useState('');
  const siteUrl = absoluteUrl(`/${user.handle}`);
  const name = pick(user.fullNameAr, user.fullNameEn);
  const specialty = pick(user.specialtyAr, user.specialtyEn);

  useEffect(() => {
    qrDataUrl(siteUrl, 640).then(setSiteQr).catch(() => undefined);
    qrDataUrl(buildVCard(user), 640).then(setVcardQr).catch(() => undefined);
  }, [siteUrl, user]);

  const copy = async () => {
    const ok = await copyText(siteUrl);
    toast(ok ? t('prof.copied') : t('common.error'), ok ? 'success' : 'error');
  };

  const nativeShare = async () => {
    const result = await shareUrl({ title: name, text: t('prof.shareText', { name, specialty }), url: siteUrl });
    if (result === 'copied') toast(t('prof.copied'));
  };

  const downloadBranded = async (which: 'site' | 'vcard') => {
    setBusy(which);
    try {
      const canvas = which === 'site'
        ? await makeBrandedQr(siteUrl, name, `${specialty} · ksa.doctor/${user.handle}`, lang)
        : await makeBrandedQr(buildVCard(user), `${name} — vCard`, t('prof.downloadVcard'), lang);
      downloadCanvas(canvas, which === 'site' ? `${user.handle}-qr.png` : `${user.handle}-vcard-qr.png`);
    } catch {
      toast(t('common.error'), 'error');
    } finally {
      setBusy('');
    }
  };

  const downloadCard = async () => {
    setBusy('card');
    try {
      const canvas = await makeShareCard(user, lang, siteUrl);
      downloadCanvas(canvas, `${user.handle}-card.png`);
    } catch {
      toast(t('common.error'), 'error');
    } finally {
      setBusy('');
    }
  };

  const shareLinks = [
    { key: 'whatsapp', label: t('prof.shareWhatsapp'), href: `https://wa.me/?text=${encodeURIComponent(`${name} — ${specialty} ${siteUrl}`)}` },
    { key: 'x', label: t('prof.shareX'), href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${name} — ${specialty}`)}&url=${encodeURIComponent(siteUrl)}` },
    { key: 'linkedin', label: t('prof.shareLinkedin'), href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(siteUrl)}` },
    { key: 'telegram', label: t('prof.shareTelegram'), href: `https://t.me/share/url?url=${encodeURIComponent(siteUrl)}&text=${encodeURIComponent(name)}` }
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">{t('dash.share')}</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>{t('dash.qrSub')}</p>
      </div>

      <section className="relative overflow-hidden rounded-[26px] p-5 text-white sm:p-6" style={{ background: 'linear-gradient(135deg,#043824,#065c3b)' }}>
        <div className="absolute -end-10 -top-10 h-40 w-40 rounded-full bg-[#c8a45c]/20 blur-2xl" />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#e8cf9a]">{t('dash.publicLink')}</p>
          <p className="mt-2 truncate text-xl font-extrabold sm:text-2xl" dir="ltr">ksa.doctor/{user.handle}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn btn-gold btn-sm" onClick={nativeShare}><Share2 size={15} /> {t('prof.share')}</button>
            <button className="btn btn-sm border border-white/25 bg-white/10 text-white hover:bg-white/20" onClick={copy}><Copy size={15} /> {t('common.copy')}</button>
            {user.visible && user.status === 'approved' && (
              <Link to={`/${user.handle}`} target="_blank" className="btn btn-sm border border-white/25 bg-white/10 text-white hover:bg-white/20"><ExternalLink size={15} /> {t('dash.viewProfile')}</Link>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="card p-5 text-center">
          <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl" style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}><QrCode size={19} /></span>
          <h2 className="mt-2 text-base font-extrabold">{t('dash.siteQr')}</h2>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>{t('prof.qrSiteHint')}</p>
          {siteQr ? <img src={siteQr} alt="" className="mx-auto mt-4 h-48 w-48 rounded-2xl border bg-white p-2" style={{ borderColor: 'var(--line)' }} /> : <div className="skeleton mx-auto mt-4 h-48 w-48" />}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button className="btn btn-primary btn-sm" onClick={() => downloadBranded('site')} disabled={!!busy}>{busy === 'site' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} PNG</button>
            <button className="btn btn-ghost btn-sm" onClick={() => downloadQrSvg(siteUrl, `${user.handle}-qr.svg`)}><Download size={14} /> SVG</button>
          </div>
        </section>

        <section className="card p-5 text-center">
          <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl" style={{ background: 'var(--gold-soft)', color: 'var(--gold)' }}><QrCode size={19} /></span>
          <h2 className="mt-2 text-base font-extrabold">{t('dash.vcardQr')}</h2>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>{t('prof.qrVcardHint')}</p>
          {vcardQr ? <img src={vcardQr} alt="" className="mx-auto mt-4 h-48 w-48 rounded-2xl border bg-white p-2" style={{ borderColor: 'var(--line)' }} /> : <div className="skeleton mx-auto mt-4 h-48 w-48" />}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button className="btn btn-primary btn-sm" onClick={() => downloadBranded('vcard')} disabled={!!busy}>{busy === 'vcard' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} PNG</button>
            <button className="btn btn-ghost btn-sm" onClick={() => downloadQrSvg(buildVCard(user), `${user.handle}-vcard-qr.svg`)}><Download size={14} /> SVG</button>
          </div>
        </section>
      </div>

      <section className="card p-5">
        <h2 className="text-base font-extrabold">{t('dash.downloadCard')}</h2>
        <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>{t('dash.shareProfile')} · {t('dash.downloadPdf')}</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <button className="btn btn-ghost justify-start" onClick={downloadCard} disabled={!!busy}>
            {busy === 'card' ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />} {t('dash.downloadCard')}
          </button>
          <Link to={`/${user.handle}/print`} target="_blank" className="btn btn-ghost justify-start"><Printer size={16} /> {t('dash.downloadPdf')}</Link>
          <button className="btn btn-ghost justify-start" onClick={() => downloadVCard(user)}><Download size={16} /> {t('prof.downloadVcard')}</button>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-base font-extrabold">{t('prof.shareProfile')}</h2>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {shareLinks.map((link) => (
            <a key={link.key} href={link.href} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-bold transition-transform hover:-translate-y-0.5" style={{ borderColor: 'var(--line)' }}>
              <Share2 size={14} style={{ color: 'var(--brand)' }} /> {link.label}
            </a>
          ))}
        </div>
        <button className="btn btn-primary mt-3 w-full" onClick={nativeShare}><Share2 size={16} /> {t('dash.shareProfile')}</button>
      </section>
    </div>
  );
}
