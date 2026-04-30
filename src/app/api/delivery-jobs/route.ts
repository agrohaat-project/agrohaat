import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import connectDB from '@/lib/mongodb';
import DeliveryJob from '@/models/DeliveryJob';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();

    const { searchParams } = new URL(req.url);
    const query: Record<string, unknown> = {};

    if (session.user.role === 'transporter') {
      const filter = searchParams.get('filter') ?? 'available';
      if (filter === 'available') query.status = 'available';
      else if (filter === 'mine') query.transporterId = session.user.id;
    } else if (session.user.role === 'farmer') {
      query.farmerId = session.user.id;
    } else if (session.user.role === 'buyer') {
      query.buyerId  = session.user.id;
    }
    // admin sees all

    const jobs = await DeliveryJob.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ jobs });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
