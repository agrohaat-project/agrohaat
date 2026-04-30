import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import connectDB from '@/lib/mongodb';
import ChatMessage from '@/models/ChatMessage';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'specialist') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get all unique farmers who have chatted with specialists
    const chatRooms = await ChatMessage.aggregate([
      {
        $match: {
          room: { $regex: '^farmer-' },
        },
      },
      {
        $group: {
          _id: '$room',
          lastMessage: { $last: '$text' },
          lastMessageTime: { $last: '$createdAt' },
          messages: { $push: '$$ROOT' },
        },
      },
      {
        $sort: { lastMessageTime: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // Fetch farmer details and count unread messages
    const recentConversations = await Promise.all(
      chatRooms.map(async (room) => {
        const farmerId = room._id.replace('farmer-', '');
        const farmer = await User.findById(farmerId, { name: 1 }).lean();

        const unreadCount = room.messages.filter(
          (msg: Record<string, unknown>) => msg.senderRole === 'farmer'
        ).length;

        return {
          farmerId,
          farmerName: farmer?.name || 'Unknown Farmer',
          lastMessage: room.lastMessage || 'No messages',
          lastMessageTime: new Date(room.lastMessageTime).toLocaleDateString(),
          unreadCount,
        };
      })
    );

    // Get overall stats
    const allFarmers = await ChatMessage.aggregate([
      {
        $match: {
          room: { $regex: '^farmer-' },
        },
      },
      {
        $group: {
          _id: '$room',
        },
      },
    ]);

    const totalFarmers = allFarmers.length;

    // Count active conversations (with messages in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activeConversations = await ChatMessage.aggregate([
      {
        $match: {
          room: { $regex: '^farmer-' },
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: '$room',
        },
      },
    ]);

    // Count unreplied farmer messages
    const latestMessages = await ChatMessage.aggregate([
      {
        $match: {
          room: { $regex: '^farmer-' },
        },
      },
      {
        $group: {
          _id: '$room',
          lastMessageRole: { $last: '$senderRole' },
        },
      },
    ]);

    const unrepliedMessages = latestMessages.filter(
      (room) => room.lastMessageRole === 'farmer'
    ).length;

    return NextResponse.json({
      activeConversations: activeConversations.length,
      totalFarmers,
      unrepliedMessages,
      recentConversations,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
