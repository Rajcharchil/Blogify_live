import jwt from 'jsonwebtoken'
import type { NextRequest } from 'next/server'

export type AuthUser = {
  id: string
  email: string
  username?: string
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not set')
  }
  return secret
}

export function signAuthToken(user: AuthUser) {
  return jwt.sign(user, getJwtSecret(), { expiresIn: '7d' })
}

export function getAuthUserFromRequest(req: NextRequest): AuthUser | null {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization')
  if (!auth) return null
  const m = auth.match(/^Bearer\s+(.+)$/i)
  if (!m) return null

  try {
    const payload = jwt.verify(m[1], getJwtSecret())
    if (typeof payload !== 'object' || payload === null) return null

    const id = (payload as any).id
    const email = (payload as any).email
    const username = (payload as any).username
    if (typeof id !== 'string' || typeof email !== 'string') return null

    return { id, email, username: typeof username === 'string' ? username : undefined }
  } catch {
    return null
  }
}

export function requireAuth(req: NextRequest): AuthUser {
  const user = getAuthUserFromRequest(req)
  if (!user) {
    const err = new Error('Unauthorized')
    ;(err as any).status = 401
    throw err
  }
  return user
}

