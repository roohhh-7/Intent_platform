import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Missing Authorization header' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    
    // Standard user auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const { outreachId } = await req.json();

    if (!outreachId) {
      return NextResponse.json({ success: false, error: 'Missing outreachId' }, { status: 400 });
    }

    // Mock API latency
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate a mock CRM record ID
    const mockCrmRecordId = `hubspot_contact_${Math.random().toString(36).substring(7)}`;

    // Update the outreach record in Supabase
    const { data, error } = await supabase
      .from('outreach')
      .update({
        status: 'Synced',
        crm_provider: 'HubSpot (Mock)',
        crm_record_id: mockCrmRecordId,
        synced_at: new Date().toISOString()
      })
      .eq('id', outreachId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error('[CRM Sync Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
