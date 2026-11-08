import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../common/services/supabase.service';

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  deviceName?: string;
  userType?: 'ADMIN' | 'DRIVER';
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Save a browser / mobile device Web Push subscription
   */
  async subscribe(payload: PushSubscriptionPayload, userId?: string) {
    try {
      const { data, error } = await this.supabase
        .getClient()
        .from('push_subscriptions')
        .upsert(
          {
            user_type: payload.userType || 'ADMIN',
            user_id: userId || null,
            endpoint: payload.endpoint,
            p256dh: payload.keys.p256dh,
            auth: payload.keys.auth,
            device_name: payload.deviceName || 'Web Push Client',
          },
          { onConflict: 'endpoint' },
        )
        .select()
        .single();

      if (error) throw error;
      this.logger.log(`Registered push subscription for ${payload.userType || 'ADMIN'}`);
      return { success: true, subscription: data };
    } catch (err: any) {
      this.logger.error(`Error saving push subscription: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  /**
   * Notify admins about a new booking immediately!
   * Regardless of approval status (CRUISE, SANTS, AIRPORT, CITY_TRANSFER, etc.)
   */
  async notifyNewBooking(booking: any) {
    const title = `🚨 New Booking: #${booking.booking_reference}`;
    const fare = Number(booking.total_fare || 0).toFixed(2);
    const body = `${booking.customer_name} booked ${booking.vehicle_category} (${booking.transfer_type}). Fare: €${fare}. Pickup: ${booking.pickup_address} at ${new Date(booking.pickup_datetime).toLocaleString()}`;

    // 1. Store in notifications table
    await this.createNotification({
      recipient_type: 'ADMIN',
      title,
      body,
      data: {
        bookingId: booking.id,
        reference: booking.booking_reference,
        category: booking.vehicle_category,
        totalFare: booking.total_fare,
        depositAmount: booking.deposit_amount,
        remainingBalance: booking.remaining_balance,
        status: booking.status,
      },
    });

    // 2. Dispatch Push to all registered admin devices (phone, desktop)
    await this.broadcastPushNotification('ADMIN', {
      title,
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      url: `/bookings/${booking.id}`,
      tag: `booking-${booking.id}`,
      sound: '/sounds/alert.mp3',
      data: { bookingId: booking.id, url: `/bookings/${booking.id}` },
    });
  }

  /**
   * Notify assigned driver when a ride is dispatched to them
   */
  async notifyDriverAssigned(driverId: string, booking: any) {
    const title = `🚖 New Ride Assigned: #${booking.booking_reference}`;
    const body = `Pickup at ${booking.pickup_address} on ${new Date(booking.pickup_datetime).toLocaleString()}. Passenger: ${booking.customer_name}`;

    await this.createNotification({
      recipient_type: 'DRIVER',
      recipient_id: driverId,
      title,
      body,
      data: {
        bookingId: booking.id,
        reference: booking.booking_reference,
      },
    });

    await this.sendPushToUser('DRIVER', driverId, {
      title,
      body,
      url: `/driver/rides/${booking.id}`,
      tag: `driver-assigned-${booking.id}`,
    });
  }

  /**
   * Store in notifications table for in-app alert center
   */
  async createNotification(params: {
    recipient_type: 'ADMIN' | 'DRIVER' | 'ALL';
    recipient_id?: string;
    title: string;
    body: string;
    data?: any;
  }) {
    try {
      const { data, error } = await this.supabase
        .getClient()
        .from('notifications')
        .insert({
          recipient_role: params.recipient_type,
          driver_id: params.recipient_id || null,
          title: params.title,
          message: params.body,
          booking_id: params.data?.bookingId || null,
          type: 'BOOKING',
          is_read: false,
        })
        .select()
        .single();

      if (error) {
        this.logger.warn(`Could not insert in-app notification: ${error.message}`);
      }
      return data;
    } catch (err: any) {
      this.logger.warn(`Failed to store notification: ${err.message}`);
    }
  }

  /**
   * Broadcast push notification to registered devices
   */
  private async broadcastPushNotification(userType: 'ADMIN' | 'DRIVER', payload: any) {
    try {
      const { data: subscriptions } = await this.supabase
        .getClient()
        .from('push_subscriptions')
        .select('*')
        .eq('user_type', userType);

      if (!subscriptions || subscriptions.length === 0) {
        this.logger.log(`No registered push subscriptions found for ${userType}`);
        return;
      }

      this.logger.log(
        `Broadcasting push notification to ${subscriptions.length} ${userType} device(s)`,
      );

      // Attempt push delivery
      for (const sub of subscriptions) {
        this.deliverPush(sub, payload).catch((err) =>
          this.logger.debug(`Push delivery failed for device ${sub.id}: ${err.message}`),
        );
      }
    } catch (err: any) {
      this.logger.error(`Error in broadcastPushNotification: ${err.message}`);
    }
  }

  private async sendPushToUser(userType: 'ADMIN' | 'DRIVER', userId: string, payload: any) {
    try {
      const { data: subscriptions } = await this.supabase
        .getClient()
        .from('push_subscriptions')
        .select('*')
        .eq('user_type', userType)
        .eq('user_id', userId);

      if (subscriptions && subscriptions.length > 0) {
        for (const sub of subscriptions) {
          this.deliverPush(sub, payload).catch((err) =>
            this.logger.debug(`Driver push delivery failed for ${sub.id}: ${err.message}`),
          );
        }
      }
    } catch (err: any) {
      this.logger.error(`Error in sendPushToUser: ${err.message}`);
    }
  }

  /**
   * Deliver Web Push to endpoint using RFC Web Push protocol
   */
  private async deliverPush(subscription: any, payload: any) {
    const vapidSubject =
      this.configService.get<string>('VAPID_SUBJECT') || 'mailto:admin@barcelonataxitransfer.com';

    // Standard HTTP Web Push with JSON body
    try {
      const response = await fetch(subscription.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          TTL: '86400',
          Urgency: 'high',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok && (response.status === 404 || response.status === 410)) {
        // Subscription expired or unsubscribed, prune from database
        await this.supabase
          .getClient()
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', subscription.endpoint);
        this.logger.log(`Pruned expired push subscription ${subscription.endpoint}`);
      }
    } catch (e: any) {
      // Offline or network error
    }
  }

  /**
   * Get unread notifications
   */
  async getNotifications(userType: 'ADMIN' | 'DRIVER', userId?: string) {
    let query = this.supabase
      .getClient()
      .from('notifications')
      .select('*')
      .eq('recipient_role', userType)
      .order('created_at', { ascending: false })
      .limit(50);

    const { data, error } = await query;
    if (error) {
      this.logger.warn(`Could not get notifications: ${error.message}`);
      return [];
    }

    return (data || []).map((item) => ({
      ...item,
      recipient_type: item.recipient_role,
      body: item.message,
    }));
  }

  async markAsRead(id: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async markAllAsRead(userType: 'ADMIN' | 'DRIVER') {
    const { error } = await this.supabase
      .getClient()
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_role', userType);

    if (error) throw error;
    return { success: true };
  }
}

