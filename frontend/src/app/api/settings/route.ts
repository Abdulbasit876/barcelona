import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const DEFAULT_PRICING_RULES = {
  // Airport Transfers (Barcelona AMB Zone Reference)
  airport_metropolitan_km_rate: 3.0,
  airport_outside_km_rate: 2.5,
  airport_minimum_fare: 35.0,
  free_waiting_mins_airport: 60,

  // City Point-to-Point Transfers
  city_base_fare: 25.0,
  city_base_threshold_km: 2.5,
  city_per_km_rate: 3.0,
  free_waiting_mins_standard: 15,

  // Cruise Port Transfers
  cruise_port_sedan_base: 42.0,
  cruise_port_van_fixed: 70.0,
  free_waiting_mins_port: 30,

  // Sants Train Station Transfers
  sants_station_sedan_base: 32.0,
  sants_station_van_fixed: 45.0,
  free_waiting_mins_sants: 15,

  // Sightseeing Tours & Hourly Chauffeur
  city_tour_hourly_rate: 65.0,
  company_trip_hourly_rate: 65.0,
  city_tour_min_hours: 2,
  free_waiting_mins_tour: 15,

  // Vehicle Category Surcharges
  surcharge_economy: 0.0,
  surcharge_standard: 5.0,
  surcharge_premium: 10.0,
  surcharge_standard_van: 15.0,
  surcharge_premium_van: 22.5,
  surcharge_electric: 12.0,

  // Child Safety Seats & Extras
  baby_seat_price: 9.0,
  baby_booster_price: 4.5,

  // Payment & Online Deposit Rules
  deposit_percentage: 20,
  minimum_deposit_eur: 10,
  allow_cash_balance: true,
  allow_full_online_payment: true,

  // Overtime & Night Hours
  overtime_enabled: false,
  overtime_start_hour: 22,
  overtime_end_hour: 6,
  overtime_surcharge_percent: 20,
};

const DEFAULT_DEPOSIT_CONFIG = {
  deposit_percentage: 20,
  minimum_deposit_eur: 10,
  allow_cash_balance: true,
  allow_full_online_payment: true,
  category_auto_assignments: {},
};

export async function GET() {
  let pricingRules = { ...DEFAULT_PRICING_RULES };
  let depositConfig = { ...DEFAULT_DEPOSIT_CONFIG };

  // 1. Try fetching from Admin API public settings endpoint
  try {
    const adminApiUrl = process.env.ADMIN_API_URL || 'http://localhost:4001/api/v1';
    const res = await fetch(`${adminApiUrl}/settings/public`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(2000),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.pricingRules) {
        pricingRules = { ...pricingRules, ...data.pricingRules };
      }
      if (data?.depositConfig) {
        depositConfig = { ...depositConfig, ...data.depositConfig };
      }
      if (typeof data?.deposit_percentage === 'number') {
        depositConfig.deposit_percentage = data.deposit_percentage;
      }
      return NextResponse.json({
        deposit_percentage: depositConfig.deposit_percentage,
        minimum_deposit_eur: depositConfig.minimum_deposit_eur,
        allow_cash_balance: depositConfig.allow_cash_balance,
        pricingRules,
        depositConfig,
      });
    }
  } catch {}

  // 2. Direct Supabase fallback (reading persisted pricing_rules & deposit_config from audit_logs)
  try {
    const [depRes, priceRes] = await Promise.all([
      supabase
        .from('audit_logs')
        .select('metadata')
        .eq('action', 'SETTINGS_STORE')
        .eq('entity_id', 'deposit_config')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('audit_logs')
        .select('metadata')
        .eq('action', 'SETTINGS_STORE')
        .eq('entity_id', 'pricing_rules')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (!depRes.error && depRes.data?.metadata?.value) {
      depositConfig = { ...depositConfig, ...depRes.data.metadata.value };
    }
    if (!priceRes.error && priceRes.data?.metadata?.value) {
      pricingRules = { ...pricingRules, ...priceRes.data.metadata.value };
    }
  } catch (err) {
    console.error('Error fetching settings from Supabase:', err);
  }

  return NextResponse.json({
    deposit_percentage: depositConfig.deposit_percentage ?? 20,
    minimum_deposit_eur: depositConfig.minimum_deposit_eur ?? 10,
    allow_cash_balance: depositConfig.allow_cash_balance ?? true,
    pricingRules,
    depositConfig,
  });
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { section, data } = body;

    const targetSection = section || (body.city_base_fare !== undefined ? 'pricing' : 'deposit');
    const payload = data || body;

    // 1. Save to Supabase audit_logs
    if (targetSection === 'pricing') {
      // Fetch current pricing rules to merge
      const { data: currentAudit } = await supabase
        .from('audit_logs')
        .select('metadata')
        .eq('action', 'SETTINGS_STORE')
        .eq('entity_id', 'pricing_rules')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const mergedRules = {
        ...DEFAULT_PRICING_RULES,
        ...(currentAudit?.metadata?.value || {}),
        ...payload,
      };

      await supabase
        .from('audit_logs')
        .delete()
        .eq('action', 'SETTINGS_STORE')
        .eq('entity_id', 'pricing_rules');

      await supabase.from('audit_logs').insert({
        actor_type: 'SYSTEM',
        action: 'SETTINGS_STORE',
        entity_type: 'system_settings',
        entity_id: 'pricing_rules',
        metadata: {
          key: 'pricing_rules',
          value: mergedRules,
          updated_at: new Date().toISOString(),
        },
      });

      // Forward to backend if reachable
      try {
        const adminApiUrl = process.env.ADMIN_API_URL || 'http://localhost:4001/api/v1';
        await fetch(`${adminApiUrl}/settings/pricing`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(request.headers.get('authorization')
              ? { Authorization: request.headers.get('authorization')! }
              : {}),
          },
          body: JSON.stringify(mergedRules),
        });
      } catch {}

      return NextResponse.json({ success: true, pricingRules: mergedRules });
    }

    if (targetSection === 'deposit') {
      const { data: currentDep } = await supabase
        .from('audit_logs')
        .select('metadata')
        .eq('action', 'SETTINGS_STORE')
        .eq('entity_id', 'deposit_config')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const mergedDeposit = {
        ...DEFAULT_DEPOSIT_CONFIG,
        ...(currentDep?.metadata?.value || {}),
        ...payload,
      };

      await supabase
        .from('audit_logs')
        .delete()
        .eq('action', 'SETTINGS_STORE')
        .eq('entity_id', 'deposit_config');

      await supabase.from('audit_logs').insert({
        actor_type: 'SYSTEM',
        action: 'SETTINGS_STORE',
        entity_type: 'system_settings',
        entity_id: 'deposit_config',
        metadata: {
          key: 'deposit_config',
          value: mergedDeposit,
          updated_at: new Date().toISOString(),
        },
      });

      try {
        const adminApiUrl = process.env.ADMIN_API_URL || 'http://localhost:4001/api/v1';
        await fetch(`${adminApiUrl}/settings/deposit`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(request.headers.get('authorization')
              ? { Authorization: request.headers.get('authorization')! }
              : {}),
          },
          body: JSON.stringify(mergedDeposit),
        });
      } catch {}

      return NextResponse.json({ success: true, depositConfig: mergedDeposit });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in PATCH /api/settings:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
