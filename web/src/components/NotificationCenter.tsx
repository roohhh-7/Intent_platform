import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Bot, ChevronRight } from 'lucide-react';

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

  const handleAction = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('companies').update({ status: newStatus }).eq('id', id);
    if (!error) {
      fetchAlerts(); // refresh list
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
                <button onClick={() => handleAction(alert.id, 'Approved')} className="px-4 py-2 bg-background border border-border text-sm rounded hover:border-emerald-500 hover:text-emerald-600 font-medium transition-colors">Approve Instantly</button>
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
    </div>
  );
}
