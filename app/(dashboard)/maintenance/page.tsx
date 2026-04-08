'use client';

import { useState, useEffect, useCallback } from 'react';

interface MaintenanceRecord {
  _id: string;
  asset: { assetCode: string; item_name: string };
  maintenanceType: string;
  description: string;
  startDate: string;
  endDate?: string;
  cost?: number;
  technician?: string;
  status: string;
  createdAt: string;
}

interface AssetOption {
  _id: string;
  assetCode: string;
  item_name: string;
}

const STATUS_BADGE: Record<string, string> = {
  Scheduled: 'badge bg-blue-50 text-blue-700',
  'In Progress': 'badge bg-amber-50 text-amber-700',
  Completed: 'badge bg-green-50 text-green-700',
  Cancelled: 'badge bg-gray-100 text-gray-600',
};

const TYPE_BADGE: Record<string, string> = {
  Repair: 'bg-red-50 text-red-700',
  Preventive: 'bg-blue-50 text-blue-700',
  Inspection: 'bg-purple-50 text-purple-700',
  Upgrade: 'bg-cyan-50 text-cyan-700',
  Disposal: 'bg-gray-100 text-gray-600',
};

export default function MaintenancePage() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [assets, setAssets] = useState<AssetOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    assetId: '', maintenanceType: 'Repair', description: '', startDate: '', endDate: '',
    cost: '', technician: '', vendor: '', status: 'In Progress', notes: '',
  });

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/maintenance?page=${page}&limit=20`);
    const d = await res.json();
    setRecords(d.records || []);
    setTotal(d.pagination?.total || 0);
    setLoading(false);
  }, [page]);

  useEffect(() => {
    fetchRecords();
    fetch('/api/assets?limit=200').then((r) => r.json()).then((d) => setAssets(d.assets || []));
  }, [fetchRecords]);

  const handleSubmit = async () => {
    if (!form.assetId || !form.description || !form.startDate) return;
    setSaving(true);
    const res = await fetch('/api/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, cost: form.cost ? parseFloat(form.cost) : undefined }),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ assetId: '', maintenanceType: 'Repair', description: '', startDate: '', endDate: '', cost: '', technician: '', vendor: '', status: 'In Progress', notes: '' });
      fetchRecords();
    }
    setSaving(false);
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-primary-dark)' }}>Maintenance</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} maintenance records</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Record
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ background: 'var(--color-surface)' }}>
              <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Asset</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Description</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Technician</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                    {Array.from({ length: 6 }).map((_, j) => <td key={j} className="p-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                  </tr>
                ))
              ) : records.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-gray-400">No maintenance records</td></tr>
              ) : (
                records.map((r) => (
                  <tr key={r._id} className="table-row-hover border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="p-4">
                      <p className="font-mono text-xs font-medium" style={{ color: 'var(--color-primary)' }}>{r.asset?.assetCode}</p>
                      <p className="text-xs text-gray-500">{r.asset?.item_name}</p>
                    </td>
                    <td className="p-4">
                      <span className={`badge ${TYPE_BADGE[r.maintenanceType] || 'bg-gray-100 text-gray-600'}`}>{r.maintenanceType}</span>
                    </td>
                    <td className="p-4 text-gray-600 max-w-xs hidden md:table-cell">
                      <p className="truncate">{r.description}</p>
                    </td>
                    <td className="p-4">
                      <span className={STATUS_BADGE[r.status] || 'badge'}>{r.status}</span>
                    </td>
                    <td className="p-4 text-gray-500 hidden md:table-cell">{r.technician || '-'}</td>
                    <td className="p-4 text-gray-500 text-xs whitespace-nowrap">{fmt(r.startDate)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Record Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-primary-dark)' }}>Add Maintenance Record</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="label">Asset <span className="text-red-500">*</span></label>
                <select value={form.assetId} onChange={(e) => setForm((p) => ({ ...p, assetId: e.target.value }))} className="input-field">
                  <option value="">Select asset…</option>
                  {assets.map((a) => <option key={a._id} value={a._id}>{a.assetCode} – {a.item_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Type</label>
                  <select value={form.maintenanceType} onChange={(e) => setForm((p) => ({ ...p, maintenanceType: e.target.value }))} className="input-field">
                    {['Repair', 'Preventive', 'Inspection', 'Upgrade', 'Disposal'].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="input-field">
                    {['Scheduled', 'In Progress', 'Completed', 'Cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Description <span className="text-red-500">*</span></label>
                <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="input-field resize-none" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Start Date <span className="text-red-500">*</span></label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="label">End Date</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Technician</label>
                  <input type="text" value={form.technician} onChange={(e) => setForm((p) => ({ ...p, technician: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="label">Cost (LKR)</label>
                  <input type="number" value={form.cost} onChange={(e) => setForm((p) => ({ ...p, cost: e.target.value }))} className="input-field" min="0" />
                </div>
              </div>
              <button onClick={handleSubmit} disabled={saving} className="btn-primary w-full justify-center py-2.5">
                {saving ? 'Saving…' : 'Save Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
