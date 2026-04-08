import { connectDB } from '@/lib/db';
import Transfer from '@/models/Transfer';
import Asset from '@/models/Asset';
import { requireAuth } from '@/lib/auth';
import { logAudit } from '@/lib/utils';
import { NextRequest } from 'next/server';

// GET /api/transfers
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    await connectDB();

    const { searchParams } = request.nextUrl;
    const assetId = searchParams.get('assetId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query = assetId ? { asset: assetId } : {};
    const skip = (page - 1) * limit;

    const [transfers, total] = await Promise.all([
      Transfer.find(query)
        .populate('asset', 'assetCode item_name')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transfer.countDocuments(query),
    ]);

    return Response.json({
      transfers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

// POST /api/transfers
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (['viewer', 'auditor'].includes(session.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    await connectDB();

    const { assetId, transferType, toValue, reason, authorizedBy, notes } = await request.json();
    if (!assetId || !transferType || !toValue) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const asset = await Asset.findById(assetId);
    if (!asset) return Response.json({ error: 'Asset not found' }, { status: 404 });

    // Get current value based on transfer type
    const fieldMap: Record<string, keyof typeof asset> = {
      branch: 'branch',
      department: 'department',
      location: 'location',
      custodian: 'custodian',
    };
    const field = fieldMap[transferType];
    const fromValue = String(asset[field] || '');

    // Create transfer record
    const transfer = await Transfer.create({
      asset: assetId,
      transferType,
      fromValue,
      toValue,
      reason,
      authorizedBy,
      notes,
      transferDate: new Date(),
      createdBy: session.userId,
    });

    // Update asset
    const updateData: Record<string, string> = { [field as string]: toValue };
    if (transferType === 'branch') {
      updateData.asset_status = 'Transferred';
    }
    await Asset.findByIdAndUpdate(assetId, { ...updateData, updatedBy: session.userId });

    await logAudit(session, 'TRANSFER', 'Asset', {
      entityId: assetId,
      entityCode: asset.assetCode,
      changes: { transferType, fromValue, toValue },
      request,
    });

    return Response.json({ transfer }, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
