import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Helper to check admin authorization
function isAuthorizedAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const devHeader = request.headers.get('x-admin-dev-key');
  const expectedDevKey = process.env.ADMIN_DEV_KEY || 'btt-admin-super-secret-dev';

  if (devHeader && devHeader === expectedDevKey) return true;
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (token && token.length > 20) return true;
  }
  return false;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isAdminQuery = searchParams.get('admin') === 'true';

    let query = supabase.from('reviews').select('*');

    if (isAdminQuery) {
      if (!isAuthorizedAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 401 });
      }
      query = query.order('created_at', { ascending: false });
    } else {
      // Public review view: only published reviews
      query = query.eq('is_published', true).order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch reviews from Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Format reviews for client
    const formatted = (data || []).map((row: any) => {
      let route = 'Barcelona Transfer';
      let cleanComment = row.comment || '';

      const routeMatch = cleanComment.match(/^\[Route:\s*([^\]]+)\]\s*([\s\S]*)$/);
      if (routeMatch) {
        route = routeMatch[1].trim();
        cleanComment = routeMatch[2].trim();
      }

      return {
        id: row.id,
        name: row.customer_name || 'Passenger',
        customer_name: row.customer_name,
        customer_email: row.customer_email,
        rating: row.rating,
        comment: cleanComment,
        rawComment: row.comment,
        route,
        verified: row.is_verified ?? true,
        is_verified: row.is_verified ?? true,
        is_published: row.is_published ?? true,
        created_at: row.created_at,
        date: formatRelativeTime(row.created_at),
      };
    });

    return NextResponse.json(formatted);
  } catch (err: any) {
    console.error('Error in GET /api/reviews:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, customer_name, rating, comment, route, email, customer_email } = body;

    const reviewerName = (customer_name || name || '').trim();
    const reviewComment = (comment || '').trim();
    const reviewRating = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));
    const reviewEmail = (customer_email || email || '').trim() || null;
    const reviewRoute = (route || '').trim();

    if (!reviewerName) {
      return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });
    }
    if (!reviewComment) {
      return NextResponse.json({ error: 'Please enter your comments.' }, { status: 400 });
    }

    // Embed route into comment if provided
    const storedComment = reviewRoute
      ? `[Route: ${reviewRoute}] ${reviewComment}`
      : reviewComment;

    const insertPayload: any = {
      customer_name: reviewerName,
      customer_email: reviewEmail,
      rating: reviewRating,
      comment: storedComment,
      is_verified: true,
      is_published: true,
    };

    const { data, error } = await supabase
      .from('reviews')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error('Supabase review insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const created = {
      id: data.id,
      name: data.customer_name,
      customer_name: data.customer_name,
      rating: data.rating,
      comment: reviewComment,
      route: reviewRoute || 'Barcelona Transfer',
      verified: data.is_verified ?? true,
      is_published: data.is_published ?? true,
      created_at: data.created_at,
      date: 'Just now',
    };

    return NextResponse.json({ success: true, review: created });
  } catch (err: any) {
    console.error('Error in POST /api/reviews:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!isAuthorizedAdmin(request)) {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators are authorized to edit reviews.' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { id, customer_name, name, rating, comment, route, is_published, is_verified } = body;

    if (!id) {
      return NextResponse.json({ error: 'Review ID is required.' }, { status: 400 });
    }

    const updatePayload: any = {};

    if (customer_name !== undefined || name !== undefined) {
      updatePayload.customer_name = (customer_name || name || '').trim();
    }
    if (rating !== undefined) {
      updatePayload.rating = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));
    }
    if (comment !== undefined) {
      const rawText = (comment || '').trim();
      if (route) {
        updatePayload.comment = `[Route: ${route.trim()}] ${rawText}`;
      } else {
        updatePayload.comment = rawText;
      }
    }
    if (is_published !== undefined) {
      updatePayload.is_published = Boolean(is_published);
    }
    if (is_verified !== undefined) {
      updatePayload.is_verified = Boolean(is_verified);
    }

    const { data, error } = await supabase
      .from('reviews')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase review update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, review: data });
  } catch (err: any) {
    console.error('Error in PATCH /api/reviews:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!isAuthorizedAdmin(request)) {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators are authorized to delete reviews.' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Review ID is required for deletion.' }, { status: 400 });
    }

    const { error } = await supabase.from('reviews').delete().eq('id', id);

    if (error) {
      console.error('Supabase review delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Review permanently deleted from Supabase.' });
  } catch (err: any) {
    console.error('Error in DELETE /api/reviews:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Recently';
  }
}
