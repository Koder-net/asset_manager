import { connectDB } from '@/lib/db';
import Asset from '@/models/Asset';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await requireAuth();
    await connectDB();

    const [
      total,
      byCategory,
      byStatus,
      byBranch,
      byCondition,
      recentAssets,
      inRepair,
      missing,
    ] = await Promise.all([
      Asset.countDocuments(),
      Asset.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Asset.aggregate([{ $group: { _id: '$asset_status', count: { $sum: 1 } } }]),
      Asset.aggregate([{ $group: { _id: '$branch', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Asset.aggregate([{ $group: { _id: '$condition_status', count: { $sum: 1 } } }]),
      Asset.find().sort({ createdAt: -1 }).limit(5).select('assetCode item_name category asset_status branch createdAt').lean(),
      Asset.countDocuments({ asset_status: 'In Repair' }),
      Asset.countDocuments({ asset_status: 'Missing' }),
    ]);

    return Response.json({
      total,
      byCategory,
      byStatus,
      byBranch,
      byCondition,
      recentAssets,
      inRepair,
      missing,
      userRole: session.role,
    });
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
