import { NextRequest, NextResponse } from 'next/server';
import { store, saveUsers } from '@/lib/store';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const user = store.users.get(userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  const { password: _, ...safe } = user;
  return NextResponse.json(safe);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const user = store.users.get(userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  try {
    const auth = requireAuth(request);
    if (auth.id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { password, email, id, createdAt, ...updates } = body || {};
    const updated = { ...user, ...updates };
    store.users.set(userId, updated);
    store.usersByEmail.set(updated.email, updated);
    store.usersByUsername.set(updated.username.toLowerCase(), updated);
    saveUsers();
    const { password: _, ...safe } = updated;
    return NextResponse.json(safe);
  } catch (error) {
    if ((error as any)?.status === 401) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
