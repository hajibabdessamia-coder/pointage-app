import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const { userId, adminPassword } = await req.json();

  if (!process.env.ADMIN_PASSWORD || !process.env.ACTIVATION_SECRET) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hex = crypto
    .createHmac('sha256', process.env.ACTIVATION_SECRET)
    .update(userId)
    .digest('hex')
    .slice(0, 12)
    .toUpperCase();

  const code = `${hex.slice(0,4)}-${hex.slice(4,8)}-${hex.slice(8,12)}`;
  return NextResponse.json({ code });
}
