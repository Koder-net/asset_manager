import { connectDB } from '@/lib/db';
import Asset from '@/models/Asset';
import { requireAuth } from '@/lib/auth';
import { logAudit, generateAssetCode } from '@/lib/utils';
import { NextRequest } from 'next/server';
import QRCode from 'qrcode';

// GET /api/assets
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    await connectDB();

    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const branch = searchParams.get('branch') || '';
    const department = searchParams.get('department') || '';
    const status = searchParams.get('status') || '';
    const condition = searchParams.get('condition') || '';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};

    if (search) {
      query.$or = [
        { assetCode: { $regex: search, $options: 'i' } },
        { item_name: { $regex: search, $options: 'i' } },
        { serial_number: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) query.category = category;
    if (branch) query.branch = branch;
    if (department) query.department = department;
    if (status) query.asset_status = status;
    if (condition) query.condition_status = condition;

    const skip = (page - 1) * limit;
    const [assets, total] = await Promise.all([
      Asset.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Asset.countDocuments(query),
    ]);

    return Response.json({
      assets,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

// POST /api/assets
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (['viewer', 'auditor'].includes(session.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    await connectDB();

    const body = await request.json();
    const count = await Asset.countDocuments();
    const assetCode = generateAssetCode(body.category || 'GEN', count);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const qrUrl = `${appUrl}/assets/${assetCode}`;
    const qrCodeData = await QRCode.toDataURL(qrUrl, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
    });

    const asset = await Asset.create({
      ...body,
      assetCode,
      qrCodeData,
      createdBy: session.userId,
    });

    await logAudit(session, 'CREATE', 'Asset', {
      entityId: asset._id.toString(),
      entityCode: assetCode,
      changes: { item_name: body.item_name, category: body.category },
      request,
    });

    return Response.json({ asset }, { status: 201 });
  } catch (error) {
    console.error('Create asset error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
