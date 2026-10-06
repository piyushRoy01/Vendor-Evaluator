import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Vendor } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { Search, Plus, Filter, AlertCircle, Eye, ShieldAlert } from 'lucide-react';

export const VendorsPage: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [firmFilter, setFirmFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create Form State
  const [formData, setFormData] = useState({
    vendorCode: '',
    vendorName: '',
    pan: '',
    gstn: '',
    email: '',
    mobile: '',
    bankAccountNumber: '',
    ifscCode: '',
    typeOfFirm: 'PRIVATE_LIMITED',
    initialPassword: 'Vendor@123'
  });

  const fetchVendors = async () => {
    setIsLoading(true);
    try {
      const res = await api.getVendors({
        page,
        limit: 10,
        search,
        status: statusFilter,
        typeOfFirm: firmFilter
      });
      if (res.success) {
        setVendors(res.vendors || []);
        setTotal(res.total || 0);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [page, statusFilter, firmFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchVendors();
  };

  const handleOpenDetail = async (v: Vendor) => {
    try {
      const res = await api.getVendor(v.id);
      if (res.success) {
        setSelectedVendor(res.vendor);
        setIsDetailOpen(true);
      }
    } catch (err: any) {
      alert(err.message || 'Error loading vendor details.');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      const res = await api.createVendor(formData);
      if (res.success) {
        setIsCreateOpen(false);
        setFormData({
          vendorCode: '',
          vendorName: '',
          pan: '',
          gstn: '',
          email: '',
          mobile: '',
          bankAccountNumber: '',
          ifscCode: '',
          typeOfFirm: 'PRIVATE_LIMITED',
          initialPassword: 'Vendor@123'
        });
        fetchVendors();
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to create vendor record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (vendorId: string, newStatus: string) => {
    if (!confirm(`Are you sure you want to change vendor status to ${newStatus}?`)) return;
    try {
      await api.updateVendorStatus(vendorId, newStatus);
      fetchVendors();
      if (selectedVendor && selectedVendor.id === vendorId) {
        setSelectedVendor({ ...selectedVendor, status: newStatus as any });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update vendor status.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-corporate-200">
        <div>
          <h1 className="text-lg font-bold text-corporate-900 tracking-tight">Vendor Master Directory</h1>
          <p className="text-xs text-corporate-500 mt-0.5">
            Registered contractual vendors, statutory tax credentials (PAN/GSTN), and evaluation aggregates.
          </p>
        </div>
        <button
          onClick={() => { setFormError(null); setIsCreateOpen(true); }}
          className="btn-primary text-xs"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Register New Vendor
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
              placeholder="Search by Vendor Code, Name, PAN, GSTN, Email..."
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
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="BLACKLISTED">BLACKLISTED</option>
            </select>

            <select
              value={firmFilter}
              onChange={(e) => { setFirmFilter(e.target.value); setPage(1); }}
              className="select-field text-xs w-44"
            >
              <option value="">All Firm Types</option>
              <option value="PUBLIC_LIMITED">PUBLIC LIMITED</option>
              <option value="PRIVATE_LIMITED">PRIVATE LIMITED</option>
              <option value="LLP">LLP</option>
              <option value="PARTNERSHIP">PARTNERSHIP</option>
              <option value="PROPRIETORSHIP">PROPRIETORSHIP</option>
              <option value="JOINT_VENTURE">JOINT VENTURE</option>
            </select>

            <button type="submit" className="btn-secondary text-xs">
              <Filter className="w-3.5 h-3.5 mr-1 text-corporate-500" /> Filter
            </button>
          </div>
        </form>
      </div>

      {/* Vendors Data Table */}
      <div className="bg-white border border-corporate-200 rounded shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-corporate-100/70 border-b border-corporate-200 text-[11px] font-semibold text-corporate-600 uppercase tracking-wider">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Vendor Name</th>
                <th className="px-4 py-3 font-mono">PAN</th>
                <th className="px-4 py-3 font-mono">GSTN</th>
                <th className="px-4 py-3">Type of Firm</th>
                <th className="px-4 py-3 text-center">Contracts</th>
                <th className="px-4 py-3 text-right">Avg Score</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-corporate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-corporate-400 font-mono">
                    Loading vendor records...
                  </td>
                </tr>
              ) : vendors.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-corporate-400">
                    No vendors match the search criteria.
                  </td>
                </tr>
              ) : (
                vendors.map((v) => (
                  <tr key={v.id} className="hover:bg-corporate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-corporate-800">{v.vendorCode}</td>
                    <td className="px-4 py-3 font-medium text-corporate-900">
                      <div>{v.vendorName}</div>
                      <div className="text-[11px] text-corporate-500">{v.email} • {v.mobile}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-corporate-700">{v.pan}</td>
                    <td className="px-4 py-3 font-mono text-corporate-700">{v.gstn}</td>
                    <td className="px-4 py-3 text-corporate-600 text-[11px]">
                      {v.typeOfFirm.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-medium text-corporate-800">
                      {v.contractsCount || 0}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-corporate-900">
                      {v.averagePerformanceScore !== null ? `${v.averagePerformanceScore}%` : 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={v.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleOpenDetail(v)}
                        className="inline-flex items-center text-xs text-blue-700 hover:text-blue-900 font-medium"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> View
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
          <span>Showing {vendors.length} of {total} registered vendors</span>
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
              disabled={vendors.length < 10}
              className="px-2.5 py-1 border border-corporate-300 rounded bg-white disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Create Vendor Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register Vendor Master Record"
        subtitle="Mandatory statutory validation: PAN (10 chars), GSTN (15 chars), IFSC (11 chars)"
        maxWidth="xl"
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
              <label className="block text-xs font-semibold text-corporate-700 uppercase">Vendor Code *</label>
              <input
                type="text"
                required
                value={formData.vendorCode}
                onChange={(e) => setFormData({ ...formData, vendorCode: e.target.value.toUpperCase() })}
                placeholder="VND-2026-001"
                className="input-field mt-1 font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-corporate-700 uppercase">Vendor Enterprise Name *</label>
              <input
                type="text"
                required
                value={formData.vendorName}
                onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                placeholder="Enterprise Industrial Ltd"
                className="input-field mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-corporate-700 uppercase">Permanent Account Number (PAN) *</label>
              <input
                type="text"
                required
                maxLength={10}
                value={formData.pan}
                onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                placeholder="AAACA1234A"
                className="input-field mt-1 font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-corporate-700 uppercase">GSTN Identification Number *</label>
              <input
                type="text"
                required
                maxLength={15}
                value={formData.gstn}
                onChange={(e) => setFormData({ ...formData, gstn: e.target.value.toUpperCase() })}
                placeholder="27AAACA1234A1Z5"
                className="input-field mt-1 font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-corporate-700 uppercase">Official Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@vendor.com"
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
                placeholder="9876543210"
                className="input-field mt-1 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-corporate-700 uppercase">Bank Account No. *</label>
              <input
                type="text"
                required
                value={formData.bankAccountNumber}
                onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                placeholder="109283746501"
                className="input-field mt-1 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-corporate-700 uppercase">Bank IFSC Code *</label>
              <input
                type="text"
                required
                maxLength={11}
                value={formData.ifscCode}
                onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                placeholder="SBIN0001234"
                className="input-field mt-1 font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-corporate-700 uppercase">Type of Firm *</label>
              <select
                value={formData.typeOfFirm}
                onChange={(e) => setFormData({ ...formData, typeOfFirm: e.target.value })}
                className="select-field mt-1"
              >
                <option value="PUBLIC_LIMITED">PUBLIC LIMITED</option>
                <option value="PRIVATE_LIMITED">PRIVATE LIMITED</option>
                <option value="LLP">LLP</option>
                <option value="PARTNERSHIP">PARTNERSHIP</option>
                <option value="PROPRIETORSHIP">PROPRIETORSHIP</option>
                <option value="JOINT_VENTURE">JOINT VENTURE</option>
              </select>
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
              {isSubmitting ? 'Registering...' : 'Register Vendor Master'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Vendor Details Modal */}
      {selectedVendor && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Vendor Dossier: ${selectedVendor.vendorCode}`}
          subtitle={selectedVendor.vendorName}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs">
            {/* Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-corporate-50 border border-corporate-200 rounded">
              <div>
                <span className="text-[11px] text-corporate-500 uppercase font-semibold block">Status</span>
                <div className="mt-1"><StatusBadge status={selectedVendor.status} /></div>
              </div>
              <div>
                <span className="text-[11px] text-corporate-500 uppercase font-semibold block">PAN</span>
                <span className="font-mono font-medium text-corporate-900 mt-1 block">{selectedVendor.pan}</span>
              </div>
              <div>
                <span className="text-[11px] text-corporate-500 uppercase font-semibold block">GSTN</span>
                <span className="font-mono font-medium text-corporate-900 mt-1 block">{selectedVendor.gstn}</span>
              </div>
              <div>
                <span className="text-[11px] text-corporate-500 uppercase font-semibold block">Firm Type</span>
                <span className="font-medium text-corporate-900 mt-1 block">{selectedVendor.typeOfFirm}</span>
              </div>
              <div>
                <span className="text-[11px] text-corporate-500 uppercase font-semibold block">Bank Account</span>
                <span className="font-mono text-corporate-900 mt-1 block">{selectedVendor.bankAccountNumber}</span>
              </div>
              <div>
                <span className="text-[11px] text-corporate-500 uppercase font-semibold block">IFSC</span>
                <span className="font-mono text-corporate-900 mt-1 block">{selectedVendor.ifscCode}</span>
              </div>
              <div>
                <span className="text-[11px] text-corporate-500 uppercase font-semibold block">Email</span>
                <span className="text-corporate-900 mt-1 block truncate">{selectedVendor.email}</span>
              </div>
              <div>
                <span className="text-[11px] text-corporate-500 uppercase font-semibold block">Mobile</span>
                <span className="font-mono text-corporate-900 mt-1 block">{selectedVendor.mobile}</span>
              </div>
            </div>

            {/* Status Governance Actions */}
            <div className="flex items-center justify-between p-3 bg-corporate-100/60 border border-corporate-200 rounded">
              <span className="text-xs font-semibold text-corporate-700 flex items-center">
                <ShieldAlert className="w-4 h-4 mr-1.5 text-corporate-500" />
                Administrative Status Control:
              </span>
              <div className="flex gap-2">
                {selectedVendor.status !== 'ACTIVE' && (
                  <button
                    onClick={() => handleStatusChange(selectedVendor.id, 'ACTIVE')}
                    className="btn-success text-[11px] py-1 px-2.5"
                  >
                    Set Active
                  </button>
                )}
                {selectedVendor.status !== 'SUSPENDED' && (
                  <button
                    onClick={() => handleStatusChange(selectedVendor.id, 'SUSPENDED')}
                    className="btn-secondary text-[11px] py-1 px-2.5 text-amber-700 border-amber-300"
                  >
                    Suspend
                  </button>
                )}
                {selectedVendor.status !== 'BLACKLISTED' && (
                  <button
                    onClick={() => handleStatusChange(selectedVendor.id, 'BLACKLISTED')}
                    className="btn-danger text-[11px] py-1 px-2.5"
                  >
                    Blacklist
                  </button>
                )}
              </div>
            </div>

            {/* Assigned PO/LOA Contracts */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-corporate-800 mb-2">
                Awarded PO / LOA Contracts ({selectedVendor.contracts?.length || 0})
              </h3>
              <div className="border border-corporate-200 rounded overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-corporate-100 text-[11px] text-corporate-600 font-semibold uppercase">
                    <tr>
                      <th className="px-3 py-2">PO Number</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Plant</th>
                      <th className="px-3 py-2 font-mono text-right">Value (Tax Incl.)</th>
                      <th className="px-3 py-2">Appointed EIC</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-corporate-100">
                    {selectedVendor.contracts?.map((c) => (
                      <tr key={c.id} className="hover:bg-corporate-50">
                        <td className="px-3 py-2 font-mono font-medium text-corporate-900">{c.poNumber}</td>
                        <td className="px-3 py-2">{c.contractType}</td>
                        <td className="px-3 py-2 font-mono">{c.plantCode}</td>
                        <td className="px-3 py-2 font-mono text-right">
                          ₹{c.poValueWithTax?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-2">{c.eic?.name}</td>
                        <td className="px-3 py-2"><StatusBadge status={c.contractStatus} size="sm" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Evaluation Scorecards */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-corporate-800 mb-2">
                Performance Scorecards ({selectedVendor.evaluations?.length || 0})
              </h3>
              <div className="border border-corporate-200 rounded overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-corporate-100 text-[11px] text-corporate-600 font-semibold uppercase">
                    <tr>
                      <th className="px-3 py-2">Eval #</th>
                      <th className="px-3 py-2">Contract</th>
                      <th className="px-3 py-2 font-mono text-right">Percentage</th>
                      <th className="px-3 py-2">Rating Grade</th>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-corporate-100">
                    {selectedVendor.evaluations?.map((e) => (
                      <tr key={e.id} className="hover:bg-corporate-50">
                        <td className="px-3 py-2 font-mono font-medium text-corporate-900">{e.evaluationNumber}</td>
                        <td className="px-3 py-2 font-mono text-corporate-700">{e.contract?.poNumber}</td>
                        <td className="px-3 py-2 font-mono text-right font-bold text-corporate-900">{e.percentage}%</td>
                        <td className="px-3 py-2"><StatusBadge status={e.ratingGrade} size="sm" /></td>
                        <td className="px-3 py-2 text-corporate-500">{new Date(e.evaluationDate).toLocaleDateString()}</td>
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
