"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Target, Users, Mail, Activity, BarChart, CheckCircle2, XCircle, Clock, MessageSquare, Phone, RefreshCw, Send, Check, Link } from 'lucide-react';

interface CampaignWorkspaceProps {
  campaignId: string;
  onBack: () => void;
}

export default function CampaignWorkspace({ campaignId, onBack }: CampaignWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Pipeline' | 'Enrichment' | 'Outreach'>('Pipeline');
  const [campaign, setCampaign] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [outreachDrafts, setOutreachDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Action states
  const [manualDomain, setManualDomain] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);

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

  const handleEnrich = async (companyId: string, domain: string) => {
    try {
      const response = await fetch('/api/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, domain })
      });
      const data = await response.json();
      if (data.success) {
        setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, status: 'Enriched', contacts: data.data.contacts } : c));
      } else {
        alert('Enrichment failed: ' + data.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleGenerateDraft = async (company: any, contact: any) => {
    const key = `${company.id}-${contact.email}`;
    setIsGenerating(key);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/outreach', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ company, contact, campaignId })
      });
      const data = await response.json();
      if (data.success) {
        // Replace existing draft for this contact if regenerating, or add new
        setOutreachDrafts(prev => {
          const filtered = prev.filter(d => !(d.company_id === company.id && d.contact.email === contact.email));
          return [data.data, ...filtered];
        });
      } else {
        alert('Failed to generate outreach: ' + data.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
    setIsGenerating(null);
  };

  const handleApproveDraft = async (outreachId: string) => {
    const { error } = await supabase.from('outreach').update({ status: 'Approved' }).eq('id', outreachId);
    if (!error) {
      setOutreachDrafts(prev => prev.map(d => d.id === outreachId ? { ...d, status: 'Approved' } : d));
    }
  };

  const handleSyncCRM = async (outreachId: string) => {
    setIsSyncing(outreachId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/crm', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ outreachId })
      });
      const data = await response.json();
      if (data.success) {
        setOutreachDrafts(prev => prev.map(d => d.id === outreachId ? data.data : d));
      } else {
        alert('CRM Sync failed: ' + data.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
    setIsSyncing(null);
  };

  if (loading) {
    return <div className="p-8 text-center text-text-muted">Loading workspace...</div>;
  }

  if (!campaign) {
    return <div className="p-8 text-center text-rose-500">Campaign not found.</div>;
  }

  const tabs = [
    { id: 'Overview', icon: BarChart, label: 'Overview' },
    { id: 'Pipeline', icon: Target, label: 'Intent Pipeline' },
    { id: 'Enrichment', icon: Users, label: 'Enrichment Queue' },
    { id: 'Outreach', icon: Mail, label: 'Generated Outreach' }
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
                        onClick={() => handleUpdateStatus(company.id, 'Approved')}
                        className="flex-1 py-2 text-sm font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded hover:bg-emerald-500 hover:text-white transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'Enrichment' && (
          <div className="space-y-6">
             <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Enrichment Queue</h2>
              <div className="text-sm text-text-muted">Approved companies waiting for contact enrichment.</div>
            </div>
            
            {approved.length === 0 ? (
              <div className="panel p-8 text-center text-text-muted flex flex-col items-center justify-center">
                <Users className="w-12 h-12 mb-4 opacity-20" />
                <h3 className="text-lg font-medium text-text mb-2">Queue Empty</h3>
                <p className="max-w-md mx-auto">Approve companies from the Intent Pipeline to add them to the enrichment queue.</p>
              </div>
            ) : (
              <div className="panel">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface text-text-muted uppercase text-[10px] tracking-widest">
                      <th className="p-3 font-semibold">Company</th>
                      <th className="p-3 font-semibold">Intent</th>
                      <th className="p-3 font-semibold">Status</th>
                      <th className="p-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {approved.map((company) => (
                      <tr key={company.id} className="hover:bg-surface transition-colors">
                        <td className="p-3 font-medium text-primary">{company.name}</td>
                        <td className="p-3 font-mono text-emerald-500">{company.intent_score}</td>
                        <td className="p-3">
                          {company.status === 'Enriched' ? (
                            <span className="flex items-center gap-1.5 text-xs text-blue-500 font-medium">
                              <CheckCircle2 className="w-3 h-3" /> Found {company.contacts?.length || 0} Contacts
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-xs text-text-muted">
                              <Clock className="w-3 h-3" /> Waiting to be enriched
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {company.status === 'Enriched' ? (
                            <button onClick={() => setActiveTab('Outreach')} className="text-xs bg-surface border border-border text-text-muted px-3 py-1.5 rounded font-medium hover:text-text transition-colors">
                              Go to Outreach
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleEnrich(company.id, company.domain)}
                              className="text-xs bg-primary text-background px-3 py-1.5 rounded font-medium hover:bg-primary-hover transition-colors"
                            >
                              Enrich Contacts
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'Outreach' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Outreach Generation & CRM Sync</h2>
              <div className="text-sm text-text-muted">AI-crafted drafts explicitly citing buying signals.</div>
            </div>

            {enriched.length === 0 ? (
              <div className="panel p-8 text-center text-text-muted flex flex-col items-center justify-center min-h-[300px]">
                <Mail className="w-12 h-12 mb-4 opacity-20" />
                <h3 className="text-lg font-medium text-text mb-2">No Enriched Contacts</h3>
                <p className="max-w-md mx-auto">Enrich some companies in the Enrichment Queue first before generating outreach.</p>
              </div>
            ) : (
              <div className="space-y-12">
                {enriched.map(company => (
                  <div key={company.id} className="space-y-4">
                    <h3 className="text-md font-semibold text-primary border-b border-border pb-2 flex justify-between">
                      {company.name} <span className="text-xs text-text-muted normal-case font-normal">Intent Score: {company.intent_score}</span>
                    </h3>
                    
                    {company.contacts && company.contacts.map((contact: any, i: number) => {
                      const draft = outreachDrafts.find(d => d.company_id === company.id && d.contact.email === contact.email);
                      const key = `${company.id}-${contact.email}`;
                      const isGen = isGenerating === key;
                      const isSync = isSyncing === draft?.id;

                      return (
                        <div key={i} className="panel p-5 grid grid-cols-12 gap-6 relative overflow-hidden">
                          {/* Sidebar Info */}
                          <div className="col-span-12 md:col-span-3 space-y-4">
                            <div>
                              <div className="font-semibold text-text">{contact.name}</div>
                              <div className="text-xs text-text-muted">{contact.title}</div>
                              <a href={contact.linkedin} target="_blank" className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1"><Link className="w-3 h-3" /> Profile</a>
                            </div>
                            
                            {!draft ? (
                              <button 
                                onClick={() => handleGenerateDraft(company, contact)}
                                disabled={isGen}
                                className="w-full bg-primary text-background px-3 py-2 rounded text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                              >
                                {isGen ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                                {isGen ? 'Drafting...' : 'Generate AI Draft'}
                              </button>
                            ) : (
                              <div className="space-y-3 pt-4 border-t border-border">
                                <div className="text-[10px] uppercase font-bold tracking-widest text-text-muted">Status</div>
                                <div className="flex flex-col gap-2">
                                  {draft.status === 'Draft' && <span className="inline-block px-2 py-1 bg-surface border border-border text-xs rounded text-text font-medium w-fit">Pending Review</span>}
                                  {draft.status === 'Approved' && <span className="inline-block px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs rounded font-medium w-fit">Approved for CRM</span>}
                                  {draft.status === 'Synced' && <span className="inline-block px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs rounded font-medium w-fit flex items-center gap-1"><Check className="w-3 h-3"/> Synced to CRM</span>}
                                </div>
                                
                                {draft.status === 'Synced' && draft.crm_record_id && (
                                  <div className="mt-2 text-xs text-text-muted">
                                    <div className="mb-1">{draft.crm_provider}</div>
                                    <div className="font-mono text-[10px] break-all">{draft.crm_record_id}</div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Draft Area */}
                          <div className="col-span-12 md:col-span-9 bg-surface rounded border border-border p-5 relative">
                            {!draft ? (
                              <div className="h-full flex items-center justify-center text-text-muted text-sm italic">
                                AI has not generated a draft yet.
                              </div>
                            ) : (
                              <div className="space-y-6">
                                {/* Email */}
                                <div>
                                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">
                                    <Mail className="w-4 h-4" /> Email Sequence
                                  </div>
                                  <div className="bg-background rounded border border-border p-3">
                                    <div className="text-sm font-medium border-b border-border pb-2 mb-2">Subject: {draft.email_subject}</div>
                                    <div className="text-sm whitespace-pre-wrap text-text-muted leading-relaxed">{draft.email_body}</div>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  {/* LinkedIn */}
                                  <div>
                                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-text-muted mb-2">
                                      <MessageSquare className="w-4 h-4 text-blue-500" /> LinkedIn Request
                                    </div>
                                    <div className="bg-background rounded border border-border p-3 text-sm text-text-muted">
                                      {draft.linkedin_message}
                                    </div>
                                  </div>

                                  {/* Cold Call */}
                                  <div>
                                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-text-muted mb-2">
                                      <Phone className="w-4 h-4 text-emerald-500" /> Cold Call Hook
                                    </div>
                                    <div className="bg-background rounded border border-border p-3 text-sm text-text-muted">
                                      <ul className="list-disc pl-4 space-y-1">
                                        {draft.call_notes.split('\n').filter(Boolean).map((n: string, i: number) => <li key={i}>{n.replace(/^[-*]\s*/, '')}</li>)}
                                      </ul>
                                    </div>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="pt-4 border-t border-border flex justify-end gap-3">
                                  {draft.status === 'Draft' && (
                                    <>
                                      <button 
                                        onClick={() => handleGenerateDraft(company, contact)}
                                        disabled={isGen}
                                        className="px-4 py-1.5 text-sm font-medium border border-border rounded text-text-muted hover:text-text transition-colors flex items-center gap-2 disabled:opacity-50"
                                      >
                                        <RefreshCw className={`w-3.5 h-3.5 ${isGen ? 'animate-spin' : ''}`} /> Regenerate
                                      </button>
                                      <button 
                                        onClick={() => handleApproveDraft(draft.id)}
                                        className="px-4 py-1.5 text-sm font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded hover:bg-emerald-500 hover:text-white transition-colors flex items-center gap-2"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve Draft
                                      </button>
                                    </>
                                  )}
                                  
                                  {draft.status === 'Approved' && (
                                    <button 
                                      onClick={() => handleSyncCRM(draft.id)}
                                      disabled={isSync}
                                      className="px-4 py-1.5 text-sm font-medium bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                                    >
                                      {isSync ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                      {isSync ? 'Pushing to CRM...' : 'Sync to CRM'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
