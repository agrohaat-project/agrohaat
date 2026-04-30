import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const { searchParams } = new URL(req.url);
    const role   = searchParams.get('role');
    const status = searchParams.get('status');
    const query: Record<string, unknown> = {};
    if (role && role !== 'all') query.role = role;
    if (status === 'pending')   { query.isApproved = false; query.isSuspended = false; }
    if (status === 'suspended') query.isSuspended = true;
    if (status === 'approved')  { query.isApproved = true; query.isSuspended = false; }

    const users = await User.find(query, { password: 0 }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ users });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const { userId, action } = await req.json();
    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (action === 'approve')  { user.isApproved = true; user.isSuspended = false; }
    if (action === 'suspend')  user.isSuspended = true;
    if (action === 'reinstate'){ user.isSuspended = false; }
    if (action === 'reject')   user.isApproved = false;

    await user.save();
    return NextResponse.json({ message: 'Updated', user: { ...user.toObject(), password: undefined } });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
