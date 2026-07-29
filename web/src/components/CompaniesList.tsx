"use client";
import { useState, useEffect } from 'react';
import { Search, ChevronRight, Briefcase } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function CompaniesList({ onSelectCompany }: { onSelectCompany: (id: string) => void }) {
  const [groupedCompanies, setGroupedCompanies] = useState<{ [key: string]: any[] }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    // Fetch all approved companies
    const { data: comps } = await supabase.from('companies').select('*').eq('status', 'Approved').order('intent_score', { ascending: false });
    
    // Fetch all campaigns and the join table to link them
    const { data: camps } = await supabase.from('campaigns').select('id, name');
    const { data: links } = await supabase.from('campaign_companies').select('campaign_id, company_id');

    if (comps) {
      const grouped: { [key: string]: any[] } = {};
      
      comps.forEach(comp => {
        // Find which campaign this company belongs to
        const link = links?.find(l => l.company_id === comp.id);
        const camp = link ? camps?.find(c => c.id === link.campaign_id) : null;
        
        // If not assigned to a campaign (e.g. older mock data), put in Unassigned
        const campName = camp ? camp.name : 'Unassigned Prospects';
        
        if (!grouped[campName]) grouped[campName] = [];
        grouped[campName].push(comp);
      });

      setGroupedCompanies(grouped);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <h2 className="text-lg font-semibold">Target Directory</h2>
        <div className="relative">
          <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" />
          <input 
            type="text" 
            placeholder="Search directory..." 
            className="bg-background border border-border rounded pl-7 pr-2 py-1 text-xs focus:outline-none focus:border-primary transition-colors w-48"
          />
        </div>
      </div>

      <div className="space-y-8">
        {loading ? (
          <div className="panel p-4 text-center text-text-muted">Loading directory...</div>
        ) : Object.keys(groupedCompanies).length === 0 ? (
          <div className="panel p-4 text-center text-text-muted">No approved accounts found. Go to the Alerts tab to approve pending accounts!</div>
        ) : (
          Object.entries(groupedCompanies).map(([campaignName, comps]) => (
            <div key={campaignName} className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-text-muted px-1 flex items-center gap-2">
                <Briefcase className="w-3 h-3" />
                Campaign: <span className="text-primary ml-1">{campaignName}</span>
                <span className="ml-2 font-mono text-[9px] bg-border px-1.5 rounded-full text-text-muted">{comps.length}</span>
              </h3>
              
              <div className="panel">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface text-text-muted uppercase text-[10px] tracking-widest">
                      <th className="p-3 font-semibold">Company</th>
                      <th className="p-3 font-semibold">Domain</th>
                      <th className="p-3 font-semibold">Industry</th>
                      <th className="p-3 font-semibold">Status</th>
                      <th className="p-3 font-semibold text-right">Intent</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {comps.map((company) => (
                      <tr 
                        key={company.id} 
                        className="hover:bg-surface transition-colors cursor-pointer group"
                        onClick={() => onSelectCompany(company.id)}
                      >
                        <td className="p-3 font-medium text-primary">{company.name}</td>
                        <td className="p-3 text-text-muted">{company.domain}</td>
                        <td className="p-3 text-text-muted">{company.industry || 'Unknown'}</td>
                        <td className="p-3 text-text-muted">
                          <span className="flex items-center gap-1.5 text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            {company.status}
                          </span>
                        </td>
                        <td className="p-3 text-right mono-data font-bold text-primary">{company.intent_score}</td>
                        <td className="p-3 text-right">
                          <ChevronRight className="w-4 h-4 text-border group-hover:text-primary transition-colors inline-block" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

