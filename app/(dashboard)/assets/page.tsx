'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Asset {
  _id: string;
  assetCode: string;
  item_name: string;
  category: string;
  brand?: string;
  branch: string;
  department: string;
  location: string;
  custodian?: string;
  condition_status: string;
  asset_status: string;
  cost_value?: number;
  createdAt: string;
}

const STATUS_BADGE: Record<string, string> = {
  Active: 'badge badge-active',
  'In Storage': 'badge badge-storage',
  'In Repair': 'badge badge-repair',
  Transferred: 'badge badge-transferred',
  Missing: 'badge badge-missing',
  Disposed: 'badge badge-disposed',
};

const CATEGORIES = ['Computer', 'Printer', 'Furniture', 'Vehicle', 'Equipment', 'Electronics', 'Other'];
const STATUSES = ['Active', 'In Storage', 'In Repair', 'Transferred', 'Missing', 'Disposed'];

export default function AssetsPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: '20',
      ...(search && { search }),
      ...(category && { category }),
      ...(status && { status }),
    });
    const res = await fetch(`/api/assets?${params}`);
    const data = await res.json();
    setAssets(data.assets || []);
    setTotal(data.pagination?.total || 0);
    setLoading(false);
  }, [page, search, category, status]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this asset?')) return;
    await fetch(`/api/assets/${id}`, { method: 'DELETE' });
    fetchAssets();
  };

  const handlePrintSelected = () => {
    if (selected.length === 0) return;
    router.push(`/qr?ids=${selected.join(',')}`);
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="page-header flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-primary-dark)' }}>Assets</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total assets</p>
        </div>
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <button onClick={handlePrintSelected} className="btn-outline">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print QR ({selected.length})
            </button>
          )}
          <Link href="/assets/new" className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Asset
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by code, name or serial…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input-field pl-9"
            id="search-assets"
          />
        </div>
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="input-field sm:w-44"
          id="filter-category"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="input-field sm:w-40"
          id="filter-status"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ background: 'var(--color-surface)' }}>
              <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={selected.length === assets.length && assets.length > 0}
                    onChange={(e) => setSelected(e.target.checked ? assets.map((a) => a._id) : [])}
                  />
                </th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Code</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Category</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Branch</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Department</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="p-4 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="p-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: j === 0 ? '20px' : '80%' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : assets.length === 0 ? (
                <tr><td colSpan={8} className="py-16 text-center text-gray-400">No assets found</td></tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset._id} className="table-row-hover border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="p-4">
                      <input type="checkbox" className="rounded" checked={selected.includes(asset._id)} onChange={() => toggleSelect(asset._id)} />
                    </td>
                    <td className="p-4">
                      <Link href={`/assets/${asset.assetCode}`} className="font-mono text-xs font-medium hover:underline" style={{ color: 'var(--color-primary)' }}>
                        {asset.assetCode}
                      </Link>
                    </td>
                    <td className="p-4 font-medium text-gray-800">{asset.item_name}</td>
                    <td className="p-4 text-gray-500 hidden md:table-cell">{asset.category}</td>
                    <td className="p-4 text-gray-500 hidden lg:table-cell">{asset.branch}</td>
                    <td className="p-4 text-gray-500 hidden lg:table-cell">{asset.department}</td>
                    <td className="p-4">
                      <span className={STATUS_BADGE[asset.asset_status] || 'badge badge-storage'}>{asset.asset_status}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Link href={`/assets/${asset.assetCode}/edit`} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600" title="Edit">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </Link>
                        <button onClick={() => handleDelete(asset._id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500" title="Delete">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs rounded border disabled:opacity-40"
                style={{ borderColor: 'var(--color-border)' }}
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs rounded border disabled:opacity-40"
                style={{ borderColor: 'var(--color-border)' }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
