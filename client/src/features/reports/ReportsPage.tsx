import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { FileDown, Printer, Search, FileSpreadsheet, Building2, Award } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [activeReport, setActiveReport] = useState<'vendors' | 'contracts' | 'performance'>('vendors');
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      let res: any;
      if (activeReport === 'vendors') {
        res = await api.getVendorReport();
      } else if (activeReport === 'contracts') {
        res = await api.getContractReport();
      } else {
        res = await api.getPerformanceReport();
      }
      if (res.success) {
        setData(res.data || []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeReport]);

  const filteredData = data.filter((item) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return Object.values(item).some(val => String(val).toLowerCase().includes(term));
  });

  const exportToCSV = () => {
    if (filteredData.length === 0) return;
    const headers = Object.keys(filteredData[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const row of filteredData) {
      const values = headers.map(header => {
        const val = row[header] !== undefined && row[header] !== null ? String(row[header]) : '';
        const escaped = val.replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeReport}_master_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-corporate-200">
        <div>
          <h1 className="text-lg font-bold text-corporate-900 tracking-tight">Organization Reports & Analytics</h1>
          <p className="text-xs text-corporate-500 mt-0.5">
            Audit-compliant reporting modules with deterministic CSV generation and printable master registries.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={exportToCSV}
            disabled={filteredData.length === 0}
            className="btn-primary text-xs"
          >
            <FileDown className="w-4 h-4 mr-1.5" /> Export CSV / Excel
          </button>
          <button
            onClick={handlePrint}
            className="btn-secondary text-xs"
          >
            <Printer className="w-4 h-4 mr-1.5 text-corporate-500" /> Print Report
          </button>
        </div>
      </div>

      {/* Report Selector Tabs */}
      <div className="flex border-b border-corporate-200 space-x-4 text-xs font-semibold">
        <button
          onClick={() => { setActiveReport('vendors'); setSearch(''); }}
          className={`pb-2.5 px-1 border-b-2 flex items-center transition-colors ${
            activeReport === 'vendors'
              ? 'border-corporate-900 text-corporate-900 font-bold'
              : 'border-transparent text-corporate-500 hover:text-corporate-800'
          }`}
        >
          <Building2 className="w-4 h-4 mr-1.5" />
          Vendor Master Report
        </button>
        <button
          onClick={() => { setActiveReport('contracts'); setSearch(''); }}
          className={`pb-2.5 px-1 border-b-2 flex items-center transition-colors ${
            activeReport === 'contracts'
              ? 'border-corporate-900 text-corporate-900 font-bold'
              : 'border-transparent text-corporate-500 hover:text-corporate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 mr-1.5" />
          PO / LOA Contracts Report
        </button>
        <button
          onClick={() => { setActiveReport('performance'); setSearch(''); }}
          className={`pb-2.5 px-1 border-b-2 flex items-center transition-colors ${
            activeReport === 'performance'
              ? 'border-corporate-900 text-corporate-900 font-bold'
              : 'border-transparent text-corporate-500 hover:text-corporate-800'
          }`}
        >
          <Award className="w-4 h-4 mr-1.5" />
          Vendor Performance Scorecard Report
        </button>
      </div>

      {/* Search Filter */}
      <div className="bg-white border border-corporate-200 rounded p-3 shadow-sm">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Filter ${activeReport} records...`}
            className="input-field pl-9 text-xs"
          />
          <Search className="w-4 h-4 text-corporate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Table Render */}
      <div className="bg-white border border-corporate-200 rounded shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-12 text-center text-xs font-mono text-corporate-500">
              Generating report dataset...
            </div>
          ) : filteredData.length === 0 ? (
            <div className="py-12 text-center text-xs text-corporate-400">
              No matching report records found.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-corporate-100/70 border-b border-corporate-200 text-[11px] font-semibold text-corporate-600 uppercase tracking-wider">
                  {Object.keys(filteredData[0]).map(h => (
                    <th key={h} className="px-4 py-3">{h.replace(/([A-Z])/g, ' $1').toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-corporate-100 text-xs">
                {filteredData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-corporate-50/70">
                    {Object.entries(row).map(([k, val]: any, cellIdx) => (
                      <td key={cellIdx} className="px-4 py-2.5 text-corporate-800">
                        {k === 'status' || k === 'grade' ? (
                          <StatusBadge status={String(val)} size="sm" />
                        ) : typeof val === 'number' && (k.toLowerCase().includes('val') || k.toLowerCase().includes('tax')) ? (
                          <span className="font-mono">₹{val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        ) : typeof val === 'number' && (k.toLowerCase().includes('score') || k.toLowerCase().includes('percentage')) ? (
                          <span className="font-mono font-bold">{val}%</span>
                        ) : (
                          <span className={k.toLowerCase().includes('code') || k.toLowerCase().includes('number') || k.toLowerCase().includes('id') || k.toLowerCase().includes('pan') || k.toLowerCase().includes('gstn') ? 'font-mono' : ''}>
                            {String(val)}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="px-4 py-3 bg-corporate-50 border-t border-corporate-200 text-xs text-corporate-600 font-mono">
          Report Generated: {filteredData.length} records • Confidential Internal Audit Use
        </div>
      </div>
    </div>
  );
};
