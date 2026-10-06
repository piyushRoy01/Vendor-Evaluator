import React from 'react';
import { FileText, CheckCircle2, AlertTriangle, Scale, Lock } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      {/* Title */}
      <div className="pb-4 border-b border-corporate-200">
        <div className="flex items-center space-x-2 text-corporate-900">
          <FileText className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-bold tracking-tight">Terms and Conditions of System Usage</h1>
        </div>
        <p className="text-xs text-corporate-500 mt-1">
          Operational Protocols, Supervisory Scoring Regulations, and Role-Based Access Governance
        </p>
      </div>

      <div className="bg-white border border-corporate-200 rounded p-6 shadow-sm space-y-6 text-xs text-corporate-700 leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-corporate-900 uppercase tracking-wide flex items-center">
            <Scale className="w-4 h-4 mr-2 text-corporate-500" />
            1. Role-Based Access and Contract Isolation
          </h2>
          <p>
            Users are assigned distinct security privileges under the three-tier RBAC architecture (Admin, EIC, and Vendor). Users must access only records expressly authorized within their operational mandate. Cross-vendor data exposure and unassigned contract queries are strictly blocked at the API gateway layer and flagged as security incidents.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-corporate-900 uppercase tracking-wide flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2 text-corporate-500" />
            2. Evaluation Scoring Integrity & Immutable Submission
          </h2>
          <p>
            Supervisory Engineers In-Charge (EICs) are required to evaluate performance objectively against published engineering parameters, safety norms, and schedule milestones. Once an evaluation is marked as SUBMITTED, scores become permanently locked. Direct tampering or post-submission edits are prohibited except through the formalized administrative return workflow with written justification.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-corporate-900 uppercase tracking-wide flex items-center">
            <Lock className="w-4 h-4 mr-2 text-corporate-500" />
            3. Deterministic Snapshotting of Evaluation Weights
          </h2>
          <p>
            To guarantee deterministic and reproducible evaluation histories, criteria weights and maximum scores are snapshotted into individual scorecard rows at the moment of evaluation creation. Administrative adjustments to global criteria weights will affect only prospective contracts and will never alter historical performance determinations.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-corporate-900 uppercase tracking-wide flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2 text-corporate-500" />
            4. Performance Consequences and Vendor Rating Thresholds
          </h2>
          <p>
            Evaluations resulting in scores falling into the UNSATISFACTORY or SATISFACTORY categories (&lt; 60%) may trigger contractual remedial notices, withholding of milestone disbursements, or suspension/blacklisting in accordance with organizational procurement bylaws.
          </p>
        </section>

        <div className="pt-4 border-t border-corporate-200 text-[11px] text-corporate-400 font-mono">
          Operational Version: 1.0.4 • Central Procurement & Vigilance Committee
        </div>
      </div>
    </div>
  );
};
