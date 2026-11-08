import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ContactService } from './contact.service';
import { ContactMessageDto, CustomQuoteRequestDto } from '../../shared';

@ApiTags('contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post('message')
  @ApiOperation({ summary: 'Submit a contact inquiry' })
  submitMessage(@Body() dto: ContactMessageDto) {
    return this.contactService.handleContactMessage(dto);
  }

  @Post('quote')
  @ApiOperation({ summary: 'Request a custom quotation for special or long-distance routes' })
  submitQuote(@Body() dto: CustomQuoteRequestDto) {
    return this.contactService.handleCustomQuote(dto);
  }
}

