import { connectDB } from '@/lib/db';
import AuditLog from '@/models/AuditLog';
import { requireAuth } from '@/lib/auth';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!['admin', 'asset_manager', 'auditor'].includes(session.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    await connectDB();
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');
    const entity = searchParams.get('entity') || '';
    const action = searchParams.get('action') || '';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};
    if (entity) query.entity = entity;
    if (action) query.action = { $regex: action, $options: 'i' };

    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(query),
    ]);

    return Response.json({
      logs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
