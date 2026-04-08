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

  useEffect(() => {
    fetch('/api/dashboard').then((r) => r.json()).then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
    </div>
  );

  if (!data) return <div>Failed to load data</div>;

  const Section = ({ title, data, color }: { title: string; data: { _id: string; count: number }[]; color?: string }) => (
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
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-primary-dark)' }}>Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Asset analytics overview</p>
        </div>
        <button
          onClick={() => window.print()}
          className="btn-outline"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Report
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Assets', value: data.total, color: 'var(--color-primary)' },
          { label: 'Categories', value: data.byCategory.length, color: '#4a5e52' },
          { label: 'In Repair', value: data.inRepair, color: '#f59e0b' },
          { label: 'Missing', value: data.missing, color: '#ef4444' },
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
        <Section title="By Status" data={data.byStatus} />
        <Section title="By Condition" data={data.byCondition} />
      </div>
    </div>
  );
}
