import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const query: Record<string, unknown> = { isAvailable: true };

    const search   = searchParams.get('search');
    const category = searchParams.get('category');
    const district = searchParams.get('district');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const grade    = searchParams.get('grade');
    const farmerId = searchParams.get('farmerId');

    if (search)   query.$text = { $search: search };
    if (category && category !== 'all') query.category = category;
    if (district && district !== 'all') query['location.district'] = district;
    if (grade && grade !== 'all')       query.qualityGrade = grade;
    if (farmerId) { query.farmerId = farmerId; delete query.isAvailable; }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) (query.price as Record<string,number>).$gte = Number(minPrice);
      if (maxPrice) (query.price as Record<string,number>).$lte = Number(maxPrice);
    }

    const page  = Number(searchParams.get('page') ?? 1);
    const limit = Number(searchParams.get('limit') ?? 12);
    const skip  = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Product.countDocuments(query),
    ]);
    return NextResponse.json({ products, total, page, pages: Math.ceil(total / limit) });
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'farmer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!session.user.isApproved) {
      return NextResponse.json({ error: 'Account not yet approved by admin' }, { status: 403 });
    }
    const body = await req.json();
    await connectDB();
    const farmer = await User.findById(session.user.id).lean();
    if (!farmer) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const product = await Product.create({
      ...body,
      farmerId:    session.user.id,
      farmerName:  farmer.name,
      farmerPhone: farmer.phone,
    });
    return NextResponse.json({ product }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
