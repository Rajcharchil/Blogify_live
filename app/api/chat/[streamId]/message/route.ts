import { NextRequest, NextResponse } from 'next/server';
import { store, generateId } from '@/lib/store';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: Promise<{ streamId: string }> }) {
  const { streamId } = await params;
  try {
    const auth = requireAuth(request);
    const { content } = await request.json();
    if (!content) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const user = store.users.get(auth.id);
    const id = generateId();
    const message = {
      id,
      streamId,
      content,
      authorId: auth.id,
      authorUsername: user?.username || auth.username || 'anonymous',
      createdAt: new Date().toISOString(),
    };
    store.chatMessages.set(id, message);
    return NextResponse.json({ ...message, author: { id: auth.id, username: message.authorUsername } }, { status: 201 });
  } catch (error) {
    if ((error as any)?.status === 401) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
