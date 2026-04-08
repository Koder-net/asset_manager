import { getSession, SessionPayload } from './session';

export type Role = 'admin' | 'asset_manager' | 'data_entry' | 'auditor' | 'viewer';

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  admin: ['*'],
  asset_manager: [
    'assets.read', 'assets.create', 'assets.update',
    'transfers.read', 'transfers.create',
    'maintenance.read', 'maintenance.create',
    'qr.read', 'qr.print',
    'reports.read',
    'audit.read',
  ],
  data_entry: [
    'assets.read', 'assets.create', 'assets.update',
    'qr.read', 'qr.print',
  ],
  auditor: [
    'assets.read',
    'transfers.read',
    'maintenance.read',
    'reports.read',
    'audit.read',
  ],
  viewer: [
    'assets.read',
    'transfers.read',
    'maintenance.read',
  ],
};

export function hasPermission(role: Role, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  return perms.includes('*') || perms.includes(permission);
}

export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function requirePermission(permission: string): Promise<SessionPayload> {
  const session = await requireAuth();
  if (!hasPermission(session.role as Role, permission)) {
    throw new Error('Forbidden');
  }
  return session;
}
