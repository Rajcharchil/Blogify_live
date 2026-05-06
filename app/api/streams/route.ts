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
    const body = await request.json();
    const { title, description, authorId, authorUsername } = body;

    if (!authorId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find user in store
    const user = store.users.get(authorId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found - please logout and login again' },
        { status: 404 }
      );
    }

    const id = generateId();
    const stream = {
      id,
      title: title || 'Untitled Stream',
      description: description || '',
      authorId: user.id,
      authorUsername: user.username,
      status: 'offline',
      viewerCount: 0,
      createdAt: new Date().toISOString(),
    };

    store.streams.set(id, stream);
    saveStreams();

    return NextResponse.json({ stream }, { status: 201 });
  } catch (error) {
    console.error('Stream create error:', error);
    return NextResponse.json(
      { error: 'Failed to create stream' },
      { status: 500 }
    );
  }
}
