import { connectDB } from '@/lib/db';
import Asset from '@/models/Asset';
import { requireAuth } from '@/lib/auth';
import { logAudit } from '@/lib/utils';
import { NextRequest } from 'next/server';

// GET /api/assets/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    await connectDB();
    const asset = await Asset.findOne({
      $or: [{ _id: id.match(/^[0-9a-f]{24}$/i) ? id : null }, { assetCode: id }],
    });
    if (!asset) return Response.json({ error: 'Asset not found' }, { status: 404 });
    return Response.json({ asset });
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

// PUT /api/assets/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (['viewer', 'auditor'].includes(session.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { id } = await params;
    await connectDB();
    const body = await request.json();

    const existing = await Asset.findById(id);
    if (!existing) return Response.json({ error: 'Asset not found' }, { status: 404 });

    const changes: Record<string, unknown> = {};
    for (const key of Object.keys(body)) {
      if (String(existing.get(key)) !== String(body[key])) {
        changes[key] = { from: existing.get(key), to: body[key] };
      }
    }

    const asset = await Asset.findByIdAndUpdate(
      id,
      { ...body, updatedBy: session.userId },
      { new: true }
    );

    await logAudit(session, 'UPDATE', 'Asset', {
      entityId: id,
      entityCode: existing.assetCode,
      changes,
      request,
    });

    return Response.json({ asset });
  } catch {
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE /api/assets/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (session.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { id } = await params;
    await connectDB();
    const asset = await Asset.findByIdAndDelete(id);
    if (!asset) return Response.json({ error: 'Asset not found' }, { status: 404 });

    await logAudit(session, 'DELETE', 'Asset', {
      entityId: id,
      entityCode: asset.assetCode,
      request,
    });

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
