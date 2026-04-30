import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import connectDB from '@/lib/mongodb';
import ProblemReport from '@/models/ProblemReport';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const farmerId = searchParams.get('farmerId');
    if (!farmerId) {
      return NextResponse.json({ error: 'farmerId required' }, { status: 400 });
    }
    const reports = await ProblemReport.find({ farmerId }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ reports });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.user.role !== 'farmer') {
      return NextResponse.json({ error: 'Only farmers can submit crop reports.' }, { status: 403 });
    }
    const body = await req.json();
    const { title, description, images } = body;
    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required.' }, { status: 400 });
    }
    await connectDB();
    const report = await ProblemReport.create({
      farmerId: session.user.id,
      farmerName: session.user.name,
      title,
      description,
      images: Array.isArray(images) ? images : [],
    });
    return NextResponse.json({ report }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
