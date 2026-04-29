import { NextResponse } from 'next/server';
import { createHash } from 'crypto';

export async function POST(request: Request) {
  const { password } = await request.json();

  if (!password) {
    return NextResponse.json({ error: 'Missing password' }, { status: 400 });
  }

  const hash = createHash('sha256').update(password).digest('hex');
  const expected = process.env.ADMIN_PASSWORD_HASH;

  if (!expected) {
    return NextResponse.json({ error: 'Admin not configured' }, { status: 500 });
  }

  if (hash !== expected) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
