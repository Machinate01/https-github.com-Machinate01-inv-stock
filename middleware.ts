import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'atlanta-medicare-inv-secret-2025');
const PUBLIC_PATHS = ['/login', '/api/auth/login'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) return NextResponse.next();
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) return NextResponse.next();

  const token = req.cookies.get('inv_session')?.value;
  if (!token) return NextResponse.redirect(new URL('/login', req.url));

  try {
    await jwtVerify(token, SECRET);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
