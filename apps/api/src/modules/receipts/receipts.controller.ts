import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { ReceiptsService } from './receipts.service';

@ApiTags('receipts')
@Controller('receipts')
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Get(':reference/pdf')
  @ApiOperation({ summary: 'Download branded PDF receipt or invoice' })
  async getPdfReceipt(
    @Param('reference') reference: string,
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    const buffer = await this.receiptsService.generateReceiptPdf(reference, token);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=Barcelona-Taxi-Receipt-${reference}.pdf`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}
