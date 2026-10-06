import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Eic } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { Search, Plus, Filter, AlertCircle, Eye, Briefcase } from 'lucide-react';

export const EicManagementPage: React.FC = () => {
  const [eics, setEics] = useState<Eic[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedEic, setSelectedEic] = useState<Eic | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    company: '',
    mobile: '',
    email: '',
    initialPassword: 'Eic@123'
  });

  const fetchEics = async () => {
    setIsLoading(true);
    try {
      const res = await api.getEics({
        page,
        limit: 10,
        search,
        status: statusFilter
      });
      if (res.success) {
        setEics(res.eics || []);
        setTotal(res.total || 0);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEics();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEics();
  };

  const handleOpenDetail = async (eic: Eic) => {
    try {
      const res = await api.getEic(eic.id);
      if (res.success) {
        setSelectedEic(res.eic);
        setIsDetailOpen(true);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to load EIC details.');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      const res = await api.createEic(formData);
      if (res.success) {
        setIsCreateOpen(false);
        setFormData({
          employeeId: '',
          name: '',
          company: '',
          mobile: '',
          email: '',
          initialPassword: 'Eic@123'
        });
        fetchEics();
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to create EIC record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-corporate-200">
        <div>
          <h1 className="text-lg font-bold text-corporate-900 tracking-tight">Engineer In-Charge (EIC) Management</h1>
          <p className="text-xs text-corporate-500 mt-0.5">
            Supervisory personnel appointed to oversee contractual vendor execution and submit performance scorecards.
          </p>
        </div>
        <button
          onClick={() => { setFormError(null); setIsCreateOpen(true); }}
          className="btn-primary text-xs"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add EIC Officer
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-corporate-200 rounded p-3.5 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Employee ID, Name, Department, Email..."
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
              <option value="INACTIVE">INACTIVE</option>
            </select>

            <button type="submit" className="btn-secondary text-xs">
              <Filter className="w-3.5 h-3.5 mr-1 text-corporate-500" /> Filter
            </button>
          </div>
        </form>
      </div>

      {/* EICs Table */}
      <div className="bg-white border border-corporate-200 rounded shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-corporate-100/70 border-b border-corporate-200 text-[11px] font-semibold text-corporate-600 uppercase tracking-wider">
                <th className="px-4 py-3">Emp ID</th>
                <th className="px-4 py-3">EIC Name</th>
                <th className="px-4 py-3">Division / Company</th>
                <th className="px-4 py-3">Contact Email</th>
                <th className="px-4 py-3 font-mono">Mobile</th>
                <th className="px-4 py-3 text-center">Assigned POs</th>
                <th className="px-4 py-3 text-center">Evaluations</th>
                <th className="px-4 py-3 text-right">Avg Score Given</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-corporate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-corporate-400 font-mono">
                    Loading EIC records...
                  </td>
                </tr>
              ) : eics.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-corporate-400">
                    No EIC officers found.
                  </td>
                </tr>
              ) : (
                eics.map((e) => (
                  <tr key={e.id} className="hover:bg-corporate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-corporate-800">{e.employeeId}</td>
                    <td className="px-4 py-3 font-medium text-corporate-900">{e.name}</td>
                    <td className="px-4 py-3 text-corporate-600">{e.company}</td>
                    <td className="px-4 py-3 text-corporate-700">{e.email}</td>
                    <td className="px-4 py-3 font-mono text-corporate-600">{e.mobile}</td>
                    <td className="px-4 py-3 text-center font-mono font-medium text-corporate-800">
                      {e.assignedContractsCount || 0}
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-medium text-corporate-800">
                      {e.completedEvaluationsCount || 0}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-corporate-900">
                      {e.averageEvaluationScore !== null ? `${e.averageEvaluationScore}%` : 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={e.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleOpenDetail(e)}
                        className="inline-flex items-center text-xs text-blue-700 hover:text-blue-900 font-medium"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> Dossier
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
          <span>Showing {eics.length} of {total} registered EIC officers</span>
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
              disabled={eics.length < 10}
              className="px-2.5 py-1 border border-corporate-300 rounded bg-white disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Create EIC Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Appoint New Engineer In-Charge (EIC)"
        subtitle="Registers supervisory profile and credentials for contract oversight"
        maxWidth="lg"
      >
        {formError && (
          <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-800 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-corporate-700 uppercase">Employee ID / EmpID *</label>
              <input
                type="text"
                required
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value.toUpperCase() })}
                placeholder="EMP-EIC-106"
                className="input-field mt-1 font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-corporate-700 uppercase">Full Officer Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Er. Alok Verma"
                className="input-field mt-1"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-corporate-700 uppercase">Division / Company *</label>
            <input
              type="text"
              required
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="Civil & Structural Engineering Division"
              className="input-field mt-1"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-corporate-700 uppercase">Official Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="eic.name@enterprise.org"
                className="input-field mt-1"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-corporate-700 uppercase">Mobile Number *</label>
              <input
                type="tel"
                required
                maxLength={10}
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="9811099887"
                className="input-field mt-1 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-corporate-200">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary text-xs"
            >
              {isSubmitting ? 'Registering...' : 'Appoint EIC Officer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* EIC Details Modal */}
      {selectedEic && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`EIC Officer Dossier: ${selectedEic.employeeId}`}
          subtitle={selectedEic.name}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-corporate-50 border border-corporate-200 rounded">
              <div>
                <span className="text-[11px] text-corporate-500 uppercase font-semibold block">Status</span>
                <div className="mt-1"><StatusBadge status={selectedEic.status} /></div>
              </div>
              <div>
                <span className="text-[11px] text-corporate-500 uppercase font-semibold block">Emp ID</span>
                <span className="font-mono font-medium text-corporate-900 mt-1 block">{selectedEic.employeeId}</span>
              </div>
              <div>
                <span className="text-[11px] text-corporate-500 uppercase font-semibold block">Department</span>
                <span className="font-medium text-corporate-900 mt-1 block">{selectedEic.company}</span>
              </div>
              <div>
                <span className="text-[11px] text-corporate-500 uppercase font-semibold block">Mobile</span>
                <span className="font-mono text-corporate-900 mt-1 block">{selectedEic.mobile}</span>
              </div>
            </div>

            {/* Assigned Vendors */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-corporate-800 mb-2 flex items-center">
                <Briefcase className="w-3.5 h-3.5 mr-1.5 text-corporate-500" />
                Supervised Vendors ({selectedEic.assignedVendors?.length || 0})
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedEic.assignedVendors?.map(v => (
                  <span key={v.id} className="px-2.5 py-1 bg-corporate-100 border border-corporate-200 rounded font-medium text-corporate-800 text-[11px]">
                    <span className="font-mono text-corporate-600 mr-1.5">{v.vendorCode}</span>
                    {v.vendorName}
                  </span>
                ))}
              </div>
            </div>

            {/* Assigned Contracts */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-corporate-800 mb-2">
                Assigned PO / LOA Contracts ({selectedEic.contracts?.length || 0})
              </h3>
              <div className="border border-corporate-200 rounded overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-corporate-100 text-[11px] text-corporate-600 font-semibold uppercase">
                    <tr>
                      <th className="px-3 py-2">PO Number</th>
                      <th className="px-3 py-2">Vendor</th>
                      <th className="px-3 py-2">Plant</th>
                      <th className="px-3 py-2 font-mono text-right">Value (Tax Incl.)</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-corporate-100">
                    {selectedEic.contracts?.map((c) => (
                      <tr key={c.id} className="hover:bg-corporate-50">
                        <td className="px-3 py-2 font-mono font-medium text-corporate-900">{c.poNumber}</td>
                        <td className="px-3 py-2">{c.vendor?.vendorName}</td>
                        <td className="px-3 py-2 font-mono">{c.plantCode}</td>
                        <td className="px-3 py-2 font-mono text-right">
                          ₹{c.poValueWithTax?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-2"><StatusBadge status={c.contractStatus} size="sm" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
