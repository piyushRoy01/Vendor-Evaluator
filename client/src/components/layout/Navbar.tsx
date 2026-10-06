import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, LogOut, Shield, User, Check, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { AppNotification } from '../../types';

interface NavbarProps {
  onToggleSidebar?: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ setActiveTab }) => {
  const { user, role, logout, quickDemoLogin } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.getNotifications();
      if (res.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch {
      // Ignore background notification fetch errors
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleRoleSwitch = async (targetRole: 'ADMIN' | 'EIC' | 'VENDOR') => {
    setIsSwitching(true);
    await quickDemoLogin(targetRole);
    setIsSwitching(false);
    setActiveTab('dashboard');
  };

  return (
    <header className="sticky top-0 z-40 bg-corporate-900 border-b border-corporate-800 text-white">
      <div className="px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-corporate-800 border border-corporate-700 flex items-center justify-center text-primary-500">
            <Shield className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-wide text-white uppercase">Vendor Evaluator</span>
            <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] font-mono tracking-widest bg-corporate-800 border border-corporate-700 text-corporate-300 rounded">
              ENTERPRISE RBAC
            </span>
          </div>
        </div>

        {/* Center / Role Switcher for seamless pair evaluation */}
        <div className="hidden md:flex items-center bg-corporate-950/80 border border-corporate-700/60 rounded px-1.5 py-1 space-x-1 text-xs">
          <span className="text-[11px] font-mono text-corporate-400 px-2 flex items-center">
            {isSwitching ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : null}
            ROLE:
          </span>
          <button
            onClick={() => handleRoleSwitch('ADMIN')}
            className={`px-2 py-0.5 rounded font-mono font-medium transition-colors ${
              role === 'ADMIN' ? 'bg-blue-600 text-white shadow-sm' : 'text-corporate-300 hover:text-white hover:bg-corporate-800'
            }`}
          >
            ADMIN
          </button>
          <button
            onClick={() => handleRoleSwitch('EIC')}
            className={`px-2 py-0.5 rounded font-mono font-medium transition-colors ${
              role === 'EIC' ? 'bg-blue-600 text-white shadow-sm' : 'text-corporate-300 hover:text-white hover:bg-corporate-800'
            }`}
          >
            EIC
          </button>
          <button
            onClick={() => handleRoleSwitch('VENDOR')}
            className={`px-2 py-0.5 rounded font-mono font-medium transition-colors ${
              role === 'VENDOR' ? 'bg-blue-600 text-white shadow-sm' : 'text-corporate-300 hover:text-white hover:bg-corporate-800'
            }`}
          >
            VENDOR
          </button>
        </div>

        {/* Right Section: User & Notifications */}
        <div className="flex items-center space-x-3">
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-1.5 rounded hover:bg-corporate-800 text-corporate-300 hover:text-white transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded bg-amber-500"></span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-corporate-300 rounded shadow-xl py-2 z-50 text-corporate-900">
                <div className="px-4 py-2 border-b border-corporate-200 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-corporate-600">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-blue-700 hover:underline flex items-center"
                    >
                      <Check className="w-3 h-3 mr-1" /> Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-corporate-100">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-corporate-400">No notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        className={`p-3 text-xs hover:bg-corporate-50 transition-colors ${!n.isRead ? 'bg-blue-50/50' : ''}`}
                      >
                        <p className="font-semibold text-corporate-900">{n.title}</p>
                        <p className="text-corporate-600 mt-0.5 leading-relaxed">{n.message}</p>
                        <span className="text-[10px] text-corporate-400 mt-1 block">
                          {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Tag */}
          <div className="flex items-center space-x-2 pl-2 border-l border-corporate-800">
            <div className="w-7 h-7 rounded bg-corporate-800 flex items-center justify-center text-corporate-300">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden lg:block text-left text-xs">
              <div className="font-medium text-white truncate max-w-[140px]">{user?.email}</div>
              <div className="text-[10px] font-mono text-corporate-400 uppercase tracking-wide">{role}</div>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="p-1.5 rounded hover:bg-corporate-800 text-corporate-300 hover:text-red-400 transition-colors"
            title="Sign out session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
