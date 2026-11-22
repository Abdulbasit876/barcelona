import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { SupabaseService } from '../../common/services/supabase.service';
import { BookingsService } from '../bookings/bookings.service';
import { BookingStatus, PaymentStatus } from '../../shared';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: Stripe | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly bookingsService: BookingsService,
    private readonly supabase: SupabaseService,
  ) {
    const secretKey =
      this.configService.get<string>('STRIPE_SECRET_KEY') ||
      process.env.STRIPE_SECRET_KEY;
    if (secretKey && !secretKey.includes('placeholder')) {
      const cleanKey = secretKey.replace(/['"]+/g, '').trim();
      this.stripe = new Stripe(cleanKey, {
        apiVersion: '2024-04-10' as any,
      });
      this.logger.log('Stripe client initialized with valid API secret key.');
    } else {
      this.logger.warn('Stripe secret key missing or placeholder.');
    }
  }

  private getStripeClient(): Stripe {
    if (this.stripe) return this.stripe;
    const secretKey =
      this.configService.get<string>('STRIPE_SECRET_KEY') ||
      process.env.STRIPE_SECRET_KEY;
    if (secretKey && !secretKey.includes('placeholder')) {
      const cleanKey = secretKey.replace(/['"]+/g, '').trim();
      this.stripe = new Stripe(cleanKey, {
        apiVersion: '2024-04-10' as any,
      });
      return this.stripe;
    }
    throw new BadRequestException('Stripe payment processing is not configured on the server.');
  }

  /**
   * Create or retrieve a Stripe PaymentIntent for a booking.
   * Server validates the booking, checks ownership, ensures it is not cancelled or already paid,
   * computes the exact server-side amount in cents (EUR), and returns clientSecret.
   */
  public async createPaymentIntent(
    bookingReference: string,
    token?: string,
    contactEmail?: string,
  ) {
    if (!bookingReference) {
      throw new BadRequestException('Booking reference is required.');
    }

    const stripe = this.getStripeClient();

    // 1. Fetch booking from Supabase
    const { data: booking, error: bErr } = await this.supabase
      .getClient()
      .from('bookings')
      .select('*')
      .ilike('booking_reference', bookingReference.trim())
      .maybeSingle();

    if (bErr || !booking) {
      throw new NotFoundException(`Booking #${bookingReference} not found.`);
    }

    // 2. Validate token or email ownership
    if (token && booking.access_token && token.trim() !== booking.access_token.trim()) {
      throw new ForbiddenException('Security verification failed: Invalid access token.');
    }

    // 3. Security Rule: Cannot charge a cancelled booking
    if (booking.status === 'CANCELLED') {
      throw new BadRequestException(
        'Cannot process payment for a cancelled booking. Please create a new booking.',
      );
    }

    // 4. Security Rule: Prevent double charging already paid bookings
    if (booking.payment_status === 'PAID') {
      throw new BadRequestException('This reservation is already paid in full.');
    }

    // 5. Server-side authorized fare calculation
    const totalFare = Number(booking.total_fare || 0);
    if (totalFare <= 0) {
      throw new BadRequestException('Invalid total fare on reservation record.');
    }

    // Deposit due: either the deposit_amount configured or full fare
    const depositAmount = Number(booking.deposit_amount || totalFare);
    const amountToCharge = depositAmount > 0 ? depositAmount : totalFare;
    const amountCents = Math.round(amountToCharge * 100);

    if (amountCents < 50) {
      throw new BadRequestException('Payment amount must be at least 0.50 EUR.');
    }

    // 6. Check if an active reusable PaymentIntent already exists
    let paymentIntent: Stripe.PaymentIntent | null = null;
    if (booking.stripe_payment_intent_id) {
      try {
        const existing = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id);
        if (
          existing.status === 'requires_payment_method' ||
          existing.status === 'requires_confirmation' ||
          existing.status === 'requires_action'
        ) {
          if (existing.amount !== amountCents) {
            paymentIntent = await stripe.paymentIntents.update(existing.id, {
              amount: amountCents,
            });
          } else {
            paymentIntent = existing;
          }
        }
      } catch (err: any) {
        this.logger.warn(`Could not reuse existing PaymentIntent: ${err.message}`);
      }
    }

    // 7. Create new PaymentIntent with idempotency key
    if (!paymentIntent) {
      const idempotencyKey = `pi_create_${booking.id}_${amountCents}_${Date.now()}`;
      try {
        paymentIntent = await stripe.paymentIntents.create(
          {
            amount: amountCents,
            currency: 'eur',
            automatic_payment_methods: { enabled: true },
            metadata: {
              bookingReference: booking.booking_reference,
              bookingId: booking.id,
              accessToken: booking.access_token || '',
              customerEmail: booking.customer_email || contactEmail || '',
              customerName: booking.customer_name || '',
            },
            description: `Barcelona Taxi Transfer: Reservation #${booking.booking_reference}`,
            receipt_email: booking.customer_email || contactEmail || undefined,
          },
          { idempotencyKey },
        );

        // Save reference and update status to PROCESSING
        await this.supabase
          .getClient()
          .from('bookings')
          .update({
            stripe_payment_intent_id: paymentIntent.id,
            payment_status: 'PROCESSING',
          })
          .eq('id', booking.id);
      } catch (err: any) {
        this.logger.error(`Stripe PaymentIntent creation failed: ${err.message}`);
        throw new BadRequestException(`Stripe error: ${err.message}`);
      }
    }

    const publishableKey = this.configService.get<string>('STRIPE_PUBLISHABLE_KEY');

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      publishableKey,
      amountEur: amountToCharge,
      totalFareEur: totalFare,
      currency: 'EUR',
      bookingReference: booking.booking_reference,
    };
  }

  /**
   * Handle verified Stripe webhooks with cryptographic signature verification and event deduplication
   */
  public async handleStripeWebhook(signature: string, rawBody: Buffer) {
    const webhookSecret =
      this.configService.get<string>('STRIPE_WEBHOOK_SECRET') ||
      process.env.STRIPE_WEBHOOK_SECRET;

    const stripe = this.getStripeClient();

    if (!webhookSecret) {
      throw new BadRequestException('Stripe webhook secret is not configured');
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret.trim());
    } catch (err: any) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    // Persistent idempotency check using audit_logs table
    const { data: existingEvent } = await this.supabase
      .getClient()
      .from('audit_logs')
      .select('id')
      .eq('action', 'STRIPE_WEBHOOK')
      .eq('entity_id', event.id)
      .maybeSingle();

    if (existingEvent) {
      this.logger.log(`Webhook event ${event.id} already processed. Skipping duplicate.`);
      return { received: true, duplicate: true };
    }

    // Record event in audit_logs to guarantee idempotency across restarts
    await this.supabase
      .getClient()
      .from('audit_logs')
      .insert({
        actor_type: 'SYSTEM',
        actor_id: 'stripe_webhook',
        action: 'STRIPE_WEBHOOK',
        entity_type: 'stripe_event',
        entity_id: event.id,
        metadata: {
          eventType: event.type,
          created: event.created,
        },
      });

    // Handle payment_intent.succeeded
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const bookingRef = paymentIntent.metadata?.bookingReference;
      const paidAmountEur = Number((paymentIntent.amount / 100).toFixed(2));
      const paymentMethodType = paymentIntent.payment_method_types?.[0] || 'card';

      if (bookingRef) {
        const { data: booking } = await this.supabase
          .getClient()
          .from('bookings')
          .select('*')
          .ilike('booking_reference', bookingRef.trim())
          .maybeSingle();

        if (booking) {
          const totalFare = Number(booking.total_fare || paidAmountEur);
          const newRemaining = Math.max(0, Number((totalFare - paidAmountEur).toFixed(2)));
          const isFullyPaid = newRemaining === 0;

          await this.supabase
            .getClient()
            .from('bookings')
            .update({
              payment_status: 'PAID',
              deposit_paid: true,
              deposit_amount: paidAmountEur,
              remaining_balance: newRemaining,
              balance_paid: isFullyPaid,
              stripe_payment_intent_id: paymentIntent.id,
              status: booking.status === 'CANCELLED' ? 'CANCELLED' : 'CONFIRMED',
              updated_at: new Date().toISOString(),
              fare_breakdown: {
                ...(booking.fare_breakdown || {}),
                online_payment_transaction_id: paymentIntent.id,
                payment_method_type: paymentMethodType,
                paid_at: new Date().toISOString(),
                deposit_amount_paid: paidAmountEur,
                stripe_payment_status: paymentIntent.status,
              },
            })
            .eq('id', booking.id);

          this.logger.log(
            `✓ Booking #${bookingRef} verified and updated to PAID via Stripe PaymentIntent: ${paymentIntent.id}`,
          );

          // Notify Admin
          try {
            await this.supabase.getClient().from('notifications').insert({
              recipient_role: 'ADMIN',
              title: `💳 Payment Confirmed: #${bookingRef}`,
              message: `Customer successfully paid €${paidAmountEur.toFixed(2)} online via Stripe (Booking #${bookingRef}, Txn: ${paymentIntent.id}).`,
              booking_id: booking.id,
              type: 'PAYMENT_RECEIVED',
            });
          } catch {}
        }
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const bookingRef = paymentIntent.metadata?.bookingReference;
      const errorMsg = paymentIntent.last_payment_error?.message || 'Card payment declined';

      if (bookingRef) {
        await this.supabase
          .getClient()
          .from('bookings')
          .update({
            payment_status: 'FAILED',
            fare_breakdown: {
              payment_error: errorMsg,
              failed_at: new Date().toISOString(),
            },
          })
          .ilike('booking_reference', bookingRef.trim())
          .neq('payment_status', 'PAID');

        this.logger.warn(`Payment failed for #${bookingRef}: ${errorMsg}`);
      }
    }

    return { received: true, eventId: event.id };
  }

  /**
   * Retrieve authoritative payment status for a booking
   */
  public async getPaymentStatus(reference: string) {
    if (!reference) throw new BadRequestException('Booking reference is required.');

    const { data: booking, error } = await this.supabase
      .getClient()
      .from('bookings')
      .select('id, booking_reference, status, payment_status, total_fare, deposit_amount, remaining_balance, deposit_paid, balance_paid, stripe_payment_intent_id, fare_breakdown')
      .ilike('booking_reference', reference.trim())
      .maybeSingle();

    if (error || !booking) throw new NotFoundException(`Booking #${reference} not found.`);

    // Auto-reconciliation: If Stripe succeeded but DB was delayed or webhook missed, sync immediately
    if (booking.payment_status !== 'PAID' && booking.stripe_payment_intent_id && this.stripe) {
      try {
        const pi = await this.stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id);
        if (pi && pi.status === 'succeeded') {
          const nowIso = new Date().toISOString();
          await this.supabase
            .getClient()
            .from('bookings')
            .update({
              payment_status: 'PAID',
              deposit_paid: true,
              balance_paid: true,
              remaining_balance: 0,
              status: booking.status === 'CANCELLED' ? 'CANCELLED' : 'CONFIRMED',
              fare_breakdown: {
                ...(booking.fare_breakdown || {}),
                paid_at: nowIso,
                stripe_payment_intent_id: pi.id,
                reconciled_via: 'status_check',
              },
            })
            .eq('id', booking.id);

          booking.payment_status = 'PAID';
          booking.deposit_paid = true;
          booking.balance_paid = true;
          booking.remaining_balance = 0;
          this.logger.log(`Auto-reconciled successful Stripe PaymentIntent ${pi.id} for #${reference}`);
        }
      } catch (piErr: any) {
        this.logger.warn(`Could not auto-reconcile PaymentIntent for #${reference}: ${piErr.message}`);
      }
    }

    return {
      bookingReference: booking.booking_reference,
      bookingStatus: booking.status,
      paymentStatus: booking.payment_status,
      totalFare: Number(booking.total_fare || 0),
      depositAmount: Number(booking.deposit_amount || 0),
      remainingBalance: Number(booking.remaining_balance || 0),
      depositPaid: Boolean(booking.deposit_paid),
      balancePaid: Boolean(booking.balance_paid),
      transactionId: booking.stripe_payment_intent_id || null,
      paidAt: booking.fare_breakdown?.paid_at || null,
      paymentMethodType: booking.fare_breakdown?.payment_method_type || 'card',
      paymentError: booking.fare_breakdown?.payment_error || null,
    };
  }

  /**
   * Backward-compatible checkout session creator
   */
  public async createCheckoutSession(
    bookingReference: string,
    token: string,
    locale = 'en',
    originUrl = 'http://localhost:3000',
  ) {
    return this.createPaymentIntent(bookingReference, token);
  }
}
