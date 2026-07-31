"use client";
import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabase';
import { Plus, Activity, Mail, RefreshCw } from 'lucide-react';

export default function DashboardStats({ onStartCampaign }: { onStartCampaign?: () => void }) {
  const [stats, setStats] = useState({
    activeCampaigns: 0,
    totalAccounts: 0,
    alerts24h: 0,
    draftsGenerated: 0,
    crmSyncs: 0,
    conversionRate: '0%'
  });
  
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [distributionData, setDistributionData] = useState<{ range: string, count: number }[]>([]);
  const [outreachTrend, setOutreachTrend] = useState<any[]>([]);
  const [campaignSyncs, setCampaignSyncs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
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

    // Outreach counts
    const { count: draftsCount } = await supabase.from('outreach').select('*', { count: 'exact', head: true });
    const { count: syncsCount } = await supabase.from('outreach').select('*', { count: 'exact', head: true }).eq('status', 'Synced');
    
    const conversion = compCount && compCount > 0 ? Math.round(((syncsCount || 0) / compCount) * 100) + '%' : '0%';

    setStats({
      activeCampaigns: campCount || 0,
      totalAccounts: compCount || 0,
      alerts24h: alertsCount || 0,
      draftsGenerated: draftsCount || 0,
      crmSyncs: syncsCount || 0,
      conversionRate: conversion
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

    // 4. Outreach Analytics
    const { data: allOutreach } = await supabase.from('outreach').select('company_id, generated_at, status');
    if (allOutreach) {
      // Trend
      const trendMap: { [key: string]: number } = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        trendMap[d.toISOString().split('T')[0]] = 0;
      }
      
      allOutreach.forEach(record => {
        if (!record.generated_at) return;
        const dateStr = record.generated_at.split('T')[0];
        if (trendMap[dateStr] !== undefined) {
          trendMap[dateStr]++;
        }
      });
      
      setOutreachTrend(Object.keys(trendMap).map(k => ({
        date: k.substring(5), // "MM-DD"
        drafts: trendMap[k]
      })));

      // Campaign Leaderboard
      const { data: camps } = await supabase.from('campaigns').select('id, name');
      const { data: links } = await supabase.from('campaign_companies').select('campaign_id, company_id');
      
      if (camps && links) {
        const campaignSyncMap: { [key: string]: number } = {};
        camps.forEach(c => campaignSyncMap[c.name] = 0);
        campaignSyncMap['Domain Search'] = 0;
        
        allOutreach.forEach(record => {
          if (record.status === 'Synced') {
             const link = links.find(l => l.company_id === record.company_id);
             const camp = link ? camps.find(c => c.id === link.campaign_id) : null;
             const campName = camp ? camp.name : 'Domain Search';
             campaignSyncMap[campName]++;
          }
        });
        
        const perfList = Object.keys(campaignSyncMap)
          .map(name => ({ name, syncs: campaignSyncMap[name] }))
          .filter(x => x.syncs > 0)
          .sort((a, b) => b.syncs - a.syncs);
          
        setCampaignSyncs(perfList);
      }
    }
    
    setLoading(false);
  };

  if (loading) {
    return <div className="p-8 text-center text-text-muted">Loading metrics...</div>;
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-end border-b border-border pb-2">
        <h2 className="text-lg font-semibold">Command Center</h2>
        <div className="flex items-center gap-4">
          <button onClick={fetchDashboardData} className="text-text-muted hover:text-text p-1" title="Refresh Data">
            <RefreshCw className="w-4 h-4" />
          </button>
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

      {/* KPI Panel */}
      <div className="panel overflow-hidden">
        <div className="panel-header bg-surface">Pipeline Lifecycle Metrics</div>
        <div className="grid grid-cols-2 md:grid-cols-6 divide-x divide-y md:divide-y-0 divide-border">
          {[
            { label: 'Active Campaigns', val: stats.activeCampaigns },
            { label: 'Monitored Accounts', val: stats.totalAccounts },
            { label: 'Alerts (24h)', val: stats.alerts24h },
            { label: 'Outreach Drafted', val: stats.draftsGenerated },
            { label: 'HubSpot Syncs', val: stats.crmSyncs },
            { label: 'Funnel Conversion', val: stats.conversionRate }
          ].map(kpi => (
            <div key={kpi.label} className="p-4 bg-background">
              <div className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-1">{kpi.label}</div>
              <div className="mono-data text-2xl font-bold">{kpi.val}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Recent Alerts Data Table */}
        <div className="panel md:col-span-2">
          <div className="panel-header flex justify-between items-center">
            <span>Recent Intent Alerts</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border">
              {recentAlerts.length === 0 ? (
                <tr><td className="p-8 text-center text-text-muted">No recent alerts. Start a campaign!</td></tr>
              ) : recentAlerts.map((alert, i) => (
                <tr key={i} className="hover:bg-surface transition-colors">
                  <td className="p-3 pl-4 mono-data text-xs text-text-muted w-24">{alert.time}</td>
                  <td className="p-3 font-semibold text-primary">{alert.company}</td>
                  <td className="p-3 text-text-muted truncate max-w-[200px] text-xs">{alert.signal}</td>
                  <td className="p-3 pr-4 text-right mono-data font-bold text-emerald-500">{alert.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Campaign CRM Sync Leaderboard */}
        <div className="panel md:col-span-1">
          <div className="panel-header flex justify-between items-center">
            <span>Top Performing Campaigns</span>
            <Mail className="w-4 h-4 text-blue-500" />
          </div>
          <div className="p-4 space-y-4">
            {campaignSyncs.length === 0 ? (
              <div className="text-center text-text-muted text-sm py-4">No CRM syncs recorded yet.</div>
            ) : (
              campaignSyncs.map((camp, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="text-text-muted text-xs">{i + 1}.</span>
                    <span className="font-medium text-sm truncate">{camp.name}</span>
                  </div>
                  <div className="mono-data text-primary font-bold bg-surface border border-border px-2 py-0.5 rounded text-sm">
                    {camp.syncs} <span className="text-text-muted text-xs font-normal">syncs</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Intent Distribution Chart */}
        <div className="panel">
          <div className="panel-header">Intent Score Distribution</div>
          <div className="h-56 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a', fontFamily: 'JetBrains Mono' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a', fontFamily: 'JetBrains Mono' }} />
                <Tooltip cursor={{ fill: '#18181b' }} contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '4px', fontSize: '11px', fontFamily: 'JetBrains Mono', color: '#e4e4e7' }} itemStyle={{ color: '#e4e4e7' }} />
                <Bar dataKey="count" fill="#3f3f46" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Outreach Trend Chart */}
        <div className="panel">
          <div className="panel-header">Outreach Drafts (7 Days)</div>
          <div className="h-56 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={outreachTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a', fontFamily: 'JetBrains Mono' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a', fontFamily: 'JetBrains Mono' }} />
                <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '4px', fontSize: '11px', fontFamily: 'JetBrains Mono', color: '#e4e4e7' }} itemStyle={{ color: '#e4e4e7' }} />
                <Line type="monotone" dataKey="drafts" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#09090b', stroke: '#10b981', strokeWidth: 2 }} activeDot={{ r: 5, fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

