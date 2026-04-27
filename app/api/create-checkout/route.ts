import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const { userId, userEmail } = await req.json();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'eur',
        product_data: {
          name: 'نظام الحضور والغياب',
          description: 'ترخيص دائم — دفعة واحدة بدون اشتراك',
        },
        unit_amount: Number(process.env.PRICE_CENTS ?? 9900), // 99€ افتراضي
      },
      quantity: 1,
    }],
    mode: 'payment',
    customer_email: userEmail,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/?payment=success`,
    cancel_url:   `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/`,
    metadata: { userId },
  });

  return NextResponse.json({ url: session.url });
}
