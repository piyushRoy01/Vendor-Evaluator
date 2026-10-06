import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { MetricCard } from '../../components/common/MetricCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Building2,
  FileSpreadsheet,
  Users,
  Award,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle2,
  Factory
} from 'lucide-react';

export const AdminDashboard: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
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
    return <div className="p-8 text-center text-xs font-mono text-corporate-500">Loading system metrics...</div>;
  }

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-corporate-200 rounded p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-corporate-900 tracking-tight">Organization Governance Dashboard</h1>
          <p className="text-xs text-corporate-500 mt-0.5">
            Centralized monitoring of PO/LOA execution, supervisory EIC assignments, and periodic vendor scorecards.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigate('contracts')}
            className="btn-primary text-xs"
          >
            Manage Contracts
          </button>
          <button
            onClick={() => onNavigate('reports')}
            className="btn-secondary text-xs"
          >
            Export Reports
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <MetricCard
          title="Total Vendors"
          value={kpis.totalVendors || 0}
          subtitle={`${kpis.activeVendors || 0} Active`}
          icon={Building2}
        />
        <MetricCard
          title="Active Contracts"
          value={kpis.activeContracts || 0}
          subtitle={`Total: ${kpis.totalContracts || 0}`}
          icon={FileSpreadsheet}
        />
        <MetricCard
          title="Near Completion"
          value={kpis.nearCompletionContracts || 0}
          subtitle="< 30 days remaining"
          icon={Clock}
          variant={kpis.nearCompletionContracts > 0 ? 'warning' : 'default'}
        />
        <MetricCard
          title="Appointed EICs"
          value={kpis.totalEICs || kpis.totalEics || 0}
          subtitle="Supervisory Engineers"
          icon={Users}
        />
        <MetricCard
          title="Pending Reviews"
          value={kpis.submittedEvaluations || 0}
          subtitle="Awaiting Approval"
          icon={Award}
          variant={kpis.submittedEvaluations > 0 ? 'warning' : 'default'}
        />
        <MetricCard
          title="Avg Vendor Score"
          value={`${kpis.averageVendorScore || 0}%`}
          subtitle="Across Org"
          icon={TrendingUp}
          variant="success"
        />
      </div>

      {/* Middle Row: Contracts by Plant & Grade Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plant-wise Distribution */}
        <div className="bg-white border border-corporate-200 rounded p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-corporate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-corporate-700 flex items-center">
              <Factory className="w-4 h-4 mr-2 text-corporate-500" />
              Plant-wise Contract Allocation
            </h2>
            <span className="text-[11px] font-mono text-corporate-400">Total: {kpis.totalContracts}</span>
          </div>
          <div className="mt-4 space-y-3">
            {charts.contractsByPlant?.map((p: any) => {
              const pct = kpis.totalContracts > 0 ? Math.round((p.count / kpis.totalContracts) * 100) : 0;
              return (
                <div key={p.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-mono font-medium text-corporate-800">{p.name}</span>
                    <span className="font-mono text-corporate-500">{p.count} Contracts ({pct}%)</span>
                  </div>
                  <div className="w-full bg-corporate-100 h-2 rounded overflow-hidden">
                    <div
                      className="bg-corporate-700 h-2 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rating Grade Distribution */}
        <div className="bg-white border border-corporate-200 rounded p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-corporate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-corporate-700 flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-2 text-corporate-500" />
              Approved Evaluation Grades
            </h2>
            <span className="text-[11px] font-mono text-corporate-400">{kpis.approvedEvaluations} Evaluated</span>
          </div>
          <div className="mt-4 space-y-2.5">
            {charts.evaluationsByGrade?.map((g: any) => (
              <div key={g.grade} className="flex items-center justify-between p-2.5 bg-corporate-50 border border-corporate-200 rounded">
                <StatusBadge status={g.grade} size="sm" />
                <span className="font-mono text-xs font-bold text-corporate-800">
                  {g.count} <span className="text-corporate-500 font-normal text-[11px]">Scorecards</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Vendor Score Comparison Table */}
      <div className="bg-white border border-corporate-200 rounded shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-corporate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-corporate-800">
              Vendor Performance & Contract Commitment Summary
            </h2>
            <p className="text-[11px] text-corporate-500 mt-0.5">
              Aggregated historical scorecard averages and contract award valuations.
            </p>
          </div>
          <button
            onClick={() => onNavigate('vendors')}
            className="text-xs font-semibold text-blue-700 hover:underline"
          >
            View All Vendors →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-corporate-100/70 border-b border-corporate-200 text-[11px] font-semibold text-corporate-600 uppercase tracking-wider">
                <th className="px-4 py-2.5">Vendor Code</th>
                <th className="px-4 py-2.5">Vendor Name</th>
                <th className="px-4 py-2.5 text-right">Total Committed Value</th>
                <th className="px-4 py-2.5 text-right">Avg Score</th>
                <th className="px-4 py-2.5">Status Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-corporate-100 text-xs">
              {charts.vendorComparison?.map((v: any) => {
                let rating = 'GOOD';
                if (v.avgScore >= 90) rating = 'EXCELLENT';
                else if (v.avgScore >= 75) rating = 'VERY_GOOD';
                else if (v.avgScore >= 50) rating = 'SATISFACTORY';
                else if (v.avgScore > 0) rating = 'UNSATISFACTORY';
                else rating = 'DRAFT';

                return (
                  <tr key={v.vendorCode} className="hover:bg-corporate-50/80 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-corporate-700 font-medium">{v.vendorCode}</td>
                    <td className="px-4 py-2.5 font-medium text-corporate-900">{v.vendorName}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-corporate-800">
                      ₹{v.totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-corporate-900">
                      {v.avgScore > 0 ? `${v.avgScore}%` : 'N/A'}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={rating} size="sm" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Critical Attention: Poor Performing Vendors */}
      {charts.poorPerformingVendors?.length > 0 && (
        <div className="bg-red-50/40 border border-red-200 rounded p-5 shadow-sm">
          <div className="flex items-center space-x-2 text-red-800 pb-2 border-b border-red-200">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider">
              Poor Performing Vendors Alert (&lt; 60% Score)
            </h2>
          </div>
          <div className="mt-3 divide-y divide-red-100">
            {charts.poorPerformingVendors.map((p: any) => (
              <div key={p.vendorCode} className="py-2 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono font-bold text-red-900 mr-2">{p.vendorCode}</span>
                  <span className="font-medium text-corporate-900">{p.vendorName}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-red-700 font-bold">{p.avgScore}%</span>
                  <button
                    onClick={() => onNavigate('vendors')}
                    className="text-[11px] font-semibold text-red-800 underline hover:text-red-900"
                  >
                    Review Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
