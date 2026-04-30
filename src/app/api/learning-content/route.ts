import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import connectDB from '@/lib/mongodb';
import LearningContent from '@/models/LearningContent';

// GET /api/learning-content — fetch approved content (public) or all (admin)
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const forAdmin = searchParams.get('admin') === 'true';
    const status   = searchParams.get('status');

    // Admin can see all; everyone else sees only approved
    let query: Record<string, unknown> = {};
    if (forAdmin && session?.user?.role === 'admin') {
      if (status && status !== 'all') query.status = status;
    } else {
      query.status = 'approved';
    }

    const items = await LearningContent.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST /api/learning-content — create new content
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = session.user.role as string;
    if (!['admin', 'specialist', 'farmer'].includes(role)) {
      return NextResponse.json({ error: 'Only farmers, specialists, and admins can submit content' }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, type, category, youtubeId, imageUrl, content, duration, readTime, tags, difficulty } = body;

    if (!title?.trim() || !description?.trim() || !type || !category) {
      return NextResponse.json({ error: 'Title, description, type and category are required' }, { status: 400 });
    }

    await connectDB();

    // Admin and specialist content auto-approved; farmer content is pending
    const status = role === 'admin' || role === 'specialist' ? 'approved' : 'pending';

    const item = await LearningContent.create({
      title:       title.trim(),
      description: description.trim(),
      type,
      category,
      youtubeId:   youtubeId?.trim() || '',
      imageUrl:    imageUrl?.trim() || '',
      content:     content?.trim() || '',
      duration:    duration?.trim() || '',
      readTime:    readTime?.trim() || '',
      tags:        Array.isArray(tags) ? tags.filter(Boolean) : [],
      difficulty:  difficulty || 'Beginner',
      author:      session.user.id,
      authorName:  session.user.name,
      authorRole:  role as 'admin' | 'specialist' | 'farmer',
      status,
    });

    const message =
      status === 'approved'
        ? 'Content published successfully!'
        : 'Content submitted for admin review. It will appear once approved.';

    return NextResponse.json({ item, message }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
