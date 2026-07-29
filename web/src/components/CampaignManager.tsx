"use client";
import { Plus, Play, Pause, Archive, X, Upload } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Campaign {
  id: string;
  name: string;
  icp_config: any;
  intent_threshold: number;
  status: string;
}

const COMPANY_SIZES = ['1-10', '11-20', '21-50', '51-100', '101-200', '201-500', '501-1000', '1001-2000', '2001-5000', '5001-10000', '10001+'];
const MARKET_SEGMENTS = ['B2B', 'B2C', 'B2B2C', 'SaaS', 'FinTech', 'E-commerce', 'Marketplace', 'D2C', 'Retail', 'Healthcare', 'Consulting', 'Services', 'Non-Profit'];

export default function CampaignManager() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSlideover, setShowSlideover] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [threshold, setThreshold] = useState(75);
  
  // Detailed ICP Form State
  const [icpConfig, setIcpConfig] = useState({
    selling: '',
    solving: '',
    roles: '',
    industry: '',
    country: '',
    characteristics: '',
    domains: '',
    companySize: [] as string[],
    marketSegment: [] as string[]
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    const { data, error } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setCampaigns(data);
    }
    setLoading(false);
  };

  const toggleArrayItem = (field: 'companySize' | 'marketSegment', item: string) => {
    setIcpConfig(prev => {
      const current = prev[field];
      const updated = current.includes(item) 
        ? current.filter(i => i !== item)
        : [...current, item];
      return { ...prev, [field]: updated };
    });
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('campaigns').insert([
      { 
        name, 
        icp_definition: icpConfig.selling, // Legacy fallback
        icp_config: icpConfig, 
        intent_threshold: threshold, 
        status: 'Active' 
      }
    ]);
    
    if (!error) {
      setShowSlideover(false);
      setName('');
      setThreshold(75);
      setIcpConfig({
        selling: '', solving: '', roles: '', industry: '', country: '', 
        characteristics: '', domains: '', companySize: [], marketSegment: []
      });
      fetchCampaigns();
    } else {
      alert('Error creating campaign: ' + error.message);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <h2 className="text-lg font-semibold">Campaign Management</h2>
        <button 
          onClick={() => setShowSlideover(true)}
          className="text-xs font-semibold uppercase tracking-widest text-primary hover:text-primary-hover flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3 h-3" />
          New Campaign
        </button>
      </div>

      <div className="panel">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-text-muted uppercase text-[10px] tracking-widest">
              <th className="p-3 font-semibold">Campaign Name</th>
              <th className="p-3 font-semibold">Segments</th>
              <th className="p-3 font-semibold">Intent Threshold</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={5} className="p-4 text-center text-text-muted">Loading campaigns...</td></tr>
            ) : campaigns.length === 0 ? (
              <tr><td colSpan={5} className="p-4 text-center text-text-muted">No campaigns found. Create one to start monitoring!</td></tr>
            ) : campaigns.map((camp) => (
              <tr key={camp.id} className="hover:bg-surface transition-colors group">
                <td className="p-3 font-medium text-primary">{camp.name}</td>
                <td className="p-3 text-text-muted max-w-xs truncate">
                  {camp.icp_config?.marketSegment?.join(', ') || 'N/A'}
                </td>
                <td className="p-3 mono-data font-semibold">{camp.intent_threshold}</td>
                <td className="p-3 text-text-muted">
                  <span className="flex items-center gap-1.5 text-xs">
                    <span className={`w-1.5 h-1.5 rounded-full ${camp.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                    {camp.status}
                  </span>
                </td>
                <td className="p-3 text-right space-x-2">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    {camp.status === 'Paused' ? (
                      <button className="p-1 text-text-muted hover:text-emerald-600 transition-colors" title="Resume"><Play className="w-4 h-4" /></button>
                    ) : (
                      <button className="p-1 text-text-muted hover:text-amber-600 transition-colors" title="Pause"><Pause className="w-4 h-4" /></button>
                    )}
                    <button className="p-1 text-text-muted hover:text-rose-600 transition-colors" title="Archive"><Archive className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showSlideover && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex justify-end z-50">
          <div className="panel h-full w-full max-w-2xl bg-background flex flex-col border-l border-border rounded-none shadow-2xl animate-in slide-in-from-right-full duration-200">
            <div className="panel-header flex justify-between items-center py-4 px-6 border-b border-border bg-background">
              <div>
                <h2 className="text-lg font-semibold text-text uppercase tracking-widest mb-1">Edit Target ICP</h2>
                <div className="text-xs text-text-muted normal-case font-normal">Define your highly specific Ideal Customer Profile</div>
              </div>
              <button onClick={() => setShowSlideover(false)} className="text-text-muted hover:text-primary"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <form id="campaign-form" onSubmit={handleCreateCampaign} className="space-y-8">
                
                {/* General Settings */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted mb-2">Campaign Name</label>
                    <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Q4 Enterprise Expansion" className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted mb-2">Intent Threshold</label>
                    <input required type="number" value={threshold} onChange={e => setThreshold(Number(e.target.value))} className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors mono-data" />
                  </div>
                </div>

                <div className="border-t border-border pt-8 space-y-6">
                  
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted mb-2">What are you selling?</label>
                    <textarea value={icpConfig.selling} onChange={e => setIcpConfig({...icpConfig, selling: e.target.value})} placeholder="e.g. resume ATS screener platform" className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors h-20 resize-y" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted mb-2">What problem are you solving?</label>
                    <textarea value={icpConfig.solving} onChange={e => setIcpConfig({...icpConfig, solving: e.target.value})} placeholder="e.g. HR team always confuses with what kind of ATS they wanna use..." className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors h-20 resize-y" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted mb-2">Product Brochure / Overview (PDF) - Optional</label>
                    <div className="flex items-center gap-4">
                      <button type="button" className="bg-surface border border-border hover:border-primary px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2">
                        <Upload className="w-4 h-4" /> Choose File
                      </button>
                      <span className="text-sm text-text-muted">No file chosen</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted mb-2">Who buys it? <span className="text-text-muted/50 normal-case font-normal">(Comma separated)</span></label>
                    <input type="text" value={icpConfig.roles} onChange={e => setIcpConfig({...icpConfig, roles: e.target.value})} placeholder="e.g. HR, Talent, Recruiter" className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted mb-2">Target Industry</label>
                    <input type="text" value={icpConfig.industry} onChange={e => setIcpConfig({...icpConfig, industry: e.target.value})} placeholder="e.g. B2B SaaS, Enterprise Software" className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">Target Company Size</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {COMPANY_SIZES.map(size => (
                        <label key={size} className="flex items-center gap-2 p-2 bg-surface border border-border rounded cursor-pointer hover:border-primary transition-colors">
                          <input 
                            type="checkbox" 
                            checked={icpConfig.companySize.includes(size)}
                            onChange={() => toggleArrayItem('companySize', size)}
                            className="accent-primary"
                          />
                          <span className="text-sm mono-data">{size}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted mb-2">Target Country</label>
                    <input type="text" value={icpConfig.country} onChange={e => setIcpConfig({...icpConfig, country: e.target.value})} placeholder="e.g. India, United States" className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">Market Segment</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {MARKET_SEGMENTS.map(seg => (
                        <label key={seg} className="flex items-center gap-2 p-2 bg-surface border border-border rounded cursor-pointer hover:border-primary transition-colors">
                          <input 
                            type="checkbox" 
                            checked={icpConfig.marketSegment.includes(seg)}
                            onChange={() => toggleArrayItem('marketSegment', seg)}
                            className="accent-primary"
                          />
                          <span className="text-sm">{seg}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted mb-2">Ideal Customer Characteristics</label>
                    <textarea value={icpConfig.characteristics} onChange={e => setIcpConfig({...icpConfig, characteristics: e.target.value})} placeholder="e.g. Fast growing, recently funded" className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors h-20 resize-y" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted mb-2">Target Specific Domains (Optional)</label>
                    <input type="text" value={icpConfig.domains} onChange={e => setIcpConfig({...icpConfig, domains: e.target.value})} placeholder="e.g. apple.com, microsoft.com" className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors" />
                  </div>

                </div>
              </form>
            </div>
            
            <div className="border-t border-border p-6 bg-background flex justify-end gap-3">
              <button type="button" onClick={() => setShowSlideover(false)} className="px-6 py-2 text-sm font-medium border border-border rounded hover:bg-surface transition-colors">Cancel</button>
              <button type="submit" form="campaign-form" className="bg-primary text-background px-6 py-2 text-sm font-medium rounded hover:bg-primary-hover transition-colors">Save Campaign</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

