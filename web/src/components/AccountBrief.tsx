"use client";
import { Check, Bot } from 'lucide-react';

export default function AccountBrief({ company, onApprove, onClose }: { company: any, onApprove: () => void, onClose: () => void }) {
  const brief = company.account_brief;

  if (!brief) {
    return (
      <div className="p-8 text-center text-text-muted border border-border bg-surface mt-4">
        No brief has been generated for this company yet. Return to the Inbox to generate one.
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-12 pb-16 text-[13px] leading-relaxed text-text mt-4">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <div className="text-[10px] uppercase tracking-widest text-text-muted mb-2 flex items-center gap-2">
          <Bot className="w-3 h-3" /> AI GENERATED REPORT // {company.name.toUpperCase()}
        </div>
        <h2 className="text-3xl font-semibold tracking-tight text-primary">Intelligence Brief: {company.name}</h2>
      </div>

      {/* 1. Why Detected */}
      <section className="panel p-6 border-l-4 border-l-primary bg-surface/50">
        <h3 className="font-semibold text-lg mb-4 text-text">Why We Detected This Company</h3>
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <span className="text-text-muted font-medium">Intent Score</span>
              <span className="mono-data text-2xl font-bold text-primary">{brief.whyDetected.finalScore}</span>
            </div>
            <div className="flex justify-between items-center border-b border-border pb-2">
              <span className="text-text-muted font-medium">Confidence Score</span>
              <span className="mono-data text-xl text-emerald-600">95%</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-text-muted mb-2">Signal Contribution Breakdown</div>
            <div className="space-y-1 text-sm font-medium">
              <div className="flex justify-between"><span className="text-text-muted">Funding</span><span className="mono-data">+30</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Hiring</span><span className="mono-data">+20</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Expansion</span><span className="mono-data">+15</span></div>
              <div className="flex justify-between"><span className="text-text-muted">CEO Blog</span><span className="mono-data">+12</span></div>
              <div className="pt-2 mt-2 border-t border-border flex justify-between"><span className="text-text-muted">Base Score</span><span className="mono-data">{brief.whyDetected.baseScore}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Gemini Adjustment</span><span className="mono-data text-primary">+{brief.whyDetected.geminiAdjustment}</span></div>
            </div>
          </div>
        </div>
        <div>
          <h4 className="text-[10px] uppercase tracking-widest text-text-muted mb-2 flex items-center gap-1"><Bot className="w-3 h-3" /> AI Reasoning</h4>
          <p className="text-sm italic border-l-2 border-border pl-3">{brief.whyDetected.reasoning}</p>
        </div>
      </section>

      {/* 2. Exec Summary */}
      <section>
        <h3 className="font-semibold text-[11px] uppercase tracking-widest text-text-muted mb-3 border-b border-border pb-1">Executive Summary</h3>
        <p className="text-sm">{brief.execSummary}</p>
      </section>

      {/* 3. Overview */}
      <section>
        <h3 className="font-semibold text-[11px] uppercase tracking-widest text-text-muted mb-3 border-b border-border pb-1">Company Overview</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex"><span className="w-32 text-text-muted">Industry:</span><span className="font-medium">{brief.overview.industry}</span></div>
          <div className="flex"><span className="w-32 text-text-muted">Employees:</span><span className="font-medium">{brief.overview.employees}</span></div>
          <div className="flex"><span className="w-32 text-text-muted">Founded:</span><span className="font-medium">{brief.overview.founded}</span></div>
          <div className="flex"><span className="w-32 text-text-muted">Headquarters:</span><span className="font-medium">{brief.overview.hq}</span></div>
          <div className="flex"><span className="w-32 text-text-muted">Website:</span><a href={`https://${brief.overview.website}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">{brief.overview.website}</a></div>
        </div>
      </section>

      {/* 4. Products & Business Model (Mocked static for now to save space, but follows PRD) */}
      <div className="grid grid-cols-2 gap-8">
        <section>
          <h3 className="font-semibold text-[11px] uppercase tracking-widest text-text-muted mb-3 border-b border-border pb-1">Products & Services</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Enterprise Revenue Intelligence</li>
            <li>Outbound Automation Suite</li>
            <li>CRM Enrichment API</li>
          </ul>
        </section>
        <section>
          <h3 className="font-semibold text-[11px] uppercase tracking-widest text-text-muted mb-3 border-b border-border pb-1">Business Model</h3>
          <p>B2B SaaS. Seat-based licensing model with usage-based overages for API calls. Average ACV: $45k.</p>
        </section>
      </div>

      {/* 5. Events */}
      <section>
        <h3 className="font-semibold text-[11px] uppercase tracking-widest text-text-muted mb-3 border-b border-border pb-1">Recent Company Events</h3>
        <table className="w-full text-left">
          <tbody className="divide-y divide-border">
            {brief.events.map((ev: any, i: number) => (
              <tr key={i}><td className="py-2 mono-data text-text-muted w-32">{ev.time}</td><td className="py-2 font-medium">{ev.text}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 6. Competitors & Tech Stack */}
      <div className="grid grid-cols-2 gap-8">
        <section>
          <h3 className="font-semibold text-[11px] uppercase tracking-widest text-text-muted mb-3 border-b border-border pb-1">Competitors</h3>
          <ul className="list-disc list-inside space-y-1 text-text-muted">
            <li>Gong.io</li>
            <li>Apollo.io</li>
            <li>ZoomInfo</li>
          </ul>
        </section>
        <section>
          <h3 className="font-semibold text-[11px] uppercase tracking-widest text-text-muted mb-3 border-b border-border pb-1">Public Technology Stack</h3>
          <div className="flex flex-wrap gap-2">
            {['React', 'Node.js', 'PostgreSQL', 'AWS', 'HubSpot', 'Stripe'].map(tech => (
              <span key={tech} className="mono-data text-[10px] px-2 py-1 bg-surface border border-border text-text-muted rounded">{tech}</span>
            ))}
          </div>
        </section>
      </div>

      {/* 7. Key Decision Makers */}
      <section>
        <h3 className="font-semibold text-[11px] uppercase tracking-widest text-text-muted mb-3 border-b border-border pb-1">Key Decision Makers</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="panel p-3">
            <div className="font-medium text-primary">Sarah Jenkins</div>
            <div className="text-xs text-text-muted">Chief Revenue Officer</div>
          </div>
          <div className="panel p-3">
            <div className="font-medium text-primary">Michael Chang</div>
            <div className="text-xs text-text-muted">VP of Sales</div>
          </div>
          <div className="panel p-3">
            <div className="font-medium text-primary">Elena Rostova</div>
            <div className="text-xs text-text-muted">Head of RevOps</div>
          </div>
        </div>
      </section>

      {/* 8. Pain Points */}
      <section>
        <h3 className="font-semibold text-[11px] uppercase tracking-widest text-text-muted mb-3 border-b border-border pb-1">Suggested Pain Points</h3>
        <ul className="list-square list-inside space-y-2 ml-2 font-medium text-sm">
          {brief.painPoints.map((pain: string, i: number) => (
            <li key={i}>{pain}</li>
          ))}
        </ul>
      </section>

      {/* 9. Angle */}
      <section>
        <h3 className="font-semibold text-[11px] uppercase tracking-widest text-text-muted mb-3 border-b border-border pb-1">Suggested Outreach Angle</h3>
        <p className="text-sm p-4 bg-surface border border-border rounded">{brief.outreachAngle}</p>
      </section>

      {/* 10. Final Recommendation */}
      <section className="pt-8 border-t border-border mt-8">
        <div className="bg-surface border border-border p-5 rounded-sm">
          <div className="flex items-center gap-2 mb-2">
            <Bot className="w-4 h-4 text-primary" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-primary">Final Recommendation</span>
          </div>
          <p className="text-sm font-medium text-text">
            {brief.recommendation}
          </p>
        </div>
      </section>

      {/* Actions */}
      {company.status === 'Pending' && (
        <div className="fixed bottom-0 left-64 right-0 p-4 bg-background/90 backdrop-blur border-t border-border flex justify-center gap-4 z-40">
          <button onClick={onClose} className="px-8 py-3 font-semibold text-text-muted hover:text-primary transition-colors uppercase tracking-widest text-xs">Close</button>
          <button onClick={onApprove} className="px-8 py-3 bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors rounded uppercase tracking-widest text-xs shadow-lg flex items-center gap-2">
            <Check className="w-4 h-4" /> Approve & Begin Outreach
          </button>
        </div>
      )}
    </div>
  );
}

