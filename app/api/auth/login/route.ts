import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { createSession } from '@/lib/session';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase(), isActive: true });
    if (!user) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    await createSession({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return Response.json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('Login error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
