import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import User from '@/models/User';
import DeliveryJob from '@/models/DeliveryJob';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();

    const role   = session.user.role;
    const userId = session.user.id;
    const query: Record<string, unknown> = {};
    if (role === 'farmer') query.farmerId = userId;
    if (role === 'buyer')  query.buyerId  = userId;

    const orders = await Order.find(query).sort({ createdAt: -1 }).lean();

    // Attach the linked delivery job to each order so farmer/buyer can see delivery status
    if (orders.length > 0) {
      const orderIds = orders.map(o => o._id);
      const jobs     = await DeliveryJob.find({ orderId: { $in: orderIds } }).lean();
      const jobMap   = new Map(jobs.map(j => [j.orderId.toString(), j]));
      const enriched = orders.map(o => ({ ...o, deliveryJob: jobMap.get(o._id.toString()) ?? null }));
      return NextResponse.json({ orders: enriched });
    }

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Orders API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'buyer') {
      return NextResponse.json({ error: 'Only buyers can place orders' }, { status: 401 });
    }
    const body = await req.json();
    const { productId, quantity, deliveryAddress, notes } = body;
    if (!productId || !quantity) {
      return NextResponse.json({ error: 'productId and quantity required' }, { status: 400 });
    }
    await connectDB();
    const product = await Product.findById(productId);
    if (!product || !product.isAvailable) {
      return NextResponse.json({ error: 'Product not available' }, { status: 404 });
    }
    if (quantity > product.quantity) {
      return NextResponse.json({ error: `Only ${product.quantity} ${product.unit} available` }, { status: 400 });
    }
    const buyer = await User.findById(session.user.id).lean();
    if (!buyer) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const totalAmount = product.price * quantity;
    const order = await Order.create({
      productId,
      productTitle: product.title,
      productImage: product.images[0] ?? '',
      farmerId:    product.farmerId,
      farmerName:  product.farmerName,
      buyerId:     session.user.id,
      buyerName:   buyer.name,
      buyerPhone:  buyer.phone,
      quantity,
      unitPrice:   product.price,
      totalAmount,
      unit:        product.unit,
      status:      'pending',
      paymentStatus: 'unpaid',
      deliveryAddress: deliveryAddress ?? { district: '', upazila: '', address: '' },
      notes: notes ?? '',
    });
    return NextResponse.json({ order }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
