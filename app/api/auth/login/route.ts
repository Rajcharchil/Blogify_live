import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import bcrypt from 'bcryptjs';
import { signAuthToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }
    const user = store.usersByEmail.get(email.toLowerCase());
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }
    const token = signAuthToken({ id: user.id, email: user.email, username: user.username });
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword, token });
  } catch (error) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
