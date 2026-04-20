import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { Loader2 } from 'lucide-react';

// Lazy load pages for optimization
const Landing = lazy(() => import('./pages/Landing').then(m => ({ default: m.Landing })));
const Onboarding = lazy(() => import('./pages/Onboarding').then(m => ({ default: m.Onboarding })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const CareerGuide = lazy(() => import('./pages/CareerGuide').then(m => ({ default: m.CareerGuide })));
const Learning = lazy(() => import('./pages/Learning').then(m => ({ default: m.Learning })));
const ResumeBuilder = lazy(() => import('./pages/ResumeBuilder').then(m => ({ default: m.ResumeBuilder })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));

function PageLoader() {
  return (
    <div className="min-h-screen bg-app-base flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        </div>
        <p className="text-sm text-[#8E8E93] font-medium">Loading…</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-app-base flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center animate-pulse">
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        </div>
        <p className="text-sm text-[#8E8E93] font-medium">Loading CareerBridge…</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Landing />} />
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

              {/* Protected — inside Layout */}
              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="/dashboard"    element={<Dashboard />} />
                <Route path="/career-guide" element={<CareerGuide />} />
                <Route path="/learning"     element={<Learning />} />
                <Route path="/resume"       element={<ResumeBuilder />} />
                <Route path="/settings"     element={<Settings />} />
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
