import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import connectDB from '@/lib/mongodb';
import LearningContent from '@/models/LearningContent';

// POST /api/learning-content/[id]/review
// body: { action: 'approve' | 'reject', rejectionReason?: string }
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, rejectionReason } = await req.json();
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await connectDB();
    const item = await LearningContent.findById(params.id);
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    item.status = action === 'approve' ? 'approved' : 'rejected';
    if (action === 'reject' && rejectionReason) {
      item.rejectionReason = rejectionReason;
    }
    await item.save();

    const message = action === 'approve' ? 'Content approved and published.' : 'Content rejected.';
    return NextResponse.json({ message, item });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
