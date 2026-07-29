"use client";
import { Save, ChevronDown, ChevronRight, Key } from 'lucide-react';
import { useState } from 'react';

export default function Settings() {
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);

  const toggleProvider = (provider: string) => {
    setExpandedProvider(expandedProvider === provider ? null : provider);
  };

  const providers = [
    { id: 'gemini', name: 'Gemini', role: 'AI Provider', placeholder: 'AIzaSy...' },
    { id: 'apollo', name: 'Apollo', role: 'Enrichment Provider', placeholder: 'sk_...' },
    { id: 'hubspot', name: 'HubSpot', role: 'CRM Provider', placeholder: 'pat-na1-...' },
    { id: 'firecrawl', name: 'Firecrawl', role: 'Scraping Provider', placeholder: 'fc-...' },
  ];

  return (
    <div className="space-y-8 max-w-4xl pb-12">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Platform Settings</h2>
        <p className="text-sm text-text-muted">Manage your monitoring engine configuration and third-party provider integrations.</p>
      </div>

      <div className="panel">
        <div className="panel-header">Engine Configuration</div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-muted">Monitoring Interval</label>
            <select className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors">
              <option>Every 6 Hours (Recommended)</option>
              <option>Every 12 Hours</option>
              <option>Daily</option>
            </select>
            <p className="text-xs text-text-muted">How often the engine scrapes data sources.</p>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-muted">Global Intent Threshold</label>
            <input type="number" defaultValue={75} className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors mono-data" />
            <p className="text-xs text-text-muted">Minimum score to trigger an Intent Alert.</p>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">Provider Adapters (API Keys)</div>
        <div className="divide-y divide-border">
          {providers.map((provider) => (
            <div key={provider.id} className="bg-background">
              <button
                onClick={() => toggleProvider(provider.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-surface transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Key className="w-4 h-4 text-text-muted" />
                  <div>
                    <div className="font-medium">{provider.name}</div>
                    <div className="text-xs text-text-muted">{provider.role}</div>
                  </div>
                </div>
                {expandedProvider === provider.id ? (
                  <ChevronDown className="w-4 h-4 text-text-muted" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-text-muted" />
                )}
              </button>
              
              {expandedProvider === provider.id && (
                <div className="px-4 pb-4 pt-2 bg-surface/50 border-t border-border">
                  <div className="max-w-xl">
                    <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted mb-2">
                      API Key
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="password" 
                        placeholder={provider.placeholder} 
                        className="flex-1 bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors mono-data" 
                      />
                      <button className="px-4 py-2 bg-primary text-background text-sm font-medium rounded hover:bg-primary-hover transition-colors">
                        Verify
                      </button>
                    </div>
                    <p className="text-xs text-text-muted mt-2">
                      Enter your {provider.name} API key to enable the {provider.role} adapter.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button className="bg-primary hover:bg-primary-hover text-background px-6 py-2 rounded flex items-center gap-2 font-medium transition-colors text-sm">
          <Save className="w-4 h-4" /> Save Configuration
        </button>
      </div>
    </div>
  );
}

