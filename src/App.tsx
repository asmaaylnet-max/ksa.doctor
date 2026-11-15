import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { I18nProvider } from './i18n';
import { ThemeProvider } from './lib/theme';
import { ToastProvider } from './lib/toast';
import { ConsentProvider } from './lib/consent';
import { AuthProvider } from './lib/auth';
import { PublicLayout } from './components/PublicLayout';
import { RequireAdmin, RequireAuth } from './components/RequireAuth';
import { ScrollToTop } from './components/ScrollToTop';
import { CookieConsent } from './components/CookieConsent';
import { InstallPrompt } from './components/InstallPrompt';
import { PwaUpdate } from './components/PwaUpdate';
import { OfflineBanner } from './components/OfflineBanner';

const Home = lazy(() => import('./pages/Home'));
const SearchPage = lazy(() => import('./pages/Search'));
const Join = lazy(() => import('./pages/Join'));
const Login = lazy(() => import('./pages/Login'));
const Forgot = lazy(() => import('./pages/Forgot'));
const Reset = lazy(() => import('./pages/Reset'));
const Profile = lazy(() => import('./pages/Profile'));
const PrintProfile = lazy(() => import('./pages/PrintProfile'));
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const Admin = lazy(() => import('./pages/Admin'));
const Legal = lazy(() => import('./pages/Legal'));
const NotFound = lazy(() => import('./pages/NotFound'));

function Loader() {
  return (
    <div className="grid min-h-[70dvh] place-items-center" role="status" aria-label="Loading">
      <div className="flex flex-col items-center gap-3">
        <img src="/brand/emblem.png" alt="" className="h-14 w-14 animate-pulse" />
        <span className="skeleton h-1.5 w-24 !rounded-full" />
      </div>
    </div>
  );
}

function RoutesView() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="terms" element={<Legal kind="terms" />} />
          <Route path="privacy" element={<Legal kind="privacy" />} />
          <Route path="cookies" element={<Legal kind="cookies" />} />
          <Route path=":handle" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="join" element={<Join />} />
        <Route path="login" element={<Login />} />
        <Route path="forgot" element={<Forgot />} />
        <Route path="reset" element={<Reset />} />
        <Route path=":handle/print" element={<PrintProfile />} />
        <Route path="dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <ConsentProvider>
              <BrowserRouter>
                <ScrollToTop />
                <RoutesView />
                <CookieConsent />
                <InstallPrompt />
                <PwaUpdate />
                <OfflineBanner />
              </BrowserRouter>
            </ConsentProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}
