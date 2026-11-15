const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const creds = Object.fromEntries(
  fs.readFileSync(path.join(__dirname, '..', '.secrets', 'admin.env'), 'utf8').trim().split('\n').map((line) => {
    const i = line.indexOf('=');
    return [line.slice(0, i), line.slice(i + 1).replace(/^'|'$/g, '')];
  })
);

const base = 'https://ksa.doctor';
const testUser = {
  name: 'د. سارة العتيبي',
  email: 'qa.doctor@ksa.doctor',
  handle: 'qadoctor',
  password: 'QaDoctor!2026#Ksa'
};

const profile = {
  fullNameAr: 'د. سارة العتيبي',
  fullNameEn: 'Dr. Sarah Al-Otaibi',
  specialtyAr: 'طب الأسرة',
  specialtyEn: 'Family Medicine',
  titleAr: 'استشارية طب الأسرة وصحة المجتمع',
  titleEn: 'Consultant in Family & Community Medicine',
  bioAr: 'استشارية طب أسرة بخبرة تتجاوز اثني عشر عامًا في الرعاية الأولية وصحة المرأة وصحة المجتمع. أرافق عائلتك بخطة رعاية واضحة وإنسانية، من الفحص الوقائي إلى المتابعة طويلة المدى.',
  bioEn: 'A family medicine consultant with over twelve years of experience in primary care, women’s health, and community medicine. I partner with families on a clear, human-centered care plan.',
  city: 'الرياض',
  phone: '',
  whatsapp: '',
  publicEmail: 'clinic@example.com',
  website: '',
  accent: '#006830'
};

const links = {
  socials: [
    { platform: 'linkedin', value: 'https://www.linkedin.com/in/example' },
    { platform: 'x', value: 'https://x.com/example' }
  ],
  services: [
    { id: 'svc1', titleAr: 'استشارات طب الأسرة', titleEn: 'Family medicine consultations', descAr: 'تقييم شامل وخطة رعاية شخصية لكل فرد في الأسرة.', descEn: 'Comprehensive assessment and a personal care plan for every family member.', icon: 'stethoscope' },
    { id: 'svc2', titleAr: 'الفحص الوقائي السنوي', titleEn: 'Annual preventive check', descAr: 'فحوصات مبكرة مبنية على العمر والتاريخ الصحي والعوامل الوراثية.', descEn: 'Age-appropriate screening based on your history and family risk.', icon: 'heart-pulse' },
    { id: 'svc3', titleAr: 'صحة المرأة', titleEn: 'Women’s health', descAr: 'رعاية متكاملة في مراحل الحياة المختلفة.', descEn: 'Integrated care across every stage of life.', icon: 'flower-2' }
  ],
  buttons: [
    { id: 'btn1', labelAr: 'احجز موعدًا', labelEn: 'Book an appointment', url: 'https://example.com/booking', icon: 'calendar', color: '#006830' }
  ],
  videos: []
};

