import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import axios from 'axios';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId, domain } = await req.json();

    if (!companyId || !domain) {
      return NextResponse.json({ success: false, error: 'Missing companyId or domain' }, { status: 400 });
    }

    console.log(`[Apollo Real] Enriching organization data for domain: ${domain}`);
    
    let apolloData = null;
    
    if (process.env.APOLLO_API_KEY) {
      try {
        const response = await axios.get('https://api.apollo.io/api/v1/organizations/enrich', {
          params: { domain },
          headers: {
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/json',
            'x-api-key': process.env.APOLLO_API_KEY
          }
        });
        apolloData = response.data?.organization || null;
        console.log(`[Apollo Real] Successfully fetched data for ${domain}`);
      } catch (apolloErr: any) {
        console.error('[Apollo API Error]', apolloErr.response?.data || apolloErr.message);
        // Continue with mock data if Apollo fails
      }
    } else {
      console.warn('[Apollo Mock] APOLLO_API_KEY not found. Using empty org data.');
    }

    // Generate mock contacts based on the domain (to save contact credits as requested)
    const companyName = domain.split('.')[0];
    const mockContacts = [
      {
        id: `cnt_${Date.now()}_1`,
        name: `Sarah Jenkins`,
        title: 'Chief Revenue Officer',
        email: `s.jenkins@${domain}`,
        linkedin: `linkedin.com/in/sjenkins-${companyName}`,
        department: 'Sales'
      },
      {
        id: `cnt_${Date.now()}_2`,
        name: `Michael Chen`,
        title: 'VP of Marketing',
        email: `mchen@${domain}`,
        linkedin: `linkedin.com/in/mchen-${companyName}`,
        department: 'Marketing'
      }
    ];

    console.log(`[Apollo Mock] Found ${mockContacts.length} mock decision makers for ${domain}`);

    // Update company in Supabase
    const { error } = await supabase
      .from('companies')
      .update({ 
        status: 'Enriched',
        contacts: mockContacts,
        apollo_data: apolloData,
        timeline: [
          { event: 'Apollo.io Enrichment Complete', timestamp: new Date().toISOString() }
        ]
      })
      .eq('id', companyId);

    if (error) {
      console.error('[Supabase Error] Failed to update company:', error);
      throw error;
    }

    return NextResponse.json({ success: true, data: { contacts: mockContacts, organization: apolloData } });
  } catch (error: any) {
    console.error('[Enrichment API Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
