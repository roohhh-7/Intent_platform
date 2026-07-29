import { useState } from 'react';
import { Play } from 'lucide-react';
import { supabase } from '../lib/supabase';

const MOCK_COMPANIES = [
  { name: 'Acme AI', domain: 'acme.ai', industry: 'Enterprise Software' },
  { name: 'Stark Industries', domain: 'stark.com', industry: 'Defense Tech' },
  { name: 'Wayne Enterprises', domain: 'wayne.com', industry: 'Conglomerate' },
  { name: 'Cyberdyne Systems', domain: 'cyberdyne.com', industry: 'Robotics' },
];

export default function MonitoringLogs() {
  const [logs, setLogs] = useState([
    { id: 1, time: '2026-10-15 14:00:00', status: 'Success', message: 'Checked 45 companies in B2B SaaS campaign. Found 3 signals.', duration: '1.2s' },
  ]);

  const [simulating, setSimulating] = useState(false);

  const handleSimulateRun = async () => {
    setSimulating(true);
    const randomCompany = MOCK_COMPANIES[Math.floor(Math.random() * MOCK_COMPANIES.length)];
    const intentScore = Math.floor(Math.random() * 20) + 80; // High score 80-100
    
    const mockSignals = [
      "Raised $8M Series A",
      "Hiring 6 SDRs",
      "Opened US Sales Office",
      "CEO mentioned scaling outbound"
    ];

    const initialTimeline = [
      { event: 'Funding Detected', timestamp: new Date().toISOString() },
      { event: 'Hiring Detected', timestamp: new Date().toISOString() },
      { event: 'Expansion Detected', timestamp: new Date().toISOString() },
      { event: 'Intent Score Generated', timestamp: new Date().toISOString() },
      { event: 'Intent Alert Created', timestamp: new Date().toISOString() }
    ];

    const { data: insertedCompany, error } = await supabase.from('companies').insert([{
      name: randomCompany.name,
      domain: randomCompany.domain + Math.floor(Math.random() * 10000), 
      industry: randomCompany.industry,
      intent_score: intentScore,
      status: 'Pending',
      signals: mockSignals,
      timeline: initialTimeline
    }]).select().single();

    if (!error && insertedCompany) {
      // Link this company to a random active campaign
      const { data: camps } = await supabase.from('campaigns').select('id').eq('status', 'Active');
      if (camps && camps.length > 0) {
         const randomCamp = camps[Math.floor(Math.random() * camps.length)];
         await supabase.from('campaign_companies').insert({
            campaign_id: randomCamp.id,
            company_id: insertedCompany.id
         });
      }

      setLogs(prev => [{
        id: Date.now(),
        time: new Date().toISOString().replace('T', ' ').substring(0, 19),
        status: 'Success',
        message: `Engine Simulation found ${randomCompany.name} showing buying intent!`,
        duration: '0.4s'
      }, ...prev]);
    } else if (error) {
      alert('Simulation error: ' + error.message);
    }
    setSimulating(false);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-end justify-between border-b border-border pb-2">
        <h2 className="text-lg font-semibold">System Health & Logs</h2>
        <div className="flex items-center gap-6">
          <button 
            onClick={handleSimulateRun}
            disabled={simulating}
            className="flex items-center gap-1.5 px-3 py-1 bg-surface border border-border text-xs font-semibold uppercase tracking-widest rounded hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-700 transition-colors disabled:opacity-50"
          >
            <Play className="w-3 h-3" /> Simulate Engine Run
          </button>
          
          <div className="mono-data text-emerald-600 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            SYS.OPERATIONAL
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">Engine Telemetry (24h)</div>
        <div className="grid grid-cols-4 divide-x divide-border">
          {[
            { label: 'Last Run', value: 'Just now' },
            { label: 'Next Run', value: 'In 4h' },
            { label: 'Signals Detected', value: '15' },
            { label: 'System Errors', value: '0' },
          ].map((stat) => (
            <div key={stat.label} className="p-4">
              <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">{stat.label}</div>
              <div className="mono-data text-xl text-primary">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="flex justify-between items-center panel-header">
          <span>Execution Logs</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-border bg-surface text-text-muted uppercase text-[10px] tracking-widest">
                <th className="px-4 py-3 font-semibold">Timestamp</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Event Message</th>
                <th className="px-4 py-3 font-semibold text-right">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-surface transition-colors cursor-pointer">
                  <td className="px-4 py-3 text-text-muted mono-data whitespace-nowrap">{log.time}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold tracking-wider uppercase text-emerald-600">
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{log.message}</td>
                  <td className="px-4 py-3 text-right mono-data text-text-muted">{log.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
