'use client';

import { useState, useEffect, useCallback } from 'react';

interface AuditLog {
  _id: string;
  action: string;
  entity: string;
  entityCode?: string;
  performedByName: string;
  performedByRole: string;
  createdAt: string;
  changes?: Record<string, unknown>;
}

const ACTION_BADGE: Record<string, string> = {
  CREATE: 'bg-green-50 text-green-700',
  UPDATE: 'bg-blue-50 text-blue-700',
  DELETE: 'bg-red-50 text-red-700',
  TRANSFER: 'bg-purple-50 text-purple-700',
  QR_PRINT: 'bg-amber-50 text-amber-700',
  MAINTENANCE: 'bg-cyan-50 text-cyan-700',
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [entity, setEntity] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '30', ...(entity && { entity }) });
    const res = await fetch(`/api/audit?${params}`);
    const d = await res.json();
    setLogs(d.logs || []);
    setTotal(d.pagination?.total || 0);
    setLoading(false);
  }, [page, entity]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const fmt = (d: string) => new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-primary-dark)' }}>Audit Logs</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total events</p>
        </div>
        <select
          value={entity}
          onChange={(e) => { setEntity(e.target.value); setPage(1); }}
          className="input-field w-40"
        >
          <option value="">All Entities</option>
          <option value="Asset">Asset</option>
          <option value="QRBatch">QR Batch</option>
          <option value="User">User</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ background: 'var(--color-surface)' }}>
              <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Entity</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Code/ID</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Performed By</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Changes</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                    {Array.from({ length: 6 }).map((_, j) => <td key={j} className="p-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-gray-400">No audit logs found</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="table-row-hover border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="p-4">
                      <span className={`badge ${ACTION_BADGE[log.action] || 'bg-gray-100 text-gray-600'}`}>{log.action}</span>
                    </td>
                    <td className="p-4 text-gray-600">{log.entity}</td>
                    <td className="p-4 font-mono text-xs text-gray-500 hidden md:table-cell">{log.entityCode || '-'}</td>
                    <td className="p-4">
                      <p className="font-medium text-gray-700 text-xs">{log.performedByName}</p>
                      <p className="text-xs text-gray-400">{log.performedByRole}</p>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      {log.changes ? (
                        <details className="text-xs text-gray-500 cursor-pointer">
                          <summary>View changes</summary>
                          <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-auto max-h-24">{JSON.stringify(log.changes, null, 2)}</pre>
                        </details>
                      ) : '-'}
                    </td>
                    <td className="p-4 text-gray-500 text-xs whitespace-nowrap">{fmt(log.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {Math.ceil(total / 30) > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-xs text-gray-500">Page {page} of {Math.ceil(total / 30)}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-xs rounded border disabled:opacity-40" style={{ borderColor: 'var(--color-border)' }}>Prev</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page * 30 >= total} className="px-3 py-1.5 text-xs rounded border disabled:opacity-40" style={{ borderColor: 'var(--color-border)' }}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
