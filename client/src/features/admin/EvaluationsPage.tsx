import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Evaluation } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { Search, Filter, Eye, CheckCircle2, RotateCcw, AlertCircle } from 'lucide-react';

export const EvaluationsPage: React.FC = () => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchEvaluations = async () => {
    setIsLoading(true);
    try {
      const res = await api.getEvaluations({
        page,
        limit: 10,
        search,
        status: statusFilter,
        ratingGrade: gradeFilter
      });
      if (res.success) {
        setEvaluations(res.evaluations || []);
        setTotal(res.total || 0);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, [page, statusFilter, gradeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEvaluations();
  };

  const handleOpenDetail = async (ev: Evaluation) => {
    try {
      const res = await api.getEvaluation(ev.id);
      if (res.success) {
        setSelectedEvaluation(res.evaluation);
        setIsDetailOpen(true);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to load evaluation details.');
    }
  };

  const handleApprove = async () => {
    if (!selectedEvaluation) return;
    if (!confirm(`Are you sure you want to APPROVE evaluation ${selectedEvaluation.evaluationNumber}? This will publish results to the vendor.`)) return;

    setIsProcessing(true);
    try {
      const res = await api.approveEvaluation(selectedEvaluation.id);
      if (res.success) {
        setIsDetailOpen(false);
        fetchEvaluations();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to approve evaluation.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvaluation || !returnReason.trim()) return;

    setIsProcessing(true);
    try {
      const res = await api.returnEvaluation(selectedEvaluation.id, returnReason);
      if (res.success) {
        setIsReturnModalOpen(false);
        setIsDetailOpen(false);
        setReturnReason('');
        fetchEvaluations();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to return evaluation.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-corporate-200">
        <div>
          <h1 className="text-lg font-bold text-corporate-900 tracking-tight">Vendor Performance Evaluations</h1>
          <p className="text-xs text-corporate-500 mt-0.5">
            Periodic supervisor assessments across weighted engineering, safety, and compliance parameters.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-corporate-200 rounded p-3.5 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Evaluation #, PO Number, Vendor Name..."
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
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="APPROVED">APPROVED</option>
              <option value="RETURNED">RETURNED</option>
              <option value="DRAFT">DRAFT</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
            </select>

            <select
              value={gradeFilter}
              onChange={(e) => { setGradeFilter(e.target.value); setPage(1); }}
              className="select-field text-xs w-40"
            >
              <option value="">All Grades</option>
              <option value="EXCELLENT">EXCELLENT (90-100%)</option>
              <option value="VERY_GOOD">VERY GOOD (75-89%)</option>
              <option value="GOOD">GOOD (60-74%)</option>
              <option value="SATISFACTORY">SATISFACTORY (50-59%)</option>
              <option value="UNSATISFACTORY">UNSATISFACTORY (&lt;50%)</option>
            </select>

            <button type="submit" className="btn-secondary text-xs">
              <Filter className="w-3.5 h-3.5 mr-1 text-corporate-500" /> Filter
            </button>
          </div>
        </form>
      </div>

      {/* Evaluations Data Table */}
      <div className="bg-white border border-corporate-200 rounded shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-corporate-100/70 border-b border-corporate-200 text-[11px] font-semibold text-corporate-600 uppercase tracking-wider">
                <th className="px-4 py-3">Eval Number</th>
                <th className="px-4 py-3">Contract PO</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Supervisory EIC</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Weighted Score</th>
                <th className="px-4 py-3 text-right">Percentage</th>
                <th className="px-4 py-3">Grade</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-corporate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-corporate-400 font-mono">
                    Loading evaluation scorecards...
                  </td>
                </tr>
              ) : evaluations.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-corporate-400">
                    No evaluations match the search filter.
                  </td>
                </tr>
              ) : (
                evaluations.map((ev) => (
                  <tr key={ev.id} className="hover:bg-corporate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-corporate-800">{ev.evaluationNumber}</td>
                    <td className="px-4 py-3 font-mono text-corporate-700">{ev.contract?.poNumber}</td>
                    <td className="px-4 py-3 font-medium text-corporate-900">
                      <div>{ev.vendor?.vendorName}</div>
                      <div className="text-[11px] font-mono text-corporate-500">{ev.vendor?.vendorCode}</div>
                    </td>
                    <td className="px-4 py-3 text-corporate-800">
                      <div>{ev.eic?.name}</div>
                      <div className="text-[11px] font-mono text-corporate-500">{ev.eic?.employeeId}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-corporate-600">
                      {new Date(ev.evaluationDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-corporate-900">
                      {ev.totalWeightedScore} / 100
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-corporate-900">
                      {ev.percentage}%
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ev.ratingGrade} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ev.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleOpenDetail(ev)}
                        className="inline-flex items-center text-xs text-blue-700 hover:text-blue-900 font-medium"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> Scorecard
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
          <span>Showing {evaluations.length} of {total} evaluations</span>
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
              disabled={evaluations.length < 10}
              className="px-2.5 py-1 border border-corporate-300 rounded bg-white disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Evaluation Scorecard Detail Modal */}
      {selectedEvaluation && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Evaluation Scorecard: ${selectedEvaluation.evaluationNumber}`}
          subtitle={`Contract ${selectedEvaluation.contract?.poNumber} • ${selectedEvaluation.vendor?.vendorName}`}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs">
            {/* Top Stat Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-corporate-50 border border-corporate-200 rounded">
              <div>
                <span className="text-[11px] text-corporate-500 uppercase font-semibold block">Status</span>
                <div className="mt-1"><StatusBadge status={selectedEvaluation.status} /></div>
              </div>
              <div>
                <span className="text-[11px] text-corporate-500 uppercase font-semibold block">Rating Grade</span>
                <div className="mt-1"><StatusBadge status={selectedEvaluation.ratingGrade} /></div>
              </div>
              <div>
                <span className="text-[11px] text-corporate-500 uppercase font-semibold block">Total Percentage</span>
                <span className="font-mono text-base font-bold text-corporate-900 mt-0.5 block">
                  {selectedEvaluation.percentage}%
                </span>
              </div>
              <div>
                <span className="text-[11px] text-corporate-500 uppercase font-semibold block">Evaluation Date</span>
                <span className="font-mono text-corporate-800 mt-1 block">
                  {new Date(selectedEvaluation.evaluationDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Admin Action Bar (Approve / Return) */}
            {selectedEvaluation.status === 'SUBMITTED' && (
              <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-blue-900 block">Submitted for Management Approval</span>
                  <span className="text-[11px] text-blue-700">
                    Review line-item scores before approving or requesting EIC clarification.
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsReturnModalOpen(true)}
                    disabled={isProcessing}
                    className="btn-secondary text-xs text-amber-800 border-amber-300"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" /> Return for Clarification
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={isProcessing}
                    className="btn-success text-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve & Publish
                  </button>
                </div>
              </div>
            )}

            {/* Return Reason Warning Banner if Returned */}
            {selectedEvaluation.returnReason && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded">
                <span className="font-bold block text-[11px] uppercase tracking-wider text-amber-800 mb-0.5">
                  Return Justification Note
                </span>
                <p className="leading-relaxed">{selectedEvaluation.returnReason}</p>
              </div>
            )}

            {/* Snapshot Criteria Breakdown Table */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-corporate-800 mb-2">
                Evaluated Criteria & Deterministic Weighting
              </h3>
              <div className="border border-corporate-200 rounded overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-corporate-100 text-[11px] text-corporate-600 font-semibold uppercase">
                    <tr>
                      <th className="px-3 py-2.5">Criterion Parameter</th>
                      <th className="px-3 py-2.5 text-center font-mono">Weight</th>
                      <th className="px-3 py-2.5 text-center font-mono">Max</th>
                      <th className="px-3 py-2.5 text-center font-mono">Score</th>
                      <th className="px-3 py-2.5 text-right font-mono">Weighted Contrib.</th>
                      <th className="px-3 py-2.5">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-corporate-100">
                    {selectedEvaluation.scores?.map((s) => (
                      <tr key={s.id} className="hover:bg-corporate-50">
                        <td className="px-3 py-2.5 font-medium text-corporate-900">
                          {s.criterionNameSnapshot}
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono text-corporate-600">
                          {s.weightSnapshot}%
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono text-corporate-600">
                          {s.maxScoreSnapshot}
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono font-bold text-corporate-900">
                          {s.score}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold text-corporate-900">
                          {s.weightedScore}
                        </td>
                        <td className="px-3 py-2.5 text-corporate-600 italic">
                          {s.remarks || '-'}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-corporate-50 font-bold border-t border-corporate-200">
                      <td colSpan={4} className="px-3 py-2.5 text-right uppercase text-corporate-700">
                        Final Weighted Sum:
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-corporate-900 text-sm">
                        {selectedEvaluation.totalWeightedScore} / 100
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Observations & Remarks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-corporate-50 border border-corporate-200 rounded">
                <span className="text-[11px] text-corporate-500 uppercase font-semibold block mb-1">
                  EIC Site Observations
                </span>
                <p className="text-corporate-800 leading-relaxed">
                  {selectedEvaluation.observations || 'No specific site observations recorded.'}
                </p>
              </div>
              <div className="p-3 bg-corporate-50 border border-corporate-200 rounded">
                <span className="text-[11px] text-corporate-500 uppercase font-semibold block mb-1">
                  General Performance Remarks
                </span>
                <p className="text-corporate-800 leading-relaxed">
                  {selectedEvaluation.remarks || 'No overall remarks entered.'}
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Return Justification Prompt Modal */}
      {selectedEvaluation && (
        <Modal
          isOpen={isReturnModalOpen}
          onClose={() => setIsReturnModalOpen(false)}
          title="Return Evaluation for EIC Clarification"
          subtitle={`Evaluation ${selectedEvaluation.evaluationNumber}`}
          maxWidth="md"
        >
          <form onSubmit={handleReturnSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                Please specify the exact observations or calculations that require revision by the supervisory EIC.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-corporate-700 uppercase mb-1">
                Return Justification / Revision Notes *
              </label>
              <textarea
                required
                rows={3}
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="E.g., Please re-verify the equipment breakdown logs and clarify penalty deductions..."
                className="input-field"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-corporate-200">
              <button
                type="button"
                onClick={() => setIsReturnModalOpen(false)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="btn-danger text-xs"
              >
                {isProcessing ? 'Returning...' : 'Confirm Return to EIC'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
