import type { SocialPlatform } from './types';

export interface NamedItem {
  key: string;
  ar: string;
  en: string;
}

export const SPECIALTIES: NamedItem[] = [
  { key: 'family', ar: 'طب الأسرة', en: 'Family Medicine' },
  { key: 'internal', ar: 'طب الباطنة', en: 'Internal Medicine' },
  { key: 'pediatrics', ar: 'طب الأطفال', en: 'Pediatrics' },
  { key: 'obgyn', ar: 'النساء والولادة', en: 'Obstetrics & Gynecology' },
  { key: 'general-surgery', ar: 'الجراحة العامة', en: 'General Surgery' },
  { key: 'orthopedics', ar: 'جراحة العظام', en: 'Orthopedic Surgery' },
  { key: 'cardiac-surgery', ar: 'جراحة القلب', en: 'Cardiac Surgery' },
  { key: 'neurosurgery', ar: 'جراحة المخ والأعصاب', en: 'Neurosurgery' },
  { key: 'urology', ar: 'جراحة المسالك البولية', en: 'Urology' },
  { key: 'plastic-surgery', ar: 'جراحة التجميل', en: 'Plastic Surgery' },
  { key: 'ent', ar: 'الأنف والأذن والحنجرة', en: 'ENT' },
  { key: 'ophthalmology', ar: 'طب العيون', en: 'Ophthalmology' },
  { key: 'dermatology', ar: 'الجلدية', en: 'Dermatology' },
  { key: 'dentistry', ar: 'طب الأسنان', en: 'Dentistry' },
  { key: 'orthodontics', ar: 'تقويم الأسنان', en: 'Orthodontics' },
  { key: 'oral-surgery', ar: 'جراحة الفم والأسنان', en: 'Oral & Maxillofacial Surgery' },
  { key: 'cosmetic-dentistry', ar: 'تجميل الأسنان', en: 'Cosmetic Dentistry' },
  { key: 'psychiatry', ar: 'الطب النفسي', en: 'Psychiatry' },
  { key: 'child-psychiatry', ar: 'الطب النفسي للأطفال', en: 'Child Psychiatry' },
  { key: 'anesthesia', ar: 'التخدير', en: 'Anesthesiology' },
  { key: 'radiology', ar: 'الأشعة التشخيصية', en: 'Diagnostic Radiology' },
  { key: 'interventional-radiology', ar: 'الأشعة التداخلية', en: 'Interventional Radiology' },
  { key: 'pathology', ar: 'علم الأمراض', en: 'Pathology' },
  { key: 'nuclear', ar: 'الطب النووي', en: 'Nuclear Medicine' },
  { key: 'emergency', ar: 'طب الطوارئ', en: 'Emergency Medicine' },
  { key: 'icu', ar: 'العناية المركزة', en: 'Intensive Care' },
  { key: 'public-health', ar: 'الصحة العامة', en: 'Public Health' },
  { key: 'occupational', ar: 'الطب المهني', en: 'Occupational Medicine' },
  { key: 'endocrinology', ar: 'الغدد الصماء والسكري', en: 'Endocrinology & Diabetes' },
  { key: 'gastro', ar: 'الجهاز الهضمي والكبد', en: 'Gastroenterology & Hepatology' },
  { key: 'nephrology', ar: 'أمراض الكلى', en: 'Nephrology' },
  { key: 'hematology', ar: 'أمراض الدم', en: 'Hematology' },
  { key: 'oncology', ar: 'الأورام', en: 'Oncology' },
  { key: 'pulmonology', ar: 'أمراض الصدر', en: 'Pulmonology' },
  { key: 'allergy', ar: 'الحساسية والمناعة', en: 'Allergy & Immunology' },
  { key: 'rheumatology', ar: 'الروماتيزم', en: 'Rheumatology' },
  { key: 'neurology', ar: 'طب الأعصاب', en: 'Neurology' },
  { key: 'cardiology', ar: 'طب القلب', en: 'Cardiology' },
  { key: 'vascular', ar: 'جراحة الأوعية الدموية', en: 'Vascular Surgery' },
  { key: 'clinical-nutrition', ar: 'التغذية السريرية', en: 'Clinical Nutrition' },
  { key: 'physiotherapy', ar: 'العلاج الطبيعي', en: 'Physiotherapy' },
  { key: 'rehabilitation', ar: 'التأهيل الطبي', en: 'Rehabilitation Medicine' },
  { key: 'audiology', ar: 'السمعيات', en: 'Audiology' },
  { key: 'speech', ar: 'النطق والتخاطب', en: 'Speech Therapy' },
  { key: 'sports', ar: 'الطب الرياضي', en: 'Sports Medicine' },
  { key: 'sleep', ar: 'طب النوم', en: 'Sleep Medicine' },
  { key: 'geriatrics', ar: 'طب الشيخوخة', en: 'Geriatrics' },
  { key: 'other', ar: 'تخصص آخر', en: 'Other Specialty' }
];

