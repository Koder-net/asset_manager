'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

const CATEGORIES = ['Computer', 'Laptop', 'Printer', 'Scanner', 'Monitor', 'Furniture - Table', 'Furniture - Chair', 'Vehicle', 'Air Conditioner', 'Projector', 'Server', 'Network Equipment', 'Phone', 'Other'];
const CONDITION_STATUSES = ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged'];
const ASSET_STATUSES = ['Active', 'In Storage', 'In Repair', 'Missing'];
const BRANCHES = ['Head Office', 'Branch A', 'Branch B', 'Branch C', 'Regional Office'];
const DEPARTMENTS = ['Administration', 'Finance', 'IT', 'HR', 'Operations', 'Legal', 'Procurement', 'Audit'];

interface FormData {
  item_name: string;
  category: string;
  brand: string;
  model: string;
  serial_number: string;
  source: string;
  supplier_name: string;
  invoice_number: string;
  purchased_date: string;
  received_date: string;
  delivered_by: string;
  brought_by: string;
  branch: string;
  department: string;
  location: string;
  custodian: string;
  condition_status: string;
  asset_status: string;
  warranty_end_date: string;
  cost_value: string;
  notes: string;
}

export default function NewAssetPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormData>({
    item_name: '', category: '', brand: '', model: '', serial_number: '',
    source: '', supplier_name: '', invoice_number: '',
    purchased_date: '', received_date: '', delivered_by: '', brought_by: '',
    branch: '', department: '', location: '', custodian: '',
    condition_status: 'Good', asset_status: 'Active',
    warranty_end_date: '', cost_value: '', notes: '',
  });

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.item_name || !form.category || !form.branch || !form.department || !form.location) {
      setError('Please fill all required fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...form,
        cost_value: form.cost_value ? parseFloat(form.cost_value) : undefined,
        purchased_date: form.purchased_date || undefined,
        received_date: form.received_date || undefined,
        warranty_end_date: form.warranty_end_date || undefined,
      };
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/assets/${data.asset.assetCode}`);
      } else {
        setError(data.error || 'Failed to create asset');
      }
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="card p-6">
      <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-primary)' }}>{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {children}
      </div>
    </div>
  );

  const Field = ({
    label, id, required, children
  }: { label: string; id: string; required?: boolean; children: React.ReactNode }) => (
    <div>
      <label htmlFor={id} className="label">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
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
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-primary-dark)' }}>Add New Asset</h1>
          <p className="text-sm text-gray-500">Fill in details to register a new asset</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
        )}

        <Section title="Basic Information">
          <Field label="Item Name" id="item_name" required>
            <input id="item_name" type="text" required value={form.item_name} onChange={set('item_name')} className="input-field" placeholder="e.g. Dell Laptop" />
          </Field>
          <Field label="Category" id="category" required>
            <select id="category" required value={form.category} onChange={set('category')} className="input-field">
              <option value="">Select category</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Brand" id="brand">
            <input id="brand" type="text" value={form.brand} onChange={set('brand')} className="input-field" placeholder="e.g. Dell, HP" />
          </Field>
          <Field label="Model" id="model">
            <input id="model" type="text" value={form.model} onChange={set('model')} className="input-field" placeholder="Model number" />
          </Field>
          <Field label="Serial Number" id="serial_number">
            <input id="serial_number" type="text" value={form.serial_number} onChange={set('serial_number')} className="input-field" placeholder="Serial number" />
          </Field>
          <Field label="Cost Value (LKR)" id="cost_value">
            <input id="cost_value" type="number" value={form.cost_value} onChange={set('cost_value')} className="input-field" placeholder="0.00" min="0" step="0.01" />
          </Field>
        </Section>

        <Section title="Acquisition Details">
          <Field label="Source" id="source">
            <input id="source" type="text" value={form.source} onChange={set('source')} className="input-field" placeholder="e.g. Direct Purchase, Tender" />
          </Field>
          <Field label="Supplier Name" id="supplier_name">
            <input id="supplier_name" type="text" value={form.supplier_name} onChange={set('supplier_name')} className="input-field" placeholder="Supplier" />
          </Field>
          <Field label="Invoice Number" id="invoice_number">
            <input id="invoice_number" type="text" value={form.invoice_number} onChange={set('invoice_number')} className="input-field" placeholder="INV-XXXX" />
          </Field>
          <Field label="Purchase Date" id="purchased_date">
            <input id="purchased_date" type="date" value={form.purchased_date} onChange={set('purchased_date')} className="input-field" />
          </Field>
          <Field label="Received Date" id="received_date">
            <input id="received_date" type="date" value={form.received_date} onChange={set('received_date')} className="input-field" />
          </Field>
          <Field label="Warranty End Date" id="warranty_end_date">
            <input id="warranty_end_date" type="date" value={form.warranty_end_date} onChange={set('warranty_end_date')} className="input-field" />
          </Field>
          <Field label="Delivered By" id="delivered_by">
            <input id="delivered_by" type="text" value={form.delivered_by} onChange={set('delivered_by')} className="input-field" placeholder="Name" />
          </Field>
          <Field label="Brought By" id="brought_by">
            <input id="brought_by" type="text" value={form.brought_by} onChange={set('brought_by')} className="input-field" placeholder="Name" />
          </Field>
        </Section>

        <Section title="Location & Assignment">
          <Field label="Branch" id="branch" required>
            <select id="branch" required value={form.branch} onChange={set('branch')} className="input-field">
              <option value="">Select branch</option>
              {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </Field>
          <Field label="Department" id="department" required>
            <select id="department" required value={form.department} onChange={set('department')} className="input-field">
              <option value="">Select department</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Location / Room" id="location" required>
            <input id="location" required type="text" value={form.location} onChange={set('location')} className="input-field" placeholder="e.g. Room 201, Block A" />
          </Field>
          <Field label="Custodian" id="custodian">
            <input id="custodian" type="text" value={form.custodian} onChange={set('custodian')} className="input-field" placeholder="Person responsible" />
          </Field>
        </Section>

        <Section title="Condition & Status">
          <Field label="Condition" id="condition_status">
            <select id="condition_status" value={form.condition_status} onChange={set('condition_status')} className="input-field">
              {CONDITION_STATUSES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Asset Status" id="asset_status">
            <select id="asset_status" value={form.asset_status} onChange={set('asset_status')} className="input-field">
              {ASSET_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <div className="sm:col-span-2 lg:col-span-3">
            <label htmlFor="notes" className="label">Notes</label>
            <textarea id="notes" value={form.notes} onChange={set('notes')} className="input-field resize-none" rows={3} placeholder="Additional information…" />
          </div>
        </Section>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" id="submit-asset" disabled={loading} className="btn-primary px-8 py-2.5">
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating…
              </>
            ) : 'Create Asset'}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-outline">Cancel</button>
        </div>
      </form>
    </div>
  );
}
