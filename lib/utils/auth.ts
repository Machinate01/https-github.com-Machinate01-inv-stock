import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { cookies } from 'next/headers';
import { User } from '../types';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'atlanta-medicare-inv-secret-2025');
const COOKIE_NAME = 'inv_session';

export interface SessionPayload extends JWTPayload {
  userId: string;
  username: string;
  name: string;
  role: string;
  warehouseAccess: string[];
}

export async function createSession(user: User): Promise<string> {
  const payload: SessionPayload = {
    userId: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    warehouseAccess: user.warehouseAccess,
  };
  const token = await new SignJWT(payload as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .setIssuedAt()
    .sign(SECRET);
  return token;
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export { COOKIE_NAME };
