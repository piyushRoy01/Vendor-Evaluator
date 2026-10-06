import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { EvaluationCriteria, RatingThreshold } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { Sliders, CheckCircle2, AlertCircle } from 'lucide-react';

export const CriteriaSettingsPage: React.FC = () => {
  const [criteria, setCriteria] = useState<EvaluationCriteria[]>([]);
  const [thresholds, setThresholds] = useState<RatingThreshold[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Modal
  const [selectedCrit, setSelectedCrit] = useState<EvaluationCriteria | null>(null);
  const [editWeight, setEditWeight] = useState<number>(0);
  const [editDesc, setEditDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchCriteria = async () => {
    setIsLoading(true);
    try {
      const res = await api.getCriteria();
      if (res.success) {
        setCriteria(res.criteria || []);
        setThresholds(res.thresholds || []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCriteria();
  }, []);

  const totalWeight = criteria.reduce((sum, c) => (c.isActive ? sum + c.weight : sum), 0);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCrit) return;
    setIsSubmitting(true);
    try {
      const res = await api.updateCriterion(selectedCrit.id, {
        weight: editWeight,
        description: editDesc
      });
      if (res.success) {
        setSelectedCrit(null);
        setMessage('Criterion weight successfully updated.');
        setTimeout(() => setMessage(null), 4000);
        fetchCriteria();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update criterion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (c: EvaluationCriteria) => {
    try {
      await api.updateCriterion(c.id, { isActive: !c.isActive });
      fetchCriteria();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status.');
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-xs font-mono text-corporate-500">Loading criteria settings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-corporate-200">
        <div>
          <h1 className="text-lg font-bold text-corporate-900 tracking-tight flex items-center">
            <Sliders className="w-5 h-5 mr-2 text-corporate-700" />
            Evaluation Criteria & Rating Thresholds
          </h1>
          <p className="text-xs text-corporate-500 mt-0.5">
            Configure dynamic evaluation parameters and performance grade bands. Past submitted evaluations remain immutable via snapshots.
          </p>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
          {message}
        </div>
      )}

      {/* Weight Allocation Health Alert */}
      <div className={`p-4 border rounded shadow-sm text-xs flex items-center justify-between ${
        Math.round(totalWeight) === 100
          ? 'bg-emerald-50/50 border-emerald-300 text-emerald-900'
          : 'bg-amber-50/60 border-amber-300 text-amber-900'
      }`}>
        <div className="flex items-center space-x-2">
          {Math.round(totalWeight) === 100 ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-700" />
          )}
          <div>
            <span className="font-bold text-sm">
              Total Active Criteria Weight: {totalWeight.toFixed(1)}%
            </span>
            <p className="text-corporate-600 text-[11px] mt-0.5">
              Standard enterprise configuration requires active weights to sum exactly to 100.0%.
            </p>
          </div>
        </div>
      </div>

      {/* Criteria Table */}
      <div className="bg-white border border-corporate-200 rounded shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-corporate-200 bg-corporate-50">
          <h2 className="text-xs font-bold uppercase tracking-wider text-corporate-800">
            Active Performance Criteria ({criteria.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-corporate-100/70 border-b border-corporate-200 text-[11px] font-semibold text-corporate-600 uppercase tracking-wider">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Parameter Name</th>
                <th className="px-4 py-3 font-mono">Code</th>
                <th className="px-4 py-3">Engineering Description</th>
                <th className="px-4 py-3 text-center font-mono">Max Score</th>
                <th className="px-4 py-3 text-center font-mono">Weight (%)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-corporate-100 text-xs">
              {criteria.map((c) => (
                <tr key={c.id} className="hover:bg-corporate-50/70 transition-colors">
                  <td className="px-4 py-3 font-mono text-corporate-500">{c.sortOrder}</td>
                  <td className="px-4 py-3 font-medium text-corporate-900">{c.name}</td>
                  <td className="px-4 py-3 font-mono text-corporate-600">{c.code}</td>
                  <td className="px-4 py-3 text-corporate-600 text-[11px] max-w-sm leading-relaxed">{c.description}</td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-corporate-800">{c.maxScore}</td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-corporate-900">{c.weight}%</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                      c.isActive ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-600 border-slate-300'
                    }`}>
                      {c.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => { setSelectedCrit(c); setEditWeight(c.weight); setEditDesc(c.description); }}
                      className="text-xs font-semibold text-blue-700 hover:text-blue-900"
                    >
                      Edit Weight
                    </button>
                    <button
                      onClick={() => handleToggleActive(c)}
                      className="text-xs text-corporate-500 hover:text-corporate-800"
                    >
                      {c.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rating Thresholds Table */}
      <div className="bg-white border border-corporate-200 rounded shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-corporate-200 bg-corporate-50">
          <h2 className="text-xs font-bold uppercase tracking-wider text-corporate-800">
            Rating Grade Bands & Scoring Classifications
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-corporate-100/70 border-b border-corporate-200 text-[11px] font-semibold text-corporate-600 uppercase tracking-wider">
                <th className="px-4 py-3">Performance Grade</th>
                <th className="px-4 py-3 font-mono text-center">Score Range (%)</th>
                <th className="px-4 py-3">Contractual Significance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-corporate-100 text-xs">
              {thresholds.map((t) => (
                <tr key={t.id} className="hover:bg-corporate-50/70">
                  <td className="px-4 py-3">
                    <StatusBadge status={t.grade} size="sm" />
                  </td>
                  <td className="px-4 py-3 font-mono text-center text-corporate-800 font-bold">
                    {t.minScore}% to {t.maxScore}%
                  </td>
                  <td className="px-4 py-3 text-corporate-600 text-[11px]">{t.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Weight Modal */}
      {selectedCrit && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedCrit(null)}
          title={`Configure Criterion: ${selectedCrit.name}`}
          subtitle="Modifications will apply to future evaluations; past scorecards preserve snapshots."
          maxWidth="md"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-corporate-700 uppercase mb-1">
                Weight Percentage (%) *
              </label>
              <input
                type="number"
                step="0.5"
                required
                value={editWeight}
                onChange={(e) => setEditWeight(Number(e.target.value))}
                className="input-field font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-corporate-700 uppercase mb-1">
                Engineering Specification / Evaluation Guide
              </label>
              <textarea
                rows={3}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-corporate-200">
              <button
                type="button"
                onClick={() => setSelectedCrit(null)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary text-xs"
              >
                {isSubmitting ? 'Saving...' : 'Update Criterion'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
