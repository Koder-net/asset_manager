'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const allNavItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    roles: ['admin', 'asset_manager', 'data_entry', 'auditor'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/assets',
    label: 'Assets',
    roles: ['admin', 'asset_manager', 'data_entry', 'auditor'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    href: '/assets/new',
    label: 'Add Asset',
    roles: ['admin', 'asset_manager', 'data_entry'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    href: '/qr',
    label: 'QR Print',
    roles: ['admin', 'asset_manager', 'data_entry'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
      </svg>
    ),
  },
  {
    href: '/transfers',
    label: 'Transfers',
    roles: ['admin', 'asset_manager', 'data_entry'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    href: '/maintenance',
    label: 'Maintenance',
    roles: ['admin', 'asset_manager'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: '/reports',
    label: 'Reports',
    roles: ['admin', 'asset_manager', 'auditor'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    href: '/users',
    label: 'Users',
    roles: ['admin'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    href: '/audit',
    label: 'Audit Logs',
    roles: ['admin', 'auditor'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
];

interface SidebarProps {
  user?: { name: string; email: string; role: string };
  onMobileItemClick?: () => void;
}

export default function Sidebar({ user, onMobileItemClick }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  // Viewers normally just see asset details natively, they don't get the full dashboard panel. 
  // Allow only roles mapped in the navItems.
  const allowedNavItems = user?.role 
    ? allNavItems.filter(item => item.roles.includes(user.role))
    : [];

  return (
    <aside
      className={`flex flex-col h-full transition-all duration-300 w-64 md:${collapsed ? 'w-16' : 'w-64'}`}
      style={{ background: 'var(--color-sidebar-bg)' }}
    >
      {/* Logo area */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/10 shrink-0">
        <div className={`flex items-center gap-2.5 ${collapsed ? 'hidden md:hidden' : ''}`}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--color-accent)' }}>
            <svg className="w-5 h-5" style={{ color: 'var(--color-primary-dark)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <span className="text-white text-sm font-semibold leading-tight block">Asset Manager</span>
            <span className="text-xs leading-tight" style={{ color: 'rgba(212,219,214,0.6)' }}>Government Office</span>
          </div>
        </div>
        
        {/* Only show center icon on desktop when collapsed */}
        <div className={`w-8 h-8 rounded-lg items-center justify-center mx-auto hidden ${collapsed ? 'md:flex' : ''}`} style={{ background: 'var(--color-accent)' }}>
            <svg className="w-5 h-5" style={{ color: 'var(--color-primary-dark)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-400 hover:text-gray-200 p-1 rounded transition-colors ml-auto hidden md:block" // Hidden on mobile, only meaningful on desktop
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {collapsed
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            }
          </svg>
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto w-full">
        {allowedNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' &&
              pathname.startsWith(item.href + '/') &&
              !allowedNavItems.some(
                (other) =>
                  other.href !== item.href &&
                  other.href.length > item.href.length &&
                  pathname.startsWith(other.href)
              ));
              
          return (
            <div key={item.href} onClick={onMobileItemClick}>
              <Link
                href={item.href}
                className={`sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? 'sidebar-active' : 'text-gray-400'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {/* On mobile, text is always visible since collapse is disabled */}
                <span className={`block md:${collapsed ? 'hidden' : 'block'}`}>{item.label}</span>
              </Link>
            </div>
          );
        })}
        {allowedNavItems.length === 0 && (
           <div className={`text-center py-8 text-sm text-gray-500 md:${collapsed ? 'hidden' : 'block'}`}>
             No pages available
           </div>
        )}
      </nav>

      {/* User info + logout */}
      <div className="border-t border-white/10 p-3 shrink-0">
        {user && (
          <div className={`px-2 py-2 mb-2 block md:${collapsed ? 'hidden' : 'block'}`}>
            <p className="text-white text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs truncate" style={{ color: 'rgba(212,219,214,0.6)' }}>{user.role.replace('_', ' ')}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 w-full"
          title={collapsed ? 'Logout' : undefined}
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className={`block md:${collapsed ? 'hidden' : 'block'}`}>
            {loggingOut ? 'Logging out…' : 'Logout'}
          </span>
        </button>
        <p className={`text-center text-xs mt-3 pb-1 block md:${collapsed ? 'hidden' : 'block'}`} style={{ color: 'rgba(212,219,214,0.35)' }}>
          Powered by Kodernet
        </p>
      </div>
    </aside>
  );
}
