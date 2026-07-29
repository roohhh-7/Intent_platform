import { useState, useEffect } from 'react';
import { Target, Users, Zap, Briefcase, ExternalLink, ThumbsUp, ThumbsDown, Calendar, CheckCircle, XCircle, Search, Bot, Database, Loader2 } from 'lucide-react';
import AccountBrief from './AccountBrief';
import { supabase } from '../lib/supabase';

export default function CompanyDetail({ companyId, onClose }: { companyId: string, onClose: () => void }) {
  const [activeTab, setActiveTab] = useState('Account Brief');
  const tabs = ['Account Brief', 'Timeline', 'Feedback'];
  const [company, setCompany] = useState<any>(null);
  
  // Workflow States
  const [workflowActive, setWorkflowActive] = useState(false);
  const [workflowStep, setWorkflowStep] = useState(0);

  const fetchCompany = async () => {
    const { data } = await supabase.from('companies').select('*').eq('id', companyId).single();
    if (data) setCompany(data);
  };

  useEffect(() => {
    fetchCompany();
  }, [companyId]);

  const handleApprove = async () => {
    setWorkflowActive(true);
    setWorkflowStep(1);
    
    // Mock Apollo
    await new Promise(r => setTimeout(r, 1500));
    setWorkflowStep(2);
    
    // Mock Gemini
    await new Promise(r => setTimeout(r, 2000));
    setWorkflowStep(3);
    
    // Mock HubSpot
    await new Promise(r => setTimeout(r, 1500));
    
    // Finalize DB Update
    const mockContacts = [
      { name: 'Sarah Jenkins', role: 'CRO', email: 'sarah@' + company.domain },
      { name: 'Michael Chang', role: 'VP Sales', email: 'michael@' + company.domain }
    ];
    
    const mockOutreach = {
      email: `Hi Sarah,\n\nSaw that ${company.name} just raised funding and is scaling the SDR team. Managing CRM hygiene during rapid expansion is notoriously difficult.\n\nWe help teams like yours accelerate pipeline generation. Worth a chat?\n\nBest,`,
      linkedin: `Hey Sarah, congrats on the recent funding! Would love to connect and share how we're helping teams scale outbound.`
    };
    
    const newTimeline = [
      ...(company.timeline || []),
      { event: 'Approved', timestamp: new Date().toISOString() },
      { event: 'Apollo Enrichment Completed', timestamp: new Date().toISOString() },
      { event: 'Outreach Generated', timestamp: new Date().toISOString() },
      { event: 'HubSpot Sync Completed', timestamp: new Date().toISOString() }
    ];

    await supabase.from('companies').update({
      status: 'Approved',
      enriched_contacts: mockContacts,
      outreach_drafts: mockOutreach,
      timeline: newTimeline
    }).eq('id', company.id);

    setWorkflowStep(4);
    setTimeout(() => {
      setWorkflowActive(false);
      fetchCompany(); // reload to show new data
    }, 1500);
  };

  const handleFeedback = async (outcome: string) => {
    await supabase.from('companies').update({ feedback: outcome }).eq('id', company.id);
    fetchCompany();
    alert('Feedback recorded!');
  };

  if (!company) return <div className="text-text-muted p-4">Loading company details...</div>;

  return (
    <div className="space-y-6">
      {/* Downstream Workflow Overlay */}
      {workflowActive && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur z-50 flex items-center justify-center">
          <div className="panel p-8 max-w-md w-full space-y-6 shadow-2xl">
            <h3 className="text-lg font-semibold border-b border-border pb-4">Executing Downstream Workflow</h3>
            <div className="space-y-4">
              <div className={`flex items-center gap-4 ${workflowStep >= 1 ? 'text-primary' : 'text-text-muted'}`}>
                {workflowStep === 1 ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                <span className="font-medium">1. Contact Enrichment (Apollo)</span>
              </div>
              <div className={`flex items-center gap-4 ${workflowStep >= 2 ? 'text-primary' : 'text-text-muted'}`}>
                {workflowStep === 2 ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bot className="w-5 h-5" />}
                <span className="font-medium">2. Outreach Generation (Gemini)</span>
              </div>
              <div className={`flex items-center gap-4 ${workflowStep >= 3 ? 'text-primary' : 'text-text-muted'}`}>
                {workflowStep === 3 ? <Loader2 className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />}
                <span className="font-medium">3. CRM Sync (HubSpot)</span>
              </div>
            </div>
            {workflowStep === 4 && (
              <div className="p-4 bg-emerald-500/10 text-emerald-600 font-semibold text-center rounded border border-emerald-500/20">
                Sync Complete!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-semibold">{company.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-text-muted">{company.industry}</span>
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${company.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-surface border border-border'}`}>
              {company.status}
            </span>
          </div>
        </div>
        <div className="text-right">
          <button onClick={onClose} className="text-[10px] uppercase tracking-widest text-text-muted hover:text-primary mb-4 block ml-auto">X Close View</button>
          <div className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Intent Score</div>
          <div className="mono-data text-3xl font-bold text-primary">{company.intent_score}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border flex gap-6 px-2 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-xs uppercase tracking-widest font-semibold transition-colors whitespace-nowrap -mb-[1px] ${
              activeTab === tab 
                ? 'border-b-2 border-primary text-primary' 
                : 'border-b-2 border-transparent text-text-muted hover:text-text'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="py-4">
        {activeTab === 'Account Brief' && (
          <AccountBrief company={company} onApprove={handleApprove} onClose={onClose} />
        )}
        
        {activeTab === 'Timeline' && (
          <div className="panel p-6 max-w-2xl">
            <h3 className="font-semibold mb-6 text-sm uppercase tracking-widest text-text-muted border-b border-border pb-2 flex justify-between">
              <span>Activity Log</span>
              <span>Audit Trail</span>
            </h3>
            <div className="space-y-8 pl-4 border-l-2 border-border ml-2 py-2">
              {company.timeline?.map((item: any, i: number) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[23px] w-3 h-3 bg-primary rounded-full ring-4 ring-background"></div>
                  <div className="font-medium">{item.event}</div>
                  <div className="text-xs text-text-muted mt-1 mono-data">
                    {new Date(item.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
              {(!company.timeline || company.timeline.length === 0) && (
                <div className="text-text-muted text-sm italic">No timeline events recorded.</div>
              )}
            </div>
            
            {/* Show outreach drafts if available in the timeline view for context */}
            {company.outreach_drafts?.email && (
              <div className="mt-8 pt-6 border-t border-border">
                <h4 className="font-semibold mb-4 text-xs uppercase tracking-widest text-text-muted">Generated Outreach Artifacts</h4>
                <div className="p-4 bg-surface border border-border text-sm whitespace-pre-wrap font-mono rounded">
                  {company.outreach_drafts.email}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'Feedback' && (
          <div className="panel p-6 max-w-2xl">
            {company.feedback ? (
              <div className="text-center p-8">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                <h3 className="font-semibold text-lg">Feedback Logged</h3>
                <p className="text-text-muted mt-2">Outcome: <span className="font-semibold text-text">{company.feedback}</span></p>
              </div>
            ) : (
              <>
                <h3 className="font-semibold mb-2 text-sm uppercase tracking-widest text-text-muted border-b border-border pb-2">Record Feedback</h3>
                <p className="text-xs text-text-muted mb-6">Log the outcome to track AI accuracy and ROI. No automatic adjustments will be made.</p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <button onClick={() => handleFeedback('Good Recommendation')} className="flex items-center gap-3 p-4 bg-surface border border-border hover:border-emerald-500 hover:bg-emerald-50 transition-colors text-left group">
                    <ThumbsUp className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium">Good Recommendation</span>
                  </button>
                  <button onClick={() => handleFeedback('Poor Recommendation')} className="flex items-center gap-3 p-4 bg-surface border border-border hover:border-rose-500 hover:bg-rose-50 transition-colors text-left group">
                    <ThumbsDown className="w-4 h-4 text-rose-600" />
                    <span className="text-sm font-medium">Poor Recommendation</span>
                  </button>
                </div>

                <h4 className="font-semibold mb-4 text-sm uppercase tracking-widest text-text-muted border-b border-border pb-2">Sales Outcomes</h4>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Meeting Booked', icon: Calendar, color: 'text-blue-600' },
                    { label: 'Opportunity Created', icon: Target, color: 'text-indigo-600' },
                    { label: 'Closed Won', icon: CheckCircle, color: 'text-emerald-600' },
                    { label: 'Closed Lost', icon: XCircle, color: 'text-rose-600' },
                  ].map((outcome) => (
                    <button key={outcome.label} onClick={() => handleFeedback(outcome.label)} className="flex items-center gap-3 p-3 bg-surface border border-border hover:border-primary transition-colors text-left">
                      <outcome.icon className={`w-4 h-4 ${outcome.color}`} />
                      <span className="font-medium text-sm">{outcome.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
