import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

    console.log(`[Apollo Mock] Simulating enrichment for domain: ${domain}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate mock contacts based on the domain
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
      },
      {
        id: `cnt_${Date.now()}_3`,
        name: `David Ross`,
        title: 'Director of Growth',
        email: `david.r@${domain}`,
        linkedin: `linkedin.com/in/davidross-${companyName}`,
        department: 'Growth'
      }
    ];

    console.log(`[Apollo Mock] Found ${mockContacts.length} decision makers for ${domain}`);

    // Update company in Supabase
    // Note: This assumes a 'contacts' JSONB column exists on the companies table.
    const { error } = await supabase
      .from('companies')
      .update({ 
        status: 'Enriched',
        contacts: mockContacts,
        timeline: [
          { event: 'Apollo.io Enrichment Complete', timestamp: new Date().toISOString() }
        ]
      })
      .eq('id', companyId);

    if (error) {
      console.error('[Supabase Error] Failed to update company:', error);
      throw error;
    }

    return NextResponse.json({ success: true, data: { contacts: mockContacts } });
  } catch (error: any) {
    console.error('[Enrichment API Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
