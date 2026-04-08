import { connectDB } from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';

// GET /api/users — list users (admin only)
export async function GET() {
  try {
    const session = await requireAuth();
    if (session.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    await connectDB();
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    return Response.json({ users });
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

// POST /api/users — create user (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (session.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { name, email, password, role } = await request.json();
    if (!name || !email || !password || !role) {
      return Response.json({ error: 'All fields required' }, { status: 400 });
    }
    await connectDB();
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return Response.json({ error: 'Email already exists' }, { status: 409 });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.findById(
      (await User.create({ name, email: email.toLowerCase(), password: hashedPassword, role }))._id,
      '-password'
    ).lean();
    return Response.json({ user }, { status: 201 });
  } catch {
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
