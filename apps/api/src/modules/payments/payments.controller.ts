import { Controller, Post, Body, Req, Headers, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-checkout-session')
  @ApiOperation({ summary: 'Create a Stripe Checkout session for an approved booking' })
  async createCheckoutSession(
    @Body()
    body: {
      bookingReference: string;
      token: string;
      locale?: string;
      originUrl?: string;
    },
  ) {
    if (!body.bookingReference || !body.token) {
      throw new BadRequestException('bookingReference and token are required');
    }
    return this.paymentsService.createCheckoutSession(
      body.bookingReference,
      body.token,
      body.locale,
      body.originUrl,
    );
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Handle verified Stripe payment webhooks' })
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: any,
  ) {
    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));
    return this.paymentsService.handleStripeWebhook(signature, rawBody);
  }

  @Post('confirm-test-payment')
  @ApiOperation({ summary: 'Simulate server-side payment confirmation in test sandbox' })
  confirmTestPayment(@Body() body: { bookingReference: string; token: string }) {
    return this.paymentsService.simulateConfirmPayment(body.bookingReference, body.token);
  }
}
