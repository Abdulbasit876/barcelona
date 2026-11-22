import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { reference: string } }
) {
  const reference = params.reference;
  if (!reference) {
    return NextResponse.json({ error: 'Reference required' }, { status: 400 });
  }

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.BACKEND_URL ||
    'http://localhost:4001/api/v1';

  try {
    const res = await fetch(`${apiBase}/payments/status/${encodeURIComponent(reference)}`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err: any) {
    console.warn(`Backend payment status fetch failed: ${err.message}`);
  }

  return NextResponse.json(
    { error: 'Unable to retrieve payment status' },
    { status: 502 }
  );
}
