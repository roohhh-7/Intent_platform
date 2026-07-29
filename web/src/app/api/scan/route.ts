import { NextResponse } from 'next/server';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Missing Authorization header' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    
    // Check if it's the automated Cron Job bypassing auth
    const isCron = token === process.env.CRON_SECRET;
    
    if (!isCron) {
      // Standard user auth
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return NextResponse.json({ success: false, error: 'Unauthorized: Invalid token' }, { status: 401 });
      }
    }

    const { domain, campaignId } = await req.json();

    if (!domain) {
      return NextResponse.json({ success: false, error: 'Domain is required' }, { status: 400 });
    }

    console.log(`[Engine] Initiating scan for domain: ${domain}`);
    
    if (!process.env.FIRECRAWL_API_KEY || !process.env.GEMINI_API_KEY) {
      return NextResponse.json({ success: false, error: 'Missing API Keys in Environment' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // 1. Scrape with Firecrawl
    console.log(`[Engine] Scraping website: https://${domain}`);
    let markdown = '';
    try {
      const response = await axios.post(
        'https://api.firecrawl.dev/v1/scrape',
        {
          url: `https://${domain}`,
          formats: ['markdown'],
          onlyMainContent: true
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.data.success) {
        throw new Error(`Firecrawl API returned success: false`);
      }
      
      markdown = response.data.data.markdown;
      console.log(`[Engine] Extracted ${markdown.length} characters of markdown.`);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message;
      return NextResponse.json({ success: false, error: `Failed to scrape ${domain}: ${errorMsg}` }, { status: 500 });
    }

    // 2. Analyze with Gemini
    console.log(`[Engine] Analyzing signals with Gemini...`);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.6-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            intentScore: { type: "integer", description: "Score from 0-100 indicating buying intent based on signals" },
            signals: { type: "array", items: { type: "string" }, description: "Specific buying signals found" },
            industry: { type: "string" },
            companyName: { type: "string" },
            reasoning: { type: "string", description: "Short 2 sentence explanation of the score" }
          },
          required: ["intentScore", "signals", "industry", "companyName", "reasoning"]
        }
      }
    });

    const prompt = `You are an elite B2B sales intelligence analyst. Analyze this company's website content and extract any buying signals (e.g., hiring, expansion, new products, funding, leadership changes). Determine an intent score out of 100.
    
    Website Content:
    ${markdown.substring(0, 30000)}
    `;

    const result = await model.generateContent(prompt);
    const analysis = JSON.parse(result.response.text());
    
    console.log(`[Engine] AI Analysis Complete: ${analysis.companyName} scored ${analysis.intentScore}`);

    // 3. Save to Supabase
    console.log(`[Engine] Saving to database...`);
    
    const initialTimeline = [
      { event: 'Website Crawled via Firecrawl', timestamp: new Date().toISOString() },
      { event: 'AI Intent Analysis Complete', timestamp: new Date().toISOString() },
      { event: 'Intent Alert Created', timestamp: new Date().toISOString() }
    ];

    const { data: insertedCompany, error } = await supabase.from('companies').insert([{
      name: analysis.companyName,
      domain: domain,
      industry: analysis.industry,
      intent_score: analysis.intentScore,
      status: 'Pending',
      signals: analysis.signals,
      timeline: initialTimeline
    }]).select().single();

    if (error) throw error;

    // Link to campaign if provided
    if (campaignId) {
      await supabase.from('campaign_companies').insert({
        campaign_id: campaignId,
        company_id: insertedCompany.id
      });
    }

    return NextResponse.json({ success: true, data: { company: insertedCompany, analysis } });
  } catch (error: any) {
    console.error('[Engine API Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
