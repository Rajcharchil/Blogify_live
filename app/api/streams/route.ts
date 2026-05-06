import { NextRequest, NextResponse } from 'next/server';
import { store, generateId } from '@/lib/store';
import { requireAuth } from '@/lib/auth';
import { saveStreams } from '@/lib/store';

export async function GET() {
  const streams = Array.from(store.streams.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(s => ({ ...s, author: { id: s.authorId, username: s.authorUsername } }));
  return NextResponse.json({ streams, total: streams.length });
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    const { title, description } = await request.json();
    if (!title) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const user = store.users.get(auth.id);
    const id = generateId();
    const stream = {
      id,
      title,
      description: description || '',
      authorId: auth.id,
      authorUsername: user?.username || auth.username || 'anonymous',
      status: 'scheduled',
      viewerCount: 0,
      createdAt: new Date().toISOString(),
    };
    store.streams.set(id, stream);
    saveStreams();
    return NextResponse.json({ ...stream, author: { id: auth.id, username: stream.authorUsername } }, { status: 201 });
  } catch (error) {
    if ((error as any)?.status === 401) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed to create stream' }, { status: 500 });
  }
}
