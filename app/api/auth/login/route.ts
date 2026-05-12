import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { readJson } from '@/lib/data/db';
import { User } from '@/lib/types';
import { createSession, COOKIE_NAME } from '@/lib/utils/auth';

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  const users = readJson<User>('users.json');
  const user = users.find(u => u.username === username && u.active);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return NextResponse.json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
  }
  const token = await createSession(user);
  const res = NextResponse.json({ success: true, user: { id: user.id, username: user.username, name: user.name, role: user.role } });
  res.cookies.set(COOKIE_NAME, token, { httpOnly: true, maxAge: 60 * 60 * 8, path: '/', sameSite: 'lax' });
  return res;
}
