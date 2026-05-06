import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { requireAuth } from '@/lib/auth';
import { saveBlogs } from '@/lib/store';

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const blog = Array.from(store.blogs.values()).find(b => b.slug === slug) || store.blogs.get(slug);
  if (!blog) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  try {
    const auth = requireAuth(request);
    const userId = auth.id;
    const alreadyLiked = blog.likedBy.includes(userId);
    if (alreadyLiked) {
      blog.likes = Math.max(0, blog.likes - 1);
      blog.likedBy = blog.likedBy.filter(id => id !== userId);
    } else {
      blog.likes = blog.likes + 1;
      blog.likedBy = [...blog.likedBy, userId];
    }
    store.blogs.set(blog.id, blog);
    saveBlogs();
    return NextResponse.json({ likes: blog.likes, liked: !alreadyLiked });
  } catch (error) {
    if ((error as any)?.status === 401) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed to like blog' }, { status: 500 });
  }
}
