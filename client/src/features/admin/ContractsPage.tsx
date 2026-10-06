import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Contract, Vendor, Eic } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { Search, Plus, Filter, AlertCircle, Eye, UserPlus, Clock } from 'lucide-react';

export const ContractsPage: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [plantFilter, setPlantFilter] = useState('');
  const [nearCompOnly, setNearCompOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Dropdown options for creation
  const [vendorsList, setVendorsList] = useState<Vendor[]>([]);
  const [eicsList, setEicsList] = useState<Eic[]>([]);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [newEicId, setNewEicId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Contract Form State
  const [formData, setFormData] = useState({
    poNumber: '',
    contractType: 'PO' as 'PO' | 'LOA',
    poDate: new Date().toISOString().split('T')[0],
    completionDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
    poValueWithoutTax: 1000000,
    poValueWithTax: 1180000,
    plantCode: 'PLANT-01',
    vendorId: '',
    eicId: '',
    description: ''
  });

  const fetchContracts = async () => {
    setIsLoading(true);
    try {
      const res = await api.getContracts({
        page,
        limit: 10,
        search,
        contractType: typeFilter,
        contractStatus: statusFilter,
        plantCode: plantFilter,
        nearCompletionOnly: nearCompOnly ? 'true' : ''
      });
      if (res.success) {
        setContracts(res.contracts || []);
        setTotal(res.total || 0);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadDropdowns = async () => {
    try {
      const [vRes, eRes] = await Promise.all([
        api.getVendors({ limit: 100, status: 'ACTIVE' }),
        api.getEics({ limit: 100, status: 'ACTIVE' })
      ]);
      if (vRes.success) setVendorsList(vRes.vendors || []);
      if (eRes.success) setEicsList(eRes.eics || []);
    } catch {
      // Ignore background dropdown fetch errors
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [page, typeFilter, statusFilter, plantFilter, nearCompOnly]);

  useEffect(() => {
    loadDropdowns();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchContracts();
  };

  const handleOpenDetail = async (c: Contract) => {
    try {
      const res = await api.getContract(c.id);
      if (res.success) {
        setSelectedContract(res.contract);
        setIsDetailOpen(true);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to load contract details.');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      const res = await api.createContract(formData);
      if (res.success) {
        setIsCreateOpen(false);
        setFormData({
          poNumber: '',
          contractType: 'PO',
          poDate: new Date().toISOString().split('T')[0],
          completionDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
          poValueWithoutTax: 1000000,
          poValueWithTax: 1180000,
          plantCode: 'PLANT-01',
          vendorId: '',
          eicId: '',
          description: ''
        });
        fetchContracts();
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to create contract.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract || !newEicId) return;
    setIsSubmitting(true);
    try {
      const res = await api.assignEic(selectedContract.id, newEicId);
      if (res.success) {
        setIsReassignOpen(false);
        fetchContracts();
        if (isDetailOpen) {
          const updated = await api.getContract(selectedContract.id);
          if (updated.success) setSelectedContract(updated.contract);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to reassign EIC.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-corporate-200">
        <div>
          <h1 className="text-lg font-bold text-corporate-900 tracking-tight">PO / LOA Contract Management</h1>
          <p className="text-xs text-corporate-500 mt-0.5">
            Central repository of Purchase Orders and Letters of Award linking awarded vendors and appointed supervisory EICs.
          </p>
        </div>
        <button
          onClick={() => { setFormError(null); setIsCreateOpen(true); }}
          className="btn-primary text-xs"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create PO / LOA Contract
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
              placeholder="Search by PO Number, Plant Code, Scope..."
              className="input-field pl-9 text-xs"
            />
            <Search className="w-4 h-4 text-corporate-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="select-field text-xs w-28"
            >
              <option value="">All Types</option>
              <option value="PO">PO</option>
              <option value="LOA">LOA</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="select-field text-xs w-36"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="NEAR_COMPLETION">NEAR COMPLETION</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="DRAFT">DRAFT</option>
              <option value="EXPIRED">EXPIRED</option>
            </select>

            <select
              value={plantFilter}
              onChange={(e) => { setPlantFilter(e.target.value); setPage(1); }}
              className="select-field text-xs w-32"
            >
              <option value="">All Plants</option>
              <option value="PLANT-01">PLANT-01</option>
              <option value="PLANT-02">PLANT-02</option>
              <option value="PLANT-03">PLANT-03</option>
              <option value="PLANT-04">PLANT-04</option>
              <option value="PLANT-05">PLANT-05</option>
            </select>

            <label className="flex items-center text-xs text-corporate-700 font-medium px-2 py-1 bg-corporate-50 border border-corporate-200 rounded cursor-pointer">
              <input
                type="checkbox"
                checked={nearCompOnly}
                onChange={(e) => { setNearCompOnly(e.target.checked); setPage(1); }}
                className="mr-1.5"
              />
              Near Expiry (&lt;30d)
            </label>

            <button type="submit" className="btn-secondary text-xs">
              <Filter className="w-3.5 h-3.5 mr-1 text-corporate-500" /> Filter
            </button>
          </div>
        </form>
      </div>

      {/* Contracts Data Table */}
      <div className="bg-white border border-corporate-200 rounded shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-corporate-100/70 border-b border-corporate-200 text-[11px] font-semibold text-corporate-600 uppercase tracking-wider">
                <th className="px-4 py-3">PO Number</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Plant</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Appointed EIC</th>
                <th className="px-4 py-3">Completion Date</th>
                <th className="px-4 py-3 text-center">Urgency</th>
                <th className="px-4 py-3 text-right">Value (With Tax)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-corporate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-corporate-400 font-mono">
                    Loading contract records...
                  </td>
                </tr>
              ) : contracts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-corporate-400">
                    No PO/LOA contracts match the search criteria.
                  </td>
                </tr>
              ) : (
                contracts.map((c) => {
                  let urgencyBadge = (
                    <span className="font-mono text-[11px] text-corporate-600">
                      {c.daysRemaining}d rem.
                    </span>
                  );

                  if (c.urgencyLevel === 'CRITICAL') {
                    urgencyBadge = (
                      <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-900 border border-red-300 font-mono text-[10px] font-bold inline-flex items-center">
                        <Clock className="w-3 h-3 mr-1 text-red-700" /> &lt;15d ({c.daysRemaining}d)
                      </span>
                    );
                  } else if (c.urgencyLevel === 'WARNING') {
                    urgencyBadge = (
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-mono text-[10px] font-medium inline-flex items-center">
                        <Clock className="w-3 h-3 mr-1 text-amber-700" /> 15-30d ({c.daysRemaining}d)
                      </span>
                    );
                  }

                  return (
                    <tr key={c.id} className="hover:bg-corporate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-corporate-800">{c.poNumber}</td>
                      <td className="px-4 py-3 font-medium text-corporate-700">{c.contractType}</td>
                      <td className="px-4 py-3 font-mono text-corporate-700">{c.plantCode}</td>
                      <td className="px-4 py-3 font-medium text-corporate-900">
                        <div>{c.vendor?.vendorName}</div>
                        <div className="text-[11px] font-mono text-corporate-500">{c.vendor?.vendorCode}</div>
                      </td>
                      <td className="px-4 py-3 text-corporate-800">
                        <div>{c.eic?.name}</div>
                        <div className="text-[11px] font-mono text-corporate-500">{c.eic?.employeeId}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-corporate-600">
                        {new Date(c.completionDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-center">{urgencyBadge}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-corporate-900">
                        ₹{c.poValueWithTax?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={c.contractStatus} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => handleOpenDetail(c)}
                          className="inline-flex items-center text-xs text-blue-700 hover:text-blue-900 font-medium"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> View
                        </button>
                        <button
                          onClick={() => { setSelectedContract(c); setNewEicId(c.eicId); setIsReassignOpen(true); }}
                          className="inline-flex items-center text-xs text-corporate-600 hover:text-corporate-900"
                          title="Reassign supervisory EIC"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-corporate-200 bg-corporate-50 flex items-center justify-between text-xs text-corporate-600">
          <span>Showing {contracts.length} of {total} contracts</span>
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

      {/* Create Contract Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Issue New PO / LOA Contract"
        subtitle="Enforces business rules: Completion Date >= PO Date; PO Value With Tax >= Without Tax"
        maxWidth="xl"
      >
        {formError && (
          <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-800 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-corporate-700 uppercase">PO / LOA Number *</label>
              <input
                type="text"
                required
                value={formData.poNumber}
                onChange={(e) => setFormData({ ...formData, poNumber: e.target.value.toUpperCase() })}
                placeholder="PO/2026/PLANT-1/0199"
                className="input-field mt-1 font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-corporate-700 uppercase">Contract Type *</label>
              <select
                value={formData.contractType}
                onChange={(e) => setFormData({ ...formData, contractType: e.target.value as any })}
                className="select-field mt-1"
              >
                <option value="PO">PO (Purchase Order)</option>
                <option value="LOA">LOA (Letter of Award)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-corporate-700 uppercase">Plant Code *</label>
              <input
                type="text"
                required
                value={formData.plantCode}
                onChange={(e) => setFormData({ ...formData, plantCode: e.target.value.toUpperCase() })}
                placeholder="PLANT-01"
                className="input-field mt-1 font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-corporate-700 uppercase">Awarded Vendor *</label>
              <select
                required
                value={formData.vendorId}
                onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                className="select-field mt-1"
              >
                <option value="">Select Registered Vendor...</option>
                {vendorsList.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.vendorCode} - {v.vendorName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-corporate-700 uppercase">Appointed EIC Officer *</label>
              <select
                required
                value={formData.eicId}
                onChange={(e) => setFormData({ ...formData, eicId: e.target.value })}
                className="select-field mt-1"
              >
                <option value="">Appoint Supervisory EIC...</option>
                {eicsList.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.employeeId} - {e.name} ({e.company})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-corporate-700 uppercase">PO Issuance Date *</label>
              <input
                type="date"
                required
                value={formData.poDate}
                onChange={(e) => setFormData({ ...formData, poDate: e.target.value })}
                className="input-field mt-1 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-corporate-700 uppercase">Contract Completion Date *</label>
              <input
                type="date"
                required
                value={formData.completionDate}
                onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })}
                className="input-field mt-1 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-corporate-700 uppercase">Value Without Tax (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.poValueWithoutTax}
                onChange={(e) => setFormData({ ...formData, poValueWithoutTax: Number(e.target.value) })}
                className="input-field mt-1 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-corporate-700 uppercase">Value With Tax (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.poValueWithTax}
                onChange={(e) => setFormData({ ...formData, poValueWithTax: Number(e.target.value) })}
                className="input-field mt-1 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-corporate-700 uppercase">Scope of Work / Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of contractual scope and engineering specifications..."
              className="input-field mt-1"
            />
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
              {isSubmitting ? 'Issuing...' : 'Create Contract'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reassign EIC Modal */}
      {selectedContract && (
        <Modal
          isOpen={isReassignOpen}
          onClose={() => setIsReassignOpen(false)}
          title="Reassign Supervisory EIC"
          subtitle={`Contract ${selectedContract.poNumber}`}
          maxWidth="md"
        >
          <form onSubmit={handleReassignSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-corporate-700 uppercase mb-1">
                Current Appointed EIC
              </label>
              <div className="p-2.5 bg-corporate-100 rounded text-corporate-900 font-medium">
                {selectedContract.eic?.name} ({selectedContract.eic?.employeeId})
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-corporate-700 uppercase mb-1">
                Select New EIC Officer *
              </label>
              <select
                required
                value={newEicId}
                onChange={(e) => setNewEicId(e.target.value)}
                className="select-field"
              >
                <option value="">Select EIC...</option>
                {eicsList.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.employeeId} - {e.name} ({e.company})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-corporate-200">
              <button
                type="button"
                onClick={() => setIsReassignOpen(false)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary text-xs"
              >
                {isSubmitting ? 'Reassigning...' : 'Confirm Reassignment'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Contract Detail Modal */}
      {selectedContract && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Contract Master: ${selectedContract.poNumber}`}
          subtitle={`${selectedContract.contractType} • Plant ${selectedContract.plantCode}`}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-corporate-50 border border-corporate-200 rounded">
              <div>
                <span className="text-[11px] text-corporate-500 uppercase font-semibold block">Contract Status</span>
                <div className="mt-1"><StatusBadge status={selectedContract.contractStatus} /></div>
              </div>
              <div>
                <span className="text-[11px] text-corporate-500 uppercase font-semibold block">PO Date</span>
                <span className="font-mono text-corporate-900 mt-1 block">
                  {new Date(selectedContract.poDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-corporate-500 uppercase font-semibold block">Completion Date</span>
                <span className="font-mono text-corporate-900 mt-1 block">
                  {new Date(selectedContract.completionDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-corporate-500 uppercase font-semibold block">Urgency</span>
                <span className="font-mono font-bold text-corporate-900 mt-1 block">
                  {selectedContract.daysRemaining} Days Left
                </span>
              </div>
              <div>
                <span className="text-[11px] text-corporate-500 uppercase font-semibold block">Value Without Tax</span>
                <span className="font-mono text-corporate-900 mt-1 block">
                  ₹{selectedContract.poValueWithoutTax?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-corporate-500 uppercase font-semibold block">Value With Tax</span>
                <span className="font-mono font-bold text-corporate-900 mt-1 block">
                  ₹{selectedContract.poValueWithTax?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-corporate-500 uppercase font-semibold block">Vendor</span>
                <span className="text-corporate-900 mt-1 block font-medium truncate">
                  {selectedContract.vendor?.vendorName}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-corporate-500 uppercase font-semibold block">Appointed EIC</span>
                <span className="text-corporate-900 mt-1 block font-medium truncate">
                  {selectedContract.eic?.name}
                </span>
              </div>
            </div>

            {selectedContract.description && (
              <div className="p-3 bg-corporate-50 border border-corporate-200 rounded">
                <span className="text-[11px] text-corporate-500 uppercase font-semibold block mb-1">
                  Scope of Work
                </span>
                <p className="text-corporate-800 leading-relaxed">{selectedContract.description}</p>
              </div>
            )}

            {/* Evaluations for this Contract */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-corporate-800 mb-2">
                Evaluations Conducted for this Contract ({selectedContract.evaluations?.length || 0})
              </h3>
              <div className="border border-corporate-200 rounded overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-corporate-100 text-[11px] text-corporate-600 font-semibold uppercase">
                    <tr>
                      <th className="px-3 py-2">Eval #</th>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2 font-mono text-right">Weighted Score</th>
                      <th className="px-3 py-2 font-mono text-right">Percentage</th>
                      <th className="px-3 py-2">Grade</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-corporate-100">
                    {selectedContract.evaluations?.map((e) => (
                      <tr key={e.id} className="hover:bg-corporate-50">
                        <td className="px-3 py-2 font-mono font-medium text-corporate-900">{e.evaluationNumber}</td>
                        <td className="px-3 py-2 text-corporate-600">{new Date(e.evaluationDate).toLocaleDateString()}</td>
                        <td className="px-3 py-2 font-mono text-right">{e.totalWeightedScore}</td>
                        <td className="px-3 py-2 font-mono text-right font-bold text-corporate-900">{e.percentage}%</td>
                        <td className="px-3 py-2"><StatusBadge status={e.ratingGrade} size="sm" /></td>
                        <td className="px-3 py-2"><StatusBadge status={e.status} size="sm" /></td>
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
