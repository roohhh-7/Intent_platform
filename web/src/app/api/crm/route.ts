import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Missing Authorization header' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    
    // Secure Server-Side Supabase Client (Admin)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_KEY!);

    // Validate token and get user
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Invalid token' }, { status: 401 });
    }
    const user = authData.user;

    // Rate Limiting Check (100 CRM syncs per 24 hours per user to protect HubSpot limits)
    const isAllowed = await checkRateLimit(user.id, 'crm', 100, 24);
    if (!isAllowed) {
      return NextResponse.json({ success: false, error: 'Rate limit exceeded: Max 100 CRM syncs per 24 hours' }, { status: 429 });
    }

    const { outreachId } = await req.json();

    if (!outreachId) {
      return NextResponse.json({ success: false, error: 'Missing outreachId' }, { status: 400 });
    }

    // 1. Fetch the outreach record to get the data
    const { data: outreachRecord, error: fetchError } = await supabaseAdmin
      .from('outreach')
      .select('*, companies(name)')
      .eq('id', outreachId)
      .single();

    if (fetchError || !outreachRecord) {
      return NextResponse.json({ success: false, error: 'Outreach record not found' }, { status: 404 });
    }

    let hubspotContactId = `mock_${Math.random().toString(36).substring(7)}`;

    if (process.env.HUBSPOT_ACCESS_TOKEN) {
      try {
        const [firstName, ...lastNames] = outreachRecord.contact.name.split(' ');
        
        // 1. Create Contact in HubSpot
        const contactResponse = await axios.post('https://api.hubapi.com/crm/v3/objects/contacts', {
          properties: {
            email: outreachRecord.contact.email,
            firstname: firstName,
            lastname: lastNames.join(' '),
            jobtitle: outreachRecord.contact.title,
            company: outreachRecord.companies?.name || ''
          }
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });

        hubspotContactId = contactResponse.data.id;
        console.log(`[HubSpot] Created Contact ${hubspotContactId}`);

        // 2. Attach the generated AI draft as a Note to the Contact
        const noteBody = `<strong>Drafted AI Email</strong><br><br><strong>Subject:</strong> ${outreachRecord.email_subject}<br><br>${outreachRecord.email_body.replace(/\n/g, '<br>')}`;
        
        await axios.post('https://api.hubapi.com/crm/v3/objects/notes', {
          properties: {
            hs_note_body: noteBody,
            hs_timestamp: Date.now().toString()
          },
          associations: [
            {
              to: { id: hubspotContactId },
              types: [
                { associationCategory: "HUBSPOT_DEFINED", associationTypeId: 202 } // Note -> Contact
              ]
            }
          ]
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });
        console.log(`[HubSpot] Attached AI Draft Note to Contact ${hubspotContactId}`);

      } catch (hubspotErr: any) {
        console.error('[HubSpot API Error]', hubspotErr.response?.data || hubspotErr.message);
        throw new Error('HubSpot API failed. Is your HUBSPOT_ACCESS_TOKEN valid?');
      }
    } else {
      console.warn('[CRM Mock] HUBSPOT_ACCESS_TOKEN not found. Generating mock ID.');
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // Update the outreach record in Supabase
    const { data, error } = await supabaseAdmin
      .from('outreach')
      .update({
        status: 'Synced',
        crm_provider: process.env.HUBSPOT_ACCESS_TOKEN ? 'HubSpot' : 'HubSpot (Mock)',
        crm_record_id: hubspotContactId,
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
