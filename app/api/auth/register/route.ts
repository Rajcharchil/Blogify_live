import { NextRequest, NextResponse } from 'next/server';
import { store, generateId, saveUsers } from '@/lib/store';
import bcrypt from 'bcryptjs';
import { signAuthToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, username, password, fullName } = await request.json();
    if (!email || !username || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const emailLower = email.toLowerCase();
    const usernameLower = username.toLowerCase();

    if (store.usersByEmail.has(emailLower)) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
    }
    if (store.usersByUsername.has(usernameLower)) {
      return NextResponse.json({ error: 'This username is already taken' }, { status: 400 });
    }

    const id = generateId();
    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
      id,
      email: emailLower,
      username: usernameLower,
      fullName: fullName || username,
      password: passwordHash,
      bio: '',
      avatar: undefined,
      createdAt: new Date().toISOString(),
    };
    store.users.set(id, user);
    store.usersByEmail.set(emailLower, user);
    store.usersByUsername.set(usernameLower, user);

    // Persist to disk so users survive server restarts
    saveUsers();

    const token = signAuthToken({ id: user.id, email: user.email, username: user.username });
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword, token }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
