import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import connectDB from '@/lib/mongodb';
import ChatMessage from '@/models/ChatMessage';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const room = searchParams.get('room');
    if (!room) {
      return NextResponse.json({ error: 'room required' }, { status: 400 });
    }
    const messages = await ChatMessage.find({ room }).sort({ createdAt: 1 }).lean();
    return NextResponse.json({ messages });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { room, text } = body;
    if (!room || !text) {
      return NextResponse.json({ error: 'room and text are required' }, { status: 400 });
    }
    await connectDB();
    const message = await ChatMessage.create({
      room,
      senderId: session.user.id,
      senderName: session.user.name,
      senderRole: session.user.role,
      text,
    });
    return NextResponse.json({ message }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
