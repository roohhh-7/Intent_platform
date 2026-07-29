"use client";
import { useState } from 'react';
import { Play, Globe, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function MonitoringLogs() {
  const [logs, setLogs] = useState([
    { id: 1, time: '2026-10-15 14:00:00', status: 'Success', message: 'Checked 45 companies in B2B SaaS campaign. Found 3 signals.', duration: '1.2s' },
  ]);

  const [simulating, setSimulating] = useState(false);
  const [domainInput, setDomainInput] = useState('');

  const handleSimulateRun = async () => {
    if (!domainInput) {
      alert('Please enter a domain to scan (e.g. stripe.com)');
      return;
    }

    setSimulating(true);
    setLogs(prev => [{
      id: Date.now(),
      time: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'Processing',
      message: `Engine initializing crawl for ${domainInput}...`,
      duration: '...'
    }, ...prev]);

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domainInput })
      });

      const data = await response.json();

      if (data.success) {
        setLogs(prev => [{
          id: Date.now(),
          time: new Date().toISOString().replace('T', ' ').substring(0, 19),
          status: 'Success',
          message: `Engine crawled ${domainInput} and AI extracted ${data.data.analysis.signals.length} buying signals. Intent Score: ${data.data.analysis.intentScore}`,
          duration: '3.4s' // Mock duration for the log
        }, ...prev]);
        setDomainInput('');
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      setLogs(prev => [{
        id: Date.now(),
        time: new Date().toISOString().replace('T', ' ').substring(0, 19),
        status: 'Failed',
        message: `Engine error: ${error.message}`,
        duration: '0.0s'
      }, ...prev]);
      alert('Simulation error: ' + error.message);
    }
    
    setSimulating(false);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-end justify-between border-b border-border pb-2">
        <h2 className="text-lg font-semibold">System Health & Logs</h2>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-text-muted" />
            <input 
              type="text" 
              placeholder="e.g. stripe.com" 
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              className="bg-background border border-border rounded px-2 py-1 text-xs focus:outline-none focus:border-primary w-48"
              disabled={simulating}
            />
            <button 
              onClick={handleSimulateRun}
              disabled={simulating}
              className="flex items-center gap-1.5 px-3 py-1 bg-surface border border-border text-xs font-semibold uppercase tracking-widest rounded hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-700 transition-colors disabled:opacity-50"
            >
              {simulating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
              Trigger AI Engine
            </button>
          </div>
          
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
                    <span className={`text-xs font-semibold tracking-wider uppercase ${log.status === 'Failed' ? 'text-rose-600' : 'text-emerald-600'}`}>
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

