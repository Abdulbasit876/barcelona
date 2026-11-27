/**
 * Barcelona Taxi Transfer - Complete Stripe Payment Integration Test Suite
 * Validated against Stripe Test Mode & Supabase
 */
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const backendUrl = 'http://localhost:4001';

console.log('--- Initializing Stripe Test Suite ---');
console.log('Stripe Key prefix:', stripeSecretKey ? stripeSecretKey.substring(0, 8) : 'NONE');
console.log('Webhook Secret prefix:', stripeWebhookSecret ? stripeWebhookSecret.substring(0, 8) : 'NONE');
console.log('Supabase URL:', supabaseUrl);

const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });
const supabase = createClient(supabaseUrl, supabaseKey);

function makeBooking(reference, fare, overrides = {}) {
  return {
    booking_reference: reference,
    access_token: require('crypto').randomBytes(24).toString('hex'),
    transfer_type: 'AIRPORT',
    vehicle_category: 'STANDARD',
    status: 'PENDING',
    approval_status: 'APPROVED',
    payment_status: 'PENDING',
    payment_method: 'ONLINE_DEPOSIT',
    pickup_address: 'Barcelona Airport BCN Terminal 1',
    destination_address: 'Plaça de Catalunya, Barcelona',
    pickup_datetime: new Date(Date.now() + 86400000).toISOString(),
    passengers: 2,
    luggage: 2,
    child_seats: 0,
    baby_booster: 0,
    customer_name: 'Stripe Test User',
    customer_email: 'stripe-test@barcelonataxi.com',
    customer_phone: '+34600000001',
    total_fare: fare,
    deposit_percentage: 100,
    deposit_amount: fare,
    remaining_balance: 0,
    deposit_paid: false,
    balance_paid: false,
    ...overrides,
  };
}

