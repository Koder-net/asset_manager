'use client';

import { useState, useEffect, useCallback } from 'react';

interface Transfer {
  _id: string;
  asset: { assetCode: string; item_name: string };
  transferType: string;
  fromValue: string;
  toValue: string;
  transferDate: string;
  reason?: string;
  authorizedBy?: string;
  createdAt: string;
}

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchTransfers = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/transfers?page=${page}&limit=25`);
    const d = await res.json();
    setTransfers(d.transfers || []);
    setTotal(d.pagination?.total || 0);
    setLoading(false);
  }, [page]);

  useEffect(() => { fetchTransfers(); }, [fetchTransfers]);

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const TYPE_BADGE: Record<string, string> = {
    branch: 'bg-blue-50 text-blue-700',
    department: 'bg-purple-50 text-purple-700',
    location: 'bg-amber-50 text-amber-700',
    custodian: 'bg-green-50 text-green-700',
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-primary-dark)' }}>Transfers</h1>
        <p className="text-sm text-gray-500 mt-0.5">{total} transfer records</p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ background: 'var(--color-surface)' }}>
              <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Asset</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">From</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">To</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Reason</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="p-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : transfers.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-gray-400">No transfers recorded</td></tr>
              ) : (
                transfers.map((t) => (
                  <tr key={t._id} className="table-row-hover border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="p-4">
                      <p className="font-mono text-xs font-medium" style={{ color: 'var(--color-primary)' }}>{t.asset?.assetCode}</p>
                      <p className="text-xs text-gray-500">{t.asset?.item_name}</p>
                    </td>
                    <td className="p-4">
                      <span className={`badge ${TYPE_BADGE[t.transferType] || 'bg-gray-100 text-gray-600'}`}>
                        {t.transferType}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">{t.fromValue}</td>
                    <td className="p-4 font-medium text-gray-800">{t.toValue}</td>
                    <td className="p-4 text-gray-500 hidden md:table-cell">{t.reason || '-'}</td>
                    <td className="p-4 text-gray-500 text-xs">{fmt(t.transferDate || t.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {Math.ceil(total / 25) > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-xs text-gray-500">Showing {(page - 1) * 25 + 1}–{Math.min(page * 25, total)} of {total}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-xs rounded border disabled:opacity-40" style={{ borderColor: 'var(--color-border)' }}>Prev</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page * 25 >= total} className="px-3 py-1.5 text-xs rounded border disabled:opacity-40" style={{ borderColor: 'var(--color-border)' }}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
