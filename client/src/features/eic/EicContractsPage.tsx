import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Contract } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EvaluationScoringModal } from './EvaluationScoringModal';
import { Search, Filter, Plus } from 'lucide-react';

export const EicContractsPage: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Scoring Modal
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchContracts = async () => {
    setIsLoading(true);
    try {
      const res = await api.getContracts({
        page,
        limit: 10,
        search,
        contractStatus: statusFilter
      });
      if (res.success) {
        setContracts(res.contracts || []);
        setTotal(res.total || 0);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchContracts();
  };

  return (
    <div className="space-y-5">
      <div className="pb-3 border-b border-corporate-200">
        <h1 className="text-lg font-bold text-corporate-900 tracking-tight">My Appointed PO / LOA Contracts</h1>
        <p className="text-xs text-corporate-500 mt-0.5">
          Contracts under your direct supervisory authority. Strict isolation ensures you cannot access contracts of other EIC officers.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-corporate-200 rounded p-3.5 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assigned contracts by PO Number, Plant Code..."
              className="input-field pl-9 text-xs"
            />
            <Search className="w-4 h-4 text-corporate-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="select-field text-xs w-36"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="NEAR_COMPLETION">NEAR COMPLETION</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>

            <button type="submit" className="btn-secondary text-xs">
              <Filter className="w-3.5 h-3.5 mr-1 text-corporate-500" /> Filter
            </button>
          </div>
        </form>
      </div>

      {/* Contracts Table */}
      <div className="bg-white border border-corporate-200 rounded shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-corporate-100/70 border-b border-corporate-200 text-[11px] font-semibold text-corporate-600 uppercase tracking-wider">
                <th className="px-4 py-3">PO Number</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Plant</th>
                <th className="px-4 py-3">Awarded Vendor</th>
                <th className="px-4 py-3">Completion Date</th>
                <th className="px-4 py-3 text-center">Urgency</th>
                <th className="px-4 py-3 text-right">Value (Tax Incl.)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-corporate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-corporate-400 font-mono">
                    Loading your assigned contracts...
                  </td>
                </tr>
              ) : contracts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-corporate-400">
                    No assigned contracts found.
                  </td>
                </tr>
              ) : (
                contracts.map((c) => (
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
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                        c.daysRemaining !== undefined && c.daysRemaining <= 15
                          ? 'bg-red-100 text-red-900 border border-red-300'
                          : c.daysRemaining !== undefined && c.daysRemaining <= 30
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'text-corporate-600'
                      }`}>
                        {c.daysRemaining}d rem.
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-corporate-900">
                      ₹{c.poValueWithTax?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={c.contractStatus} size="sm" /></td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedContract(c);
                          setIsModalOpen(true);
                        }}
                        className="btn-primary text-xs py-1 px-2.5"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Evaluate
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-corporate-200 bg-corporate-50 flex items-center justify-between text-xs text-corporate-600">
          <span>Showing {contracts.length} of {total} assigned contracts</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2.5 py-1 border border-corporate-300 rounded bg-white disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-2.5 py-1 font-mono text-corporate-800 font-medium">Page {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={contracts.length < 10}
              className="px-2.5 py-1 border border-corporate-300 rounded bg-white disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <EvaluationScoringModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        contract={selectedContract}
        onSuccess={() => fetchContracts()}
      />
    </div>
  );
};
