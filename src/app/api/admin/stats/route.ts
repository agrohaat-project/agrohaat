import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Product from '@/models/Product';
import Order from '@/models/Order';
import DeliveryJob from '@/models/DeliveryJob';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const [
      totalUsers, pendingApprovals, totalProducts,
      totalOrders, paidOrders, activeJobs,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isApproved: false, isSuspended: false, role: { $ne: 'buyer' } }),
      Product.countDocuments({ isAvailable: true }),
      Order.countDocuments(),
      Order.countDocuments({ paymentStatus: 'paid' }),
      DeliveryJob.countDocuments({ status: { $in: ['available','accepted','delivering'] } }),
    ]);
    const revenueData = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = revenueData[0]?.total ?? 0;
    return NextResponse.json({ totalUsers, pendingApprovals, totalProducts, totalOrders, paidOrders, activeJobs, totalRevenue });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
