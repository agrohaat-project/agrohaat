import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, phone, role, location } = body;
    if (!name || !email || !password || !phone || !role) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }
    await connectDB();
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });

    const hashed = await bcrypt.hash(password, 12);
    const isAutoApproved = role === 'buyer';  // buyers are auto-approved, others need admin
    const user = await User.create({
      name, email: email.toLowerCase(), password: hashed, phone, role,
      location: location || { district: '', upazila: '', address: '' },
      isVerified: true,   // simplified: auto-verify for now
      isApproved: isAutoApproved,
      isSuspended: false,
    });
    return NextResponse.json({
      message: isAutoApproved
        ? 'Account created successfully! You can log in now.'
        : 'Account created! Please wait for admin approval before logging in.',
      userId: user._id,
    }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
