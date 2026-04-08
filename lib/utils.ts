import { connectDB } from '@/lib/db';
import AuditLog from '@/models/AuditLog';
import { SessionPayload } from '@/lib/session';
import { NextRequest } from 'next/server';

export async function logAudit(
  session: SessionPayload,
  action: string,
  entity: string,
  options: {
    entityId?: string;
    entityCode?: string;
    changes?: Record<string, unknown>;
    request?: NextRequest;
  } = {}
): Promise<void> {
  try {
    await connectDB();
    await AuditLog.create({
      action,
      entity,
      entityId: options.entityId,
      entityCode: options.entityCode,
      changes: options.changes,
      performedBy: session.userId,
      performedByName: session.name,
      performedByRole: session.role,
      ipAddress: options.request?.headers.get('x-forwarded-for') || options.request?.headers.get('x-real-ip'),
      userAgent: options.request?.headers.get('user-agent'),
    });
  } catch (err) {
    console.error('Failed to log audit:', err);
  }
}

export function generateAssetCode(category: string, count: number): string {
  const prefix = category.slice(0, 3).toUpperCase().replace(/\s/g, '');
  const year = new Date().getFullYear().toString().slice(-2);
  const seq = String(count + 1).padStart(5, '0');
  return `${prefix}-${year}-${seq}`;
}

export function generateBatchNumber(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timePart = now.getTime().toString().slice(-6);
  return `BATCH-${datePart}-${timePart}`;
}
