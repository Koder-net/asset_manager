import { connectDB } from '@/lib/db';
import Asset from '@/models/Asset';
import { requireAuth } from '@/lib/auth';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    await connectDB();

    const categories = await Asset.distinct('category');
    
    const deptBranchAgg = await Asset.aggregate([
      { $match: { department: { $ne: null }, branch: { $ne: null } } },
      {
        $group: {
          _id: "$department",
          branches: { $addToSet: "$branch" }
        }
      }
    ]);

    const branchesByDept: Record<string, string[]> = {};
    
    deptBranchAgg.forEach(doc => {
      if (doc._id) {
        branchesByDept[doc._id] = doc.branches.filter(Boolean);
      }
    });

    const allBranches = await Asset.distinct('branch');
    const departments = await Asset.distinct('department');

    return Response.json({
      categories: categories.filter(Boolean),
      departments: departments.filter(Boolean),
      branches: allBranches.filter(Boolean),
      branchesByDept
    });
  } catch (error) {
    console.error('Fetch options error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
