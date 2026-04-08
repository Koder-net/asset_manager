import { connectDB } from '@/lib/db';
import Asset from '@/models/Asset';
import QRBatch from '@/models/QRBatch';
import { requireAuth } from '@/lib/auth';
import { logAudit, generateBatchNumber } from '@/lib/utils';
import { NextRequest } from 'next/server';

// GET /api/qr/batches
export async function GET() {
  try {
    await requireAuth();
    await connectDB();
    const batches = await QRBatch.find()
      .populate('assets', 'assetCode item_name')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return Response.json({ batches });
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

// POST /api/qr/batches — create batch print record
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (['viewer', 'auditor'].includes(session.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    await connectDB();
    const { assetIds, copiesPerAsset = 1, notes } = await request.json();

    if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
      return Response.json({ error: 'Asset IDs required' }, { status: 400 });
    }

    const assets = await Asset.find({ _id: { $in: assetIds } }).select('assetCode qrCodeData item_name');
    const batchNumber = generateBatchNumber();

    const batch = await QRBatch.create({
      batchNumber,
      assets: assetIds,
      copiesPerAsset,
      printedBy: session.userId,
      printedByName: session.name,
      notes,
    });

    await logAudit(session, 'QR_PRINT', 'QRBatch', {
      entityId: batch._id.toString(),
      entityCode: batchNumber,
      changes: { assetCount: assetIds.length, copiesPerAsset },
      request,
    });

    return Response.json({
      batch,
      assets: assets.map((a) => ({
        assetCode: a.assetCode,
        item_name: a.item_name,
        qrCodeData: a.qrCodeData,
      })),
      batchNumber,
    }, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
