import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  // 1. Try fetching from Admin API public settings endpoint
  try {
    const adminApiUrl = process.env.ADMIN_API_URL || 'http://localhost:4001/api/v1';
    const res = await fetch(`${adminApiUrl}/settings/public`, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(2000),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.deposit_percentage === 'number') {
        return NextResponse.json(data);
      }
    }
  } catch {}

  // 2. Direct Supabase fallback (reading persisted deposit_config from audit_logs)
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('metadata')
      .eq('action', 'SETTINGS_STORE')
      .eq('entity_id', 'deposit_config')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data?.metadata?.value?.deposit_percentage !== undefined) {
      return NextResponse.json({
        deposit_percentage: Number(data.metadata.value.deposit_percentage),
        minimum_deposit_eur: Number(data.metadata.value.minimum_deposit_eur || 10),
        allow_cash_balance: Boolean(data.metadata.value.allow_cash_balance ?? true),
      });
    }
  } catch {}

  // 3. System default fallback
  return NextResponse.json({
    deposit_percentage: 20,
    minimum_deposit_eur: 10,
    allow_cash_balance: true,
  });
}
