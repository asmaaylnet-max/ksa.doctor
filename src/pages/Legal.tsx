import { Cookie, FileText, ShieldCheck } from 'lucide-react';
import { useI18n } from '../i18n';
import { useConsent } from '../lib/consent';

type Kind = 'terms' | 'privacy' | 'cookies';

const CONTENT: Record<Kind, { ar: { title: string; intro: string; sections: { h: string; p: string }[] }; en: { title: string; intro: string; sections: { h: string; p: string }[] } }> = {
  terms: {
    ar: {
      title: 'شروط الاستخدام',
      intro: 'تحكم هذه الشروط استخدامك لمنصة «أطباء المملكة العربية السعودية» على النطاق ksa.doctor. باستخدامك المنصة أو إنشاء حساب، فإنك توافق عليها.',
      sections: [
        { h: '١. الأهلية والحساب', p: 'المنصة مخصصة للأطباء وأطباء الأسنان والصيادلة والممارسين الصحيين المرخصين في المملكة العربية السعودية. أنت مسؤول عن صحة بيانات حسابك وسرية كلمة المرور، وعن كل نشاط يجري عبر حسابك.' },
        { h: '٢. دقة البيانات', p: 'تلتزم بتقديم بيانات مهنية صحيحة ومحدثة، بما في ذلك الاسم والتخصص والمؤهل والخدمات. يحق للإدارة طلب ما يثبت الترخيص أو التخصص، ورفض أو إيقاف أي ملف لا يستوفي ذلك.' },
        { h: '٣. المراجعة والنشر', p: 'لا يُنشر الملف للجمهور إلا بعد اعتماد المشرف الرئيسي. الاعتماد لا يعني مصادقة رسمية من جهة حكومية، بل مراجعة داخلية للمنصة. يمكن تعديل الملف أو إيقافه عند مخالفة الشروط أو ورود شكوى موثقة.' },
        { h: '٤. الاستخدام المقبول', p: 'يُمنع نشر محتوى مضلل أو مسيء أو مخالف للأنظمة السعودية أو لأخلاقيات المهنة، أو انتحال شخصية غيرك، أو محاولة اختراق المنصة أو إساءة استخدامها، أو رفع مواد تنتهك حقوق الملكية الفكرية.' },
        { h: '٥. الملكية الفكرية', p: 'تبقى ملكية الصور والنصوص التي ترفعها لك، وتمنح المنصة ترخيصًا غير حصري لعرضها ضمن ملفك العام والمواد الترويجية للمنصة. شعار المنصة وتصميمها ملك للمنصة ولا يجوز استخدامهما دون إذن.' },
        { h: '٦. حدود المسؤولية والتغييرات', p: 'تُقدَّم المنصة «كما هي» دون ضمانات تشغيل غير منقطع. لا تتحمل المنصة مسؤولية أي قرار علاجي أو تعاقد بين الطبيب والزائر. قد نحدّث هذه الشروط وننشر التحديث هنا، ويُعد استمرارك في الاستخدام موافقة عليه. تخضع الشروط لأنظمة المملكة العربية السعودية.' }
      ]
    },
    en: {
      title: 'Terms of Use',
      intro: 'These terms govern your use of the Saudi Doctors platform at ksa.doctor. By using the platform or creating an account, you agree to them.',
      sections: [
        { h: '1. Eligibility and account', p: 'The platform is intended for licensed physicians, dentists, pharmacists, and healthcare practitioners in Saudi Arabia. You are responsible for the accuracy of your account information, the confidentiality of your password, and all activity under your account.' },
        { h: '2. Accurate information', p: 'You agree to provide accurate, current professional information, including your name, specialty, credentials, and services. Administration may request proof of licensure or specialty and may reject or suspend any profile that does not meet these requirements.' },
        { h: '3. Review and publication', p: 'Profiles are published only after approval by the lead administrator. Approval is an internal platform review, not official certification by a government authority. Profiles may be edited or suspended for violations or documented complaints.' },
        { h: '4. Acceptable use', p: 'You may not publish misleading or offensive content, violate Saudi law or professional ethics, impersonate others, attempt to compromise the platform, or upload material that infringes intellectual property rights.' },
        { h: '5. Intellectual property', p: 'You retain ownership of the images and text you upload and grant the platform a non-exclusive license to display them in your public profile and platform promotional materials. The platform brand and design may not be used without permission.' },
        { h: '6. Liability and changes', p: 'The platform is provided “as is” without a guarantee of uninterrupted operation. The platform is not responsible for clinical decisions or agreements between a doctor and a visitor. We may update these terms and publish changes here; continued use constitutes acceptance. These terms are governed by the laws of Saudi Arabia.' }
      ]
    }
  },
  privacy: {
    ar: {
      title: 'سياسة الخصوصية',
      intro: 'نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية وفقًا لنظام حماية البيانات الشخصية في المملكة العربية السعودية ولوائحه.',
      sections: [
        { h: '١. البيانات التي نجمعها', p: 'بيانات الحساب (الاسم والبريد وكلمة المرور المشفرة)، وبيانات الملف المهني التي تختار إدخالها (التخصص، النبذة، المدينة، وسائل التواصل، الصور، الخدمات)، وبيانات تقنية محدودة (عنوان IP ونوع المتصفح) لأغراض الأمان ومنع إساءة الاستخدام، وإحصاءات استخدام مجمعة.' },
        { h: '٢. الغرض من المعالجة', p: 'نستخدم بياناتك لإنشاء حسابك وإدارة ملفك، والتحقق من أهليتك، ونشر ملفك بعد موافقتك، والتواصل معك بشأن حسابك، وتحسين المنصة، وحماية الخدمة. لا نبيع بياناتك الشخصية ولا نشاركها لأغراض تسويقية لجهات أخرى.' },
        { h: '٣. الظهور العام', p: 'تظهر بيانات ملفك المهني (الاسم، التخصص، النبذة، المدينة، الخدمات، الصور، ووسائل التواصل التي تختار إضافتها) للجمهور عند اعتماد الملف. لا يظهر بريد حسابك أو كلمة المرور أو بيانات الأمان.' },
        { h: '٤. المشاركة والمعالجون', p: 'نستعين بمقدمي خدمات موثوقين للاستضافة (Cloudflare) وإرسال البريد (Resend) وفق ضمانات تعاقدية. قد نكشف البيانات إذا أوجبت ذلك الأنظمة أو طلب قضائي مختص، أو لحماية حقوق المنصة ومستخدميها.' },
        { h: '٥. الاحتفاظ والأمان', p: 'نحتفظ ببيانات الحساب طوال نشاطه، وبسجلات الأمان للمدة اللازمة قانونًا. نطبق تشفير النقل، وتجزئة كلمات المرور، وضوابط وصول صارمة، وحدودًا لمعدل الطلبات. لا يوجد نظام آمن بنسبة مطلقة، لكننا نراجع إجراءاتنا باستمرار.' },
        { h: '٦. حقوقك', p: 'لك حق الاطلاع على بياناتك وتصحيحها وتصديرها من لوحة حسابك، وطلب حذف حسابك عبر الإدارة. يمكنك سحب موافقتك على التحليلات من تفضيلات الكوكيز في أي وقت. للاستفسارات: hello@ksa.doctor.' }
      ]
    },
    en: {
      title: 'Privacy Policy',
      intro: 'We respect your privacy and protect your personal data in line with the Saudi Personal Data Protection Law (PDPL) and its regulations.',
      sections: [
        { h: '1. Data we collect', p: 'Account data (name, email, hashed password), professional profile data you choose to provide (specialty, bio, city, social links, images, services), limited technical data (IP address and browser type) for security and abuse prevention, and aggregated usage statistics.' },
        { h: '2. Purposes', p: 'We use your data to create and manage your account, verify eligibility, publish your profile with your consent, communicate about your account, improve the platform, and protect the service. We do not sell your personal data or share it for third-party marketing.' },
        { h: '3. Public visibility', p: 'Your professional profile data (name, specialty, bio, city, services, images, and social links you add) becomes public once the profile is approved. Your account email, password, and security data are not public.' },
        { h: '4. Sharing and processors', p: 'We use trusted service providers for hosting (Cloudflare) and email delivery (Resend) under contractual safeguards. We may disclose data where required by law, by a competent judicial order, or to protect the rights of the platform and its users.' },
        { h: '5. Retention and security', p: 'We retain account data while the account is active and security logs for the periods required by law. We apply transport encryption, password hashing, strict access controls, and request rate limits. No system is absolutely secure, but we review our practices continuously.' },
        { h: '6. Your rights', p: 'You may access, correct, and export your data from your dashboard, and request account deletion through administration. You may withdraw analytics consent at any time in cookie preferences. Contact: hello@ksa.doctor.' }
      ]
    }
  },
  cookies: {
    ar: {
      title: 'سياسة الكوكيز',
      intro: 'نستخدم الكوكيز والتخزين المحلي لتشغيل المنصة وتحسين تجربتك. لا نستخدم كوكيز إعلانية أو تتبعًا عبر المواقع.',
      sections: [
        { h: 'الضرورية', p: 'لازمة لتسجيل الدخول وإدارة الجلسة والأمان ومنع إساءة الاستخدام. لا يمكن تعطيلها لأن المنصة لا تعمل بدونها.' },
        { h: 'التفضيلات', p: 'تحفظ لغتك المفضلة ومظهرك (داكن/فاتح) وتفضيلات الكوكيز نفسها، لتجنب إعادة ضبطها في كل زيارة. يمكنك تعطيلها لكن ستعود الإعدادات الافتراضية في كل مرة.' },
        { h: 'التحليلات', p: 'إحصاءات مجمعة عن الزيارات والبحث تساعدنا على تحسين المنصة. لا تحتوي على بيانات شخصية ولا تُستخدم للإعلانات. تُفعّل فقط بموافقتك.' },
        { h: 'إدارة التفضيلات', p: 'يمكنك تغيير اختياراتك في أي وقت من هذه الصفحة أو من إعدادات حسابك. حذف الكوكيز من المتصفح يعيد ضبط التفضيلات.' }
      ]
    },
    en: {
      title: 'Cookie Policy',
      intro: 'We use cookies and local storage to operate the platform and improve your experience. We do not use advertising cookies or cross-site tracking.',
      sections: [
        { h: 'Necessary', p: 'Required for sign-in, session management, security, and abuse prevention. They cannot be disabled because the platform does not work without them.' },
        { h: 'Preferences', p: 'Remember your preferred language, theme (dark/light), and cookie choices so they are not reset on every visit. You may disable them, but defaults will apply each time.' },
        { h: 'Analytics', p: 'Aggregated visit and search statistics that help us improve the platform. They contain no personal data and are not used for advertising. They are enabled only with your consent.' },
        { h: 'Managing preferences', p: 'You can change your choices at any time from this page or your account settings. Clearing browser cookies resets preferences.' }
      ]
    }
  }
};

