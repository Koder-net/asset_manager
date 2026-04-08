import { connectDB } from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { requireAuth } from '@/lib/auth';
import { NextRequest } from 'next/server';

// PUT /api/users/[id] — update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (session.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { id } = await params;
    const { name, email, role, isActive, password } = await request.json();
    await connectDB();

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    if (role) updateData.role = role;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (password) updateData.password = await bcrypt.hash(password, 12);

    const user = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });
    return Response.json({ user });
  } catch {
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE /api/users/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (session.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { id } = await params;
    if (id === session.userId) {
      return Response.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }
    await connectDB();
    await User.findByIdAndUpdate(id, { isActive: false });
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
