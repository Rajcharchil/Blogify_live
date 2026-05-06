import { NextRequest, NextResponse } from 'next/server';
import { store, generateId, slugify } from '@/lib/store';
import { requireAuth } from '@/lib/auth';
import { saveBlogs } from '@/lib/store';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const authorId = searchParams.get('authorId');
  const published = searchParams.get('published');
  const search = searchParams.get('q');
  
  let blogs = Array.from(store.blogs.values());
  
  if (authorId) blogs = blogs.filter(b => b.authorId === authorId);
  if (published !== null) blogs = blogs.filter(b => b.published === (published === 'true'));
  if (search) {
    const q = search.toLowerCase();
    blogs = blogs.filter(b => 
      b.title.toLowerCase().includes(q) || 
      b.content.toLowerCase().includes(q) ||
      b.tags.some(t => t.toLowerCase().includes(q))
    );
  }
  
  blogs = blogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  const enriched = blogs.map(blog => ({
    ...blog,
    author: { id: blog.authorId, username: blog.authorUsername },
    _count: {
      comments: Array.from(store.comments.values()).filter(c => c.blogId === blog.id).length,
      likes: blog.likes,
    }
  }));
  
  return NextResponse.json({ blogs: enriched, total: enriched.length });
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    const body = await request.json();
    const { title, content, excerpt, tags, published, keywords } = body;
    
    if (!title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const user = store.users.get(auth.id);
    const username = user?.username || auth.username || 'anonymous';
    
    const id = generateId();
    const slug = slugify(title, id);
    const blog = {
      id,
      title,
      slug,
      content: content || '',
      excerpt: excerpt || content?.substring(0, 200) || '',
      authorId: auth.id,
      authorUsername: username,
      tags: tags || keywords || [],
      views: 0,
      likes: 0,
      published: published !== false,
      likedBy: [] as string[],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: published !== false ? new Date().toISOString() : undefined,
    };
    
    store.blogs.set(id, blog);
    saveBlogs();
    return NextResponse.json({ ...blog, author: { id: auth.id, username } }, { status: 201 });
  } catch (error) {
    if ((error as any)?.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to create blog' }, { status: 500 });
  }
}