export const CITIES: NamedItem[] = [
  { key: 'riyadh', ar: 'الرياض', en: 'Riyadh' },
  { key: 'jeddah', ar: 'جدة', en: 'Jeddah' },
  { key: 'makkah', ar: 'مكة المكرمة', en: 'Makkah' },
  { key: 'madinah', ar: 'المدينة المنورة', en: 'Madinah' },
  { key: 'dammam', ar: 'الدمام', en: 'Dammam' },
  { key: 'khobar', ar: 'الخبر', en: 'Khobar' },
  { key: 'dhahran', ar: 'الظهران', en: 'Dhahran' },
  { key: 'ahsa', ar: 'الأحساء', en: 'Al Ahsa' },
  { key: 'qatif', ar: 'القطيف', en: 'Qatif' },
  { key: 'jubail', ar: 'الجبيل', en: 'Jubail' },
  { key: 'hafr-albatin', ar: 'حفر الباطن', en: 'Hafr Al Batin' },
  { key: 'buraydah', ar: 'بريدة', en: 'Buraydah' },
  { key: 'onaizah', ar: 'عنيزة', en: 'Onaizah' },
  { key: 'alrass', ar: 'الرس', en: 'Al Rass' },
  { key: 'hail', ar: 'حائل', en: 'Hail' },
  { key: 'tabuk', ar: 'تبوك', en: 'Tabuk' },
  { key: 'sakaka', ar: 'سكاكا', en: 'Sakaka' },
  { key: 'arar', ar: 'عرعر', en: 'Arar' },
  { key: 'qurayyat', ar: 'القريات', en: 'Qurayyat' },
  { key: 'yanbu', ar: 'ينبع', en: 'Yanbu' },
  { key: 'taif', ar: 'الطائف', en: 'Taif' },
  { key: 'baha', ar: 'الباحة', en: 'Al Baha' },
  { key: 'abha', ar: 'أبها', en: 'Abha' },
  { key: 'khamis', ar: 'خميس مشيط', en: 'Khamis Mushait' },
  { key: 'jazan', ar: 'جازان', en: 'Jazan' },
  { key: 'sabya', ar: 'صبيا', en: 'Sabya' },
  { key: 'najran', ar: 'نجران', en: 'Najran' },
  { key: 'wadi-dawasir', ar: 'وادي الدواسر', en: 'Wadi Al Dawasir' },
  { key: 'kharj', ar: 'الخرج', en: 'Al Kharj' },
  { key: 'majmaah', ar: 'المجمعة', en: 'Al Majmaah' },
  { key: 'zulfi', ar: 'الزلفي', en: 'Al Zulfi' },
  { key: 'shaqra', ar: 'شقراء', en: 'Shaqra' },
  { key: 'bisha', ar: 'بيشة', en: 'Bisha' },
  { key: 'rabigh', ar: 'رابغ', en: 'Rabigh' },
  { key: 'ula', ar: 'العلا', en: 'Al Ula' },
  { key: 'other', ar: 'مدينة أخرى', en: 'Other City' }
];

export interface SocialMeta {
  id: SocialPlatform;
  ar: string;
  en: string;
  color: string;
  placeholder: string;
  kind: 'handle' | 'url' | 'phone' | 'email';
}

