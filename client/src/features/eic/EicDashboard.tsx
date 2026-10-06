import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { MetricCard } from '../../components/common/MetricCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EvaluationScoringModal } from './EvaluationScoringModal';
import { Contract } from '../../types';
import {
  FileSpreadsheet,
  Award,
  Clock,
  TrendingUp,
  Plus
} from 'lucide-react';

export const EicDashboard: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Scoring Modal
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [existingEvalId, setExistingEvalId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await api.getDashboard();
      if (res.success) {
        setData(res);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (isLoading) {
    return <div className="p-8 text-center text-xs font-mono text-corporate-500">Loading supervisor dashboard...</div>;
  }

  const kpis = data?.kpis || {};
  const recentContracts = data?.recentContracts || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-corporate-200 rounded p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-corporate-900 tracking-tight">EIC Supervisory Dashboard</h1>
          <p className="text-xs text-corporate-500 mt-0.5">
            Active monitoring of assigned PO/LOA contracts and periodic performance scorecard submissions.
          </p>
        </div>
        <button
          onClick={() => onNavigate('contracts')}
          className="btn-primary text-xs"
        >
          View All Assigned Contracts
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard
          title="Assigned POs"
          value={kpis.assignedContracts || 0}
          subtitle="Supervised by you"
          icon={FileSpreadsheet}
        />
        <MetricCard
          title="Active Contracts"
          value={kpis.activeContracts || 0}
          subtitle="Ongoing works"
          icon={FileSpreadsheet}
        />
        <MetricCard
          title="Near Expiry"
          value={kpis.nearCompletionContracts || 0}
          subtitle="< 30 days"
          icon={Clock}
          variant={kpis.nearCompletionContracts > 0 ? 'warning' : 'default'}
        />
        <MetricCard
          title="Pending Evals"
          value={kpis.pendingEvaluations || 0}
          subtitle="Draft or Returned"
          icon={Award}
          variant={kpis.pendingEvaluations > 0 ? 'warning' : 'default'}
        />
        <MetricCard
          title="Approved Evals"
          value={kpis.completedEvaluations || 0}
          subtitle="Finalized by Admin"
          icon={Award}
          variant="success"
        />
        <MetricCard
          title="Avg Score Given"
          value={`${kpis.averageScoreGiven || 0}%`}
          subtitle="Historical Average"
          icon={TrendingUp}
        />
      </div>

      {/* Assigned Contracts Table with Action */}
      <div className="bg-white border border-corporate-200 rounded shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-corporate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-corporate-800">
              Assigned Contracts Requiring Supervisory Oversight
            </h2>
            <p className="text-[11px] text-corporate-500 mt-0.5">
              Initiate periodic evaluations according to contract execution milestones.
            </p>
          </div>
          <button
            onClick={() => onNavigate('contracts')}
            className="text-xs font-semibold text-blue-700 hover:underline"
          >
            Full Contract List →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-corporate-100/70 border-b border-corporate-200 text-[11px] font-semibold text-corporate-600 uppercase tracking-wider">
                <th className="px-4 py-3">PO Number</th>
                <th className="px-4 py-3">Contract Type</th>
                <th className="px-4 py-3">Plant</th>
                <th className="px-4 py-3">Awarded Vendor</th>
                <th className="px-4 py-3">Completion Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Supervisory Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-corporate-100 text-xs">
              {recentContracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-corporate-400">
                    No active contracts currently assigned.
                  </td>
                </tr>
              ) : (
                recentContracts.map((c: any) => (
                  <tr key={c.id} className="hover:bg-corporate-50/70">
                    <td className="px-4 py-3 font-mono font-bold text-corporate-800">{c.poNumber}</td>
                    <td className="px-4 py-3 text-corporate-700">{c.contractType}</td>
                    <td className="px-4 py-3 font-mono text-corporate-700">{c.plantCode}</td>
                    <td className="px-4 py-3 font-medium text-corporate-900">
                      <div>{c.vendor?.vendorName}</div>
                      <div className="text-[11px] font-mono text-corporate-500">{c.vendor?.vendorCode}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-corporate-600">
                      {new Date(c.completionDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={c.contractStatus} size="sm" /></td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedContract(c);
                          setExistingEvalId(null);
                          setIsModalOpen(true);
                        }}
                        className="btn-primary text-xs py-1 px-3"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Evaluate Vendor
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scoring Modal */}
      <EvaluationScoringModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        contract={selectedContract}
        existingEvaluationId={existingEvalId}
        onSuccess={() => {
          fetchDashboard();
        }}
      />
    </div>
  );
};
