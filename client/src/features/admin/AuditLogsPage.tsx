import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { AuditLog } from '../../types';
import { Search, Filter, ShieldCheck } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [userEmailSearch, setUserEmailSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAuditLogs({
        page,
        limit: 15,
        action: actionFilter,
        entityType: entityFilter,
        userEmail: userEmailSearch
      });
      if (res.success) {
        setLogs(res.logs || []);
        setTotal(res.total || 0);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, entityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-corporate-200">
        <div>
          <h1 className="text-lg font-bold text-corporate-900 tracking-tight flex items-center">
            <ShieldCheck className="w-5 h-5 mr-2 text-blue-600" />
            Immutable System Audit Trail
          </h1>
          <p className="text-xs text-corporate-500 mt-0.5">
            Cryptographically stamped append-only log of all contractual updates, EIC appointments, and scorecard submissions.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-corporate-200 rounded p-3.5 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={userEmailSearch}
              onChange={(e) => setUserEmailSearch(e.target.value)}
              placeholder="Search by User Email..."
              className="input-field pl-9 text-xs"
            />
            <Search className="w-4 h-4 text-corporate-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex gap-2">
            <select
              value={entityFilter}
              onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
              className="select-field text-xs w-36"
            >
              <option value="">All Entities</option>
              <option value="PO_LOA">PO / LOA</option>
              <option value="EVALUATION">EVALUATION</option>
              <option value="VENDOR">VENDOR</option>
              <option value="EIC">EIC</option>
              <option value="USER">USER</option>
            </select>

            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              className="select-field text-xs w-44"
            >
              <option value="">All Actions</option>
              <option value="CONTRACT_CREATED">CONTRACT CREATED</option>
              <option value="CONTRACT_MODIFIED">CONTRACT MODIFIED</option>
              <option value="EIC_ASSIGNED">EIC ASSIGNED</option>
              <option value="EIC_REASSIGNED">EIC REASSIGNED</option>
              <option value="EVALUATION_SUBMITTED">EVALUATION SUBMITTED</option>
              <option value="EVALUATION_APPROVED">EVALUATION APPROVED</option>
              <option value="EVALUATION_RETURNED">EVALUATION RETURNED</option>
              <option value="VENDOR_CREATED">VENDOR CREATED</option>
              <option value="USER_LOGIN">USER LOGIN</option>
            </select>

            <button type="submit" className="btn-secondary text-xs">
              <Filter className="w-3.5 h-3.5 mr-1 text-corporate-500" /> Filter
            </button>
          </div>
        </form>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-corporate-200 rounded shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-corporate-100/70 border-b border-corporate-200 text-[11px] font-semibold text-corporate-600 uppercase tracking-wider">
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Actor Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target Entity</th>
                <th className="px-4 py-3">Payload Details</th>
                <th className="px-4 py-3 font-mono">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-corporate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-corporate-400 font-mono">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-corporate-400">
                    No audit records match the criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-corporate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px] text-corporate-600 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-corporate-900">{log.userEmail}</td>
                    <td className="px-4 py-3 font-mono text-[11px] font-semibold text-corporate-700">{log.userRole}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase bg-corporate-100 border border-corporate-300 text-corporate-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-corporate-700 text-[11px]">{log.entityType}</td>
                    <td className="px-4 py-3 text-corporate-600 font-mono text-[11px] max-w-xs truncate">
                      {log.newValue ? log.newValue : log.oldValue ? `Old: ${log.oldValue}` : '-'}
                    </td>
                    <td className="px-4 py-3 font-mono text-corporate-500 text-[11px]">{log.ipAddress || '127.0.0.1'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-corporate-200 bg-corporate-50 flex items-center justify-between text-xs text-corporate-600">
          <span>Showing {logs.length} of {total} audit records</span>
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
              disabled={logs.length < 15}
              className="px-2.5 py-1 border border-corporate-300 rounded bg-white disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
