import { connectDB } from '@/lib/db';
import Maintenance from '@/models/Maintenance';
import Asset from '@/models/Asset';
import { requireAuth } from '@/lib/auth';
import { logAudit } from '@/lib/utils';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    await connectDB();
    const { searchParams } = request.nextUrl;
    const assetId = searchParams.get('assetId') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};
    if (assetId) query.asset = assetId;
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const [records, total] = await Promise.all([
      Maintenance.find(query)
        .populate('asset', 'assetCode item_name')
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Maintenance.countDocuments(query),
    ]);

    return Response.json({
      records,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (['viewer', 'auditor'].includes(session.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    await connectDB();
    const body = await request.json();
    const { assetId, maintenanceType, description, startDate, status } = body;

    if (!assetId || !maintenanceType || !description || !startDate) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const record = await Maintenance.create({
      ...body,
      asset: assetId,
      createdBy: session.userId,
    });

    // Update asset status if repair
    if (maintenanceType === 'Repair' && status === 'In Progress') {
      await Asset.findByIdAndUpdate(assetId, { asset_status: 'In Repair', updatedBy: session.userId });
    }
    if (maintenanceType === 'Disposal' && status === 'Completed') {
      await Asset.findByIdAndUpdate(assetId, { asset_status: 'Disposed', updatedBy: session.userId });
    }

    const asset = await Asset.findById(assetId);
    await logAudit(session, 'MAINTENANCE', 'Asset', {
      entityId: assetId,
      entityCode: asset?.assetCode,
      changes: { maintenanceType, status },
      request,
    });

    return Response.json({ record }, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
