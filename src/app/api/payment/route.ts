import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import DeliveryJob from '@/models/DeliveryJob';

// Fake but realistic bKash/Nagad payment flow
function generateTransactionId(method: string): string {
  const prefix = method === 'bkash' ? 'BK' : 'NG';
  const ts     = Date.now().toString().slice(-8);
  const rand   = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}${ts}${rand}`;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'buyer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const { orderId, paymentMethod, phone } = body;

    if (!orderId || !paymentMethod || !phone) {
      return NextResponse.json({ error: 'orderId, paymentMethod, phone required' }, { status: 400 });
    }
    if (!['bkash', 'nagad', 'cash'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }

    await connectDB();
    const order = await Order.findById(orderId);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (order.buyerId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (order.status !== 'accepted') {
      return NextResponse.json({ error: 'Order must be accepted before payment' }, { status: 400 });
    }
    if (order.paymentStatus === 'paid') {
      return NextResponse.json({ error: 'Already paid' }, { status: 400 });
    }

    // Simulate payment processing delay (fake)
    const transactionId = generateTransactionId(paymentMethod);

    // Update order
    order.status                = 'paid';
    order.paymentStatus         = 'paid';
    order.paymentMethod         = paymentMethod;
    order.paymentTransactionId  = transactionId;
    await order.save();

    // Reduce product quantity
    await Product.findByIdAndUpdate(order.productId, { $inc: { quantity: -order.quantity } });

    // Create delivery job
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

    return NextResponse.json({
      success: true,
      transactionId,
      message: `Payment of ৳${order.totalAmount} via ${paymentMethod === 'bkash' ? 'bKash' : paymentMethod === 'nagad' ? 'Nagad' : 'Cash'} was successful!`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
