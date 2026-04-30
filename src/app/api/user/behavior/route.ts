import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import LearningContent from '@/models/LearningContent';
import mongoose from 'mongoose';

// GET /api/user/behavior — return processed behavior signals for the recommendation engine
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const user = await User.findById(session.user.id)
      .select('interests viewedContent clickedCategories searchHistory')
      .lean() as {
        interests?: string[];
        viewedContent?: { contentId: string; tags: string[]; viewedAt: Date }[];
        clickedCategories?: { category: string; clickedAt: Date }[];
        searchHistory?: { query: string; searchedAt: Date }[];
      } | null;

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const recentViews = (user.viewedContent ?? []).slice(-15);
    const recentViewTags = Array.from(
      new Set(recentViews.flatMap(v => (v.tags ?? []).map(t => t.toLowerCase())))
    );

    const recentCategories = Array.from(
      new Set((user.clickedCategories ?? []).slice(-15).map(c => c.category))
    ).slice(0, 5);

    const recentSearches = (user.searchHistory ?? []).slice(-5).map(s => s.query);

    const hasData =
      (user.interests?.length ?? 0) > 0 ||
      recentViews.length > 0 ||
      recentCategories.length > 0;

    return NextResponse.json({
      interests: user.interests ?? [],
      recentViewTags,
      recentCategories,
      recentSearches,
      hasData,
    });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST /api/user/behavior — record a user behavior event
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { type, contentId, tags, category, query } = body;

    await connectDB();

    if (type === 'view' && contentId && Array.isArray(tags)) {
      await User.updateOne(
        { _id: session.user.id },
        {
          $push: {
            viewedContent: {
              $each: [{ contentId, tags, viewedAt: new Date() }],
              $slice: -20,
            },
          },
        }
      );
      // Only increment viewCount for real DB documents
      if (mongoose.Types.ObjectId.isValid(contentId)) {
        await LearningContent.updateOne({ _id: contentId }, { $inc: { viewCount: 1 } });
      }
    } else if (type === 'category_click' && category) {
      await User.updateOne(
        { _id: session.user.id },
        {
          $push: {
            clickedCategories: {
              $each: [{ category, clickedAt: new Date() }],
              $slice: -20,
            },
          },
        }
      );
    } else if (type === 'search' && typeof query === 'string' && query.trim()) {
      await User.updateOne(
        { _id: session.user.id },
        {
          $push: {
            searchHistory: {
              $each: [{ query: query.trim(), searchedAt: new Date() }],
              $slice: -20,
            },
          },
        }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
