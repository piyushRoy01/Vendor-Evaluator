import React from 'react';
import { ShieldCheck, Lock, EyeOff, Server, FileText } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      {/* Title */}
      <div className="pb-4 border-b border-corporate-200">
        <div className="flex items-center space-x-2 text-corporate-900">
          <ShieldCheck className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-bold tracking-tight">Enterprise Privacy Policy</h1>
        </div>
        <p className="text-xs text-corporate-500 mt-1">
          Statutory Data Governance, Vendor Identification Safeguards, and Audit Archival Standards
        </p>
      </div>

      <div className="bg-white border border-corporate-200 rounded p-6 shadow-sm space-y-6 text-xs text-corporate-700 leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-corporate-900 uppercase tracking-wide flex items-center">
            <Lock className="w-4 h-4 mr-2 text-corporate-500" />
            1. Scope and Organizational Authority
          </h2>
          <p>
            This Privacy Policy governs the collection, processing, storage, and dissemination of organizational vendor records, statutory tax credentials (Permanent Account Numbers and Goods & Services Tax Identification Numbers), contractual commitments under Letters of Award (LOA) and Purchase Orders (PO), and periodic supervisor evaluations conducted through this centralized enterprise portal.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-corporate-900 uppercase tracking-wide flex items-center">
            <EyeOff className="w-4 h-4 mr-2 text-corporate-500" />
            2. Confidential Financial Data and Field-Level Masking
          </h2>
          <p>
            Sensitive commercial details, including vendor corporate bank account numbers and IFSC identifiers, are stored in encrypted relational schemas and subjected to field-level masking. Non-administrative users, including supervisory Engineers In-Charge (EICs) and unauthorized third parties, are strictly restricted from viewing unmasked financial banking data.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-corporate-900 uppercase tracking-wide flex items-center">
            <Server className="w-4 h-4 mr-2 text-corporate-500" />
            3. Immutable Audit Trails and Access Logging
          </h2>
          <p>
            In compliance with statutory corporate governance and procurement vigilance frameworks, all transactions—including session authentication, contract drafting, supervisory assignments, evaluation scoring, and administrative returns—are permanently recorded in an append-only audit trail containing actor identity, network IP address, and cryptographic timestamp tokens.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-corporate-900 uppercase tracking-wide flex items-center">
            <FileText className="w-4 h-4 mr-2 text-corporate-500" />
            4. Data Retention and Soft Deletion
          </h2>
          <p>
            Vendor master records, contract histories, and submitted performance scorecards are retained for the statutory life of the enterprise procurement agreement and subsequent corporate audit periods. In accordance with organizational governance, records are not permanently destroyed upon deactivation; soft-deletion mechanisms ensure historical audit continuity.
          </p>
        </section>

        <div className="pt-4 border-t border-corporate-200 text-[11px] text-corporate-400 font-mono">
          Last Reviewed: October 2026 • Legal & Vigilance Directorate
        </div>
      </div>
    </div>
  );
};
