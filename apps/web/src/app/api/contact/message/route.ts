import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message, locale } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email and message are required' },
        { status: 400 },
      );
    }

    // Insert alert into notifications table so Admin Dashboard sees it immediately
    try {
      await supabase.from('notifications').insert({
        recipient_role: 'ADMIN',
        title: `📩 New Contact Message: ${subject || 'Customer Inquiry'}`,
        message: `From: ${name} (${email}, ${phone || 'N/A'})\n\n${message}`,
        type: 'INFO',
        is_read: false,
      });
    } catch (notifErr) {
      console.warn('Could not insert admin notification for contact message:', notifErr);
    }

    // Persist in audit_logs for traceability
    try {
      await supabase.from('audit_logs').insert({
        actor_type: 'CUSTOMER',
        action: 'CONTACT_MESSAGE',
        entity_name: 'contact_inquiry',
        metadata: { name, email, phone, subject, message, locale, timestamp: new Date().toISOString() },
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Thank you. Your message has been received and our team will get in touch shortly.',
    });
  } catch (err: any) {
    console.error('Contact message submission error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 },
    );
  }
}

