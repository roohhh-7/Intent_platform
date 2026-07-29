import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// We must bypass RLS for a background cron job, so we use the SERVICE_ROLE key.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY!
);

export async function GET(req: Request) {
  // 1. Verify Vercel Cron Secret
  const authHeader = req.headers.get('authorization');
  if (process.env.NODE_ENV !== 'development' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[Cron] Starting Engine automated run...');

    // 2. Fetch Active Campaigns
    const { data: campaigns, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('status', 'Active');

    if (campaignError) throw campaignError;

    const results = [];

    // 3. Process each campaign
    for (const campaign of campaigns || []) {
      const domainsRaw = campaign.icp_config?.domains || '';
      const domains = domainsRaw.split(',').map((d: string) => d.trim()).filter(Boolean);
      
      // Limit to 3 domains per campaign per run to heavily conserve Firecrawl credits on the free tier
      const domainsToProcess = domains.slice(0, 3);
      
      for (const domain of domainsToProcess) {
        console.log(`[Cron] Triggering scan for ${domain} in campaign ${campaign.name}`);
        
        try {
          // Determine the base URL for the internal API call
          const protocol = req.headers.get('x-forwarded-proto') || 'http';
          const host = req.headers.get('host');
          const baseUrl = `${protocol}://${host}`;

          const response = await fetch(`${baseUrl}/api/scan`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.CRON_SECRET}` // Bypass auth using the cron secret
            },
            body: JSON.stringify({ domain, campaignId: campaign.id })
          });

          const data = await response.json();
          results.push({ domain, success: data.success, intentScore: data?.data?.analysis?.intentScore });
        } catch (err: any) {
          console.error(`[Cron] Failed to scan ${domain}:`, err.message);
          results.push({ domain, success: false, error: err.message });
        }
      }
    }

    console.log('[Cron] Automated run complete.', results);
    return NextResponse.json({ success: true, processed: results.length, results });
  } catch (error: any) {
    console.error('[Cron Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
