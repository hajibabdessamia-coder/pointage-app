import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

function computeCode(userId: string): string {
  return crypto
    .createHmac('sha256', process.env.ACTIVATION_SECRET!)
    .update(userId)
    .digest('hex')
    .slice(0, 12)
    .toUpperCase();
}

export async function POST(req: NextRequest) {
  const { userId, code } = await req.json();
  if (!userId || !code) return NextResponse.json({ valid: false });

  const expected = computeCode(userId);
  const entered  = (code as string).replace(/-/g, '').toUpperCase();

  return NextResponse.json({ valid: entered === expected });
}
