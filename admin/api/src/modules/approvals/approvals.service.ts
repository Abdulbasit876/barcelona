import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../common/services/supabase.service';
import { RejectBookingDto, ReviseBookingFareDto } from './approvals.dto';

@Injectable()
export class ApprovalsService {
  private readonly logger = new Logger(ApprovalsService.name);

  constructor(private readonly supabase: SupabaseService) {}

  /**
   * List pending approvals
   */
  async getPendingApprovals() {
    const { data, error } = await this.supabase
      .getClient()
      .from('bookings')
      .select('*, driver:drivers(*)')
      .or('approval_status.eq.PENDING_APPROVAL,status.eq.PENDING_APPROVAL')
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  /**
   * Approve booking as-is
   */
  async approveBooking(bookingId: string, approvedBy: string = 'ADMIN') {
    const { data: booking, error: bErr } = await this.supabase
      .getClient()
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bErr || !booking) throw new NotFoundException('Booking not found');

    const nextStatus = booking.payment_status === 'PAID' ? 'CONFIRMED' : 'CONFIRMED';

    const { data: updated, error: updateErr } = await this.supabase
      .getClient()
      .from('bookings')
      .update({
        approval_status: 'APPROVED',
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (updateErr) throw new BadRequestException(updateErr.message);

    // Audit log
    await this.supabase
      .getClient()
      .from('audit_logs')
      .insert({
        booking_id: bookingId,
        action: 'APPROVE_BOOKING',
        changed_by: approvedBy,
        new_values: { approval_status: 'APPROVED', status: nextStatus },
      });

    return updated;
  }

  /**
   * Propose a revised fare with reason
   */
  async reviseBookingFare(
    bookingId: string,
    dto: ReviseBookingFareDto,
    revisedBy: string = 'ADMIN',
  ) {
    const { data: booking, error: bErr } = await this.supabase
      .getClient()
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bErr || !booking) throw new NotFoundException('Booking not found');

    const originalFare = Number(booking.fare_breakdown?.original_fare || booking.total_fare || 0);
    const depositPercentage = Number(booking.deposit_percentage || 20);
    const newTotalFare = Number(dto.revisedFare);
    const newDepositAmount = Number(((newTotalFare * depositPercentage) / 100).toFixed(2));
    const newRemainingBalance = Number((newTotalFare - newDepositAmount).toFixed(2));

    const fb = (booking.fare_breakdown && typeof booking.fare_breakdown === 'object') ? booking.fare_breakdown : {};
    const updatedFareBreakdown = {
      ...fb,
      original_fare: originalFare,
      revised_fare: newTotalFare,
      revision_reason: dto.revisionReason,
      customer_accepted_revision: true,
      revised_by: revisedBy,
      revised_at: new Date().toISOString(),
    };

    const notes = [
      booking.driver_notes || '',
      `[FARE REVISED BY ADMIN]: New total fare €${newTotalFare.toFixed(2)} (Deposit €${newDepositAmount.toFixed(2)}, Remaining balance due to driver €${newRemainingBalance.toFixed(2)}). Reason: ${dto.revisionReason}`
    ].filter(Boolean).join('\n').trim();

    const { data: updated, error: updateErr } = await this.supabase
      .getClient()
      .from('bookings')
      .update({
        total_fare: newTotalFare,
        deposit_amount: newDepositAmount,
        remaining_balance: newRemainingBalance,
        approval_status: 'APPROVED',
        status: 'CONFIRMED',
        fare_breakdown: updatedFareBreakdown,
        driver_notes: notes,
        admin_notes: dto.notes ? `${booking.admin_notes || ''}\n[Admin note]: ${dto.notes}`.trim() : booking.admin_notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (updateErr) throw new BadRequestException(updateErr.message);

    // Notify customer & driver about fare revision
    try {
      await this.supabase.getClient().from('notifications').insert({
        recipient_role: 'DRIVER',
        title: `💶 Fare Revised: #${booking.booking_reference}`,
        message: `Booking #${booking.booking_reference} fare updated to €${newTotalFare.toFixed(2)}. Balance to collect from passenger: €${newRemainingBalance.toFixed(2)}.`,
        booking_id: bookingId,
        type: 'PRICE_UPDATE',
        is_read: false,
      });
    } catch {}

    // Audit log
    await this.supabase
      .getClient()
      .from('audit_logs')
      .insert({
        booking_id: bookingId,
        action: 'REVISE_FARE',
        changed_by: revisedBy,
        old_values: { fare: originalFare },
        new_values: {
          revisedFare: newTotalFare,
          revisionReason: dto.revisionReason,
          newRemainingBalance,
        },
      });

    return updated;
  }

  /**
   * Reject / decline booking
   */
  async rejectBooking(
    bookingId: string,
    dto: RejectBookingDto,
    rejectedBy: string = 'ADMIN',
  ) {
    const { data: updated, error } = await this.supabase
      .getClient()
      .from('bookings')
      .update({
        approval_status: 'REJECTED',
        status: 'CANCELLED',
        cancellation_reason: dto.rejectionReason,
        cancelled_by: rejectedBy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    // Audit log
    await this.supabase
      .getClient()
      .from('audit_logs')
      .insert({
        booking_id: bookingId,
        action: 'REJECT_BOOKING',
        changed_by: rejectedBy,
        new_values: {
          approval_status: 'REJECTED',
          reason: dto.rejectionReason,
        },
      });

    return updated;
  }
}
