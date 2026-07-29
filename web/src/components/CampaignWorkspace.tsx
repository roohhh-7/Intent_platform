"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Target, Users, Mail, Activity, BarChart, CheckCircle2, XCircle, Clock, MessageSquare, Phone, RefreshCw, Send, Check, Link } from 'lucide-react';

interface CampaignWorkspaceProps {
  campaignId: string;
  onBack: () => void;
}

export default function CampaignWorkspace({ campaignId, onBack }: CampaignWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Pipeline'>('Pipeline');
  const [campaign, setCampaign] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [outreachDrafts, setOutreachDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Action states
  const [manualDomain, setManualDomain] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  
  // Workflow state
  const [workflowState, setWorkflowState] = useState<{
    company: any | null;
    status: 'idle' | 'running' | 'completed' | 'error';
    step: 'enrich' | 'generate' | 'sync';
    error?: string;
  }>({ company: null, status: 'idle', step: 'enrich' });

  useEffect(() => {
    fetchData();
  }, [campaignId]);

  const fetchData = async () => {
    setLoading(true);
    const [campRes, compRes] = await Promise.all([
      supabase.from('campaigns').select('*').eq('id', campaignId).single(),
      supabase.from('campaign_companies').select('company_id, companies(*)').eq('campaign_id', campaignId)
    ]);
    
    if (campRes.data) setCampaign(campRes.data);
    
    if (compRes.data) {
      const companiesData = compRes.data.map((c: any) => c.companies).filter(Boolean);
      setCompanies(companiesData);
      
      if (companiesData.length > 0) {
        const companyIds = companiesData.map(c => c.id);
        const { data: outreachData } = await supabase
          .from('outreach')
          .select('*')
          .in('company_id', companyIds)
          .order('generated_at', { ascending: false });
        
        if (outreachData) setOutreachDrafts(outreachData);
      }
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (companyId: string, newStatus: string) => {
    const { error } = await supabase.from('companies').update({ status: newStatus }).eq('id', companyId);
    if (!error) {
      setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, status: newStatus } : c));
    }
  };

  const handleManualScan = async () => {
    if (!manualDomain) return;
    setIsScanning(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ domain: manualDomain, campaignId })
      });
      const data = await response.json();
      if (data.success) {
        setCompanies(prev => {
          const filtered = prev.filter(c => c.id !== data.data.company.id);
          return [data.data.company, ...filtered];
        });
        setManualDomain('');
      } else {
        alert('Scan failed: ' + data.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
    setIsScanning(false);
  };

  const handleAutomatedWorkflow = async (company: any) => {
    setWorkflowState({ company, status: 'running', step: 'enrich' });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // 1. Approve
      await supabase.from('companies').update({ status: 'Approved' }).eq('id', company.id);
      
      // 2. Enrich
      const enrichRes = await fetch('/api/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
           body: JSON.stringify({ company, contact, campaignId })
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
      
      // Refresh data to show in outbound
      fetchData();
    } catch (err: any) {
      setWorkflowState(prev => ({ ...prev, status: 'error', error: err.message }));
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-text-muted">Loading workspace...</div>;
  }

  if (!campaign) {
    return <div className="p-8 text-center text-rose-500">Campaign not found.</div>;
  }

  const tabs = [
    { id: 'Overview', icon: BarChart, label: 'Overview' },
    { id: 'Pipeline', icon: Target, label: 'Intent Pipeline' }
  ];

  const pending = companies.filter(c => c.status === 'Pending');
  const approved = companies.filter(c => c.status === 'Approved' || c.status === 'Enriched');
  const ignored = companies.filter(c => c.status === 'Ignored');
  const enriched = companies.filter(c => c.status === 'Enriched');

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Workspace Header */}
      <div className="flex items-start justify-between border-b border-border pb-6">
        <div>
          <button 
            onClick={onBack}
            className="mb-2 text-xs font-medium text-text-muted hover:text-text flex items-center gap-1 uppercase tracking-wider"
          >
            <ArrowLeft className="w-3 h-3" /> Back to Campaigns
          </button>
          <h1 className="text-2xl font-semibold text-primary">{campaign.name}</h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${campaign.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              {campaign.status}
            </span>
            <span>•</span>
            <span className="mono-data">Intent Threshold: {campaign.intent_threshold}</span>
          </div>
        </div>
        
        <div className="flex gap-2 bg-surface p-1 rounded border border-border">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'bg-background text-primary shadow-sm border border-border' 
                  : 'text-text-muted hover:text-text'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'Pipeline' && pending.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 text-[10px] font-bold">
                  {pending.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content Areas */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'Overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="panel p-4">
                <div className="text-xs text-text-muted uppercase tracking-widest mb-1">Total Monitored</div>
                <div className="text-2xl font-mono text-primary">{companies.length}</div>
              </div>
              <div className="panel p-4">
                <div className="text-xs text-text-muted uppercase tracking-widest mb-1">Pending Alerts</div>
                <div className="text-2xl font-mono text-amber-500">{pending.length}</div>
              </div>
              <div className="panel p-4">
                <div className="text-xs text-text-muted uppercase tracking-widest mb-1">Approved Leads</div>
                <div className="text-2xl font-mono text-emerald-500">{approved.length}</div>
              </div>
              <div className="panel p-4">
                <div className="text-xs text-text-muted uppercase tracking-widest mb-1">Generated Drafts</div>
                <div className="text-2xl font-mono text-primary">{outreachDrafts.length}</div>
              </div>
            </div>
            
            <div className="panel p-6">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-text-muted mb-4">ICP Configuration</h3>
              <pre className="text-xs text-text-muted bg-surface p-4 rounded overflow-x-auto border border-border">
                {JSON.stringify(campaign.icp_config, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'Pipeline' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Intent Pipeline</h2>
                <div className="text-sm text-text-muted">Review signals and approve companies for enrichment.</div>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={manualDomain}
                  onChange={(e) => setManualDomain(e.target.value)}
                  placeholder="e.g. stripe.com" 
                  className="bg-surface border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-primary"
                  disabled={isScanning}
                />
                <button 
                  onClick={handleManualScan}
                  disabled={isScanning || !manualDomain}
                  className="bg-primary text-background px-4 py-1.5 rounded text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors"
                >
                  {isScanning ? 'Scanning...' : 'Force Scan Domain'}
                </button>
              </div>
            </div>
            
            {pending.length === 0 ? (
              <div className="panel p-8 text-center text-text-muted flex flex-col items-center justify-center">
                <CheckCircle2 className="w-12 h-12 mb-4 opacity-20 text-emerald-500" />
                <h3 className="text-lg font-medium text-text mb-2">Inbox Zero</h3>
                <p className="max-w-md mx-auto">No pending intent alerts for this campaign. The AI Engine is constantly scanning for new signals.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pending.map(company => (
                  <div key={company.id} className="panel p-5 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-primary mb-1">{company.name}</h3>
                        <a href={`https://${company.domain}`} target="_blank" rel="noreferrer" className="text-sm text-blue-500 hover:underline">{company.domain}</a>
                      </div>
                      <div className="bg-surface px-3 py-1.5 rounded border border-border flex flex-col items-center">
                        <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Intent</span>
                        <span className={`text-xl font-mono font-bold ${company.intent_score > 70 ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {company.intent_score}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-1 bg-surface rounded p-3 text-sm text-text-muted mb-4 border border-border">
                      <div className="text-xs uppercase tracking-widest font-semibold mb-2 text-text">Detected Signals:</div>
                      <ul className="list-disc pl-4 space-y-1">
                        {company.signals?.map((sig: string, i: number) => <li key={i}>{sig}</li>)}
                      </ul>
                    </div>
                    
                    <div className="flex gap-3 pt-2 mt-auto border-t border-border">
                      <button 
                        onClick={() => handleUpdateStatus(company.id, 'Ignored')}
                        className="flex-1 py-2 text-sm font-medium border border-border rounded text-text-muted hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/20 transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" /> Ignore
                      </button>
                      <button 
                        onClick={() => handleAutomatedWorkflow(company)}
                        className="flex-1 py-2 text-sm font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded hover:bg-emerald-500 hover:text-white transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Approve & Execute
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

          </div>
        )}
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
