import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { AdminProtectedRoute } from './components/admin/AdminProtectedRoute'
import { PageMetadata } from './components/seo/PageMetadata'

const PortfolioPage = lazy(() => import('./pages/PortfolioPage').then((module) => ({ default: module.PortfolioPage })))
const AboutPage = lazy(() => import('./pages/AboutPage').then((module) => ({ default: module.AboutPage })))
const ServicesPage = lazy(() => import('./pages/ServicesPage').then((module) => ({ default: module.ServicesPage })))
const ContactPage = lazy(() => import('./pages/ContactPage').then((module) => ({ default: module.ContactPage })))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then((module) => ({ default: module.PrivacyPage })))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })))
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage').then((module) => ({ default: module.AdminLoginPage })))
const AdminLayout = lazy(() => import('./components/admin/AdminLayout').then((module) => ({ default: module.AdminLayout })))
const AdminStartPage = lazy(() => import('./pages/admin/AdminStartPage').then((module) => ({ default: module.AdminStartPage })))
const AdminComingSoonPage = lazy(() => import('./pages/admin/AdminComingSoonPage').then((module) => ({ default: module.AdminComingSoonPage })))
const PortfolioManagerPage = lazy(() => import('./pages/admin/PortfolioManagerPage').then((module) => ({ default: module.PortfolioManagerPage })))
const HomepageEditorPage = lazy(() => import('./pages/admin/HomepageEditorPage').then((module) => ({ default: module.HomepageEditorPage })))
const AboutEditorPage = lazy(() => import('./pages/admin/AboutEditorPage').then((module) => ({ default: module.AboutEditorPage })))
const ServicesEditorPage = lazy(() => import('./pages/admin/ServicesEditorPage').then((module) => ({ default: module.ServicesEditorPage })))
const InquiriesPage = lazy(() => import('./pages/admin/InquiriesPage').then((module) => ({ default: module.InquiriesPage })))

export default function App() {
  return (
    <>
      <PageMetadata />
      <ScrollToTop />
      <Suspense fallback={<RouteLoading />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminStartPage />} />
            <Route path="portfolio" element={<PortfolioManagerPage />} />
            <Route path="homepage" element={<HomepageEditorPage />} />
            <Route path="about" element={<AboutEditorPage />} />
            <Route path="services" element={<ServicesEditorPage />} />
            <Route path="inquiries" element={<InquiriesPage />} />
            <Route path="settings" element={<AdminComingSoonPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </Suspense>
    </>
  )
}

function RouteLoading() {
  return <div className="grid min-h-screen place-items-center bg-ivory"><span className="sr-only">Loading page…</span></div>
}

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