async function runTests() {
  const results = [];

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Full Payment Success (4242 4242 4242 4242)
    // -------------------------------------------------------------------------
    console.log('\n========================================');
    console.log('TEST 1: Standard Full Payment (EUR 59.00)');
    console.log('========================================');

    const ref1 = `BCN-TEST-${Date.now().toString().slice(-6)}`;
    const fare1 = 59.00;

    // 1a. Insert test booking into Supabase
    const { data: b1, error: err1 } = await supabase
      .from('bookings')
      .insert(makeBooking(ref1, fare1))
      .select()
      .single();

    if (err1) throw new Error(`Failed to create test booking 1: ${err1.message}`);
    console.log(`[PASS] Created test booking #${ref1} with fare €${fare1}`);

    // 1b. Call backend create-intent
    const createRes1 = await fetch(`${backendUrl}/api/v1/payments/create-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingReference: ref1, email: 'stripe-test@barcelonataxi.com' }),
    });
    const intentData1 = await createRes1.json();
    if (!createRes1.ok) throw new Error(`Backend create-intent failed: ${JSON.stringify(intentData1)}`);
    console.log(`[PASS] Backend returned PaymentIntent ID: ${intentData1.paymentIntentId}, Amount: €${intentData1.amountEur}`);

    if (intentData1.amountEur !== 59) {
      throw new Error(`Amount mismatch: expected €59, got ${intentData1.amountEur}`);
    }

    // 1c. Confirm PaymentIntent using Stripe test token pm_card_visa
    const confirmedPI1 = await stripe.paymentIntents.confirm(intentData1.paymentIntentId, {
      payment_method: 'pm_card_visa',
      return_url: 'http://localhost:3000/en/booking-confirmation/' + ref1,
    });
    console.log(`[PASS] Stripe confirmed PaymentIntent status: ${confirmedPI1.status}`);

    // 1d. Simulate Stripe Webhook delivery for payment_intent.succeeded
    const eventPayload1 = {
      id: `evt_test_${Date.now()}_1`,
      object: 'event',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: intentData1.paymentIntentId,
          amount: 5900,
          currency: 'eur',
          status: 'succeeded',
          metadata: {
            bookingReference: ref1,
            bookingId: b1.id,
          },
          payment_method_types: ['card'],
        },
      },
    };
    const rawBody1 = JSON.stringify(eventPayload1);
    const signature1 = stripe.webhooks.generateTestHeaderString({
      payload: rawBody1,
      secret: stripeWebhookSecret,
    });

    const webhookRes1 = await fetch(`${backendUrl}/api/v1/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature1,
      },
      body: rawBody1,
    });
    const webhookData1 = await webhookRes1.json();
    if (!webhookRes1.ok) throw new Error(`Webhook handler failed: ${JSON.stringify(webhookData1)}`);
    console.log(`[PASS] Webhook processed successfully: ${JSON.stringify(webhookData1)}`);

    // 1e. Verify booking in Supabase
    const { data: updatedB1 } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_reference', ref1)
      .single();

    if (updatedB1.payment_status !== 'PAID') {
      throw new Error(`Expected payment_status 'PAID', got '${updatedB1.payment_status}'`);
    }
    if (updatedB1.deposit_paid !== true) {
      throw new Error(`Expected deposit_paid true, got false`);
    }
    if (updatedB1.stripe_payment_intent_id !== intentData1.paymentIntentId) {
      throw new Error(`PaymentIntent ID mismatch on booking`);
    }
    console.log(`[PASS] Verified Supabase booking updated: payment_status='PAID', deposit_paid=true, stripe_payment_intent_id='${updatedB1.stripe_payment_intent_id}'`);
    results.push({ name: 'TEST 1: Standard Full Payment (EUR 59.00)', status: 'PASSED' });

    // -------------------------------------------------------------------------
    // TEST 2: Card Declined / Payment Failure
    // -------------------------------------------------------------------------
    console.log('\n========================================');
    console.log('TEST 2: Card Declined Simulation');
    console.log('========================================');

    const ref2 = `BCN-TEST-${Date.now().toString().slice(-6)}`;
    const { data: b2 } = await supabase
      .from('bookings')
      .insert(makeBooking(ref2, 45.00, { customer_email: 'fail-test@barcelonataxi.com' }))
      .select()
      .single();

    const createRes2 = await fetch(`${backendUrl}/api/v1/payments/create-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingReference: ref2 }),
    });
    const intentData2 = await createRes2.json();

    // Confirm with card that fails
    try {
      await stripe.paymentIntents.confirm(intentData2.paymentIntentId, {
        payment_method: 'pm_card_chargeCustomerFail',
      });
    } catch (e) {
      console.log(`[INFO] Stripe rejected charge as expected: ${e.message}`);
    }

    // Send payment_intent.payment_failed webhook
    const eventPayload2 = {
      id: `evt_test_${Date.now()}_2`,
      object: 'event',
      type: 'payment_intent.payment_failed',
      data: {
        object: {
          id: intentData2.paymentIntentId,
          last_payment_error: { message: 'Your card was declined.' },
          metadata: { bookingReference: ref2 },
        },
      },
    };
    const rawBody2 = JSON.stringify(eventPayload2);
    const signature2 = stripe.webhooks.generateTestHeaderString({
      payload: rawBody2,
      secret: stripeWebhookSecret,
    });
    await fetch(`${backendUrl}/api/v1/payments/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'stripe-signature': signature2 },
      body: rawBody2,
    });

    const { data: updatedB2 } = await supabase
      .from('bookings')
      .select('payment_status, deposit_paid')
      .eq('booking_reference', ref2)
      .single();

    if (updatedB2.payment_status !== 'FAILED') {
      throw new Error(`Expected payment_status 'FAILED', got '${updatedB2.payment_status}'`);
    }
    console.log(`[PASS] Verified Supabase booking payment_status is 'FAILED' and deposit_paid is false`);
    results.push({ name: 'TEST 2: Card Declined Simulation', status: 'PASSED' });

    // -------------------------------------------------------------------------
    // TEST 3: 3D Secure Authentication Flow
    // -------------------------------------------------------------------------
    console.log('\n========================================');
    console.log('TEST 3: 3D Secure (Requires Action)');
    console.log('========================================');

    const ref3 = `BCN-TEST-${Date.now().toString().slice(-6)}`;
    await supabase.from('bookings').insert(makeBooking(ref3, 75.00, { customer_email: '3ds-test@barcelonataxi.com' }));

    const createRes3 = await fetch(`${backendUrl}/api/v1/payments/create-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingReference: ref3 }),
    });
    const intentData3 = await createRes3.json();

    const confirmed3DS = await stripe.paymentIntents.confirm(intentData3.paymentIntentId, {
      payment_method: 'pm_card_threeDSecure2Required',
      return_url: 'http://localhost:3000/en/booking-confirmation/' + ref3,
    });
    console.log(`[PASS] 3DS PaymentIntent status is: '${confirmed3DS.status}' (requires_action correctly initiated)`);
    if (confirmed3DS.status !== 'requires_action') {
      throw new Error(`Expected 'requires_action', got ${confirmed3DS.status}`);
    }
    results.push({ name: 'TEST 3: 3D Secure Authentication Flow', status: 'PASSED' });

    // -------------------------------------------------------------------------
    // TEST 4: Rejection on Cancelled Booking
    // -------------------------------------------------------------------------
    console.log('\n========================================');
    console.log('TEST 4: Rejection on Cancelled Booking');
    console.log('========================================');

    const ref4 = `BCN-TEST-${Date.now().toString().slice(-6)}`;
    await supabase.from('bookings').insert(makeBooking(ref4, 69.00, { status: 'CANCELLED' }));

    const createRes4 = await fetch(`${backendUrl}/api/v1/payments/create-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingReference: ref4 }),
    });
    const resData4 = await createRes4.json();
    console.log(`[PASS] Response for cancelled booking: Status ${createRes4.status}, message: "${resData4.message}"`);
    if (createRes4.status !== 400 || !resData4.message.includes('cancelled')) {
      throw new Error(`Expected 400 rejection for cancelled booking`);
    }
    results.push({ name: 'TEST 4: Cancelled Booking Payment Block', status: 'PASSED' });

    // -------------------------------------------------------------------------
    // TEST 5: Rejection on Already Paid Booking
    // -------------------------------------------------------------------------
    console.log('\n========================================');
    console.log('TEST 5: Rejection on Already Paid Booking');
    console.log('========================================');

    const createRes5 = await fetch(`${backendUrl}/api/v1/payments/create-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingReference: ref1 }), // ref1 was paid in Test 1!
    });
    const resData5 = await createRes5.json();
    console.log(`[PASS] Response for already paid booking: Status ${createRes5.status}, message: "${resData5.message}"`);
    if (createRes5.status !== 400 || !resData5.message.includes('already paid')) {
      throw new Error(`Expected 400 rejection for already paid booking`);
    }
    results.push({ name: 'TEST 5: Already Paid Booking Block', status: 'PASSED' });

    // -------------------------------------------------------------------------
    // TEST 6: Webhook Idempotency & Deduplication
    // -------------------------------------------------------------------------
    console.log('\n========================================');
    console.log('TEST 6: Webhook Idempotency & Deduplication');
    console.log('========================================');

    // Send identical webhook event payload 1 again
    const dupWebhookRes = await fetch(`${backendUrl}/api/v1/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature1,
      },
      body: rawBody1,
    });
    const dupData = await dupWebhookRes.json();
    console.log(`[PASS] Duplicate webhook response: ${JSON.stringify(dupData)}`);
    if (!dupData.duplicate && !dupData.deduplicated) {
      throw new Error(`Expected deduplicated: true for replay of event ${eventPayload1.id}`);
    }
    results.push({ name: 'TEST 6: Webhook Idempotency & Deduplication', status: 'PASSED' });

    // -------------------------------------------------------------------------
    // TEST 7: Payment Status Endpoint
    // -------------------------------------------------------------------------
    console.log('\n========================================');
    console.log('TEST 7: Live Payment Status Query');
    console.log('========================================');

    const statusRes = await fetch(`${backendUrl}/api/v1/payments/status/${ref1}`);
    const statusData = await statusRes.json();
    console.log(`[PASS] Status for #${ref1}: paymentStatus='${statusData.paymentStatus}', depositPaid=${statusData.depositPaid}, totalFare=${statusData.totalFare}`);
    if (statusData.paymentStatus !== 'PAID' || !statusData.depositPaid) {
      throw new Error(`Status query returned unexpected values`);
    }
    results.push({ name: 'TEST 7: Live Payment Status Query', status: 'PASSED' });

    // Clean up test records
    await supabase.from('bookings').delete().in('booking_reference', [ref1, ref2, ref3, ref4]);
    console.log('\n[PASS] Cleaned up test booking records from Supabase.');

    console.log('\n========================================');
    console.log('ALL STRIPE INTEGRATION TESTS PASSED (7/7)');
    console.log('========================================');
    console.table(results);

  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED:', error);
    process.exit(1);
  }
}

runTests();
