import { lazy, Suspense, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import RouteFallback from './components/RouteFallback'
import App from './App'
import Login from './pages/Login'
import './index.css'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Companies = lazy(() => import('./pages/CompanyList'))
const CompanyDetail = lazy(() => import('./pages/CompanyDetail'))
const Requests = lazy(() => import('./pages/Requests'))
const RequestDetails = lazy(() => import('./pages/RequestDetails'))
const GAnalytics = lazy(() => import('./pages/GAnalytics'))
const Competitors = lazy(() => import('./pages/Competitors'))
const CompetitorDetail = lazy(() => import('./pages/CompetitorDetail'))
const ImportCSV = lazy(() => import('./pages/ImportCSV'))
const ImportCompetitors = lazy(() => import('./pages/ImportCompetitors'))
const Prospects = lazy(() => import('./pages/Prospects'))
const ImportProspects = lazy(() => import('./pages/ImportProspects'))

function LazyPage({ children }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <App />
              </ProtectedRoute>
            }
          >
            <Route index element={<LazyPage><Dashboard /></LazyPage>} />
            <Route path="prospects" element={<LazyPage><Prospects /></LazyPage>} />
            <Route path="companies" element={<LazyPage><Companies /></LazyPage>} />
            <Route path="companies/:id" element={<LazyPage><CompanyDetail /></LazyPage>} />
            <Route path="requests" element={<LazyPage><Requests /></LazyPage>} />
            <Route path="requests/:id" element={<LazyPage><RequestDetails /></LazyPage>} />
            <Route path="analytics" element={<LazyPage><GAnalytics /></LazyPage>} />
            <Route path="competitors" element={<LazyPage><Competitors /></LazyPage>} />
            <Route path="competitors/:id" element={<LazyPage><CompetitorDetail /></LazyPage>} />
            <Route path="import" element={<LazyPage><ImportCSV /></LazyPage>} />
            <Route path="import/competitors" element={<LazyPage><ImportCompetitors /></LazyPage>} />
            <Route path="import/prospects" element={<LazyPage><ImportProspects /></LazyPage>} />
            <Route path="*" element={<div className="p-8 text-center text-red-500">404 — Page Not Found</div>} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
