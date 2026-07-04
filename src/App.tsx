import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from './components/PageTransition';
import { ToastProvider } from './components/Toast';
import { AppShell } from './layout/AppShell';
import { ThemeProvider } from './theme/ThemeContext';
import { CaseLayout } from './pages/CaseLayout';
import { CaseOverviewPage } from './pages/CaseOverviewPage';
import { DashboardPage } from './pages/DashboardPage';
import { EvidencePage } from './pages/EvidencePage';
import { NewCasePage } from './pages/NewCasePage';
import { ReportPage } from './pages/ReportPage';
import { ResultsPage } from './pages/ResultsPage';
import { SurgeryPage } from './pages/SurgeryPage';
import { TestsPage } from './pages/TestsPage';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes key={location.pathname} location={location}>
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
                <NewCasePage />
              </PageTransition>
            }
            path="cases/new"
          />
          <Route element={<CaseLayout />} path="cases/:caseId">
            <Route
              element={
                <PageTransition>
                  <CaseOverviewPage />
                </PageTransition>
              }
              index
            />
            <Route
              element={
                <PageTransition>
                  <EvidencePage />
                </PageTransition>
              }
              path="evidence"
            />
            <Route
              element={
                <PageTransition>
                  <TestsPage />
                </PageTransition>
              }
              path="tests"
            />
            <Route
              element={
                <PageTransition>
                  <ResultsPage />
                </PageTransition>
              }
              path="results"
            />
            <Route
              element={
                <PageTransition>
                  <SurgeryPage />
                </PageTransition>
              }
              path="surgery"
            />
            <Route
              element={
                <PageTransition>
                  <ReportPage />
                </PageTransition>
              }
              path="report"
            />
          </Route>
          <Route element={<Navigate replace to="/" />} path="*" />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}