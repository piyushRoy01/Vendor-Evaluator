import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Lock, Mail, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreFill = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-corporate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-corporate-900 border border-corporate-700 rounded flex items-center justify-center text-blue-500 shadow-md">
            <Shield className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-xl font-bold tracking-tight text-white uppercase">
          Vendor Evaluation System
        </h2>
        <p className="mt-1 text-center text-xs text-corporate-400 font-mono">
          ENTERPRISE CONTRACT & PERFORMANCE GOVERNANCE
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-corporate-900 py-8 px-6 border border-corporate-800 rounded shadow-xl sm:px-10">
          {error && (
            <div className="mb-5 p-3 rounded bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-corporate-300">
                Official Email
              </label>
              <div className="mt-1.5 relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@enterprise.org"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-corporate-950 border border-corporate-700 rounded text-white placeholder-corporate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                <Mail className="w-4 h-4 text-corporate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-corporate-300">
                Password
              </label>
              <div className="mt-1.5 relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-corporate-950 border border-corporate-700 rounded text-white placeholder-corporate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                <Lock className="w-4 h-4 text-corporate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 inline-flex items-center justify-center px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-blue-700 hover:bg-blue-600 rounded transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Authenticating Session...' : 'Sign In to Portal'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </form>

          {/* Quick Select Panel for Verification */}
          <div className="mt-6 pt-5 border-t border-corporate-800">
            <p className="text-[11px] font-mono uppercase tracking-widest text-corporate-400 mb-2 flex items-center">
              <UserCheck className="w-3.5 h-3.5 mr-1 text-corporate-500" />
              DEVELOPMENT DEMO ACCOUNTS
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handlePreFill('admin@enterprise.org', 'Admin@123')}
                className="p-2 text-left bg-corporate-950 hover:bg-corporate-800 border border-corporate-700 rounded transition-colors"
              >
                <div className="text-[10px] font-bold text-white font-mono">ADMIN</div>
                <div className="text-[9px] text-corporate-400 truncate">admin@ent...</div>
              </button>
              <button
                type="button"
                onClick={() => handlePreFill('eic.sharma@enterprise.org', 'Eic@123')}
                className="p-2 text-left bg-corporate-950 hover:bg-corporate-800 border border-corporate-700 rounded transition-colors"
              >
                <div className="text-[10px] font-bold text-blue-400 font-mono">EIC</div>
                <div className="text-[9px] text-corporate-400 truncate">eic.sharma@...</div>
              </button>
              <button
                type="button"
                onClick={() => handlePreFill('vendor.apex@enterprise.org', 'Vendor@123')}
                className="p-2 text-left bg-corporate-950 hover:bg-corporate-800 border border-corporate-700 rounded transition-colors"
              >
                <div className="text-[10px] font-bold text-emerald-400 font-mono">VENDOR</div>
                <div className="text-[9px] text-corporate-400 truncate">vendor.apex@...</div>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-[11px] text-corporate-500 font-mono">
            Authorized Personnel Access Only • All Access Logged
          </p>
        </div>
      </div>
    </div>
  );
};
