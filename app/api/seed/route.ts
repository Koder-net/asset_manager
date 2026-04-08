import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// POST /api/seed — seeds initial admin user (run once)
export async function POST() {
  try {
    await requireAuth();
  } catch {
    // allow if no session (first run)
  }

  try {
    await connectDB();
    const existing = await User.findOne({ email: 'admin@office.gov' });
    if (existing) {
      return Response.json({ message: 'Already seeded' });
    }
    const hashedPassword = await bcrypt.hash('Admin@1234', 12);
    await User.create({
      name: 'System Admin',
      email: 'admin@office.gov',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
    });
    return Response.json({ message: 'Admin user created', email: 'admin@office.gov', password: 'Admin@1234' });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Seed failed' }, { status: 500 });
  }
}
