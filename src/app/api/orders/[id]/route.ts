import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import DeliveryJob from '@/models/DeliveryJob';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const order = await Order.findById(params.id).lean();
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ order });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const order = await Order.findById(params.id);
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    const { action, rejectionReason, stars, comment } = body;

    // ── Farmer actions ────────────────────────────────────────────────────────
    if (session.user.role === 'farmer') {
      if (order.farmerId.toString() !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      if (action === 'accept') {
        order.status = 'accepted';

      } else if (action === 'reject') {
        order.status = 'rejected';
        order.rejectionReason = rejectionReason ?? '';
        await Product.findByIdAndUpdate(order.productId, { $inc: { quantity: order.quantity } });

      } else if (action === 'ship') {
        order.status = 'shipped';

      } else if (action === 'ready_for_pickup') {
        // Signal to transporter that the package is ready for collection
        const job = await DeliveryJob.findOne({ orderId: order._id });
        if (!job) return NextResponse.json({ error: 'No delivery job found' }, { status: 404 });
        job.farmerReadyAt = new Date();
        job.statusUpdates.push({ message: 'Farmer has marked order as ready for pickup', createdAt: new Date() });
        await job.save();
        return NextResponse.json({ ok: true });

      } else if (action === 'rate_transporter') {
        if (!stars || stars < 1 || stars > 5) {
          return NextResponse.json({ error: 'Stars must be 1–5' }, { status: 400 });
        }
        const job = await DeliveryJob.findOne({ orderId: order._id });
        if (!job) return NextResponse.json({ error: 'No delivery job found' }, { status: 404 });
        if (job.status !== 'confirmed') {
          return NextResponse.json({ error: 'Can only rate after delivery is confirmed' }, { status: 400 });
        }
        if (job.farmerRating) {
          return NextResponse.json({ error: 'Already rated' }, { status: 409 });
        }
        job.farmerRating = { stars: Number(stars), comment: comment ?? '' };
        await job.save();
        return NextResponse.json({ ok: true });
      }
    }

    // ── Buyer actions ─────────────────────────────────────────────────────────
    if (session.user.role === 'buyer') {
      if (order.buyerId.toString() !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      if (action === 'cancel' && order.status === 'pending') {
        order.status = 'rejected';
        order.rejectionReason = 'Cancelled by buyer';
        await Product.findByIdAndUpdate(order.productId, { $inc: { quantity: order.quantity } });

      } else if (action === 'confirm_received') {
        const job = await DeliveryJob.findOne({ orderId: order._id });
        if (!job) return NextResponse.json({ error: 'No delivery job found' }, { status: 404 });
        if (job.status !== 'delivered') {
          return NextResponse.json({ error: 'Transporter has not yet confirmed delivery' }, { status: 400 });
        }
        job.status = 'confirmed';
        job.confirmedAt = new Date();
        job.statusUpdates.push({ message: 'Buyer confirmed receipt — delivery complete', createdAt: new Date() });
        await job.save();
        order.status = 'delivered'; // triggers farmer/buyer rating flow

      } else if (action === 'rate_transporter') {
        if (!stars || stars < 1 || stars > 5) {
          return NextResponse.json({ error: 'Stars must be 1–5' }, { status: 400 });
        }
        const job = await DeliveryJob.findOne({ orderId: order._id });
        if (!job) return NextResponse.json({ error: 'No delivery job found' }, { status: 404 });
        if (job.status !== 'confirmed') {
          return NextResponse.json({ error: 'Can only rate after delivery is confirmed' }, { status: 400 });
        }
        if (job.buyerRating) {
          return NextResponse.json({ error: 'Already rated' }, { status: 409 });
        }
        job.buyerRating = { stars: Number(stars), comment: comment ?? '' };
        await job.save();
        return NextResponse.json({ ok: true });
      }
    }

    await order.save();

    // Create delivery job when farmer ships
    if (action === 'ship' && order.status === 'shipped') {
      const existingJob = await DeliveryJob.findOne({ orderId: order._id });
      if (!existingJob) {
        const product = await Product.findById(order.productId).lean();
        await DeliveryJob.create({
          orderId:      order._id,
          productTitle: order.productTitle,
          farmerId:     order.farmerId,
          farmerName:   order.farmerName,
          buyerId:      order.buyerId,
          buyerName:    order.buyerName,
          pickupLocation:   product?.location ?? { district: 'Unknown', upazila: '', address: '' },
          deliveryLocation: order.deliveryAddress,
          productWeight: order.quantity,
          deliveryFee:   Math.ceil(order.totalAmount * 0.05),
          status:        'available',
        });
      }
    }

    // Also create delivery job when payment is completed (legacy flow)
    if (order.status === 'paid') {
      const existingJob = await DeliveryJob.findOne({ orderId: order._id });
      if (!existingJob) {
        const product = await Product.findById(order.productId).lean();
        await DeliveryJob.create({
          orderId:      order._id,
          productTitle: order.productTitle,
          farmerId:     order.farmerId,
          farmerName:   order.farmerName,
          buyerId:      order.buyerId,
          buyerName:    order.buyerName,
          pickupLocation:   product?.location ?? { district: 'Unknown', upazila: '', address: '' },
          deliveryLocation: order.deliveryAddress,
          productWeight: order.quantity,
          deliveryFee:   Math.ceil(order.totalAmount * 0.05),
          status:        'available',
        });
      }
    }

    return NextResponse.json({ order });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
