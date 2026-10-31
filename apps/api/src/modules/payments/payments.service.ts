import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { BookingsService } from '../bookings/bookings.service';
import { BookingStatus, PaymentStatus } from '@barcelona/shared';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: Stripe | null = null;
  private processedWebhookEvents = new Set<string>();

  constructor(
    private readonly configService: ConfigService,
    private readonly bookingsService: BookingsService,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (secretKey && !secretKey.includes('placeholder')) {
      this.stripe = new Stripe(secretKey, {
        apiVersion: '2024-04-10' as any,
      });
    }
  }

  public async createCheckoutSession(
    bookingReference: string,
    token: string,
    locale = 'en',
    originUrl = 'http://localhost:3000',
  ) {
    const booking = this.bookingsService.getBookingByReference(bookingReference, token);

    // Validate booking status
    if (booking.status === BookingStatus.PENDING_APPROVAL) {
      throw new BadRequestException(
        'This booking is currently pending dispatcher approval. Payment will become available once confirmed.',
      );
    }

    if (booking.revisedFare && !booking.hasCustomerAcceptedRevision) {
      throw new BadRequestException(
        'A revised fare has been set by our team. Please review and accept the revised fare before proceeding to payment.',
      );
    }

    if (booking.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('This reservation is already paid in full.');
    }

    const finalAmountCents = Math.round(booking.fareBreakdown.totalFare * 100);

    // If Stripe is configured with a real API key
    if (this.stripe) {
      try {
        const session = await this.stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: 'payment',
          currency: 'eur',
          customer_email: booking.customerEmail,
          line_items: [
            {
              price_data: {
                currency: 'eur',
                unit_amount: finalAmountCents,
                product_data: {
                  name: `Barcelona Taxi Transfer: ${booking.transferType.replace('_', ' ')}`,
                  description: `${booking.pickupAddress} ➔ ${booking.destinationAddress}`,
                },
              },
              quantity: 1,
            },
          ],
          metadata: {
            bookingReference: booking.bookingReference,
            accessToken: booking.accessToken,
            expectedFareCents: finalAmountCents.toString(),
          },
          success_url: `${originUrl}/${locale}/booking-confirmation/${booking.bookingReference}?token=${booking.accessToken}&payment_success=true`,
          cancel_url: `${originUrl}/${locale}/manage-booking?ref=${booking.bookingReference}&token=${booking.accessToken}&payment_cancelled=true`,
        });

        return {
          sessionId: session.id,
          url: session.url,
          isMock: false,
        };
      } catch (err: any) {
        this.logger.error(`Stripe checkout session creation failed: ${err.message}`);
        throw new BadRequestException(`Stripe error: ${err.message}`);
      }
    }

    // Graceful test-mode simulation when live Stripe keys are not yet provided in .env
    this.logger.warn('Stripe secret key not configured or in test mode. Providing simulated test checkout.');
    const mockSessionId = `cs_test_mock_${Date.now()}_${booking.bookingReference}`;
    return {
      sessionId: mockSessionId,
      url: `${originUrl}/${locale}/booking-confirmation/${booking.bookingReference}?token=${booking.accessToken}&payment_success=true&mock_payment=true`,
      isMock: true,
      amountEur: booking.fareBreakdown.totalFare,
    };
  }

  public async handleStripeWebhook(signature: string, rawBody: Buffer) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    let event: Stripe.Event;

    if (this.stripe && webhookSecret) {
      try {
        event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      } catch (err: any) {
        this.logger.error(`Webhook signature verification failed: ${err.message}`);
        throw new BadRequestException(`Webhook Error: ${err.message}`);
      }
    } else {
      // In dev/test mode without webhook secret
      event = JSON.parse(rawBody.toString());
    }

    // Idempotency check: prevent duplicate event processing
    if (this.processedWebhookEvents.has(event.id)) {
      this.logger.log(`Webhook event ${event.id} already processed. Skipping duplicate.`);
      return { received: true, duplicate: true };
    }
    this.processedWebhookEvents.add(event.id);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingRef = session.metadata?.bookingReference;
      const token = session.metadata?.accessToken;

      if (bookingRef) {
        const booking = this.bookingsService.getBookingByReference(bookingRef, token);
        booking.paymentStatus = PaymentStatus.PAID;
        booking.status = BookingStatus.CONFIRMED;
        this.logger.log(`Payment confirmed via Stripe webhook for booking ${bookingRef}`);
      }
    }

    return { received: true };
  }

  public simulateConfirmPayment(bookingReference: string, token: string) {
    const booking = this.bookingsService.getBookingByReference(bookingReference, token);
    booking.paymentStatus = PaymentStatus.PAID;
    if (booking.status === BookingStatus.PENDING_APPROVAL || booking.status === BookingStatus.PAYMENT_PENDING) {
      booking.status = BookingStatus.CONFIRMED;
    }
    return {
      success: true,
      message: 'Payment verified and booking confirmed.',
      booking,
    };
  }
}
