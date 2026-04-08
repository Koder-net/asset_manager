'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface Asset {
  _id: string;
  assetCode: string;
  item_name: string;
  category: string;
  qrCodeData: string;
  branch: string;
  department: string;
}

function QRPage() {
  const searchParams = useSearchParams();
  const idsParam = searchParams.get('ids') || '';

  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [copies, setCopies] = useState(1);
  const [note, setNote] = useState('');
  const [batchCreated, setBatchCreated] = useState<string | null>(null);
  const [creatingBatch, setCreatingBatch] = useState(false);
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    // Load all assets for selection
    fetch('/api/assets?limit=200')
      .then((r) => r.json())
      .then((d) => {
        const a = d.assets || [];
        setAllAssets(a);
        if (idsParam) {
          const ids = idsParam.split(',');
          setSelected(ids);
          setAssets(a.filter((x: Asset) => ids.includes(x._id)));
        }
      });
  }, [idsParam]);

  const handleSelect = (asset: Asset) => {
    if (selected.includes(asset._id)) {
      setSelected((p) => p.filter((s) => s !== asset._id));
      setAssets((p) => p.filter((a) => a._id !== asset._id));
    } else {
      setSelected((p) => [...p, asset._id]);
      setAssets((p) => [...p, asset]);
    }
    setBatchCreated(null);
  };

  const handleCreateBatch = async () => {
    if (assets.length === 0) return;
    setCreatingBatch(true);
    const res = await fetch('/api/qr/batches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assetIds: assets.map((a) => a._id), copiesPerAsset: copies, notes: note }),
    });
    const d = await res.json();
    if (res.ok) setBatchCreated(d.batchNumber);
    setCreatingBatch(false);
  };

  const handlePrint = () => {
    const printContent = document.getElementById('qr-print-area');
    if (!printContent) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>QR Batch Print</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 16px; }
        .grid { display: flex; flex-wrap: wrap; gap: 16px; }
        .qr-card { border: 1.5px solid #334137; padding: 12px; border-radius: 8px; text-align: center; width: 180px; page-break-inside: avoid; }
        img { width: 140px; height: 140px; }
        .code { font-family: monospace; font-size: 11px; font-weight: bold; color: #334137; margin-top: 6px; }
        .name { font-size: 10px; color: #555; margin-top: 3px; }
        .footer { font-size: 9px; color: #aaa; margin-top: 4px; }
        @media print { body { padding: 8px; } }
      </style></head>
      <body><div class="grid">
      ${assets.flatMap((asset) =>
        Array.from({ length: copies }).map(() => `
          <div class="qr-card">
            <img src="${asset.qrCodeData}" alt="QR" />
            <div class="code">${asset.assetCode}</div>
            <div class="name">${asset.item_name}</div>
            <div class="footer">Powered by Kodernet</div>
          </div>
        `)
      ).join('')}
      </div>
      <script>window.onload = () => window.print();</script>
      </body></html>
    `);
    win.document.close();
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-primary-dark)' }}>QR Print</h1>
        <p className="text-sm text-gray-500 mt-0.5">Generate and print QR codes for assets</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Asset selector */}
        <div className="lg:col-span-1 card p-5">
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>Select Assets</h2>
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {allAssets.map((asset) => (
              <label key={asset._id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.includes(asset._id)}
                  onChange={() => handleSelect(asset)}
                  className="rounded"
                />
                <div className="min-w-0">
                  <p className="text-xs font-mono font-medium" style={{ color: 'var(--color-primary)' }}>{asset.assetCode}</p>
                  <p className="text-xs text-gray-500 truncate">{asset.item_name}</p>
                </div>
              </label>
            ))}
            {allAssets.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">No assets found</p>
            )}
          </div>

          <div className="border-t mt-4 pt-4 space-y-3" style={{ borderColor: 'var(--color-border)' }}>
            <div>
              <label className="label">Copies per asset</label>
              <input type="number" value={copies} onChange={(e) => setCopies(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))} className="input-field" min="1" max="20" />
            </div>
            <div>
              <label className="label">Batch notes</label>
              <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className="input-field" placeholder="Optional note" />
            </div>
            <button onClick={handleCreateBatch} disabled={creatingBatch || assets.length === 0} className="btn-primary w-full justify-center">
              {creatingBatch ? 'Recording…' : `Record Batch (${assets.length} asset${assets.length !== 1 ? 's' : ''})`}
            </button>
            {batchCreated && (
              <div className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                Batch <code className="font-mono">{batchCreated}</code> recorded!
              </div>
            )}
          </div>
        </div>

        {/* QR preview */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
              Preview {assets.length > 0 ? `(${assets.length} × ${copies} = ${assets.length * copies} labels)` : ''}
            </h2>
            {assets.length > 0 && (
              <button onClick={handlePrint} className="btn-accent">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print All
              </button>
            )}
          </div>

          <div id="qr-print-area" className="flex flex-wrap gap-4">
            {assets.length === 0 ? (
              <div className="flex-1 flex items-center justify-center h-48 text-gray-300 text-sm">
                Select assets on the left to preview QR codes
              </div>
            ) : (
              assets.flatMap((asset) =>
                Array.from({ length: copies }).map((_, ci) => (
                  <div
                    key={`${asset._id}-${ci}`}
                    className="flex flex-col items-center p-3 rounded-xl text-center"
                    style={{ border: '1.5px solid var(--color-primary)', width: '158px' }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={asset.qrCodeData} alt="QR" className="w-28 h-28 rounded" />
                    <p className="font-mono text-xs font-bold mt-2" style={{ color: 'var(--color-primary)' }}>{asset.assetCode}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate w-full">{asset.item_name}</p>
                    <p className="text-xs mt-1" style={{ color: 'rgba(51,65,55,0.35)', fontSize: '9px' }}>Powered by Kodernet</p>
                  </div>
                ))
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QRPrintPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} /></div>}>
      <QRPage />
    </Suspense>
  );
}
