import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './layout/AppShell';
import { CaseLayout } from './pages/CaseLayout';
import { CaseOverviewPage } from './pages/CaseOverviewPage';
import { DashboardPage } from './pages/DashboardPage';
import { EvidencePage } from './pages/EvidencePage';
import { NewCasePage } from './pages/NewCasePage';
import { ReportPage } from './pages/ReportPage';
import { ResultsPage } from './pages/ResultsPage';
import { SurgeryPage } from './pages/SurgeryPage';
import { TestsPage } from './pages/TestsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />} path="/">
          <Route element={<DashboardPage />} index />
          <Route element={<NewCasePage />} path="cases/new" />
          <Route element={<CaseLayout />} path="cases/:caseId">
            <Route element={<CaseOverviewPage />} index />
            <Route element={<EvidencePage />} path="evidence" />
            <Route element={<TestsPage />} path="tests" />
            <Route element={<ResultsPage />} path="results" />
            <Route element={<SurgeryPage />} path="surgery" />
            <Route element={<ReportPage />} path="report" />
          </Route>
          <Route element={<Navigate replace to="/" />} path="*" />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}