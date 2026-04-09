import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';
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
    <DashboardShell user={{ name: session.name, email: session.email, role: session.role }}>
      {children}
    </DashboardShell>
  );
}
