"use client";
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabase';
import { Plus } from 'lucide-react';

export default function DashboardStats({ onStartCampaign }: { onStartCampaign?: () => void }) {
  const [stats, setStats] = useState({
    activeCampaigns: 0,
    totalAccounts: 0,
    alerts24h: 0,
    avgProcessTime: '1.2s' // Mock since we don't track process time yet
  });
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [distributionData, setDistributionData] = useState<{ range: string, count: number }[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    // 1. Fetch counts
    const { count: campCount } = await supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('status', 'Active');
    const { count: compCount } = await supabase.from('companies').select('*', { count: 'exact', head: true });
    
    // Alerts in last 24h
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const { count: alertsCount } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday.toISOString());

    setStats({
      activeCampaigns: campCount || 0,
      totalAccounts: compCount || 0,
      alerts24h: alertsCount || 0,
      avgProcessTime: '1.2s'
    });

    // 2. Fetch Recent Alerts
    const { data: recent } = await supabase
      .from('companies')
      .select('name, intent_score, signals, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recent) {
      setRecentAlerts(recent.map(r => ({
        time: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        company: r.name,
        score: r.intent_score,
        signal: r.signals?.[0] || 'High Intent Detected'
      })));
    }

    // 3. Fetch distribution data
    const { data: allScores } = await supabase.from('companies').select('intent_score');
    if (allScores) {
      const dist = { '50s': 0, '60s': 0, '70s': 0, '80s': 0, '90s': 0 };
      allScores.forEach(c => {
        const s = c.intent_score;
        if (s >= 90) dist['90s']++;
        else if (s >= 80) dist['80s']++;
        else if (s >= 70) dist['70s']++;
        else if (s >= 60) dist['60s']++;
        else if (s >= 50) dist['50s']++;
      });
      setDistributionData(Object.keys(dist).map(k => ({ range: k, count: dist[k as keyof typeof dist] })));
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-end border-b border-border pb-2">
        <h2 className="text-lg font-semibold">Command Center</h2>
        <div className="flex items-center gap-4">
          <div className="mono-data text-emerald-600 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            SYS.MONITORING_ACTIVE
          </div>
          {onStartCampaign && (
            <button 
              onClick={onStartCampaign}
              className="bg-primary text-background px-4 py-1.5 rounded text-sm font-medium hover:bg-primary-hover transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Start Campaign
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* KPI Panel */}
        <div className="panel col-span-1 md:col-span-3">
          <div className="panel-header">System Metrics</div>
          <div className="grid grid-cols-4 divide-x divide-border">
            {[
              { label: 'Active Campaigns', val: stats.activeCampaigns },
              { label: 'Monitored Accounts', val: stats.totalAccounts },
              { label: 'Alerts (24h)', val: stats.alerts24h },
              { label: 'Avg. Processing Time', val: stats.avgProcessTime }
            ].map(kpi => (
              <div key={kpi.label} className="p-4">
                <div className="text-xs text-text-muted uppercase tracking-wider mb-1">{kpi.label}</div>
                <div className="mono-data text-xl">{kpi.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Panel */}
        <div className="panel col-span-1">
          <div className="panel-header">Next Execution</div>
          <div className="p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Target:</span>
              <span className="mono-data">CRON_24H</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Status:</span>
              <span className="mono-data text-emerald-500">READY</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent Alerts Data Table */}
        <div className="panel">
          <div className="panel-header">Recent Intent Alerts</div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border">
              {recentAlerts.length === 0 ? (
                <tr><td className="p-4 text-center text-text-muted">No recent alerts. Start a campaign!</td></tr>
              ) : recentAlerts.map((alert, i) => (
                <tr key={i} className="hover:bg-surface transition-colors cursor-pointer">
                  <td className="p-2 pl-4 mono-data text-text-muted w-24">{alert.time}</td>
                  <td className="p-2 font-medium">{alert.company}</td>
                  <td className="p-2 text-text-muted truncate max-w-[150px]">{alert.signal}</td>
                  <td className="p-2 pr-4 text-right mono-data font-semibold text-primary">{alert.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Intent Distribution Chart */}
        <div className="panel">
          <div className="panel-header">Intent Distribution</div>
          <div className="h-40 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280', fontFamily: 'JetBrains Mono' }} dy={5} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280', fontFamily: 'JetBrains Mono' }} />
                <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '0px', border: '1px solid #e5e7eb', fontSize: '11px', fontFamily: 'JetBrains Mono' }} />
                <Bar dataKey="count" fill="#111827" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

