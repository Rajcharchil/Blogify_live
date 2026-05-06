import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { requireAuth } from '@/lib/auth';
import { saveBlogs } from '@/lib/store';

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  let blog = Array.from(store.blogs.values()).find(b => b.slug === slug);
  if (!blog) blog = store.blogs.get(slug);
  
  if (!blog) {
    return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
  }
  
  // Increment view count
  blog.views = (blog.views || 0) + 1;
  store.blogs.set(blog.id, blog);
  
  const author = store.users.get(blog.authorId) || { id: blog.authorId, username: blog.authorUsername };
  const comments = Array.from(store.comments.values())
    .filter(c => c.blogId === blog!.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(c => ({
      ...c,
      author: { id: c.authorId, username: c.authorUsername }
    }));
  
  return NextResponse.json({
    ...blog,
    author: { id: author.id, username: (author as any).username, bio: (author as any).bio },
    comments,
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const blog = Array.from(store.blogs.values()).find(b => b.slug === slug) || store.blogs.get(slug);
  if (!blog) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  
  try {
    const auth = requireAuth(request);
    if (blog.authorId !== auth.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { authorId, authorUsername, likes, likedBy, views, createdAt, ...safeUpdates } = body || {};
    const updated = { ...blog, ...safeUpdates, updatedAt: new Date().toISOString() };
    store.blogs.set(blog.id, updated);
    saveBlogs();
    return NextResponse.json(updated);
  } catch (error) {
    if ((error as any)?.status === 401) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed to update blog' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const blog = Array.from(store.blogs.values()).find(b => b.slug === slug) || store.blogs.get(slug);
  if (!blog) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  try {
    const auth = requireAuth(request);
    if (blog.authorId !== auth.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    store.blogs.delete(blog.id);
    saveBlogs();
    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as any)?.status === 401) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed to delete blog' }, { status: 500 });
  }
}
