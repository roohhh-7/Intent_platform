"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Bot, CheckCircle2, Activity, RefreshCw, Users, Mail, Send } from 'lucide-react';

export default function NotificationCenter({ onSelectCompany }: { onSelectCompany?: (id: string) => void }) {
  const [activeFilter, setActiveFilter] = useState('Pending Review');
  const filters = ['Pending Review', 'Approved', 'Ignored'];
  
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);

  useEffect(() => {
    fetchAlerts();
  }, [activeFilter]);

  const fetchAlerts = async () => {
    setLoading(true);
    let statusFilter = 'Pending';
    if (activeFilter === 'Approved') statusFilter = 'Approved';
    if (activeFilter === 'Ignored') statusFilter = 'Ignored';

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('status', statusFilter)
      .order('intent_score', { ascending: false });

    if (!error && data) setAlerts(data);
    setLoading(false);
  };

  const [workflowState, setWorkflowState] = useState<{
    company: any | null,
    status: 'idle' | 'running' | 'completed' | 'error',
    step: 'enrich' | 'generate' | 'sync',
    error?: string
  }>({ company: null, status: 'idle', step: 'enrich' });

  const handleAction = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('companies').update({ status: newStatus }).eq('id', id);
    if (!error) {
      fetchAlerts();
    }
  };

  const handleAutomatedWorkflow = async (company: any) => {
    setWorkflowState({ company, status: 'running', step: 'enrich' });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // 1. Approve
      await supabase.from('companies').update({ status: 'Approved' }).eq('id', company.id);
      fetchAlerts(); // remove from pending view instantly
      
      // 2. Enrich
      const enrichRes = await fetch('/api/enrich', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ companyId: company.id, domain: company.domain })
      });
      const enrichData = await enrichRes.json();
      if (!enrichData.success) throw new Error('Enrichment failed: ' + enrichData.error);
      
      setWorkflowState({ company, status: 'running', step: 'generate' });
      
      // 3. Generate
      const contacts = enrichData.data.contacts;
      const drafts = [];
      for (const contact of contacts) {
         const draftRes = await fetch('/api/outreach', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
           body: JSON.stringify({ company, contact, campaignId: null }) // alerts might not have a campaign
         });
         const draftData = await draftRes.json();
         if (!draftData.success) throw new Error('Generation failed: ' + draftData.error);
         drafts.push(draftData.data);
      }
      
      setWorkflowState({ company, status: 'running', step: 'sync' });
      
      // 4. CRM Sync
      for (const draft of drafts) {
         const syncRes = await fetch('/api/crm', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
           body: JSON.stringify({ outreachId: draft.id })
         });
         const syncData = await syncRes.json();
         if (!syncData.success) throw new Error('CRM Sync failed: ' + syncData.error);
      }
      
      setWorkflowState({ company, status: 'completed', step: 'sync' });
      
    } catch (err: any) {
      setWorkflowState(prev => ({ ...prev, status: 'error', error: err.message }));
    }
  };

  const generateBrief = async (company: any) => {
    setGeneratingFor(company.id);
    
    // Simulate generation delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Create the huge mock 14-section brief data
    const mockBrief = {
      whyDetected: {
        funding: 30,
        hiring: 20,
        expansion: 15,
        blog: 12,
        baseScore: 77,
        geminiAdjustment: 12,
        finalScore: company.intent_score,
        reasoning: `${company.name} recently raised funding, expanded its sales organization, and publicly discussed scaling outbound. These combined signals indicate that the company is likely investing in revenue growth, making this an ideal time for outreach.`
      },
      execSummary: `${company.name} is showing strong signs of buying intent within the ${company.industry} sector. Our engine detected signals across multiple channels resulting in a score of ${company.intent_score}. Based on this, they are highly likely to be receptive to outreach regarding their current scaling challenges.`,
      overview: {
        industry: company.industry,
        employees: '150-250',
        founded: '2019',
        hq: 'San Francisco, CA',
        website: company.domain
      },
      events: [
        { time: 'Yesterday', text: 'Raised Series A' },
        { time: 'Three days ago', text: 'Opened US Sales Office' },
        { time: 'Four days ago', text: 'Started hiring SDRs' },
        { time: 'One week ago', text: 'Released Product Version 2.0' }
      ],
      painPoints: ['Scaling outbound', 'CRM hygiene', 'SDR productivity', 'Pipeline generation'],
      outreachAngle: `Lead with congratulations on their recent strategic moves. Pivot directly into how our platform can help their new hires hit quota 30% faster without bloated onboarding. Mention that managing scale is our specialty.`,
      recommendation: `This account exhibits multiple high-confidence buying signals and is a strong candidate for outreach within the next seven days.`
    };

    // Update timeline
    const newTimeline = [...(company.timeline || []), { event: 'Account Brief Generated', timestamp: new Date().toISOString() }];

    const { error } = await supabase.from('companies').update({ 
      account_brief: mockBrief,
      timeline: newTimeline
    }).eq('id', company.id);

    setGeneratingFor(null);
    if (!error && onSelectCompany) {
      onSelectCompany(company.id);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-end border-b border-border pb-2">
        <h2 className="text-lg font-semibold">Intent Alerts</h2>
        <div className="flex gap-4">
          {filters.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`text-[10px] uppercase tracking-widest font-semibold pb-2 border-b-2 transition-colors -mb-[9px] ${
                activeFilter === filter 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-text-muted hover:text-text'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="p-4 text-center text-text-muted">Loading inbox...</div>
        ) : alerts.length === 0 ? (
          <div className="p-4 text-center text-text-muted">Inbox zero! No {activeFilter.toLowerCase()} items.</div>
        ) : alerts.map(alert => (
          <div key={alert.id} className="panel p-6 space-y-4">
            
            <div className="flex justify-between items-start border-b border-border pb-4">
              <div>
                <h3 className="text-xl font-semibold text-primary">{alert.name}</h3>
                <div className="text-sm text-text-muted">{alert.industry}</div>
              </div>
              <div className="flex gap-8 text-right">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Intent Score</div>
                  <div className="mono-data text-2xl font-bold">{alert.intent_score}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Confidence</div>
                  <div className="mono-data text-2xl font-bold text-emerald-600">95%</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="text-[10px] uppercase tracking-widest text-text-muted mb-2">Detected Signals</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {alert.signals?.map((sig: string, i: number) => (
                    <li key={i}>{sig}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-[10px] uppercase tracking-widest text-text-muted mb-2 flex items-center gap-1">
                  <Bot className="w-3 h-3" /> AI Recommendation
                </h4>
                <p className="text-sm italic text-text-muted border-l-2 border-primary pl-3 py-1">
                  "{alert.name} appears to be entering a revenue expansion phase. The combination of recent funding, rapid sales hiring, and international expansion suggests they are actively investing in GTM infrastructure. This is an excellent opportunity for outreach."
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-end gap-3">
              {activeFilter !== 'Approved' && (
                <button onClick={() => handleAutomatedWorkflow(alert)} className="px-4 py-2 bg-background border border-border text-sm rounded hover:border-emerald-500 hover:text-emerald-600 font-medium transition-colors flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Approve & Execute
                </button>
              )}
              {activeFilter !== 'Ignored' && (
                <button onClick={() => handleAction(alert.id, 'Ignored')} className="px-4 py-2 bg-background border border-border text-sm rounded hover:border-rose-500 hover:text-rose-600 font-medium transition-colors">Ignore</button>
              )}
              {activeFilter === 'Pending Review' && (
                <button 
                  onClick={() => generateBrief(alert)}
                  disabled={generatingFor === alert.id}
                  className="px-4 py-2 bg-primary text-background text-sm rounded hover:bg-primary-hover font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {generatingFor === alert.id ? 'Generating...' : 'Generate Account Brief'}
                </button>
              )}
            </div>

          </div>
        ))}
      </div>

      {/* Automated Workflow Modal */}
      {workflowState.company && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Executing Downstream Workflow
            </h2>
            
            <div className="space-y-6 ml-2">
              <div className={`flex items-center gap-4 ${workflowState.step === 'enrich' && workflowState.status === 'running' ? 'opacity-100' : (workflowState.step !== 'enrich' && workflowState.status !== 'idle' ? 'opacity-50' : 'opacity-30')}`}>
                <div className="w-6 flex justify-center">
                  {workflowState.step === 'enrich' && workflowState.status === 'running' ? <RefreshCw className="w-5 h-5 animate-spin text-primary" /> : (workflowState.step !== 'enrich' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Users className="w-5 h-5" />)}
                </div>
                <span className="font-medium text-sm">1. Contact Enrichment (Apollo)</span>
              </div>
              
              <div className={`flex items-center gap-4 ${workflowState.step === 'generate' && workflowState.status === 'running' ? 'opacity-100' : (workflowState.step === 'sync' ? 'opacity-50' : 'opacity-30')}`}>
                <div className="w-6 flex justify-center">
                  {workflowState.step === 'generate' && workflowState.status === 'running' ? <RefreshCw className="w-5 h-5 animate-spin text-primary" /> : (workflowState.step === 'sync' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Mail className="w-5 h-5" />)}
                </div>
                <span className="font-medium text-sm">2. Outreach Generation (Gemini)</span>
              </div>
              
              <div className={`flex items-center gap-4 ${workflowState.step === 'sync' && workflowState.status === 'running' ? 'opacity-100' : (workflowState.status === 'completed' ? 'opacity-50' : 'opacity-30')}`}>
                <div className="w-6 flex justify-center">
                  {workflowState.step === 'sync' && workflowState.status === 'running' ? <RefreshCw className="w-5 h-5 animate-spin text-primary" /> : (workflowState.status === 'completed' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Send className="w-5 h-5" />)}
                </div>
                <span className="font-medium text-sm">3. CRM Sync (HubSpot)</span>
              </div>
            </div>

            {workflowState.error && (
              <div className="mt-6 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm rounded">
                Error: {workflowState.error}
              </div>
            )}
            
            {(workflowState.status === 'completed' || workflowState.status === 'error') && (
              <button 
                onClick={() => setWorkflowState({ company: null, status: 'idle', step: 'enrich' })}
                className="mt-8 w-full bg-primary text-background px-4 py-2 rounded text-sm font-medium hover:bg-primary-hover transition-colors"
              >
                Close Window
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

