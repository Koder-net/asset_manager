'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Asset {
  _id: string;
  assetCode: string;
  qrCodeData: string;
  item_name: string;
  category: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  source?: string;
  supplier_name?: string;
  invoice_number?: string;
  purchased_date?: string;
  received_date?: string;
  delivered_by?: string;
  brought_by?: string;
  branch: string;
  department: string;
  location: string;
  custodian?: string;
  condition_status: string;
  asset_status: string;
  warranty_end_date?: string;
  cost_value?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_BADGE: Record<string, string> = {
  Active: 'badge badge-active',
  'In Storage': 'badge badge-storage',
  'In Repair': 'badge badge-repair',
  Transferred: 'badge badge-transferred',
  Missing: 'badge badge-missing',
  Disposed: 'badge badge-disposed',
};

function InfoRow({ label, value }: { label: string; value?: string | number }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center py-2.5 border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
      <span className="text-xs font-medium text-gray-500 sm:w-36 mb-0.5 sm:mb-0">{label}</span>
      <span className="text-sm text-gray-800">{String(value)}</span>
    </div>
  );
}

export default function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transfer, setTransfer] = useState({ transferType: 'branch', toValue: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/assets/${id}`)
      .then((r) => r.json())
      .then((d) => { setAsset(d.asset); setLoading(false); });
  }, [id]);

  const handlePrintQR = () => {
    if (!asset) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>QR - ${asset.assetCode}</title>
      <style>
        body { font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
        .qr-card { border: 2px solid #334137; padding: 20px; border-radius: 12px; text-align: center; max-width: 280px; }
        img { width: 200px; height: 200px; }
        .code { font-family: monospace; font-size: 14px; font-weight: bold; color: #334137; margin-top: 8px; }
        .name { font-size: 12px; color: #555; margin-top: 4px; }
        .footer { font-size: 10px; color: #aaa; margin-top: 8px; }
      </style></head>
      <body>
        <div class="qr-card">
          <img src="${asset.qrCodeData}" alt="QR Code" />
          <div class="code">${asset.assetCode}</div>
          <div class="name">${asset.item_name}</div>
          <div class="footer">Powered by Kodernet</div>
        </div>
        <script>window.onload = () => { window.print(); }</script>
      </body></html>
    `);
    win.document.close();
  };

  const handleTransfer = async () => {
    if (!asset || !transfer.toValue) return;
    setSubmitting(true);
    const res = await fetch('/api/transfers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assetId: asset._id, ...transfer }),
    });
    if (res.ok) {
      setShowTransfer(false);
      const d = await fetch(`/api/assets/${id}`).then((r) => r.json());
      setAsset(d.asset);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!asset) {
    return <div className="text-center py-16 text-gray-400">Asset not found</div>;
  }

  const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : undefined;

  return (
    <div>
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold" style={{ color: 'var(--color-primary-dark)' }}>{asset.item_name}</h1>
              <span className={STATUS_BADGE[asset.asset_status] || 'badge badge-storage'}>{asset.asset_status}</span>
            </div>
            <p className="text-sm font-mono text-gray-500">{asset.assetCode}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowTransfer(true)} className="btn-outline">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Transfer
          </button>
          <button onClick={handlePrintQR} className="btn-outline">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print QR
          </button>
          <Link href={`/assets/${asset.assetCode}/edit`} className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: QR preview */}
        <div className="lg:col-span-1">
          <div className="card p-6 text-center">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">QR Code</p>
            {asset.qrCodeData && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={asset.qrCodeData} alt="QR Code" className="w-48 h-48 mx-auto rounded-lg" />
            )}
            <p className="font-mono text-sm font-semibold mt-3" style={{ color: 'var(--color-primary)' }}>{asset.assetCode}</p>
            <p className="text-xs text-gray-400 mt-1">{asset.category}</p>
            <button onClick={handlePrintQR} className="btn-accent w-full mt-4 justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print QR
            </button>
          </div>

          <div className="card p-5 mt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Timeline</p>
            <InfoRow label="Created" value={fmt(asset.createdAt)} />
            <InfoRow label="Last Updated" value={fmt(asset.updatedAt)} />
            <InfoRow label="Purchase Date" value={fmt(asset.purchased_date)} />
            <InfoRow label="Received" value={fmt(asset.received_date)} />
            <InfoRow label="Warranty Ends" value={fmt(asset.warranty_end_date)} />
          </div>
        </div>

        {/* Right: details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Basic Information</p>
            <InfoRow label="Item Name" value={asset.item_name} />
            <InfoRow label="Category" value={asset.category} />
            <InfoRow label="Brand" value={asset.brand} />
            <InfoRow label="Model" value={asset.model} />
            <InfoRow label="Serial Number" value={asset.serial_number} />
            <InfoRow label="Cost Value" value={asset.cost_value ? `LKR ${asset.cost_value.toLocaleString()}` : undefined} />
            <InfoRow label="Condition" value={asset.condition_status} />
          </div>

          <div className="card p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Location & Assignment</p>
            <InfoRow label="Branch" value={asset.branch} />
            <InfoRow label="Department" value={asset.department} />
            <InfoRow label="Location" value={asset.location} />
            <InfoRow label="Custodian" value={asset.custodian} />
          </div>

          <div className="card p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Acquisition</p>
            <InfoRow label="Source" value={asset.source} />
            <InfoRow label="Supplier" value={asset.supplier_name} />
            <InfoRow label="Invoice #" value={asset.invoice_number} />
            <InfoRow label="Delivered By" value={asset.delivered_by} />
            <InfoRow label="Brought By" value={asset.brought_by} />
          </div>

          {asset.notes && (
            <div className="card p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Notes</p>
              <p className="text-sm text-gray-700">{asset.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransfer && (
        <div className="modal-overlay" onClick={() => setShowTransfer(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-primary-dark)' }}>Transfer Asset</h2>
              <button onClick={() => setShowTransfer(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Transfer Type</label>
                <select
                  value={transfer.transferType}
                  onChange={(e) => setTransfer((p) => ({ ...p, transferType: e.target.value }))}
                  className="input-field"
                >
                  <option value="branch">Branch</option>
                  <option value="department">Department</option>
                  <option value="location">Location</option>
                  <option value="custodian">Custodian</option>
                </select>
              </div>
              <div>
                <label className="label">Transfer To <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={transfer.toValue}
                  onChange={(e) => setTransfer((p) => ({ ...p, toValue: e.target.value }))}
                  className="input-field"
                  placeholder="New value"
                />
              </div>
              <div>
                <label className="label">Reason</label>
                <input
                  type="text"
                  value={transfer.reason}
                  onChange={(e) => setTransfer((p) => ({ ...p, reason: e.target.value }))}
                  className="input-field"
                  placeholder="Reason for transfer"
                />
              </div>
              <button
                onClick={handleTransfer}
                disabled={submitting || !transfer.toValue}
                className="btn-primary w-full justify-center py-2.5"
              >
                {submitting ? 'Transferring…' : 'Confirm Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
