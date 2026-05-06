import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { requireAuth } from '@/lib/auth';
import { saveStreams } from '@/lib/store';

export async function GET(request: NextRequest, { params }: { params: Promise<{ streamId: string }> }) {
  const { streamId } = await params;
  const stream = store.streams.get(streamId);
  if (!stream) return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
  const messages = Array.from(store.chatMessages.values())
    .filter(m => m.streamId === streamId)
    .slice(-50)
    .map(m => ({ ...m, author: { id: m.authorId, username: m.authorUsername } }));
  const creator = store.users.get(stream.authorId) || { id: stream.authorId, username: stream.authorUsername };
  return NextResponse.json({ ...stream, creator, chatMessages: messages });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ streamId: string }> }) {
  const { streamId } = await params;
  const stream = store.streams.get(streamId);
  if (!stream) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  try {
    const auth = requireAuth(request);
    if (stream.authorId !== auth.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const body = await request.json();
    const { authorId, authorUsername, viewerCount, createdAt, ...safeUpdates } = body || {};
    const updated = { ...stream, ...safeUpdates };
    store.streams.set(streamId, updated);
    saveStreams();
    return NextResponse.json(updated);
  } catch (error) {
    if ((error as any)?.status === 401) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed to update stream' }, { status: 500 });
  }
}
