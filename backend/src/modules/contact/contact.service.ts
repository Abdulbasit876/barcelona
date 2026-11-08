import { Injectable, Logger } from '@nestjs/common';
import { ContactMessageDto, CustomQuoteRequestDto } from '../../shared';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);
  private messages: any[] = [];
  private quotes: any[] = [];

  public handleContactMessage(dto: ContactMessageDto) {
    const record = {
      id: `msg-${Date.now()}`,
      ...dto,
      createdAt: new Date().toISOString(),
    };
    this.messages.push(record);
    this.logger.log(`Received contact message from ${dto.name} (${dto.email}): ${dto.subject}`);
    return {
      success: true,
      message: 'Thank you. Your message has been received and our team will get in touch shortly.',
    };
  }

  public handleCustomQuote(dto: CustomQuoteRequestDto) {
    const quoteRecord = {
      id: `quote-${Date.now()}`,
      ...dto,
      status: 'PENDING_REVIEW',
      createdAt: new Date().toISOString(),
    };
    this.quotes.push(quoteRecord);
    this.logger.log(`Received custom quote request from ${dto.name} for route: ${dto.pickupAddress} -> ${dto.destinationAddress}`);
    return {
      success: true,
      quoteId: quoteRecord.id,
      message: 'Your custom quote request has been registered. Our logistics dispatch will review the route and provide a tailored price within 2 hours.',
    };
  }
}

