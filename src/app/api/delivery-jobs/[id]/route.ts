import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import connectDB from '@/lib/mongodb';
import DeliveryJob from '@/models/DeliveryJob';
import User from '@/models/User';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const job = await DeliveryJob.findById(params.id).lean();
    if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ job });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const job = await DeliveryJob.findById(params.id);
    if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    const { action, message } = body;

    if (session.user.role === 'transporter') {
      if (!session.user.isApproved) {
        return NextResponse.json({ error: 'Account not yet approved' }, { status: 403 });
      }

      if (action === 'accept') {
        if (job.status !== 'available') {
          return NextResponse.json({ error: 'Job no longer available' }, { status: 400 });
        }
        const transporter = await User.findById(session.user.id).lean();
        job.transporterId   = session.user.id as unknown as import('mongoose').Types.ObjectId;
        job.transporterName = transporter?.name ?? '';
        job.status = 'accepted';

      } else if (action === 'confirm_pickup') {
        if (job.transporterId?.toString() !== session.user.id) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        if (job.status !== 'accepted') {
          return NextResponse.json({ error: 'Job must be in accepted state' }, { status: 400 });
        }
        job.status = 'picked_up';
        job.pickedUpAt = new Date();
        job.statusUpdates.push({ message: 'Package picked up from farmer', createdAt: new Date() });

      } else if (action === 'start_transit') {
        if (job.transporterId?.toString() !== session.user.id) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        if (job.status !== 'picked_up') {
          return NextResponse.json({ error: 'Must confirm pickup first' }, { status: 400 });
        }
        job.status = 'in_transit';
        job.inTransitAt = new Date();
        job.statusUpdates.push({ message: 'In transit to delivery location', createdAt: new Date() });

      } else if (action === 'confirm_delivery') {
        if (job.transporterId?.toString() !== session.user.id) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        if (job.status !== 'in_transit') {
          return NextResponse.json({ error: 'Must be in transit first' }, { status: 400 });
        }
        job.status = 'delivered';
        job.deliveredAt = new Date();
        job.statusUpdates.push({ message: 'Delivered — awaiting buyer confirmation', createdAt: new Date() });

      } else if (action === 'post_update') {
        if (job.transporterId?.toString() !== session.user.id) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        if (!message?.trim()) {
          return NextResponse.json({ error: 'Message required' }, { status: 400 });
        }
        job.statusUpdates.push({ message: message.trim(), createdAt: new Date() });
      }

    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await job.save();
    return NextResponse.json({ job });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
