import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Contract, Evaluation, EvaluationScoreItem } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { AlertCircle, CheckCircle2, Calculator } from 'lucide-react';

interface EvaluationScoringModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract | null;
  existingEvaluationId?: string | null;
  onSuccess: () => void;
}

export const EvaluationScoringModal: React.FC<EvaluationScoringModalProps> = ({
  isOpen,
  onClose,
  contract,
  existingEvaluationId,
  onSuccess
}) => {
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [scores, setScores] = useState<EvaluationScoreItem[]>([]);
  const [remarks, setRemarks] = useState('');
  const [observations, setObservations] = useState('');
  const [periodStart, setPeriodStart] = useState(new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]);
  const [periodEnd, setPeriodEnd] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize draft or fetch existing evaluation
  const initDraft = async () => {
    if (!contract && !existingEvaluationId) return;
    setIsLoading(true);
    setError(null);
    try {
      if (existingEvaluationId) {
        const res = await api.getEvaluation(existingEvaluationId);
        if (res.success && res.evaluation) {
          setEvaluation(res.evaluation);
          setScores(res.evaluation.scores || []);
          setRemarks(res.evaluation.remarks || '');
          setObservations(res.evaluation.observations || '');
          setPeriodStart(new Date(res.evaluation.periodStart).toISOString().split('T')[0]);
          setPeriodEnd(new Date(res.evaluation.periodEnd).toISOString().split('T')[0]);
        }
      } else if (contract) {
        // Create new draft
        const draftRes = await api.createEvaluationDraft({
          poId: contract.id,
          periodStart,
          periodEnd
        });
        if (draftRes.success && draftRes.evaluation) {
          setEvaluation(draftRes.evaluation);
          setScores(draftRes.evaluation.scores || []);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize evaluation draft.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      initDraft();
    } else {
      setEvaluation(null);
      setScores([]);
      setRemarks('');
      setObservations('');
    }
  }, [isOpen, contract?.id, existingEvaluationId]);

  // Live Score Calculator
  const handleScoreChange = (scoreId: string, newScore: number) => {
    setScores(prev =>
      prev.map(s => {
        if (s.id === scoreId) {
          const raw = Math.max(0, Math.min(s.maxScoreSnapshot, newScore));
          const weighted = Number(((raw / s.maxScoreSnapshot) * s.weightSnapshot).toFixed(2));
          return { ...s, score: raw, weightedScore: weighted };
        }
        return s;
      })
    );
  };

  const handleItemRemarksChange = (scoreId: string, val: string) => {
    setScores(prev =>
      prev.map(s => (s.id === scoreId ? { ...s, remarks: val } : s))
    );
  };

  // Compute live totals
  const totalWeightedScore = Number(scores.reduce((sum, s) => sum + s.weightedScore, 0).toFixed(2));
  const totalWeight = scores.reduce((sum, s) => sum + s.weightSnapshot, 0);
  const livePercentage = totalWeight > 0 ? Number(((totalWeightedScore / totalWeight) * 100).toFixed(2)) : 0;

  let liveGrade = 'UNSATISFACTORY';
  if (livePercentage >= 90.0) liveGrade = 'EXCELLENT';
  else if (livePercentage >= 75.0) liveGrade = 'VERY_GOOD';
  else if (livePercentage >= 60.0) liveGrade = 'GOOD';
  else if (livePercentage >= 50.0) liveGrade = 'SATISFACTORY';

  const handleSaveDraft = async () => {
    if (!evaluation) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await api.updateEvaluationScores(evaluation.id, {
        scores: scores.map(s => ({ scoreId: s.id, score: s.score, remarks: s.remarks || '' })),
        remarks,
        observations
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save draft.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitFinal = async () => {
    if (!evaluation) return;
    const unScored = scores.filter(s => s.score <= 0);
    if (unScored.length > 0) {
      setError(`All criteria must be scored prior to submission. Unscored: ${unScored.map(u => u.criterionNameSnapshot).join(', ')}`);
      return;
    }

    if (!confirm('Are you sure you want to SUBMIT this evaluation? Once submitted, the scorecard is locked and forwarded to administrative management.')) return;

    setIsSubmitting(true);
    setError(null);
    try {
      // First update scores
      await api.updateEvaluationScores(evaluation.id, {
        scores: scores.map(s => ({ scoreId: s.id, score: s.score, remarks: s.remarks || '' })),
        remarks,
        observations
      });
      // Then submit
      await api.submitEvaluation(evaluation.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit evaluation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={evaluation ? `Conduct Evaluation: ${evaluation.evaluationNumber}` : 'Initiate Vendor Performance Assessment'}
      subtitle={`Contract ${contract?.poNumber || evaluation?.contract?.poNumber} • ${contract?.vendor?.vendorName || evaluation?.vendor?.vendorName}`}
      maxWidth="3xl"
    >
      {isLoading ? (
        <div className="py-12 text-center text-xs font-mono text-corporate-500">
          Loading evaluation criteria and contract parameters...
        </div>
      ) : (
        <div className="space-y-5 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Performance Period */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-corporate-50 border border-corporate-200 rounded">
            <div>
              <label className="block text-xs font-semibold text-corporate-700 uppercase">Assessment Period Start</label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="input-field mt-1 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-corporate-700 uppercase">Assessment Period End</label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="input-field mt-1 font-mono"
              />
            </div>
          </div>

          {/* Live Calculation Gauge */}
          <div className="p-3.5 bg-corporate-900 border border-corporate-800 text-white rounded shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-blue-400" />
              <div>
                <span className="text-[11px] font-mono uppercase text-corporate-400 block">Live Calculated Score</span>
                <span className="font-mono text-lg font-bold text-white">
                  {totalWeightedScore} / 100 ({livePercentage}%)
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-xs text-corporate-300 font-medium">Assigned Grade:</span>
              <StatusBadge status={liveGrade} size="md" />
            </div>
          </div>

          {/* Criteria Evaluation Inputs */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-corporate-800 mb-2">
              Multi-Criteria Performance Scoring (1 to 5 Scale)
            </h3>
            <div className="border border-corporate-200 rounded overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-corporate-100 text-[11px] text-corporate-600 font-semibold uppercase">
                  <tr>
                    <th className="px-3 py-2.5">Parameter</th>
                    <th className="px-3 py-2.5 text-center font-mono w-20">Weight</th>
                    <th className="px-3 py-2.5 text-center font-mono w-32">Rating (1-5)</th>
                    <th className="px-3 py-2.5 text-right font-mono w-24">Weighted</th>
                    <th className="px-3 py-2.5">Specific Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-corporate-100">
                  {scores.map((s) => (
                    <tr key={s.id} className="hover:bg-corporate-50/70">
                      <td className="px-3 py-2.5 font-medium text-corporate-900">
                        {s.criterionNameSnapshot}
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono text-corporate-600">
                        {s.weightSnapshot}%
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <select
                          value={s.score}
                          onChange={(e) => handleScoreChange(s.id, Number(e.target.value))}
                          className="select-field text-xs font-mono font-bold text-center py-1"
                        >
                          <option value={0}>- Select -</option>
                          <option value={1}>1 - Very Poor</option>
                          <option value={2}>2 - Poor</option>
                          <option value={3}>3 - Average</option>
                          <option value={4}>4 - Good</option>
                          <option value={5}>5 - Excellent</option>
                        </select>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-corporate-900">
                        {s.weightedScore}
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          type="text"
                          value={s.remarks || ''}
                          onChange={(e) => handleItemRemarksChange(s.id, e.target.value)}
                          placeholder="Observations for this parameter..."
                          className="input-field text-xs py-1"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Observations and Remarks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-corporate-700 uppercase mb-1">
                EIC Site Observations & Compliance Notes
              </label>
              <textarea
                rows={3}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Log physical inspection notes, safety incident logs, or milestone adherence details..."
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-corporate-700 uppercase mb-1">
                Overall Recommendations & Remarks
              </label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Recommended corrective actions, milestone payment releases, or areas of improvement..."
                className="input-field"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-corporate-200">
            <span className="text-[11px] text-corporate-500 font-mono">
              Submission locks record for Admin review.
            </span>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSubmitting}
                className="btn-secondary text-xs font-medium"
              >
                {isSubmitting ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                type="button"
                onClick={handleSubmitFinal}
                disabled={isSubmitting}
                className="btn-primary text-xs"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                {isSubmitting ? 'Submitting...' : 'Submit Final Evaluation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
