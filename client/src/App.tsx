import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './features/auth/LoginPage';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { AdminDashboard } from './features/admin/AdminDashboard';
import { VendorsPage } from './features/admin/VendorsPage';
import { EicManagementPage } from './features/admin/EicManagementPage';
import { ContractsPage } from './features/admin/ContractsPage';
import { EvaluationsPage } from './features/admin/EvaluationsPage';
import { AuditLogsPage } from './features/admin/AuditLogsPage';
import { CriteriaSettingsPage } from './features/admin/CriteriaSettingsPage';
import { EicDashboard } from './features/eic/EicDashboard';
import { EicContractsPage } from './features/eic/EicContractsPage';
import { VendorDashboard } from './features/vendor/VendorDashboard';
import { ReportsPage } from './features/reports/ReportsPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsPage } from './pages/TermsPage';

export const AppContent: React.FC = () => {
  const { user, token, role, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-corporate-950 flex flex-col items-center justify-center text-white">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-mono text-corporate-400 uppercase tracking-widest">
          Authenticating Enterprise Session...
        </p>
      </div>
    );
  }

  if (!token || !user) {
    return <LoginPage />;
  }

  const renderContent = () => {
    // Statutory Pages
    if (activeTab === 'privacy') return <PrivacyPolicyPage />;
    if (activeTab === 'terms') return <TermsPage />;

    // Role: ADMIN
    if (role === 'ADMIN') {
      switch (activeTab) {
        case 'dashboard':
          return <AdminDashboard onNavigate={setActiveTab} />;
        case 'vendors':
          return <VendorsPage />;
        case 'eics':
          return <EicManagementPage />;
        case 'contracts':
          return <ContractsPage />;
        case 'evaluations':
          return <EvaluationsPage />;
        case 'reports':
          return <ReportsPage />;
        case 'audit':
          return <AuditLogsPage />;
        case 'criteria':
          return <CriteriaSettingsPage />;
        default:
          return <AdminDashboard onNavigate={setActiveTab} />;
      }
    }

    // Role: EIC
    if (role === 'EIC') {
      switch (activeTab) {
        case 'dashboard':
          return <EicDashboard onNavigate={setActiveTab} />;
        case 'contracts':
          return <EicContractsPage />;
        case 'vendors':
          return <VendorsPage />;
        case 'evaluations':
        case 'history':
          return <EvaluationsPage />;
        default:
          return <EicDashboard onNavigate={setActiveTab} />;
      }
    }

    // Role: VENDOR
    if (role === 'VENDOR') {
      switch (activeTab) {
        case 'dashboard':
        case 'profile':
          return <VendorDashboard onNavigate={setActiveTab} />;
        case 'contracts':
          return <ContractsPage />;
        case 'evaluations':
        case 'scorecards':
          return <EvaluationsPage />;
        default:
          return <VendorDashboard onNavigate={setActiveTab} />;
      }
    }

    return <div className="p-8 text-center text-xs text-corporate-500">View not accessible for current role.</div>;
  };

  return (
    <div className="min-h-screen bg-corporate-50 flex flex-col text-corporate-900">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return <AppContent />;
}
