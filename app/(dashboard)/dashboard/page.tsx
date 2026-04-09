'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

interface DashboardData {
  total: number;
  byCategory: { _id: string; count: number }[];
  byStatus: { _id: string; count: number }[];
  byBranch: { _id: string; count: number }[];
  byCondition: { _id: string; count: number }[];
  recentAssets: {
    assetCode: string;
    item_name: string;
    category: string;
    asset_status: string;
    branch: string;
    createdAt: string;
  }[];
  inRepair: number;
  missing: number;
  userRole?: string;
}

const STATUS_COLORS: Record<string, string> = {
  Active: '#22c55e',
  'In Storage': '#94a3b8',
  'In Repair': '#f59e0b',
  Transferred: '#3b82f6',
  Missing: '#ef4444',
  Disposed: '#8b5cf6',
};

const STATUS_BADGE: Record<string, string> = {
  Active: 'badge badge-active',
  'In Storage': 'badge badge-storage',
  'In Repair': 'badge badge-repair',
  Transferred: 'badge badge-transferred',
  Missing: 'badge badge-missing',
  Disposed: 'badge badge-disposed',
};

const CHART_COLORS = ['#334137', '#c9e268', '#4a5e52', '#a8c44a', '#6b7f6e', '#8aac40', '#9db09f'];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
          <p className="text-sm text-gray-500">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (!data) return <div className="text-red-500">Failed to load dashboard data.</div>;

  const statusData = data.byStatus.map((s) => ({
    name: s._id,
    value: s.count,
    color: STATUS_COLORS[s._id] || '#94a3b8',
  }));

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-primary-dark)' }}>Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Asset overview and key metrics</p>
        </div>
        {data.userRole && !['auditor', 'viewer'].includes(data.userRole) && (
          <Link href="/assets/new" className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Asset
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Assets</p>
              <p className="text-3xl font-bold mt-1" style={{ color: 'var(--color-primary)' }}>{data.total}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(51,65,55,0.08)' }}>
              <svg className="w-6 h-6" style={{ color: 'var(--color-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active</p>
              <p className="text-3xl font-bold mt-1 text-green-600">
                {data.byStatus.find((s) => s._id === 'Active')?.count ?? 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-50">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">In Repair</p>
              <p className="text-3xl font-bold mt-1 text-amber-600">{data.inRepair}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-50">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Missing</p>
              <p className="text-3xl font-bold mt-1 text-red-600">{data.missing}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-50">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Assets by Category</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.byCategory.slice(0, 8)} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2ee" />
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#334137" radius={[4, 4, 0, 0]}>
                {data.byCategory.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Assets by Status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
                fontSize={11}
              >
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Assets */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">Recent Assets</h2>
          <Link href="/assets" className="text-xs font-medium hover:underline" style={{ color: 'var(--color-primary)' }}>
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                <th className="text-left pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Code</th>
                <th className="text-left pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="text-left pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Category</th>
                <th className="text-left pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Branch</th>
              </tr>
            </thead>
            <tbody>
              {data.recentAssets.map((asset) => (
                <tr key={asset.assetCode} className="table-row-hover border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="py-3 pr-4">
                    <Link href={`/assets/${asset.assetCode}`} className="font-mono text-xs font-medium hover:underline" style={{ color: 'var(--color-primary)' }}>
                      {asset.assetCode}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 font-medium text-gray-700">{asset.item_name}</td>
                  <td className="py-3 pr-4 text-gray-500 hidden sm:table-cell">{asset.category}</td>
                  <td className="py-3 pr-4">
                    <span className={STATUS_BADGE[asset.asset_status] || 'badge badge-storage'}>
                      {asset.asset_status}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500 hidden md:table-cell">{asset.branch}</td>
                </tr>
              ))}
              {data.recentAssets.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-gray-400 text-sm">No assets yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
