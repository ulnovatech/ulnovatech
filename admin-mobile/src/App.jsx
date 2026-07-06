import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import AppShell from './components/layout/AppShell'
import ProtectedRoute from './components/layout/ProtectedRoute'
import PushNotificationManager from './components/PushNotificationManager'
import AppResumeHandler from './components/AppResumeHandler'
import HomePage from './pages/HomePage'
import InboxPage from './pages/InboxPage'
import LoginPage from './pages/LoginPage'
import RequestDetailPage from './pages/RequestDetailPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <PushNotificationManager />
        <AppResumeHandler />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/inbox/:type/:id" element={<RequestDetailPage />} />
            <Route element={<AppShell />}>
              <Route index element={<HomePage />} />
              <Route path="inbox" element={<InboxPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          className: 'text-sm',
          style: {
            background: '#0b1218',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
          },
        }}
      />
    </AuthProvider>
  )
}
