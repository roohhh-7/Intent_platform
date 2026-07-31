import { createClient } from '@supabase/supabase-js';

// Use service role to bypass RLS for rate limits table
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'placeholder'
);

/**
 * Checks and updates rate limits for a given user and endpoint.
 * Returns true if the request is allowed, false if rate limited.
 */
export async function checkRateLimit(userId: string, endpoint: string, maxRequests: number, windowHours: number = 24): Promise<boolean> {
  // If we don't have a service key in this environment, fail safe and allow (e.g., local dev without full env)
  if (!process.env.SUPABASE_SERVICE_KEY) {
    console.warn('[Security] Missing SUPABASE_SERVICE_KEY. Rate limiting disabled.');
    return true;
  }

  try {
    // 1. Fetch current usage
    const { data: limitRecord, error: fetchError } = await supabaseAdmin
      .from('api_rate_limits')
      .select('*')
      .eq('user_id', userId)
      .eq('endpoint', endpoint)
      .single();

    const now = new Date();

    if (!limitRecord) {
      // 2. Create new record if doesn't exist
      await supabaseAdmin.from('api_rate_limits').insert({
        user_id: userId,
        endpoint,
        request_count: 1,
        last_reset_at: now.toISOString()
      });
      return true;
    }

    // 3. Check if window has expired
    const lastReset = new Date(limitRecord.last_reset_at);
    const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

    if (hoursSinceReset >= windowHours) {
      // Reset counter
      await supabaseAdmin.from('api_rate_limits').update({
        request_count: 1,
        last_reset_at: now.toISOString()
      }).eq('id', limitRecord.id);
      return true;
    }

    // 4. Check if within limit
    if (limitRecord.request_count >= maxRequests) {
      return false; // Rate limited!
    }

    // 5. Increment counter
    await supabaseAdmin.from('api_rate_limits').update({
      request_count: limitRecord.request_count + 1
    }).eq('id', limitRecord.id);

    return true;

  } catch (error) {
    console.error('[RateLimit Error]', error);
    // Fail safe: allow request if DB fails so we don't break production randomly, 
    // but log it critically.
    return true;
  }
}
