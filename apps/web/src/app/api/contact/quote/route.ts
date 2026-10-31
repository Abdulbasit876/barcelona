import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      pickupAddress,
      destinationAddress,
      pickupDate,
      pickupTime,
      passengers,
      luggage,
      vehiclePreference,
      specialRequirements,
      preferredLanguage,
    } = body;

    if (!name || !email || !pickupAddress || !destinationAddress) {
      return NextResponse.json(
        { error: 'Name, email, pickup and destination addresses are required' },
        { status: 400 },
      );
    }

    const quoteId = `quote-${Date.now()}`;

    // Insert alert into notifications table for Admin Dispatch
    try {
      await supabase.from('notifications').insert({
        recipient_role: 'ADMIN',
        title: `📋 New Custom Quote Request from ${name}`,
        message: `Route: ${pickupAddress} ➔ ${destinationAddress}\nDate: ${pickupDate || 'N/A'} ${pickupTime || ''}\nPassengers: ${passengers || 1}, Luggage: ${luggage || 0}, Vehicle: ${vehiclePreference || 'Standard'}\nContact: ${email} | ${phone || 'N/A'}\nNotes: ${specialRequirements || 'None'}`,
        type: 'BOOKING',
        is_read: false,
      });
    } catch (notifErr) {
      console.warn('Could not insert admin notification for quote request:', notifErr);
    }

    // Persist in audit_logs for record keeping
    try {
      await supabase.from('audit_logs').insert({
        actor_type: 'CUSTOMER',
        action: 'CUSTOM_QUOTE_REQUEST',
        entity_id: quoteId,
        entity_name: 'custom_quotes',
        metadata: {
          quoteId,
          ...body,
          status: 'PENDING_REVIEW',
          createdAt: new Date().toISOString(),
        },
      });
    } catch {}

    return NextResponse.json({
      success: true,
      quoteId,
      message: 'Your custom quote request has been registered. Our logistics dispatch will review the route and provide a tailored price within 2 hours.',
    });
  } catch (err: any) {
    console.error('Custom quote submission error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 },
    );
  }
}

