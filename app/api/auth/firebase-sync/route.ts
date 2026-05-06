import { NextRequest, NextResponse } from 'next/server';
import { store, saveUsers } from '@/lib/store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, email, displayName, photoURL, username, fullName } = body;

    if (!uid || !email) {
      return NextResponse.json({ error: 'Missing uid or email' }, { status: 400 });
    }

    let existingUser = store.users.get(uid);

    if (existingUser) {
      const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(existingUser.username)}`;
      let updated = false;

      if (photoURL && existingUser.avatar !== photoURL) {
        existingUser.avatar = photoURL;
        updated = true;
      } else if (!existingUser.avatar) {
        existingUser.avatar = defaultAvatar;
        updated = true;
      }

      if (updated) {
        store.users.set(uid, existingUser);
        store.usersByEmail.set(email.toLowerCase(), existingUser);
        saveUsers();
      }
      return NextResponse.json({
        user: {
          id: existingUser.id,
          email: existingUser.email,
          username: existingUser.username,
          fullName: existingUser.fullName,
          avatar: existingUser.avatar,
        }
      });
    }

    let finalUsername = username ||
      (displayName ? displayName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') : null) ||
      email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');

    let usernameCandidate = finalUsername;
    let counter = 1;
    while (store.usersByUsername.get(usernameCandidate)) {
      usernameCandidate = `${finalUsername}_${counter}`;
      counter++;
    }
    finalUsername = usernameCandidate;

    const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(finalUsername)}`;

    const newUser = {
      id: uid,
      email: email.toLowerCase(),
      username: finalUsername,
      fullName: fullName || displayName || finalUsername,
      password: '',
      avatar: photoURL || defaultAvatar,
      createdAt: new Date().toISOString(),
    };

    store.users.set(uid, newUser);
    store.usersByEmail.set(email.toLowerCase(), newUser);
    store.usersByUsername.set(finalUsername, newUser);
    saveUsers();

    return NextResponse.json({
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        fullName: newUser.fullName,
        avatar: newUser.avatar,
      }
    });
  } catch (error) {
    console.error('Firebase sync error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