export const SOCIALS: SocialMeta[] = [
  { id: 'x', ar: 'منصة X', en: 'X', color: '#0f172a', placeholder: 'username', kind: 'handle' },
  { id: 'linkedin', ar: 'لينكدإن', en: 'LinkedIn', color: '#0a66c2', placeholder: 'in/username', kind: 'handle' },
  { id: 'instagram', ar: 'إنستغرام', en: 'Instagram', color: '#e1306c', placeholder: 'username', kind: 'handle' },
  { id: 'snapchat', ar: 'سناب شات', en: 'Snapchat', color: '#e7b400', placeholder: 'username', kind: 'handle' },
  { id: 'tiktok', ar: 'تيك توك', en: 'TikTok', color: '#111827', placeholder: '@username', kind: 'handle' },
  { id: 'facebook', ar: 'فيسبوك', en: 'Facebook', color: '#1877f2', placeholder: 'username', kind: 'handle' },
  { id: 'youtube', ar: 'يوتيوب', en: 'YouTube', color: '#ff0033', placeholder: '@channel', kind: 'handle' },
  { id: 'whatsapp', ar: 'واتساب', en: 'WhatsApp', color: '#25d366', placeholder: '9665xxxxxxxx', kind: 'phone' },
  { id: 'telegram', ar: 'تيليجرام', en: 'Telegram', color: '#229ed9', placeholder: 'username', kind: 'handle' },
  { id: 'threads', ar: 'ثريدز', en: 'Threads', color: '#111827', placeholder: 'username', kind: 'handle' },
  { id: 'email', ar: 'البريد الإلكتروني', en: 'Email', color: '#0f766e', placeholder: 'name@example.com', kind: 'email' },
  { id: 'phone', ar: 'الهاتف', en: 'Phone', color: '#334155', placeholder: '+9665xxxxxxxx', kind: 'phone' }
];

export const SOCIAL_MAP = Object.fromEntries(SOCIALS.map((s) => [s.id, s])) as Record<SocialPlatform, SocialMeta>;

export function socialHref(platform: SocialPlatform, raw: string): string {
  const value = raw.trim();
  if (!value) return '';
  if (platform === 'email') return `mailto:${value.replace(/^mailto:/i, '')}`;
  if (platform === 'phone') return `tel:${value.replace(/[^+\d]/g, '')}`;
  if (platform === 'whatsapp') return `https://wa.me/${value.replace(/[^\d]/g, '')}`;
  if (/^https?:\/\//i.test(value)) return value;
  const clean = value.replace(/^@/, '').replace(/^\/+|\/+$/g, '');
  switch (platform) {
    case 'x': return `https://x.com/${clean}`;
    case 'linkedin': return `https://www.linkedin.com/${clean.startsWith('in/') ? clean : `in/${clean}`}`;
    case 'instagram': return `https://www.instagram.com/${clean}`;
    case 'snapchat': return `https://www.snapchat.com/add/${clean}`;
    case 'tiktok': return `https://www.tiktok.com/@${clean}`;
    case 'facebook': return `https://www.facebook.com/${clean}`;
    case 'youtube': return clean.startsWith('channel/') || clean.startsWith('c/') ? `https://www.youtube.com/${clean}` : `https://www.youtube.com/@${clean}`;
    case 'telegram': return `https://t.me/${clean}`;
    case 'threads': return `https://www.threads.net/@${clean}`;
    default: return value;
  }
}

export const SPECIALTY_MAP = Object.fromEntries(SPECIALTIES.map((s) => [s.key, s])) as Record<string, NamedItem>;
export const CITY_MAP = Object.fromEntries(CITIES.map((c) => [c.key, c])) as Record<string, NamedItem>;

export const RESERVED_HANDLES = new Set([
  'admin', 'administrator', 'api', 'login', 'logout', 'join', 'register', 'signup', 'signin', 'search', 'dashboard',
  'settings', 'setting', 'media', 'p', 'print', 'terms', 'privacy', 'cookies', 'install', 'about', 'contact', 'support',
  'sitemap', 'sitemap.xml', 'robots', 'robots.txt', 'manifest', 'manifest.webmanifest', 'sw', 'sw.js', 'assets', 'brand',
  'og', 'health', 'qr', 'www', 'mail', 'help', 'faq', 'blog', 'news', 'doctors', 'doctor', 'profile', 'profiles', 'u',
  'user', 'users', 'app', 'download', 'verify', 'reset', 'forgot', 'auth', 'me', 'new', 'featured', 'specialties',
  'specialty', 'city', 'cities', 'static', 'fonts', 'favicon.ico', 'apple-touch-icon.png', 'index', 'home', 'ksa-doctor'
]);

export const DEFAULT_ACCENT = '#006830';
