'use client';

import { useState, useEffect, useCallback } from 'react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-50 text-red-700',
  asset_manager: 'bg-blue-50 text-blue-700',
  data_entry: 'bg-green-50 text-green-700',
  auditor: 'bg-purple-50 text-purple-700',
  viewer: 'bg-gray-100 text-gray-600',
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'viewer' });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/users');
    const d = await res.json();
    setUsers(d.users || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) { setError('All fields required'); return; }
    setSaving(true); setError('');
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) { setShowForm(false); setForm({ name: '', email: '', password: '', role: 'viewer' }); fetchUsers(); }
    else { const d = await res.json(); setError(d.error || 'Failed'); }
    setSaving(false);
  };

  const handleToggleActive = async (user: User) => {
    await fetch(`/api/users/${user._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !user.isActive }),
    });
    fetchUsers();
  };

  const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-primary-dark)' }}>Users &amp; Roles</h1>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} users</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add User
        </button>
      </div>

      {/* Role legend */}
      <div className="card p-4 mb-4">
        <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Role Permissions Overview</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { role: 'admin', desc: 'Full system access' },
            { role: 'asset_manager', desc: 'Manage assets & transfers' },
            { role: 'data_entry', desc: 'Create & update assets' },
            { role: 'auditor', desc: 'Read-only + reports' },
            { role: 'viewer', desc: 'Read-only access' },
          ].map((r) => (
            <div key={r.role} className="text-xs p-2 rounded-lg bg-gray-50">
              <span className={`badge mb-1 ${ROLE_COLORS[r.role]}`}>{r.role}</span>
              <p className="text-gray-500">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead style={{ background: 'var(--color-surface)' }}>
            <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
              <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
              <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
              <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Last Login</th>
              <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="p-4 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                  {Array.from({ length: 5 }).map((_, j) => <td key={j} className="p-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="py-16 text-center text-gray-400">No users found</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user._id} className="table-row-hover border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0" style={{ background: 'var(--color-primary)' }}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`badge ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-600'}`}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500 text-xs hidden md:table-cell">{fmt(user.lastLogin)}</td>
                  <td className="p-4">
                    <span className={`badge ${user.isActive ? 'badge-active' : 'badge-disposed'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleActive(user)}
                      className="text-xs text-gray-400 hover:text-gray-600 underline"
                    >
                      {user.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-primary-dark)' }}>Add New User</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>}
            <div className="space-y-4">
              <div>
                <label className="label">Full Name <span className="text-red-500">*</span></label>
                <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="label">Email <span className="text-red-500">*</span></label>
                <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="label">Password <span className="text-red-500">*</span></label>
                <input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="label">Role</label>
                <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} className="input-field">
                  {['admin', 'asset_manager', 'data_entry', 'auditor', 'viewer'].map((r) => (
                    <option key={r} value={r}>{r.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <button onClick={handleCreate} disabled={saving} className="btn-primary w-full justify-center py-2.5">
                {saving ? 'Creating…' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
