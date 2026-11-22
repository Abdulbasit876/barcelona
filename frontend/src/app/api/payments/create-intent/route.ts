import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

const stripePublishableKey =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
  process.env.STRIPE_PUBLISHABLE_KEY ||
  '';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://ognvbtzvblxgjimpecsx.supabase.co';

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_p8QJkLY_mxv5Tj-6yqzu6Q_vJzTIcyu';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingReference, token, email } = body;

    if (!bookingReference) {
      return NextResponse.json(
        { message: 'bookingReference is required' },
        { status: 400 }
      );
    }

    // 1. Try forwarding to backend first if available
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.BACKEND_URL ||
      'http://localhost:4001/api/v1';

    try {
      const backendRes = await fetch(`${apiBase}/payments/create-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingReference, token, email }),
      });

      if (backendRes.ok) {
        const backendData = await backendRes.json();
        return NextResponse.json(backendData);
      }

      const errText = await backendRes.text();
      // If error is not a configuration missing issue, return backend error
      if (!errText.includes('not configured')) {
        try {
          return NextResponse.json(JSON.parse(errText), { status: backendRes.status });
        } catch {
          return NextResponse.json({ message: errText }, { status: backendRes.status });
        }
      }
    } catch {
      // Backend unreachable or offline, fallback to serverless handler below
    }

    // 2. Direct serverless fallback using Stripe + Supabase
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16' as any,
    });
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: booking, error: bErr } = await supabase
      .from('bookings')
      .select('*')
      .ilike('booking_reference', bookingReference.trim())
      .maybeSingle();

    if (bErr || !booking) {
      return NextResponse.json(
        { message: `Booking #${bookingReference} not found.` },
        { status: 404 }
      );
    }

    if (booking.status === 'CANCELLED') {
      return NextResponse.json(
        { message: 'Cannot process payment for a cancelled booking. Please create a new booking.' },
        { status: 400 }
      );
    }

    if (booking.payment_status === 'PAID') {
      return NextResponse.json(
        { message: 'This reservation is already paid in full.' },
        { status: 400 }
      );
    }

    const totalFare = Number(booking.total_fare || 0);
    const depositAmount = Number(booking.deposit_amount || totalFare);
    const amountToCharge = depositAmount > 0 ? depositAmount : totalFare;
    const amountCents = Math.round(amountToCharge * 100);

    let paymentIntent: Stripe.PaymentIntent | null = null;
    if (booking.stripe_payment_intent_id) {
      try {
        const existing = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id);
        if (
          existing.status === 'requires_payment_method' ||
          existing.status === 'requires_confirmation' ||
          existing.status === 'requires_action'
        ) {
          paymentIntent =
            existing.amount !== amountCents
              ? await stripe.paymentIntents.update(existing.id, { amount: amountCents })
              : existing;
        }
      } catch {
        // Create fresh
      }
    }

    if (!paymentIntent) {
      const idempotencyKey = `pi_create_${booking.id}_${amountCents}_${Date.now()}`;
      paymentIntent = await stripe.paymentIntents.create(
        {
          amount: amountCents,
          currency: 'eur',
          automatic_payment_methods: { enabled: true },
          metadata: {
            bookingReference: booking.booking_reference,
            bookingId: booking.id,
            accessToken: booking.access_token || '',
            customerEmail: booking.customer_email || email || '',
            customerName: booking.customer_name || '',
          },
          description: `Barcelona Taxi Transfer: Reservation #${booking.booking_reference}`,
          receipt_email: booking.customer_email || email || undefined,
        },
        { idempotencyKey }
      );

      await supabase
        .from('bookings')
        .update({
          stripe_payment_intent_id: paymentIntent.id,
          payment_status: 'PROCESSING',
        })
        .eq('id', booking.id);
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      publishableKey: stripePublishableKey,
      amountEur: amountToCharge,
      totalFareEur: totalFare,
      currency: 'EUR',
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Payment initialization error' },
      { status: 500 }
    );
  }
}

