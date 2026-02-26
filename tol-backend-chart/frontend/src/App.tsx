import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './stores/auth'
import Layout from './components/Layout/Layout'
import LoginPage from './pages/Login'

const Upload = lazy(() => import('./components/Upload/UploadModule'))
const Monitoring = lazy(() => import('./components/Monitoring/MonitoringModule'))
const Testing = lazy(() => import('./components/Testing/TestingModule'))
const Analytics = lazy(() => import('./components/Analytics/AnalyticsModule'))
const Management = lazy(() => import('./components/Management/ManagementModule'))

const qc = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Toaster position="bottom-right" toastOptions={{
          style: { background: '#0f1117', color: '#e2e8f0', border: '1px solid #1e2535', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' }
        }} />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/monitoring" replace />} />
            <Route path="monitoring" element={<Suspense fallback={<PageLoader />}><Monitoring /></Suspense>} />
            <Route path="upload" element={<Suspense fallback={<PageLoader />}><Upload /></Suspense>} />
            <Route path="testing" element={<Suspense fallback={<PageLoader />}><Testing /></Suspense>} />
            <Route path="analytics" element={<Suspense fallback={<PageLoader />}><Analytics /></Suspense>} />
            <Route path="management" element={<Suspense fallback={<PageLoader />}><Management /></Suspense>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#334155' }}>
      <div className="pulse">Loading...</div>
    </div>
  )
}
