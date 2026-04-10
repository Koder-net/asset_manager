'use client';

import { useState, useEffect, FormEvent, use } from 'react';
import { useRouter } from 'next/navigation';

const CONDITION_STATUSES = ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged'];
const ASSET_STATUSES = ['Active', 'In Storage', 'In Repair', 'Transferred', 'Missing', 'Disposed'];

export default function EditAssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [assetId, setAssetId] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [form, setForm] = useState<Record<string, any>>({});
  const [options, setOptions] = useState<{
    categories: string[];
    departments: string[];
    branches: string[];
    branchesByDept: Record<string, string[]>;
  }>({ categories: [], departments: [], branches: [], branchesByDept: {} });

  useEffect(() => {
    fetch('/api/assets/options')
      .then(r => r.json())
      .then(d => {
        if (!d.error) setOptions(d);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetch(`/api/assets/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.asset) {
          const a = d.asset;
          setAssetId(a._id);
          setForm({
            item_name: a.item_name || '',
            category: a.category || '',
            brand: a.brand || '',
            model: a.model || '',
            serial_number: a.serial_number || '',
            source: a.source || '',
            supplier_name: a.supplier_name || '',
            invoice_number: a.invoice_number || '',
            purchased_date: a.purchased_date ? a.purchased_date.slice(0, 10) : '',
            received_date: a.received_date ? a.received_date.slice(0, 10) : '',
            delivered_by: a.delivered_by || '',
            brought_by: a.brought_by || '',
            branch: a.branch || '',
            department: a.department || '',
            location: a.location || '',
            custodian: a.custodian || '',
            condition_status: a.condition_status || 'Good',
            asset_status: a.asset_status || 'Active',
            warranty_end_date: a.warranty_end_date ? a.warranty_end_date.slice(0, 10) : '',
            cost_value: a.cost_value || '',
            notes: a.notes || '',
          });
        }
        setLoading(false);
      });
  }, [id]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/assets/${assetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, cost_value: form.cost_value ? parseFloat(form.cost_value) : undefined }),
      });
      if (res.ok) {
        router.push(`/assets/${id}`);
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to update');
      }
    } catch {
      setError('Connection error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} /></div>;
  }

  const Field = ({ label, id, children }: { label: string; id: string; children: React.ReactNode }) => (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      {children}
    </div>
  );

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="card p-6">
      <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-primary)' }}>{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>
    </div>
  );

  return (
    <div>
      <div className="page-header flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 p-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-primary-dark)' }}>Edit Asset</h1>
          <p className="text-sm font-mono text-gray-500">{id}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

        <Section title="Basic Information">
          <Field label="Item Name" id="item_name"><input id="item_name" type="text" required value={form.item_name} onChange={set('item_name')} className="input-field" /></Field>
          <Field label="Category" id="category">
            <input id="category" required list="category-options" value={form.category || ''} onChange={set('category')} className="input-field" placeholder="Select or enter category" autoComplete="off" />
            <datalist id="category-options">{options.categories.map((c) => <option key={c} value={c} />)}</datalist>
          </Field>
          <Field label="Brand" id="brand"><input id="brand" type="text" value={form.brand} onChange={set('brand')} className="input-field" /></Field>
          <Field label="Model" id="model"><input id="model" type="text" value={form.model} onChange={set('model')} className="input-field" /></Field>
          <Field label="Serial Number" id="serial_number"><input id="serial_number" type="text" value={form.serial_number} onChange={set('serial_number')} className="input-field" /></Field>
          <Field label="Cost Value" id="cost_value"><input id="cost_value" type="number" value={form.cost_value} onChange={set('cost_value')} className="input-field" min="0" step="0.01" /></Field>
        </Section>

        <Section title="Location & Assignment">
          <Field label="Department" id="department">
            <input id="department" required list="department-options" value={form.department || ''} onChange={set('department')} className="input-field" placeholder="Select or enter department" autoComplete="off" />
            <datalist id="department-options">{options.departments.map((d) => <option key={d} value={d} />)}</datalist>
          </Field>
          <Field label="Branch" id="branch">
            <input id="branch" required list="branch-options" value={form.branch || ''} onChange={set('branch')} className="input-field disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed" placeholder="Select or enter branch" disabled={!form.department} autoComplete="off" />
            <datalist id="branch-options">{(options.branchesByDept[form.department] || options.branches).map((b) => <option key={b} value={b} />)}</datalist>
          </Field>
          <Field label="Location" id="location"><input id="location" type="text" required value={form.location} onChange={set('location')} className="input-field" /></Field>
          <Field label="Custodian" id="custodian"><input id="custodian" type="text" value={form.custodian} onChange={set('custodian')} className="input-field" /></Field>
        </Section>

        <Section title="Condition & Status">
          <Field label="Condition" id="condition_status"><select id="condition_status" value={form.condition_status} onChange={set('condition_status')} className="input-field">{CONDITION_STATUSES.map((c) => <option key={c} value={c}>{c}</option>)}</select></Field>
          <Field label="Asset Status" id="asset_status"><select id="asset_status" value={form.asset_status} onChange={set('asset_status')} className="input-field">{ASSET_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></Field>
          <div className="sm:col-span-2 lg:col-span-3">
            <label htmlFor="notes" className="label">Notes</label>
            <textarea id="notes" value={form.notes} onChange={set('notes')} className="input-field resize-none" rows={3} />
          </div>
        </Section>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="btn-primary px-8 py-2.5">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-outline">Cancel</button>
        </div>
      </form>
    </div>
  );
}
