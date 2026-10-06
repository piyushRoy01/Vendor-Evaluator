import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { MetricCard } from '../../components/common/MetricCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  FileSpreadsheet,
  Award,
  TrendingUp,
  CheckCircle2,
  Building2,
  ShieldCheck
} from 'lucide-react';

export const VendorDashboard: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.getDashboard();
        if (res.success) {
          setData(res);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (isLoading) {
    return <div className="p-8 text-center text-xs font-mono text-corporate-500">Loading vendor portal...</div>;
  }

  const vendorInfo = data?.vendorInfo || {};
  const kpis = data?.kpis || {};
  const performanceTrend = data?.performanceTrend || [];
  const contracts = data?.contracts || [];

  return (
    <div className="space-y-6">
      {/* Enterprise Dossier Banner */}
      <div className="bg-white border border-corporate-200 rounded p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded bg-corporate-100 border border-corporate-200 flex items-center justify-center text-corporate-700">
              <Building2 className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold text-corporate-900 tracking-tight">{vendorInfo.vendorName}</h1>
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {vendorInfo.vendorCode}
                </span>
              </div>
              <div className="text-xs text-corporate-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                <span>PAN: <strong className="font-mono text-corporate-800">{vendorInfo.pan}</strong></span>
                <span>GSTN: <strong className="font-mono text-corporate-800">{vendorInfo.gstn}</strong></span>
                <span>Type: <strong className="text-corporate-800">{vendorInfo.typeOfFirm?.replace(/_/g, ' ')}</strong></span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded font-mono text-xs font-semibold flex items-center">
              <ShieldCheck className="w-4 h-4 mr-1 text-emerald-600" /> Statutory Verified
            </span>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Active Contracts"
          value={kpis.activeContracts || 0}
          subtitle={`Total Awarded: ${kpis.totalContracts || 0}`}
          icon={FileSpreadsheet}
        />
        <MetricCard
          title="Completed Contracts"
          value={kpis.completedContracts || 0}
          subtitle="Successfully Executed"
          icon={CheckCircle2}
        />
        <MetricCard
          title="Current Scorecard"
          value={`${kpis.currentPerformanceScore || 0}%`}
          subtitle="Latest Approved Evaluation"
          icon={Award}
          variant="success"
        />
        <MetricCard
          title="Average Rating"
          value={`${kpis.averagePerformanceScore || 0}%`}
          subtitle="All Performance Periods"
          icon={TrendingUp}
        />
      </div>

      {/* Performance Scorecard Trend */}
      <div className="bg-white border border-corporate-200 rounded shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-corporate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-corporate-800">
              Approved Performance Evaluations History
            </h2>
            <p className="text-[11px] text-corporate-500 mt-0.5">
              Verified evaluation records released by organizational management.
            </p>
          </div>
          <button
            onClick={() => onNavigate('evaluations')}
            className="text-xs font-semibold text-blue-700 hover:underline"
          >
            Detailed Scorecards →
          </button>
        </div>
        <div className="p-5">
          {performanceTrend.length === 0 ? (
            <div className="py-6 text-center text-xs text-corporate-400">
              No approved performance evaluations currently published.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {performanceTrend.map((pt: any) => (
                <div key={pt.evalNumber} className="p-3.5 bg-corporate-50 border border-corporate-200 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-corporate-800">{pt.evalNumber}</span>
                    <StatusBadge status={pt.grade} size="sm" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-corporate-900 mb-1">
                    {pt.score}%
                  </div>
                  <span className="text-[11px] text-corporate-500 block font-mono">
                    Published: {pt.date}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Awarded Contracts Table */}
      <div className="bg-white border border-corporate-200 rounded shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-corporate-200">
          <h2 className="text-xs font-bold uppercase tracking-wider text-corporate-800">
            Awarded Purchase Orders & Letters of Award
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-corporate-100/70 border-b border-corporate-200 text-[11px] font-semibold text-corporate-600 uppercase tracking-wider">
                <th className="px-4 py-3">PO Number</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Plant</th>
                <th className="px-4 py-3">Appointed Supervisory EIC</th>
                <th className="px-4 py-3">Completion Date</th>
                <th className="px-4 py-3 text-right">Value (Tax Incl.)</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-corporate-100 text-xs">
              {contracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-corporate-400">
                    No contracts recorded.
                  </td>
                </tr>
              ) : (
                contracts.map((c: any) => (
                  <tr key={c.id} className="hover:bg-corporate-50/70">
                    <td className="px-4 py-3 font-mono font-bold text-corporate-800">{c.poNumber}</td>
                    <td className="px-4 py-3 text-corporate-700">{c.contractType}</td>
                    <td className="px-4 py-3 font-mono text-corporate-700">{c.plantCode}</td>
                    <td className="px-4 py-3 text-corporate-800">
                      <div>{c.eic?.name}</div>
                      <div className="text-[11px] font-mono text-corporate-500">{c.eic?.employeeId}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-corporate-600">
                      {new Date(c.completionDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-corporate-900">
                      ₹{c.poValueWithTax?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={c.contractStatus} size="sm" /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
