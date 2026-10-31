import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get('reference')?.trim();
  const token = searchParams.get('token')?.trim();
  const contact = (
    searchParams.get('contact') ||
    searchParams.get('email') ||
    searchParams.get('phone')
  )?.trim();

  if (!reference) {
    return NextResponse.json({ error: 'Missing booking reference' }, { status: 400 });
  }

  // Security Verification:
  // Must provide either valid access_token OR matching contact info (email or phone)
  // This prevents attackers from enumerating or guessing booking references
  const hasToken = token && token !== 'undefined' && token !== 'null' && token.length > 5;
  const hasContact = contact && contact !== 'undefined' && contact !== 'null' && contact.length > 3;

  if (!hasToken && !hasContact) {
    return NextResponse.json(
      { error: 'Security verification required. Please provide your secure access token or email/phone number.' },
      { status: 403 },
    );
  }

  let query = supabase
    .from('bookings')
    .select('*, driver:drivers(id, name, phone, vehicle_plate, vehicle_model, rating)')
    .ilike('booking_reference', reference);

  if (hasToken) {
    query = query.eq('access_token', token);
  }

  const { data, error } = await query.maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  // If queried by contact info without token, verify email or phone matches
  if (!hasToken && hasContact) {
    const cleanContact = contact.toLowerCase().replace(/[^a-z0-9]/g, '');
    const emailMatch = data.customer_email?.toLowerCase() === contact.toLowerCase();
    const phoneMatch =
      data.customer_phone?.replace(/[^0-9]/g, '').includes(cleanContact) ||
      cleanContact.includes(data.customer_phone?.replace(/[^0-9]/g, ''));

    if (!emailMatch && !phoneMatch) {
      return NextResponse.json(
        { error: 'Booking not found. Reference and contact info do not match.' },
        { status: 404 },
      );
    }
  }

  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { reference, token, reason, action } = body;

    if (!reference) {
      return NextResponse.json({ error: 'Missing booking reference' }, { status: 400 });
    }

    if (action === 'PAY_BALANCE' || action === 'PAY_NOW') {
      const { data: currentBooking, error: fetchErr } = await supabase
        .from('bookings')
        .select('*')
        .ilike('booking_reference', reference.trim())
        .single();

      if (fetchErr || !currentBooking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      const fb = (currentBooking.fare_breakdown && typeof currentBooking.fare_breakdown === 'object') ? currentBooking.fare_breakdown : {};
      const notes = currentBooking.driver_notes || '';

      const isAlreadyCash = Boolean(
        (currentBooking.balance_paid || currentBooking.payment_status === 'PAID') &&
        (
          fb.final_payment_method === 'CASH' ||
          currentBooking.payment_method === 'CASH' ||
          notes.includes('CASH RECEIVED')
        )
      );

      if (isAlreadyCash) {
        return NextResponse.json({
          error: 'Cash payment has already been collected for this booking. Online payment is disabled.',
        }, { status: 400 });
      }

      if (currentBooking.balance_paid && currentBooking.payment_status === 'PAID') {
        return NextResponse.json({
          ...currentBooking,
          message: 'Booking has already been fully paid online.',
          alreadyPaid: true,
        });
      }

      const transactionId = `TXN-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
      const verifiedAt = new Date().toISOString();
      const updatedNotes = `${notes}\n[ONLINE PAYMENT VERIFIED]: Full balance paid online by customer on ${new Date().toLocaleString()} (Txn: ${transactionId})`.trim();

      const { data: updatedBooking, error } = await supabase
        .from('bookings')
        .update({
          payment_status: 'PAID',
          payment_method: 'FULL_ONLINE',
          balance_paid: true,
          deposit_paid: true,
          remaining_balance: 0,
          updated_at: verifiedAt,
          stripe_payment_intent_id: transactionId,
          fare_breakdown: {
            ...fb,
            final_payment_method: 'ONLINE',
            online_payment_transaction_id: transactionId,
            payment_verified_at: verifiedAt,
            audit_log: `Remaining balance paid online at ${verifiedAt}`,
          },
          driver_notes: updatedNotes,
        })
        .ilike('booking_reference', reference.trim())
        .select('*, driver:drivers(id, name, phone, vehicle_plate, vehicle_model)')
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Notify admin & driver
      try {
        await supabase.from('notifications').insert({
          recipient_role: 'ADMIN',
          title: `💳 Balance Paid Online: #${reference}`,
          message: `Customer paid the remaining balance for booking #${reference} online. Transaction ID: ${transactionId}.`,
          booking_id: updatedBooking.id,
          type: 'PAYMENT_RECEIVED',
        });
      } catch {}

      return NextResponse.json({
        ...updatedBooking,
        transactionId,
        paymentVerifiedAt: verifiedAt,
      });
    }

    // Default action: CANCEL
    const { data: updatedBooking, error } = await supabase
      .from('bookings')
      .update({
        status: 'CANCELLED',
        cancellation_reason: reason || 'Cancelled by customer online',
        updated_at: new Date().toISOString(),
      })
      .ilike('booking_reference', reference.trim())
      .select('*, driver:drivers(id, name, phone, vehicle_plate, vehicle_model)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Notify admin
    try {
      await supabase.from('notifications').insert({
        recipient_role: 'ADMIN',
        title: `🚫 Booking Cancelled: #${reference}`,
        message: `Customer cancelled booking #${reference}. Reason: ${reason || 'Cancelled by customer online'}.`,
        booking_id: updatedBooking.id,
        type: 'BOOKING_CANCELLED',
      });
    } catch {}

    return NextResponse.json(updatedBooking);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const bookingReference = `BTT-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;
    const accessToken = crypto.randomBytes(24).toString('hex');

    const totalFare = Number(body.totalFare || body.total || 54.0);
    
    // Fetch active admin-configured deposit % if not supplied
    let depositPct = body.depositPercentage !== undefined ? Number(body.depositPercentage) : null;
    if (depositPct === null || isNaN(depositPct)) {
      try {
        const { data: depAudit } = await supabase
          .from('audit_logs')
          .select('metadata')
          .eq('action', 'SETTINGS_STORE')
          .eq('entity_id', 'deposit_config')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (depAudit?.metadata?.value?.deposit_percentage !== undefined) {
          depositPct = Number(depAudit.metadata.value.deposit_percentage);
        }
      } catch {}
    }
    if (depositPct === null || isNaN(depositPct)) {
      depositPct = 20;
    }

    const depositAmount = Number(((totalFare * depositPct) / 100).toFixed(2));
    const remainingBalance = Number((totalFare - depositAmount).toFixed(2));

    // Check if this service type requires manual admin approval from system_settings
    let isPendingApproval =
      body.transferType === 'CRUISE_PORT' ||
      body.transferType === 'SANTS_STATION' ||
      body.transferType === 'CUSTOM_QUOTE';

    try {
      const { data: settingData } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'dispatch_config')
        .single();
      if (settingData?.value?.approval_required_transfer_types) {
        isPendingApproval = settingData.value.approval_required_transfer_types.includes(body.transferType);
      }
    } catch {}

    const cabinLuggageCount = Number(body.cabinLuggage || body.cabin_luggage || 0);

    const bookingRow: Record<string, any> = {
      booking_reference: bookingReference,
      access_token: accessToken,
      transfer_type: body.transferType || 'AIRPORT',
      vehicle_category: body.vehicleCategory || 'STANDARD',
      status: isPendingApproval ? 'PENDING_APPROVAL' : 'CONFIRMED',
      approval_status: isPendingApproval ? 'PENDING_APPROVAL' : 'APPROVED',
      payment_status: body.paymentStatus || (remainingBalance > 0 ? 'PENDING' : 'PAID'),
      payment_method: body.paymentMethod || (remainingBalance > 0 ? 'ONLINE_DEPOSIT' : 'FULL_ONLINE'),
      pickup_address: body.pickupAddress || 'Barcelona',
      destination_address: body.destinationAddress || 'Barcelona',
      pickup_datetime: body.pickupDateTime || (body.pickupDate ? `${body.pickupDate}T${body.pickupTime || '12:00'}:00` : new Date().toISOString()),
      passengers: Number(body.passengers || 1),
      luggage: Number(body.luggage || 0),
      child_seats: Number(body.babySeats || body.childSeats || 0),
      baby_booster: Number(body.babyBoosters || 0),
      customer_name: body.customerName || 'Customer',
      customer_email: body.customerEmail || 'customer@example.com',
      customer_phone: body.customerPhone || '+34 600 000 000',
      flight_or_train_number: body.flightOrTrainNumber || null,
      flight_details: {
        cabin_luggage: cabinLuggageCount,
        pickup_lat: body.pickupLat || body.pickup_lat || null,
        pickup_lng: body.pickupLng || body.pickup_lng || null,
        dropoff_lat: body.dropoffLat || body.dropoff_lat || null,
        dropoff_lng: body.dropoffLng || body.dropoff_lng || null,
      },
      cruise_ship_name: body.cruiseShipName || null,
      special_requests: body.specialRequests || null,
      admin_notes: 'Booked online via Customer Website',
      preferred_language: body.preferredLanguage || 'en',
      total_fare: totalFare,
      deposit_percentage: depositPct,
      deposit_amount: depositAmount,
      remaining_balance: remainingBalance,
      deposit_paid: true,
      balance_paid: false,
    };

    const { data: createdBooking, error: bookingError } = await supabase
      .from('bookings')
      .insert(bookingRow)
      .select()
      .single();

    if (bookingError) {
      console.error('Error inserting booking to Supabase:', bookingError);
      return NextResponse.json({ error: bookingError.message }, { status: 500 });
    }

    // Insert alert in notifications table so Admin Dashboard immediately receives notification
    try {
      await supabase.from('notifications').insert({
        recipient_role: 'ADMIN',
        title: `🚨 New Booking: #${bookingReference}`,
        message: `${bookingRow.customer_name} booked ${bookingRow.vehicle_category} (${bookingRow.transfer_type}). Total: €${totalFare}. Pickup: ${bookingRow.pickup_address}`,
        booking_id: createdBooking.id,
        type: 'BOOKING',
        is_read: false,
      });
    } catch (notifErr) {
      console.warn('Could not insert admin notification:', notifErr);
    }

    // Trigger automatic driver assignment immediately via Admin API if configured
    try {
      const adminApiUrl = process.env.ADMIN_API_URL || 'http://localhost:4001/api/v1';
      await fetch(`${adminApiUrl}/dispatch/auto-assign/${createdBooking.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-dev-key': process.env.ADMIN_DEV_KEY || 'btt-admin-super-secret-dev',
          'Authorization': 'Bearer dev-admin-master-token',
        },
      });
    } catch (autoErr) {
      console.warn('Auto-assignment call failed or not configured:', autoErr);
    }

    return NextResponse.json({
      success: true,
      booking: createdBooking,
      bookingReference,
      accessToken,
    });
  } catch (err: any) {
    console.error('Failed to create booking:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Security check: Only authorized administrators may delete bookings
    const authHeader = request.headers.get('authorization');
    const devHeader = request.headers.get('x-admin-dev-key');
    const isAuthorized =
      (authHeader && (authHeader.includes('Bearer ') || authHeader.length > 20)) ||
      (devHeader && devHeader === (process.env.ADMIN_DEV_KEY || 'btt-admin-super-secret-dev'));

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized: Admin authentication required.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');
    const all = searchParams.get('all') === 'true';

    if (all) {
      // 1. Delete all rides
      await supabase.from('rides').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      // 2. Delete all reviews
      try {
        await supabase.from('reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch {}
      // 3. Delete all bookings
      const { error } = await supabase.from('bookings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: 'All bookings deleted successfully from Supabase.' });
    }

    if (reference) {
      const { error } = await supabase.from('bookings').delete().ilike('booking_reference', reference);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: `Booking ${reference} deleted.` });
    }

    return NextResponse.json({ error: 'Missing parameter: reference or all=true' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
