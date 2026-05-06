import { NextRequest, NextResponse } from 'next/server';
import { store, generateId } from '@/lib/store';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const blog = Array.from(store.blogs.values()).find(b => b.slug === slug) || store.blogs.get(slug);
  const blogId = blog?.id || slug;
  const comments = Array.from(store.comments.values())
    .filter(c => c.blogId === blogId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(c => ({ ...c, author: { id: c.authorId, username: c.authorUsername } }));
  return NextResponse.json({ comments, total: comments.length });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const blog = Array.from(store.blogs.values()).find(b => b.slug === slug) || store.blogs.get(slug);
  const blogId = blog?.id || slug;
  try {
    const auth = requireAuth(request);
    const { content } = await request.json();
    if (!content) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const user = store.users.get(auth.id);
  const id = generateId();
    const comment = { id, blogId, content, authorId: auth.id, authorUsername: user?.username || auth.username || 'anonymous', createdAt: new Date().toISOString() };
  store.comments.set(id, comment);
    return NextResponse.json({ ...comment, author: { id: auth.id, username: comment.authorUsername } }, { status: 201 });
  } catch (error) {
    if ((error as any)?.status === 401) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
