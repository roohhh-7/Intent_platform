import { Activity, Search, Bell, BarChart2, Briefcase, Settings, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import CampaignManager from './components/CampaignManager';
import NotificationCenter from './components/NotificationCenter';
import CompanyDetail from './components/CompanyDetail';
import CompaniesList from './components/CompaniesList';
import DashboardStats from './components/DashboardStats';
import SettingsView from './components/Settings';
import MonitoringLogs from './components/MonitoringLogs';

function App() {
  const [activeView, setActiveView] = useState('Dashboard');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const navItems = [
    { icon: Activity, label: 'Dashboard' },
    { icon: Search, label: 'Companies' },
    { icon: Briefcase, label: 'Campaigns' },
    { icon: Bell, label: 'Alerts' },
  ];

  const handleNavClick = (label: string) => {
    setActiveView(label);
    if (label !== 'Companies') {
      setSelectedCompanyId(null);
    }
  };

  return (
    <div className="flex h-screen bg-background text-text overflow-hidden font-sans">
      {/* Sidebar - High density, minimal */}
      <aside className="w-56 border-r border-border flex flex-col bg-background">
        <div className="h-12 flex items-center px-4 border-b border-border">
          <div className="flex items-center font-semibold text-sm tracking-wide">
            <span>INTENT.TERMINAL</span>
          </div>
        </div>
        
        <div className="px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-widest">
          Core Modules
        </div>
        <nav className="flex-1 px-2 space-y-0.5">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavClick(item.label)}
              className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm w-full text-left transition-colors ${
                activeView === item.label
                  ? 'bg-surface text-primary font-medium' 
                  : 'text-text-muted hover:bg-surface hover:text-text'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
          
          <div className="pt-4 mt-2 border-t border-border">
            <div className="px-2 py-2 text-[10px] font-semibold text-text-muted uppercase tracking-widest">
              System
            </div>
            <button
              onClick={() => handleNavClick('System Logs')}
              className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm w-full text-left transition-colors ${
                activeView === 'System Logs'
                  ? 'bg-surface text-primary font-medium' 
                  : 'text-text-muted hover:bg-surface hover:text-text'
              }`}
            >
              <Activity className="w-4 h-4" />
              Monitoring Logs
            </button>
            <button 
              onClick={() => handleNavClick('Settings')}
              className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm w-full text-left transition-colors ${
                activeView === 'Settings'
                  ? 'bg-surface text-primary font-medium' 
                  : 'text-text-muted hover:bg-surface hover:text-text'
              }`}
            >
              <Settings className="w-4 h-4" />
              Configuration
            </button>
          </div>
        </nav>
        
        <div className="p-4 border-t border-border flex items-center gap-2 text-xs text-text-muted">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          Engine Online
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-surface">
        {/* Top bar - minimal breadcrumb style */}
        <header className="h-12 border-b border-border flex items-center px-6 bg-background">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span>Workspace</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-text font-medium">{activeView}</span>
            {selectedCompanyId && (
              <>
                <ChevronRight className="w-3 h-3" />
                <span className="text-text font-medium">Acme Corp</span>
              </>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {activeView === 'Dashboard' && <DashboardStats />}
            {activeView === 'Campaigns' && <CampaignManager />}
            {activeView === 'Alerts' && <NotificationCenter onSelectCompany={(id) => { setSelectedCompanyId(id); setActiveView('Companies'); }} />}
            {activeView === 'Companies' && !selectedCompanyId && (
              <CompaniesList onSelectCompany={setSelectedCompanyId} />
            )}
            {activeView === 'Companies' && selectedCompanyId && (
              <div>
                <button 
                  onClick={() => setSelectedCompanyId(null)}
                  className="mb-4 text-xs font-medium text-text-muted hover:text-text flex items-center gap-1 uppercase tracking-wider"
                >
                  ← Back to Directory
                </button>
                <CompanyDetail companyId={selectedCompanyId} onClose={() => setSelectedCompanyId(null)} />
              </div>
            )}
            {activeView === 'System Logs' && <MonitoringLogs />}
            {activeView === 'Settings' && <SettingsView />}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
