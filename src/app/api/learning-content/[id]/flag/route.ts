import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import connectDB from '@/lib/mongodb';
import LearningContent from '@/models/LearningContent';

// POST /api/learning-content/[id]/flag
// body: { reason: string }
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Please sign in to report content' }, { status: 401 });

    const { reason } = await req.json();
    if (!reason?.trim()) {
      return NextResponse.json({ error: 'Please provide a reason for reporting' }, { status: 400 });
    }

    await connectDB();
    const item = await LearningContent.findById(params.id);
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Prevent duplicate flags from same user
    const alreadyFlagged = item.flags.some(f => f.userId === session.user.id);
    if (alreadyFlagged) {
      return NextResponse.json({ error: 'You have already reported this content' }, { status: 400 });
    }

    item.flags.push({ userId: session.user.id, reason: reason.trim(), createdAt: new Date() });
    item.flagCount = item.flags.length;

    // Auto-hide content if flagged 5+ times (pending re-review)
    if (item.flagCount >= 5) {
      item.status = 'pending';
    }

    await item.save();
    return NextResponse.json({ message: 'Content reported. Our team will review it shortly.' });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
