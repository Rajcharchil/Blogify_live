import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  // Find user by username (use index map for O(1) lookup)
  const user =
    store.usersByUsername.get(username.toLowerCase()) ??
    Array.from(store.users.values()).find(
      u => u.username.toLowerCase() === username.toLowerCase()
    );

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Get user's published blogs
  const blogs = Array.from(store.blogs.values())
    .filter(b => b.authorId === user.id && b.published)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(b => ({
      ...b,
      _count: {
        comments: Array.from(store.comments.values()).filter(c => c.blogId === b.id).length,
        likes: b.likes,
      },
    }));

  // Get user's streams
  const streams = Array.from(store.streams.values())
    .filter(s => s.authorId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalViews = blogs.reduce((sum, b) => sum + (b.views || 0), 0);
  const totalLikes = blogs.reduce((sum, b) => sum + (b.likes || 0), 0);

  const { password: _, ...safeUser } = user;

  return NextResponse.json({
    user: safeUser,
    blogs,
    streams,
    stats: {
      totalBlogs: blogs.length,
      totalViews,
      totalLikes,
      totalStreams: streams.length,
    },
  });
}