(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  const errors = [];
  const attach = (page, tag) => {
    page.on('pageerror', (e) => errors.push(`${tag} PAGEERROR ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`${tag} CONSOLE ${m.text()}`); });
    page.on('requestfailed', (r) => {
      if (!r.url().includes('favicon')) errors.push(`${tag} REQFAIL ${r.url()} ${r.failure()?.errorText}`);
    });
  };

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });

  const home = await mobile.newPage(); attach(home, 'home-mobile');
  await home.goto(base + '/', { waitUntil: 'networkidle' });
  await home.waitForTimeout(1000);
  console.log('HOME_TITLE', await home.title());
  console.log('HOME_LANG', await home.locator('html').getAttribute('lang'));
  console.log('HOME_H1', await home.locator('h1').first().innerText());
  await home.screenshot({ path: 'docs/qa/home-mobile.png', fullPage: true });
  const accept = home.getByRole('button', { name: /قبول الكل|Accept all/ });
  if (await accept.count()) { await accept.first().click(); await home.waitForTimeout(400); }

  const search = await mobile.newPage(); attach(search, 'search-mobile');
  await search.goto(base + '/search?q=' + encodeURIComponent('قلب'), { waitUntil: 'networkidle' });
  await search.waitForTimeout(800);
  await search.screenshot({ path: 'docs/qa/search-mobile.png', fullPage: true });

  // Full journey: register a temporary doctor through the real UI.
  const doctor = await mobile.newPage(); attach(doctor, 'doctor-flow');
  await doctor.goto(base + '/join', { waitUntil: 'networkidle' });
  await doctor.fill('input[autocomplete="name"]', testUser.name);
  await doctor.fill('input[type=email]', testUser.email);
  await doctor.fill('input[autocomplete="username"]', testUser.handle);
  const passwords = doctor.locator('input[autocomplete="new-password"]');
  await passwords.nth(0).fill(testUser.password);
  await passwords.nth(1).fill(testUser.password);
  await doctor.locator('input[type=checkbox]').check();
  await doctor.getByRole('button', { name: /إنشاء الحساب|Create account/ }).click();
  await doctor.waitForURL(/\/dashboard/, { timeout: 25000 });
  await doctor.waitForTimeout(1200);
  console.log('REGISTERED', doctor.url());
  const meBefore = await doctor.evaluate(async () => (await fetch('/api/auth/me')).json());
  console.log('DOCTOR_ID', meBefore.user?.id, 'STATUS', meBefore.user?.status, 'VISIBLE', meBefore.user?.visible);

  // Accept cookies so they do not obscure dashboard QA captures.
  const acceptDoctor = doctor.getByRole('button', { name: /قبول الكل|Accept all/ });
  if (await acceptDoctor.count()) { await acceptDoctor.first().click(); await doctor.waitForTimeout(300); }

  // Admin signs in and approves through the real admin API/session.
  const adminContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const admin = await adminContext.newPage(); attach(admin, 'admin-flow');
  await admin.goto(base + '/', { waitUntil: 'networkidle' });
  const acceptAdmin = admin.getByRole('button', { name: /قبول الكل|Accept all/ });
  if (await acceptAdmin.count()) { await acceptAdmin.first().click(); }
  await admin.goto(base + '/login', { waitUntil: 'networkidle' });
  await admin.fill('input[type=email]', creds.ADMIN_EMAIL);
  await admin.fill('input[type=password]', creds.ADMIN_PASSWORD);
  await admin.getByRole('button', { name: /تسجيل الدخول|Sign in/ }).click();
  await admin.waitForURL(/\/admin/, { timeout: 25000 });
  await admin.getByRole('heading', { name: /لوحة الإشراف|Admin panel/ }).waitFor({ timeout: 25000 });
  await admin.waitForTimeout(900);
  console.log('ADMIN_URL', admin.url());
  console.log('ADMIN_H1', await admin.locator('h1').first().innerText());

  const approved = await admin.evaluate(async (handle) => {
    const list = await (await fetch('/api/admin/members?status=pending&q=' + encodeURIComponent(handle))).json();
    const member = (list.items || []).find((item) => item.handle === handle);
    if (!member) return { error: 'member_not_found', list };
    const res = await fetch(`/api/admin/members/${member.id}/approve`, { method: 'POST' });
    return { status: res.status, body: await res.text(), id: member.id };
  }, testUser.handle);
  console.log('APPROVE_RESULT', approved.status, approved.id || approved.error);
  await admin.reload({ waitUntil: 'networkidle' });
  await admin.getByRole('heading', { name: /لوحة الإشراف|Admin panel/ }).waitFor({ timeout: 20000 });
  await admin.waitForTimeout(800);
  await admin.screenshot({ path: 'docs/qa/admin-mobile.png', fullPage: true });

  await doctor.reload({ waitUntil: 'networkidle' });
  await doctor.waitForTimeout(900);
  const meAfter = await doctor.evaluate(async () => (await fetch('/api/auth/me')).json());
  console.log('APPROVED_STATUS', meAfter.user?.status, 'VISIBLE', meAfter.user?.visible);

  const profileResult = await doctor.evaluate(async (payload) => {
    const res = await fetch('/api/me/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    return { status: res.status, body: await res.text() };
  }, profile);
  console.log('PROFILE_UPDATE', profileResult.status, profileResult.status >= 400 ? profileResult.body.slice(0, 300) : 'ok');

  const linksResult = await doctor.evaluate(async (payload) => {
    const res = await fetch('/api/me/links', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    return { status: res.status, body: await res.text() };
  }, links);
  console.log('LINKS_UPDATE', linksResult.status, linksResult.status >= 400 ? linksResult.body.slice(0, 300) : 'ok');

  await doctor.goto(base + '/dashboard', { waitUntil: 'networkidle' });
  await doctor.waitForTimeout(5200);
  await doctor.screenshot({ path: 'docs/qa/dashboard-mobile.png', fullPage: true });

  await doctor.goto(base + '/' + testUser.handle, { waitUntil: 'networkidle' });
  await doctor.waitForTimeout(1200);
  console.log('PROFILE_H1', await doctor.locator('h1').first().innerText());
  await doctor.screenshot({ path: 'docs/qa/profile-mobile.png', fullPage: true });

  const profileDesktop = await desktop.newPage(); attach(profileDesktop, 'profile-desktop');
  await profileDesktop.goto(base + '/' + testUser.handle, { waitUntil: 'networkidle' });
  await profileDesktop.waitForTimeout(900);
  const acceptProfileDesktop = profileDesktop.getByRole('button', { name: /قبول الكل|Accept all/ });
  if (await acceptProfileDesktop.count()) { await acceptProfileDesktop.first().click(); await profileDesktop.waitForTimeout(300); }
  await profileDesktop.screenshot({ path: 'docs/qa/profile-desktop.png', fullPage: true });

  const desktopHome = await desktop.newPage(); attach(desktopHome, 'home-desktop');
  await desktopHome.goto(base + '/', { waitUntil: 'networkidle' });
  await desktopHome.waitForTimeout(900);
  const acceptHomeDesktop = desktopHome.getByRole('button', { name: /قبول الكل|Accept all/ });
  if (await acceptHomeDesktop.count()) { await acceptHomeDesktop.first().click(); await desktopHome.waitForTimeout(300); }
  await desktopHome.screenshot({ path: 'docs/qa/home-desktop.png', fullPage: true });

  await doctor.goto(base + '/dashboard?tab=share', { waitUntil: 'networkidle' });
  await doctor.waitForTimeout(1000);
  await doctor.screenshot({ path: 'docs/qa/share-mobile.png', fullPage: true });

  fs.writeFileSync('docs/qa/errors.log', errors.join('\n') + '\n');
  console.log('ERROR_COUNT', errors.length);
  console.log('TEST_USER_ID', approved.id || meBefore.user?.id);
  await browser.close();
})().catch((e) => { console.error('QA_FAILED', e); process.exit(1); });