const ICONS = { terms: FileText, privacy: ShieldCheck, cookies: Cookie };

export default function Legal({ kind }: { kind: Kind }) {
  const { t, lang } = useI18n();
  const { openSettings } = useConsent();
  const content = CONTENT[kind][lang];
  const Icon = ICONS[kind];

  return (
    <div className="container-page max-w-4xl py-10 sm:py-14">
      <div className="mb-8 text-center">
        <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl" style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>
          <Icon size={26} />
        </span>
        <h1 className="text-3xl font-extrabold sm:text-4xl">{content.title}</h1>
        <p className="mt-2 text-xs" style={{ color: 'var(--muted-2)' }}>{t('legal.lastUpdated')}</p>
      </div>
      <div className="card p-6 sm:p-10">
        <p className="text-sm leading-8" style={{ color: 'var(--muted)' }}>{content.intro}</p>
        <div className="mt-7 space-y-7">
          {content.sections.map((section) => (
            <section key={section.h}>
              <h2 className="text-lg font-extrabold">{section.h}</h2>
              <p className="mt-2 text-sm leading-8" style={{ color: 'var(--muted)' }}>{section.p}</p>
            </section>
          ))}
        </div>
        {kind === 'cookies' && (
          <button className="btn btn-primary mt-8" onClick={openSettings}>{t('legal.cookieCustomize')}</button>
        )}
        <div className="mt-8 border-t pt-5 text-sm" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>
          {t('legal.contactUs')}
        </div>
      </div>
    </div>
  );
}
