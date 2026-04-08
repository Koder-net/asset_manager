import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Office Asset Manager',
    default: 'Office Asset Manager',
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={{ name: session.name, email: session.email, role: session.role }} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header
          className="flex items-center justify-between px-6 py-4 bg-white border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: 'var(--color-accent)' }}
            />
            <span className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
              Office Asset Manager
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">{session.name}</p>
              <p className="text-xs text-gray-500 capitalize">{session.role.replace('_', ' ')}</p>
            </div>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold"
              style={{ background: 'var(--color-primary)' }}
            >
              {session.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--color-surface)' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
