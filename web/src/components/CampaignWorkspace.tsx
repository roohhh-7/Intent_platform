"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Target, Users, Mail, Activity, BarChart, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface CampaignWorkspaceProps {
  campaignId: string;
  onBack: () => void;
}

export default function CampaignWorkspace({ campaignId, onBack }: CampaignWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Pipeline' | 'Enrichment' | 'Outreach'>('Pipeline');
  const [campaign, setCampaign] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      setCompanies(compRes.data.map((c: any) => c.companies).filter(Boolean));
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (companyId: string, newStatus: string) => {
    const { error } = await supabase.from('companies').update({ status: newStatus }).eq('id', companyId);
    if (!error) {
      setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, status: newStatus } : c));
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
    { id: 'Pipeline', icon: Target, label: 'Intent Pipeline' },
    { id: 'Enrichment', icon: Users, label: 'Enrichment Queue' },
    { id: 'Outreach', icon: Mail, label: 'Generated Outreach' }
  ];

  const pending = companies.filter(c => c.status === 'Pending');
  const approved = companies.filter(c => c.status === 'Approved' || c.status === 'Enriched');
  const ignored = companies.filter(c => c.status === 'Ignored');

  const handleEnrich = async (companyId: string, domain: string) => {
    try {
      const response = await fetch('/api/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, domain })
      });
      const data = await response.json();
      if (data.success) {
        // Update local state
        setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, status: 'Enriched', contacts: data.data.contacts } : c));
      } else {
        alert('Enrichment failed: ' + data.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

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
                <div className="text-xs text-text-muted uppercase tracking-widest mb-1">Ignored</div>
                <div className="text-2xl font-mono text-text-muted">{ignored.length}</div>
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
              <h2 className="text-lg font-semibold">Intent Pipeline</h2>
              <div className="text-sm text-text-muted">Review signals and approve companies for enrichment.</div>
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
                            <button className="text-xs bg-surface border border-border text-text-muted px-3 py-1.5 rounded font-medium hover:text-text transition-colors">
                              View Contacts
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
          <div className="panel p-8 text-center text-text-muted flex flex-col items-center justify-center min-h-[400px]">
            <Mail className="w-12 h-12 mb-4 opacity-20" />
            <h3 className="text-lg font-medium text-text mb-2">Generated Outreach</h3>
            <p className="max-w-md mx-auto">AI-drafted emails tailored to the specific intent signals and decision makers will appear here, ready for CRM sync.</p>
          </div>
        )}
      </div>
    </div>
  );
}
