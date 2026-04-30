import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import ChatMessage from '@/models/ChatMessage';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'specialist') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get all unique farmers who have chatted with specialists
    // Farmers have room format: "farmer-{farmerId}"
    const chatRooms = await ChatMessage.aggregate([
      {
        $match: {
          room: { $regex: '^farmer-' },
        },
      },
      {
        $group: {
          _id: '$room',
          farmers: { $addToSet: '$senderId' },
        },
      },
    ]);

    // Extract farmer IDs from rooms
    const farmerIds = new Set<string>();
    chatRooms.forEach((room) => {
      // Room format is "farmer-{farmerId}"
      const farmerId = room._id.replace('farmer-', '');
      if (farmerId) farmerIds.add(farmerId);
    });

    // Fetch farmer details
    const farmers = await User.find(
      { _id: { $in: Array.from(farmerIds) }, role: 'farmer' },
      { name: 1, email: 1, location: 1 }
    ).lean();

    return NextResponse.json({ farmers });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
