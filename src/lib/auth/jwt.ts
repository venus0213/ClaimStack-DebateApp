import jwt, { SignOptions } from 'jsonwebtoken'
import type { StringValue } from 'ms'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN: StringValue | number = (process.env.JWT_EXPIRES_IN || '7d') as StringValue

export interface JWTPayload {
  userId: string
  email: string
  username: string
  role: string
}

export function signToken(payload: JWTPayload): string {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN,
  }
  return jwt.sign(payload, JWT_SECRET, options)
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    return decoded
  } catch (error) {
    return null
  }
}

export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return null
}

