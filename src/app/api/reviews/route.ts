import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import connectDB from '@/lib/mongodb';
import Review from '@/models/Review';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const orderId = searchParams.get('orderId');
    if (!userId && !orderId) {
      return NextResponse.json({ error: 'userId or orderId required' }, { status: 400 });
    }
    const filter = userId ? { toUserId: userId } : { orderId };
    const reviews = await Review.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ reviews });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { toUserId, orderId, rating, comment, timeliness, pricing, communication } = body;
    if (!toUserId || !orderId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const hasCategoryRatings = [timeliness, pricing, communication].every(v => typeof v === 'number' && v >= 1 && v <= 5);
    const overallRating = hasCategoryRatings
      ? Math.round((timeliness + pricing + communication) / 3)
      : Number(rating || 0);

    if (!overallRating || overallRating < 1 || overallRating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    await connectDB();
    const existing = await Review.findOne({ fromUserId: session.user.id, orderId });
    if (existing) return NextResponse.json({ error: 'Already reviewed' }, { status: 409 });

    const review = await Review.create({
      fromUserId:    session.user.id,
      fromUserName:  session.user.name,
      toUserId,
      orderId,
      rating:        overallRating,
      timeliness:    hasCategoryRatings ? timeliness : undefined,
      pricing:       hasCategoryRatings ? pricing : undefined,
      communication: hasCategoryRatings ? communication : undefined,
      comment:       comment ?? '',
    });
    return NextResponse.json({ review }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
