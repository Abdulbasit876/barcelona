import { Injectable, NotFoundException } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { BookingsService } from '../bookings/bookings.service';

@Injectable()
export class ReceiptsService {
  constructor(private readonly bookingsService: BookingsService) {}

  public generateReceiptPdf(reference: string, token?: string): Promise<Buffer> {
    const booking = this.bookingsService.getBookingByReference(reference, token);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      doc.on('error', (err) => reject(err));

      // Header Banner (Navy #0B192C)
      doc.rect(0, 0, 595.28, 110).fill('#0B192C');

      // Title & Branding (Gold #C5A059 & White)
      doc.fillColor('#C5A059').fontSize(22).font('Helvetica-Bold')
        .text('BARCELONA TAXI TRANSFER', 40, 35);
      doc.fillColor('#FFFFFF').fontSize(11).font('Helvetica')
        .text('Official Private Chauffeur & VIP Airport Transfers', 40, 62);
      doc.fillColor('#94A3B8').fontSize(9)
        .text('Barcelona, Catalonia, Spain • support@barcelonataxitransfer.com', 40, 78);

      // Invoice / Receipt Metadata
      doc.fillColor('#C5A059').fontSize(14).font('Helvetica-Bold')
        .text('BOOKING RECEIPT & INVOICE', 350, 35, { align: 'right' });
      doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica')
        .text(`Ref: ${booking.bookingReference}`, 350, 55, { align: 'right' });
      doc.text(`Date: ${new Date(booking.createdAt).toLocaleDateString()}`, 350, 70, { align: 'right' });
      doc.fillColor(booking.paymentStatus === 'PAID' ? '#10B981' : '#F59E0B')
        .text(`Status: ${booking.paymentStatus}`, 350, 85, { align: 'right' });

      // Customer Details Section
      let y = 140;
      doc.fillColor('#0B192C').fontSize(12).font('Helvetica-Bold')
        .text('CUSTOMER & RESERVATION DETAILS', 40, y);
      doc.moveTo(40, y + 16).lineTo(555, y + 16).strokeColor('#C5A059').lineWidth(1.5).stroke();

      y += 28;
      doc.fillColor('#334155').fontSize(10).font('Helvetica-Bold').text('Customer Name:', 40, y);
      doc.font('Helvetica').text(booking.customerName, 150, y);

      doc.font('Helvetica-Bold').text('Email:', 320, y);
      doc.font('Helvetica').text(booking.customerEmail, 390, y);

      y += 18;
      doc.font('Helvetica-Bold').text('Phone Number:', 40, y);
      doc.font('Helvetica').text(booking.customerPhone, 150, y);

      doc.font('Helvetica-Bold').text('Passengers / Luggage:', 320, y);
      doc.font('Helvetica').text(`${booking.passengers} pax / ${booking.luggage} suitcases`, 450, y);

      y += 18;
      doc.font('Helvetica-Bold').text('Pickup Date & Time:', 40, y);
      doc.font('Helvetica').text(new Date(booking.pickupDateTime).toLocaleString(), 160, y);

      if (booking.flightOrTrainNumber) {
        doc.font('Helvetica-Bold').text('Flight/Train #:', 320, y);
        doc.font('Helvetica').text(booking.flightOrTrainNumber, 410, y);
      }

      // Journey Details Section
      y += 35;
      doc.fillColor('#0B192C').fontSize(12).font('Helvetica-Bold')
        .text('ITINERARY & VEHICLE', 40, y);
      doc.moveTo(40, y + 16).lineTo(555, y + 16).strokeColor('#C5A059').lineWidth(1.5).stroke();

      y += 28;
      doc.fillColor('#334155').fontSize(10).font('Helvetica-Bold').text('Service Type:', 40, y);
      doc.font('Helvetica').text(booking.transferType.replace('_', ' '), 150, y);

      doc.font('Helvetica-Bold').text('Vehicle Class:', 320, y);
      doc.font('Helvetica').text(booking.vehicleCategory, 410, y);

      y += 20;
      doc.font('Helvetica-Bold').text('Pickup Location:', 40, y);
      doc.font('Helvetica').text(booking.pickupAddress, 150, y, { width: 380 });

      y += 25;
      doc.font('Helvetica-Bold').text('Destination:', 40, y);
      doc.font('Helvetica').text(booking.destinationAddress, 150, y, { width: 380 });

      // Pricing Breakdown Table
      y += 40;
      doc.fillColor('#0B192C').fontSize(12).font('Helvetica-Bold')
        .text('FARE BREAKDOWN', 40, y);
      doc.moveTo(40, y + 16).lineTo(555, y + 16).strokeColor('#C5A059').lineWidth(1.5).stroke();

      y += 26;
      // Table Header
      doc.rect(40, y, 515, 22).fill('#F1F5F9');
      doc.fillColor('#0B192C').fontSize(9).font('Helvetica-Bold');
      doc.text('DESCRIPTION', 50, y + 6);
      doc.text('RATE APPLIED', 220, y + 6);
      doc.text('AMOUNT (EUR)', 450, y + 6, { align: 'right', width: 95 });

      y += 26;
      doc.fillColor('#334155').fontSize(9).font('Helvetica');
      doc.text('Base Journey Fare', 50, y);
      doc.text(booking.fareBreakdown.pricingRuleApplied.substring(0, 40), 220, y);
      doc.text(`€${booking.fareBreakdown.baseFare.toFixed(2)}`, 450, y, { align: 'right', width: 95 });

      y += 18;
      doc.text('Vehicle Category Surcharge', 50, y);
      doc.text(`${booking.vehicleCategory} Class Upgrade`, 220, y);
      doc.text(`€${booking.fareBreakdown.vehicleSurcharge.toFixed(2)}`, 450, y, { align: 'right', width: 95 });

      // Total Box
      y += 25;
      doc.rect(40, y, 515, 30).fill('#0B192C');
      doc.fillColor('#FFFFFF').fontSize(11).font('Helvetica-Bold');
      doc.text('TOTAL AMOUNT (VAT INCLUDED):', 50, y + 9);
      doc.fillColor('#C5A059').fontSize(14)
        .text(`€${booking.fareBreakdown.totalFare.toFixed(2)} EUR`, 420, y + 8, { align: 'right', width: 125 });

      // Waiting Time Policy Notice
      y += 50;
      doc.rect(40, y, 515, 45).fill('#FAF4E8');
      doc.fillColor('#A68032').fontSize(9).font('Helvetica-Bold')
        .text('COMPLIMENTARY WAITING TIME POLICY:', 50, y + 8);
      doc.fillColor('#475569').fontSize(8).font('Helvetica')
        .text(`Included in your reservation: ${booking.fareBreakdown.freeWaitingTimeMinutes} minutes of free waiting time upon arrival. For airport pickups, flight tracking is automatically included. Additional waiting hours must be authorized and validated by dispatch.`, 50, y + 20, { width: 495 });

      // Footer
      doc.fillColor('#94A3B8').fontSize(8).font('Helvetica')
        .text('Thank you for choosing Barcelona Taxi Transfer. For 24/7 assistance call +34 930 000 000.', 40, 770, { align: 'center', width: 515 });

      doc.end();
    });
  }
}

