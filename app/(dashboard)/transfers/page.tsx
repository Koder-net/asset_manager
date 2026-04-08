'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Transfer {
  _id: string;
  asset: { _id: string; assetCode: string; item_name: string };
  transferType: string;
  fromValue: string;
  toValue: string;
  transferDate: string;
  reason?: string;
  createdAt: string;
}

interface AssetOption {
  _id: string;
  assetCode: string;
  item_name: string;
  branch: string;
  department: string;
  location: string;
  custodian?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TRANSFER_TYPES = ['branch', 'department', 'location', 'custodian'] as const;

const BRANCHES = [
  'Head Office', 'Branch A', 'Branch B', 'Branch C', 'Regional Office',
];
const DEPARTMENTS = [
  'Administration', 'Finance', 'IT', 'HR', 'Operations', 'Legal', 'Procurement', 'Audit',
];

const TYPE_COLORS: Record<string, string> = {
  branch:     'bg-blue-50   text-blue-700',
  department: 'bg-purple-50 text-purple-700',
  location:   'bg-amber-50  text-amber-700',
  custodian:  'bg-green-50  text-green-700',
};

// ─── New-Transfer Modal ───────────────────────────────────────────────────────

function NewTransferModal({
  assets,
  preselectedAssetId,
  onClose,
  onSuccess,
}: {
  assets: AssetOption[];
  preselectedAssetId?: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const preselected = assets.find((a) => a._id === preselectedAssetId) ?? null;

  const [query, setQuery]               = useState('');
  const [selected, setSelected]         = useState<AssetOption | null>(preselected);
  const [type, setType]                 = useState<string>('branch');
  const [toValues, setToValues]         = useState<Record<string, string>>({ branch: '', department: '', location: '', custodian: '' });
  const [reason, setReason]             = useState('');
  const [date, setDate]                 = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState('');

  const filtered = assets.filter(
    (a) =>
      a.assetCode.toLowerCase().includes(query.toLowerCase()) ||
      a.item_name.toLowerCase().includes(query.toLowerCase()),
  );

  /** Current value of the selected field on the chosen asset */
  const fromValue: string = selected
    ? ({ branch: selected.branch, department: selected.department, location: selected.location, custodian: selected.custodian ?? '' } as Record<string, string>)[type] ?? ''
    : '';

  const handleSubmit = async () => {
    const toValue = toValues[type] ?? '';
    if (!selected)       { setError('Please select an asset'); return; }
    if (!toValue.trim()) { setError('Please fill in the destination'); return; }
    setSaving(true);
    setError('');
    const res = await fetch('/api/transfers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assetId: selected._id,
        transferType: type,
        toValue: toValue.trim(),
        reason: reason.trim(),
        transferDate: date,
      }),
    });
    if (res.ok) { onSuccess(); onClose(); }
    else {
      const d = await res.json();
      setError(d.error ?? 'Failed to record transfer');
    }
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-primary-dark)' }}>
              New Transfer
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Record an asset movement</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* ── Step 1: pick asset ── */}
          <div>
            <label className="label">
              Asset <span className="text-red-500">*</span>
            </label>

            {selected ? (
              /* Selected asset chip */
              <div
                className="flex items-center justify-between p-3 rounded-lg border"
                style={{ borderColor: 'var(--color-primary)', background: 'rgba(51,65,55,0.04)' }}
              >
                <div>
                  <p className="font-mono text-xs font-bold" style={{ color: 'var(--color-primary)' }}>
                    {selected.assetCode}
                  </p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{selected.item_name}</p>
                  <p className="text-xs text-gray-400">{selected.branch} · {selected.department}</p>
                </div>
                <button
                  onClick={() => { setSelected(null); setQuery(''); setToValues({ branch: '', department: '', location: '', custodian: '' }); }}
                  className="text-xs text-gray-400 hover:text-red-500 underline ml-4 flex-shrink-0"
                >
                  Change
                </button>
              </div>
            ) : (
              /* Asset search list */
              <>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by asset code or name…"
                  className="input-field mb-2"
                  autoFocus
                />
                <div
                  className="border rounded-lg divide-y overflow-y-auto max-h-48"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  {filtered.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-8">No assets found</p>
                  ) : filtered.slice(0, 40).map((a) => (
                    <button
                      key={a._id}
                      onClick={() => { setSelected(a); }}
                      className="w-full text-left flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <div className="min-w-0">
                        <span className="font-mono text-xs font-medium" style={{ color: 'var(--color-primary)' }}>
                          {a.assetCode}
                        </span>
                        <span className="text-sm text-gray-700 ml-2 truncate">{a.item_name}</span>
                      </div>
                      <span className="text-xs text-gray-400 ml-3 flex-shrink-0">{a.branch}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── Step 2: transfer details (shown after asset is picked) ── */}
          {selected && (
            <>
              {/* Type selector */}
              <div>
                <label className="label">
                  Transfer Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {TRANSFER_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`py-2 rounded-lg text-xs font-semibold capitalize border transition-all ${
                        type === t
                          ? 'border-transparent text-white shadow-sm'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                      style={type === t ? { background: 'var(--color-primary)' } : {}}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* From → To */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">From (current)</label>
                  <input
                    type="text"
                    value={fromValue || '—'}
                    readOnly
                    className="input-field bg-gray-50 text-gray-400 cursor-default"
                  />
                </div>
                <div>
                  <label className="label">To (new) <span className="text-red-500">*</span></label>
                  {type === 'branch' ? (
                    <select
                      value={toValues.branch}
                      onChange={(e) => setToValues((prev) => ({ ...prev, branch: e.target.value }))}
                      className="input-field"
                    >
                      <option value="">Select branch…</option>
                      {BRANCHES.filter((b) => b !== fromValue).map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  ) : type === 'department' ? (
                    <select
                      value={toValues.department}
                      onChange={(e) => setToValues((prev) => ({ ...prev, department: e.target.value }))}
                      className="input-field"
                    >
                      <option value="">Select department…</option>
                      {DEPARTMENTS.filter((d) => d !== fromValue).map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  ) : type === 'location' ? (
                    <input
                      type="text"
                      value={toValues.location}
                      onChange={(e) => setToValues((prev) => ({ ...prev, location: e.target.value }))}
                      className="input-field"
                      placeholder="New room / location"
                    />
                  ) : (
                    <input
                      type="text"
                      value={toValues.custodian}
                      onChange={(e) => setToValues((prev) => ({ ...prev, custodian: e.target.value }))}
                      className="input-field"
                      placeholder="New custodian name"
                    />
                  )}
                </div>
              </div>

              {/* Date + Reason */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Transfer Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Reason</label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="input-field"
                    placeholder="Optional"
                  />
                </div>
              </div>
            </>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={saving || !selected || !(toValues[type] ?? '').trim()}
            className="btn-primary w-full justify-center py-2.5 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Recording…
              </>
            ) : 'Record Transfer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRows({ count = 8 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={i} className="border-b" style={{ borderColor: 'var(--color-border)' }}>
          {Array.from({ length: 6 }).map((_, j) => (
            <td key={j} className="p-4">
              <div className="h-4 rounded bg-gray-100 animate-pulse" style={{ width: `${60 + (j * 13) % 37}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function TransfersContent() {
  const searchParams = useSearchParams();
  const preAssetId   = searchParams.get('assetId') ?? undefined;

  const [transfers,   setTransfers]   = useState<Transfer[]>([]);
  const [assets,      setAssets]      = useState<AssetOption[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(1);
  const [filterType,  setFilterType]  = useState('');
  const [showModal,   setShowModal]   = useState(!!preAssetId);

  const PAGE_SIZE = 25;

  const fetchTransfers = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({
      page:  String(page),
      limit: String(PAGE_SIZE),
      ...(filterType && { transferType: filterType }),
    });
    const res = await fetch(`/api/transfers?${p}`);
    const d   = await res.json();
    setTransfers(d.transfers ?? []);
    setTotal(d.pagination?.total ?? 0);
    setLoading(false);
  }, [page, filterType]);

  useEffect(() => { fetchTransfers(); }, [fetchTransfers]);

  useEffect(() => {
    fetch('/api/assets?limit=500')
      .then((r) => r.json())
      .then((d) => setAssets(d.assets ?? []));
  }, []);

  const fmt = (s: string) =>
    new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      {/* ── Page header ── */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-primary-dark)' }}>
            Transfers
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} transfer record{total !== 1 ? 's' : ''}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter by type */}
          <select
            id="filter-type"
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
            className="input-field w-36"
          >
            <option value="">All types</option>
            {TRANSFER_TYPES.map((t) => (
              <option key={t} value={t} className="capitalize">{t}</option>
            ))}
          </select>

          {/* New Transfer CTA */}
          <button
            id="new-transfer-btn"
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            New Transfer
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ background: 'var(--color-surface)' }}>
              <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                {['Asset', 'Type', 'From', 'To', 'Reason', 'Date'].map((h, i) => (
                  <th
                    key={h}
                    className={`text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide ${i >= 4 ? 'hidden md:table-cell' : ''}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <SkeletonRows />
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <svg className="w-12 h-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      <p className="text-sm">No transfers recorded yet</p>
                      <button onClick={() => setShowModal(true)} className="btn-primary text-xs">
                        Record first transfer
                      </button>
                    </div>
                  </td>
                </tr>
              ) : transfers.map((t) => (
                <tr
                  key={t._id}
                  className="table-row-hover border-b last:border-0"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <td className="p-4">
                    <Link
                      href={`/assets/${t.asset?.assetCode}`}
                      className="font-mono text-xs font-semibold hover:underline"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      {t.asset?.assetCode}
                    </Link>
                    <p className="text-xs text-gray-500 mt-0.5 max-w-[160px] truncate">
                      {t.asset?.item_name}
                    </p>
                  </td>
                  <td className="p-4">
                    <span className={`badge capitalize ${TYPE_COLORS[t.transferType] ?? 'bg-gray-100 text-gray-600'}`}>
                      {t.transferType}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500">{t.fromValue || '—'}</td>
                  <td className="p-4 font-medium text-gray-800">{t.toValue}</td>
                  <td className="p-4 text-gray-500 hidden md:table-cell">{t.reason || '—'}</td>
                  <td className="p-4 text-gray-500 text-xs whitespace-nowrap hidden md:table-cell">
                    {fmt(t.transferDate ?? t.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3 border-t"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs rounded border disabled:opacity-40"
                style={{ borderColor: 'var(--color-border)' }}
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
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

      {/* ── Modal ── */}
      {showModal && (
        <NewTransferModal
          assets={assets}
          preselectedAssetId={preAssetId}
          onClose={() => setShowModal(false)}
          onSuccess={fetchTransfers}
        />
      )}
    </div>
  );
}

export default function TransfersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
          />
        </div>
      }
    >
      <TransfersContent />
    </Suspense>
  );
}
