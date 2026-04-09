'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardData {
  total: number;
  byCategory: { _id: string; count: number }[];
  byStatus: { _id: string; count: number }[];
  byBranch: { _id: string; count: number }[];
  byCondition: { _id: string; count: number }[];
  inRepair: number;
  missing: number;
}

const CHART_COLORS = ['#334137', '#c9e268', '#4a5e52', '#a8c44a', '#6b7f6e', '#8aac40', '#9db09f', '#c8d5c9'];

export default function ReportsPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Export filters
  const [filterBranch, setFilterBranch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Derived lists for filter dropdowns
  const branches  = data?.byBranch.map((b) => b._id) ?? [];
  const categories = data?.byCategory.map((b) => b._id) ?? [];
  const statuses  = data?.byStatus.map((b) => b._id) ?? [];

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (filterBranch)   params.set('branch',     filterBranch);
      if (filterDept)     params.set('department', filterDept);
      if (filterStatus)   params.set('status',     filterStatus);
      if (filterCategory) params.set('category',   filterCategory);

      const res = await fetch(`/api/reports/export?${params.toString()}`);
      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `asset-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to generate report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
    </div>
  );

  if (!data) return <div>Failed to load data</div>;

  const Section = ({ title, data }: { title: string; data: { _id: string; count: number }[] }) => (
    <div className="card p-5">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">{title}</h2>
      <div className="space-y-2">
        {data.map((item, i) => {
          const pct = data[0]?.count ? (item.count / data[0].count) * 100 : 0;
          return (
            <div key={item._id} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-28 truncate">{item._id}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.max(4, pct)}%`, background: CHART_COLORS[i % CHART_COLORS.length] }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-700 w-6 text-right">{item.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div>
      {/* Page header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-primary-dark)' }}>Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Asset analytics overview</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="btn-outline flex items-center gap-2"
            title="Set export filters"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Filters
            {(filterBranch || filterDept || filterStatus || filterCategory) && (
              <span className="inline-flex items-center justify-center w-4 h-4 text-xs rounded-full text-white"
                style={{ background: 'var(--color-primary)' }}>
                {[filterBranch, filterDept, filterStatus, filterCategory].filter(Boolean).length}
              </span>
            )}
          </button>

          {/* Excel export button */}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="btn-primary flex items-center gap-2"
            style={{ opacity: exporting ? 0.7 : 1 }}
          >
            {exporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.836 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9.164L14.836 2zM13 3.5L18.5 9H14a1 1 0 01-1-1V3.5zM9.5 11.5h5a.5.5 0 010 1h-5a.5.5 0 010-1zm0 3h5a.5.5 0 010 1h-5a.5.5 0 010-1zm0 3h3a.5.5 0 010 1h-3a.5.5 0 010-1z" />
                </svg>
                Export to Excel
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="card p-4 mb-5 border-l-4" style={{ borderLeftColor: 'var(--color-primary)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">Export Filters <span className="text-xs font-normal text-gray-400">(leave blank to export all)</span></p>
            {(filterBranch || filterDept || filterStatus || filterCategory) && (
              <button
                className="text-xs text-red-500 hover:underline"
                onClick={() => { setFilterBranch(''); setFilterDept(''); setFilterStatus(''); setFilterCategory(''); }}
              >
                Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Branch</label>
              <select
                className="input-field text-sm py-1.5"
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
              >
                <option value="">All branches</option>
                {branches.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Department</label>
              <input
                className="input-field text-sm py-1.5"
                placeholder="e.g. IT"
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <select
                className="input-field text-sm py-1.5"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All statuses</option>
                {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Category</label>
              <select
                className="input-field text-sm py-1.5"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">All categories</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Assets',  value: data.total,            color: 'var(--color-primary)' },
          { label: 'Categories',    value: data.byCategory.length, color: '#4a5e52' },
          { label: 'In Repair',     value: data.inRepair,         color: '#f59e0b' },
          { label: 'Missing',       value: data.missing,          color: '#ef4444' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="card p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Asset Distribution by Branch</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data.byBranch} margin={{ left: -15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2ee" />
            <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.byBranch.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Section title="By Category" data={data.byCategory} />
        <Section title="By Status"   data={data.byStatus} />
        <Section title="By Condition" data={data.byCondition} />
      </div>

      {/* Export hint */}
      <div className="mt-6 p-4 rounded-xl border border-dashed text-center" style={{ borderColor: 'var(--color-primary)', background: '#f4f9ee' }}>
        <p className="text-sm text-gray-600">
          <span className="font-semibold" style={{ color: 'var(--color-primary-dark)' }}>📥 Excel Report</span> includes 4 sheets:
          <em> Summary, Asset Details (with QR codes), Transfer History, Maintenance Records.</em>
        </p>
      </div>
    </div>
  );
}
