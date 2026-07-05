import { useLayoutEffect, useRef } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { PageTransition } from './components/PageTransition';
import { ToastProvider } from './components/Toast';
import { AppShell } from './layout/AppShell';
import { ThemeProvider } from './theme/ThemeContext';
import { shouldScrollOnNavigate } from './lib/routeTransition';
import { CaseLayout } from './pages/CaseLayout';
import { DashboardPage } from './pages/DashboardPage';
import { AgentPlatformPage } from './pages/AgentPlatformPage';
import { MyAgentsPage } from './pages/MyAgentsPage';
import { NewCasePage } from './pages/NewCasePage';
import { DeveloperPage } from './pages/DeveloperPage';
import { SettingsPage } from './pages/SettingsPage';
import { PublicSharePage } from './pages/PublicSharePage';
import { MemoryStudioPage } from './pages/MemoryStudioPage';


function AppRoutes() {
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);

  useLayoutEffect(() => {
    const prev = prevPathRef.current;
    if (shouldScrollOnNavigate(prev, location.pathname)) {
      window.scrollTo(0, 0);
    }
    prevPathRef.current = location.pathname;
  }, [location.pathname]);

  return (
    <Routes>
      <Route element={<AppShell />} path="/">
        <Route
          element={
            <PageTransition>
              <DashboardPage />
            </PageTransition>
          }
          index
        />
        <Route
          element={
            <PageTransition>
              <MyAgentsPage />
            </PageTransition>
          }
          path="agents"
        />
        <Route
          element={
            <PageTransition>
              <AgentPlatformPage />
            </PageTransition>
          }
          path="agents/create"
        />
        <Route
          element={
            <PageTransition>
              <NewCasePage />
            </PageTransition>
          }
          path="cases/new"
        />
        <Route
          element={
            <PageTransition>
              <SettingsPage />
            </PageTransition>
          }
          path="settings"
        />
        <Route
          element={
            <PageTransition>
              <MemoryStudioPage />
            </PageTransition>
          }
          path="studio"
        />
        <Route element={<Navigate replace to="/studio" />} path="play" />
        <Route
          element={
            <PageTransition>
              <DeveloperPage />
            </PageTransition>
          }
          path="developer"
        />
        <Route
          element={
            <PageTransition>
              <PublicSharePage />
            </PageTransition>
          }
          path="share/:slug"
        />
        <Route element={<CaseLayout />} path="cases/:caseId/*" />
        <Route element={<Navigate replace to="/" />} path="*" />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}