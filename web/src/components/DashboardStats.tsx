"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardStats() {
  const recentAlerts = [
    { time: '10:42 AM', company: 'Acme Corp', score: 85, signal: 'Series B Funding' },
    { time: '09:15 AM', company: 'Globex Inc', score: 72, signal: 'Hiring VP Sales' },
    { time: 'Yest.', company: 'Initech', score: 68, signal: 'EMEA Expansion' },
  ];

  const distributionData = [
    { range: '50s', count: 12 },
    { range: '60s', count: 24 },
    { range: '70s', count: 18 },
    { range: '80s', count: 7 },
    { range: '90s', count: 2 },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-end border-b border-border pb-2">
        <h2 className="text-lg font-semibold">Command Center</h2>
        <div className="mono-data text-emerald-600 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          SYS.MONITORING_ACTIVE
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* KPI Panel */}
        <div className="panel col-span-1 md:col-span-3">
          <div className="panel-header">System Metrics</div>
          <div className="grid grid-cols-4 divide-x divide-border">
            {[
              { label: 'Active Campaigns', val: '12' },
              { label: 'Monitored Accounts', val: '2,405' },
              { label: 'Alerts (24h)', val: '14' },
              { label: 'Avg. Processing Time', val: '1.2s' }
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
              <span className="mono-data">CRON_6H</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">T-Minus:</span>
              <span className="mono-data">05:42:12</span>
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
              {recentAlerts.map((alert, i) => (
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

