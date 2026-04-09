'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';

export default function DashboardShell({
  user,
  children,
}: {
  user: { name: string; email: string; role: string };
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden relative w-full">
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      
      {/* Sidebar wrapper */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:relative md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar user={user} onMobileItemClick={() => setMobileOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Top bar */}
        <header
          className="flex items-center justify-between px-4 md:px-6 py-4 bg-white border-b shrink-0"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-2 md:gap-4">
            <button 
              className="md:hidden text-gray-500 hover:text-gray-700"
              onClick={() => setMobileOpen(true)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full hidden sm:block"
                style={{ background: 'var(--color-accent)' }}
              />
              <span className="text-sm font-medium truncate" style={{ color: 'var(--color-primary)' }}>
                Office Asset Manager
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-700">{user.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role.replace('_', ' ')}</p>
            </div>
            <div
              className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
              style={{ background: 'var(--color-primary)' }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6" style={{ background: 'var(--color-surface)' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
