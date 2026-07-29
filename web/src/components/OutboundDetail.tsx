"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Users, Mail, CheckCircle2, MessageSquare, Phone, Link, Check, Send } from 'lucide-react';

interface OutboundDetailProps {
  companyId: string;
  onClose: () => void;
}

export default function OutboundDetail({ companyId, onClose }: OutboundDetailProps) {
  const [activeTab, setActiveTab] = useState<'Enrichment' | 'Emails'>('Enrichment');
  const [company, setCompany] = useState<any>(null);
  const [outreachDrafts, setOutreachDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const fetchData = async () => {
    setLoading(true);
    const [compRes, outreachRes] = await Promise.all([
      supabase.from('companies').select('*').eq('id', companyId).single(),
      supabase.from('outreach').select('*').eq('company_id', companyId)
    ]);
    
    if (compRes.data) setCompany(compRes.data);
    if (outreachRes.data) setOutreachDrafts(outreachRes.data);
    
    setLoading(false);
  };

  if (loading) {
    return <div className="p-8 text-center text-text-muted">Loading outbound details...</div>;
  }

  if (!company) {
    return <div className="p-8 text-center text-rose-500">Company not found.</div>;
  }

  return (
    <div className="flex flex-col h-full space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border pb-6">
        <div>
          <button 
            onClick={onClose}
            className="mb-2 text-xs font-medium text-text-muted hover:text-text flex items-center gap-1 uppercase tracking-wider"
          >
            <ArrowLeft className="w-3 h-3" /> Back to Outbounds
          </button>
          <h1 className="text-2xl font-semibold text-primary">{company.name}</h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-text-muted">
            <a href={`https://${company.domain}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">{company.domain}</a>
            <span>•</span>
            <span className="mono-data text-emerald-500 font-bold">Intent: {company.intent_score}</span>
          </div>
        </div>
        
        <div className="flex gap-2 bg-surface p-1 rounded border border-border">
          <button
            onClick={() => setActiveTab('Enrichment')}
            className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors ${
              activeTab === 'Enrichment' 
                ? 'bg-background text-primary shadow-sm border border-border' 
                : 'text-text-muted hover:text-text'
            }`}
          >
            <Users className="w-4 h-4" />
            Enrichment Data
          </button>
          <button
            onClick={() => setActiveTab('Emails')}
            className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors ${
              activeTab === 'Emails' 
                ? 'bg-background text-primary shadow-sm border border-border' 
                : 'text-text-muted hover:text-text'
            }`}
          >
            <Mail className="w-4 h-4" />
            Personalized Emails
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1">
        {activeTab === 'Enrichment' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Contact Enrichment
            </h2>
            
            {!company.contacts || company.contacts.length === 0 ? (
              <div className="panel p-8 text-center text-text-muted">No contacts were found during enrichment.</div>
            ) : (
              <div className="panel">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface text-text-muted uppercase text-[10px] tracking-widest">
                      <th className="p-3 font-semibold">Name</th>
                      <th className="p-3 font-semibold">Title</th>
                      <th className="p-3 font-semibold">Email</th>
                      <th className="p-3 font-semibold">LinkedIn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {company.contacts.map((contact: any, i: number) => (
                      <tr key={i} className="hover:bg-surface transition-colors">
                        <td className="p-3 font-medium text-text">{contact.name}</td>
                        <td className="p-3 text-text-muted">{contact.title}</td>
                        <td className="p-3 text-text-muted">{contact.email}</td>
                        <td className="p-3">
                          <a href={contact.linkedin} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1 text-xs">
                            <Link className="w-3 h-3" /> Profile
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {company.apollo_data && (
              <div className="mt-8 space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-text-muted">Apollo Organization Data</h3>
                <div className="panel p-5 grid grid-cols-2 gap-8 text-sm">
                  <div>
                    <div className="text-xs text-text-muted uppercase tracking-widest mb-1">Keywords</div>
                    <div className="flex flex-wrap gap-1.5">
                      {company.apollo_data.keywords?.slice(0, 8).map((k: string, i: number) => (
                        <span key={i} className="bg-surface border border-border px-2 py-0.5 rounded text-xs">{k}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-text-muted uppercase tracking-widest mb-1">Technologies</div>
                    <div className="flex flex-wrap gap-1.5">
                      {company.apollo_data.technologies?.slice(0, 8).map((t: any, i: number) => (
                        <span key={i} className="bg-surface border border-border px-2 py-0.5 rounded text-xs">{t.name}</span>
                      ))}
                    </div>
                  </div>
                  {company.apollo_data.funding_events && company.apollo_data.funding_events.length > 0 && (
                    <div className="col-span-2">
                       <div className="text-xs text-text-muted uppercase tracking-widest mb-1">Recent Funding</div>
                       <div className="text-primary font-medium">{company.apollo_data.funding_events[0]?.news_title || 'Funding round detected'}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'Emails' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" /> Generated Outreach
            </h2>

            {outreachDrafts.length === 0 ? (
              <div className="panel p-8 text-center text-text-muted">No outreach drafts found. Did generation fail?</div>
            ) : (
              <div className="space-y-8">
                {outreachDrafts.map(draft => (
                  <div key={draft.id} className="panel p-5 grid grid-cols-12 gap-6 relative overflow-hidden">
                    {/* Sidebar Info */}
                    <div className="col-span-12 md:col-span-3 space-y-4">
                      <div>
                        <div className="font-semibold text-text">{draft.contact.name}</div>
                        <div className="text-xs text-text-muted">{draft.contact.title}</div>
                        <a href={draft.contact.linkedin} target="_blank" className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1"><Link className="w-3 h-3" /> Profile</a>
                      </div>
                      
                      <div className="space-y-3 pt-4 border-t border-border">
                        <div className="text-[10px] uppercase font-bold tracking-widest text-text-muted">CRM Status</div>
                        <div className="flex flex-col gap-2">
                          <span className="inline-block px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs rounded font-medium w-fit flex items-center gap-1"><Check className="w-3 h-3"/> Drafted (Gemini)</span>
                          {draft.status === 'Synced' && (
                            <span className="inline-block px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs rounded font-medium w-fit flex items-center gap-1"><Check className="w-3 h-3"/> Synced to HubSpot</span>
                          )}
                        </div>
                        
                        {draft.status === 'Synced' && draft.crm_record_id && (
                          <div className="mt-2 text-xs text-text-muted">
                            <div className="font-mono text-[10px] break-all">Record ID: {draft.crm_record_id}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Draft Area */}
                    <div className="col-span-12 md:col-span-9 bg-surface rounded border border-border p-5 relative">
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
                      </div>
                    </div>
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
