import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  Users,
  FileSpreadsheet,
  Award,
  BarChart3,
  History,
  Sliders,
  ShieldCheck,
  FileText,
  UserCheck
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { role } = useAuth();

  const adminNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vendors', label: 'Vendors', icon: Building2 },
    { id: 'eics', label: 'EIC Management', icon: Users },
    { id: 'contracts', label: 'PO / LOA Contracts', icon: FileSpreadsheet },
    { id: 'evaluations', label: 'Evaluations', icon: Award },
    { id: 'reports', label: 'Reports & Export', icon: BarChart3 },
    { id: 'audit', label: 'Audit Logs', icon: History },
    { id: 'criteria', label: 'Evaluation Criteria', icon: Sliders }
  ];

  const eicNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'contracts', label: 'My PO / LOA Contracts', icon: FileSpreadsheet },
    { id: 'vendors', label: 'My Assigned Vendors', icon: Building2 },
    { id: 'evaluations', label: 'Performance Evaluations', icon: Award },
    { id: 'history', label: 'Evaluation History', icon: History }
  ];

  const vendorNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'Vendor Profile', icon: UserCheck },
    { id: 'contracts', label: 'My PO / LOA Contracts', icon: FileSpreadsheet },
    { id: 'evaluations', label: 'Approved Evaluations', icon: Award },
    { id: 'scorecards', label: 'Performance History', icon: BarChart3 }
  ];

  const navItems = role === 'ADMIN' ? adminNav : role === 'EIC' ? eicNav : vendorNav;

  return (
    <aside className="w-64 bg-corporate-900 border-r border-corporate-800 flex flex-col justify-between shrink-0 min-h-[calc(100vh-3.5rem)]">
      <div className="py-4">
        {/* Navigation Section Label */}
        <div className="px-5 mb-2">
          <p className="text-[11px] font-mono uppercase tracking-widest text-corporate-400">
            {role} PORTAL
          </p>
        </div>

        {/* Links */}
        <nav className="space-y-1 px-3">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-3 py-2 text-xs font-medium rounded transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-corporate-300 hover:bg-corporate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 mr-3 shrink-0 ${isActive ? 'text-white' : 'text-corporate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Compliance / Footer Links */}
      <div className="p-4 border-t border-corporate-800 text-[11px] text-corporate-400 space-y-2">
        <div className="flex flex-col space-y-1.5 font-medium">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`text-left hover:text-white transition-colors flex items-center ${activeTab === 'privacy' ? 'text-white font-semibold' : ''}`}
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-2 text-corporate-500" />
            Privacy Policy
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`text-left hover:text-white transition-colors flex items-center ${activeTab === 'terms' ? 'text-white font-semibold' : ''}`}
          >
            <FileText className="w-3.5 h-3.5 mr-2 text-corporate-500" />
            Terms and Conditions
          </button>
        </div>
        <div className="pt-2 text-[10px] text-corporate-500 font-mono border-t border-corporate-800/60">
          ORG SYSTEM v1.0.4 - PROD
        </div>
      </div>
    </aside>
  );
};
