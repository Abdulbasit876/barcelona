import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller(['api/v1/payments', 'payments'])
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-intent')
  @ApiOperation({ summary: 'Create or retrieve a Stripe PaymentIntent for a booking' })
  async createPaymentIntent(
    @Body()
    body: {
      bookingReference: string;
      token?: string;
      email?: string;
    },
  ) {
    if (!body.bookingReference) {
      throw new BadRequestException('bookingReference is required');
    }
    return this.paymentsService.createPaymentIntent(
      body.bookingReference,
      body.token,
      body.email,
    );
  }

  @Post('create-checkout-session')
  @ApiOperation({ summary: 'Create a Stripe Checkout session or PaymentIntent for an approved booking' })
  async createCheckoutSession(
    @Body()
    body: {
      bookingReference: string;
      token?: string;
      locale?: string;
      originUrl?: string;
    },
  ) {
    if (!body.bookingReference) {
      throw new BadRequestException('bookingReference is required');
    }
    return this.paymentsService.createPaymentIntent(
      body.bookingReference,
      body.token,
    );
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Handle verified Stripe payment webhooks with raw body' })
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: any,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }
    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));
    return this.paymentsService.handleStripeWebhook(signature, rawBody);
  }

  @Get('status/:reference')
  @ApiOperation({ summary: 'Get current payment status for a booking' })
  async getPaymentStatus(@Param('reference') reference: string) {
    return this.paymentsService.getPaymentStatus(reference);
  }
}
