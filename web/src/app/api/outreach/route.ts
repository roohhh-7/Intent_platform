import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
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

    const { company, contact, campaignId } = await req.json();

    if (!company || !contact) {
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ success: false, error: 'Missing GEMINI_API_KEY' }, { status: 500 });
    }

    // Fetch the campaign context
    let icpContext = '';
    if (campaignId) {
      const { data: campaign } = await supabase.from('campaigns').select('icp_config').eq('id', campaignId).single();
      if (campaign && campaign.icp_config) {
        icpContext = JSON.stringify(campaign.icp_config);
      }
    }

    console.log(`[Outreach] Generating draft for ${contact.name} at ${company.name}`);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.6-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            emailSubject: { type: SchemaType.STRING, description: "A catchy, personalized subject line" },
            emailBody: { type: SchemaType.STRING, description: "The cold email body. Must explicitly mention at least one buying signal." },
            linkedinMessage: { type: SchemaType.STRING, description: "A short, 300-character max connection request message." },
            callNotes: { type: SchemaType.STRING, description: "Bullet points for a cold caller, including an opening hook based on the signals." }
          },
          required: ["emailSubject", "emailBody", "linkedinMessage", "callNotes"]
        }
      }
    });

    const prompt = `You are an elite B2B sales development representative. 
    Write highly personalized, multi-channel outreach for the following prospect.
    
    CRITICAL INSTRUCTION: You MUST explicitly mention the "Buying Signals" surfaced in the email body, linkedin message, and call hook. Do NOT write generic outreach. Prove you did your research.

    Prospect Name: ${contact.name}
    Prospect Title: ${contact.title}
    Company Name: ${company.name}
    
    Buying Signals Detected:
    ${company.signals ? company.signals.join('\n') : 'Company is showing active intent in your market.'}

    Our Campaign / Product Context:
    ${icpContext}
    `;

    const result = await model.generateContent(prompt);
    const generated = JSON.parse(result.response.text());

    // Save to the outreach table
    const { data: outreachRecord, error: insertError } = await supabase.from('outreach').insert({
      company_id: company.id,
      contact: contact,
      email_subject: generated.emailSubject,
      email_body: generated.emailBody,
      linkedin_message: generated.linkedinMessage,
      call_notes: generated.callNotes,
      status: 'Draft'
    }).select().single();

    if (insertError) throw insertError;

    return NextResponse.json({ success: true, data: outreachRecord });

  } catch (error: any) {
    console.error('[Outreach API Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
