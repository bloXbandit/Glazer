'use client';
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, AlertCircle, Info, CheckCircle2,
  Brain, ChevronDown, ChevronUp, Printer, RotateCcw, DollarSign, Clock, FileText, Eye,
  BookOpen, Link2
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { EstimatePacket, RiskFlag, ConfidenceReport, EstimateResult } from '@/types';
import NarrativePanel from '@/components/estimator/NarrativePanel';

// ─────────────────────────────────────────────────────────
// Confidence Meter
// ─────────────────────────────────────────────────────────
function ConfidenceMeter({ confidence }: { confidence: ConfidenceReport }) {
  const [expanded, setExpanded] = useState(false);
  const color = confidence.level === 'High' ? 'emerald' : confidence.level === 'Medium' ? 'amber' : 'red';
  const colorMap = { emerald: '#16a34a', amber: '#d97706', red: '#dc2626' };

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confidence Score</p>
        <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
          confidence.level === 'High'   ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
          confidence.level === 'Medium' ? 'bg-amber-50   text-amber-700   border-amber-200'   :
                                          'bg-red-50     text-red-700     border-red-200'
        }`}>{confidence.level}</span>
      </div>
      <div className="relative h-1.5 bg-[#f0ede8] rounded-full mb-2 overflow-hidden">
        <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
          style={{ width: `${confidence.score}%`, backgroundColor: colorMap[color] }} />
      </div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl font-black tabular-nums" style={{ color: colorMap[color] }}>{confidence.score}</span>
        <span className="text-xs text-slate-400">/ 100</span>
        <button onClick={() => setExpanded(!expanded)} className="text-xs text-slate-400 hover:text-[#111] flex items-center gap-1 transition-colors font-bold">
          Details {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">{confidence.summary}</p>
      {expanded && (
        <div className="mt-3 space-y-1.5 border-t border-[#e2ddd6] pt-3">
          {confidence.factors.map((f, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className={`mt-0.5 flex-shrink-0 ${f.satisfied ? 'text-emerald-600' : 'text-slate-300'}`}>
                {f.satisfied ? <CheckCircle2 size={12} /> : <Minus size={12} />}
              </span>
              <div>
                <span className={f.satisfied ? 'text-slate-700' : 'text-slate-400'}>{f.label}</span>
                <span className="text-slate-400 ml-1">— {f.note}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Market Position Gauge
// ─────────────────────────────────────────────────────────
function MarketGauge({ result }: { result: EstimateResult }) {
  const positions = [
    { id: 'Below Market',          color: 'text-red-700     bg-red-50     border-red-200',     icon: <TrendingDown size={14} /> },
    { id: 'Competitive',           color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: <Minus size={14} /> },
    { id: 'Premium',               color: 'text-blue-700    bg-blue-50    border-blue-200',    icon: <TrendingUp size={14} /> },
    { id: 'High Risk / Over Market', color: 'text-amber-700 bg-amber-50  border-amber-200',   icon: <AlertTriangle size={14} /> },
  ];
  const active = positions.find(p => p.id === result.market_position) ?? positions[1];

  return (
    <div className="card p-4">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Market Position</p>
      <div className={`flex items-center gap-2 px-3 py-2 rounded border mb-3 font-bold text-sm ${active.color}`}>
        {active.icon}
        <span>{result.market_position}</span>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-slate-400 uppercase tracking-wider font-bold">
          <span>Low</span><span>Mid</span><span>High</span>
        </div>
        <div className="relative h-2.5 bg-gradient-to-r from-emerald-200 via-brand-200 to-amber-200 rounded-full border border-[#e2ddd6] overflow-visible">
          {(() => {
            const pct = Math.min(100, Math.max(0,
              ((result.effective_per_sf - result.benchmark_low) / (result.benchmark_high - result.benchmark_low)) * 100
            ));
            return (
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-5 rounded-sm bg-brand-500 border-2 border-white shadow-md z-10"
                style={{ left: `calc(${pct}% - 6px)` }}
                title={`$${result.effective_per_sf.toFixed(0)}/SF`}
              />
            );
          })()}
        </div>
        <div className="flex justify-between text-xs font-black">
          <span className="text-emerald-600">${result.benchmark_low}</span>
          <span className="text-brand-600">${result.benchmark_mid}</span>
          <span className="text-amber-600">${result.benchmark_high}</span>
        </div>
        <p className="text-center text-xs text-slate-500 mt-1">
          Your price: <span className="font-black text-[#111]">${result.effective_per_sf.toFixed(0)}/SF</span>
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Risk Flag Panel
// ─────────────────────────────────────────────────────────
function RiskFlagPanel({ flags }: { flags: RiskFlag[] }) {
  if (flags.length === 0) {
    return (
      <div className="card p-4 flex items-center gap-3">
        <CheckCircle2 size={17} className="text-emerald-600 flex-shrink-0" />
        <p className="text-sm text-slate-600">No critical risk flags detected for this estimate.</p>
      </div>
    );
  }

  const severityConfig: Record<string, { bg: string; border: string; text: string; icon: ReactNode }> = {
    Critical: { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    icon: <AlertCircle size={14} /> },
    High:     { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: <AlertTriangle size={14} /> },
    Medium:   { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  icon: <AlertTriangle size={14} /> },
    Low:      { bg: 'bg-[#f8f6f3]', border: 'border-[#e2ddd6]',  text: 'text-slate-500',  icon: <Info size={14} /> },
  };

  return (
    <div className="space-y-2">
      {flags.map((flag) => {
        const cfg = severityConfig[flag.severity];
        return (
          <div key={flag.id} className={`rounded-xl border p-3 ${cfg.bg} ${cfg.border}`}>
            <div className={`flex items-center gap-2 text-sm mb-1 ${cfg.text}`}>
              {cfg.icon}
              <span className="text-[10px] uppercase tracking-widest font-black">{flag.severity}</span>
              <span className="text-slate-300 font-normal text-xs">·</span>
              <span className="text-xs text-slate-500 font-medium">{flag.category}</span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">{flag.message}</p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">→ {flag.recommendation}</p>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Line Item Table
// ─────────────────────────────────────────────────────────
function LineItemTable({ result }: { result: EstimateResult }) {
  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const fmtSF = (n: number) => `$${n.toFixed(2)}/SF`;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#e2ddd6]">
            <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest pb-2">Item</th>
            <th className="text-right text-[10px] font-black text-slate-400 uppercase tracking-widest pb-2">$/SF</th>
            <th className="text-right text-[10px] font-black text-slate-400 uppercase tracking-widest pb-2">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e2ddd6]">
          {result.line_items.map((item, i) => (
            <tr key={i} className={item.category === 'markup' ? 'bg-[#f8f6f3]' : ''}>
              <td className="py-2.5">
                <div className="text-[#111] font-medium">{item.label}</div>
                {item.multipliers_applied.length > 0 && (
                  <div className="text-xs text-slate-400 mt-0.5">{item.multipliers_applied.join(' · ')}</div>
                )}
              </td>
              <td className="py-2.5 text-right text-slate-400 tabular-nums">
                {item.per_sf ? fmtSF(item.per_sf) : '—'}
              </td>
              <td className={`py-2.5 text-right font-bold tabular-nums ${
                item.category === 'markup' ? 'text-slate-500' : 'text-[#111]'
              }`}>
                {fmt(item.adjusted_value)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-[#ccc8c0]">
            <td colSpan={2} className="pt-3 font-black text-[#111] text-base uppercase tracking-wide">Total Contract Value</td>
            <td className="pt-3 text-right font-black text-xl text-brand-600 tabular-nums">{fmt(result.grand_total)}</td>
          </tr>
          <tr>
            <td colSpan={2} className="pt-1 text-xs text-slate-400">Effective rate</td>
            <td className="pt-1 text-right text-sm font-black text-slate-600 tabular-nums">${result.effective_per_sf.toFixed(2)}/SF</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// AI Advisor Card
// ─────────────────────────────────────────────────────────
function AIAdvisorCard({ commentary, loading, onRequest, hasKey }: {
  commentary: string;
  loading: boolean;
  onRequest: () => void;
  hasKey: boolean;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain size={17} className="text-brand-500" />
          <div>
            <p className="font-black text-[#111] text-sm">AI Estimator Advisory</p>
            <p className="text-xs text-slate-400">Powered by the estimate packet — no prices invented</p>
          </div>
        </div>
        {!commentary && (
          <button
            onClick={onRequest}
            disabled={loading || !hasKey}
            className={`px-4 py-2 rounded text-xs font-black uppercase tracking-wider transition-all duration-150 ${
              loading    ? 'bg-brand-500/20 text-brand-600 cursor-wait border border-brand-300' :
              !hasKey    ? 'bg-[#f8f6f3] text-slate-400 cursor-not-allowed border border-[#e2ddd6]' :
                           'bg-brand-500 hover:bg-brand-600 text-white border border-brand-500'
            }`}
          >
            {loading ? 'Analyzing…' : !hasKey ? 'Add OpenAI Key' : 'Get AI Analysis →'}
          </button>
        )}
      </div>

      {!hasKey && !commentary && (
        <div className="bg-[#f8f6f3] border border-[#e2ddd6] rounded-xl p-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Add your OpenAI API key as <code className="text-brand-600 bg-brand-500/10 px-1 rounded font-mono">OPENAI_API_KEY</code> in a <code className="text-brand-600 bg-brand-500/10 px-1 rounded font-mono">.env.local</code> file to enable AI commentary.
          </p>
          <p className="text-xs text-slate-400 mt-2">The AI receives only the structured estimate packet and explains the pricing strategy. It does not invent or override any numbers.</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-3 py-4">
          <div className="w-4 h-4 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-500">Analyzing estimate packet…</p>
        </div>
      )}

      {commentary && (
        <div className="bg-[#f8f6f3] border border-[#e2ddd6] rounded-xl p-4">
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{commentary}</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Assumptions & Exclusions
// ─────────────────────────────────────────────────────────
function AssumptionsCard({ title, items, icon }: { title: string; items: string[]; icon: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 text-left">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">{icon}</span>
          <span className="text-sm font-bold text-[#111]">{title}</span>
          <span className="text-[10px] font-black text-slate-400 bg-[#f0ede8] px-2 py-0.5 rounded border border-[#e2ddd6]">{items.length}</span>
        </div>
        {open ? <ChevronUp size={13} className="text-slate-400" /> : <ChevronDown size={13} className="text-slate-400" />}
      </button>
      {open && (
        <div className="px-4 pb-4">
          <ul className="space-y-1.5">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-500">
                <span className="text-brand-400 mt-0.5 flex-shrink-0">—</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main Results Panel
// ─────────────────────────────────────────────────────────
type ResultsTab = 'estimate' | 'narrative' | 'sources';

interface ResultsPanelProps {
  packet: EstimatePacket;
  aiCommentary: string;
  aiLoading: boolean;
  onGetAI: () => void;
  hasAIKey: boolean;
  onReset: () => void;
}

const TABS: { id: ResultsTab; label: string; icon: ReactNode }[] = [
  { id: 'estimate', label: 'Estimate', icon: <DollarSign size={13} /> },
  { id: 'narrative', label: 'Basis of Estimate', icon: <BookOpen size={13} /> },
  { id: 'sources', label: 'Sources', icon: <Link2 size={13} /> },
];

export default function ResultsPanel({ packet, aiCommentary, aiLoading, onGetAI, hasAIKey, onReset }: ResultsPanelProps) {
  const { result, confidence, risk_flags, assumptions, exclusions } = packet;
  const [activeTab, setActiveTab] = useState<ResultsTab>('estimate');
  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const criticalCount = risk_flags.filter(f => f.severity === 'Critical' || f.severity === 'High').length;

  return (
    <div className="space-y-5">

      {/* ── Header summary bar ── */}
      <div className="bg-white border border-[#e2ddd6] rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-brand-600 border border-brand-500/40 px-2.5 py-1 rounded-sm font-mono mb-2">
              {packet.mode} Estimate · {packet.project_type_label}
            </span>
            <p className="text-xs text-slate-400 mb-2">
              {packet.work_type_name} · {packet.region_name} · {packet.total_sf.toLocaleString()} SF
            </p>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black text-[#111] tabular-nums">{fmt(result.grand_total)}</span>
              <span className="text-lg font-black text-brand-600 tabular-nums">${result.effective_per_sf.toFixed(0)}/SF</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">{packet.work_condition_label}</p>
          </div>
          <div className="flex flex-wrap gap-2 md:flex-col md:items-end shrink-0">
            <button
              onClick={() => {
                sessionStorage.setItem('glaze_print_packet', JSON.stringify(packet));
                window.open('/print', '_blank');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#f8f6f3] border border-[#e2ddd6] hover:border-[#ccc8c0] text-[#111] text-xs font-bold rounded transition-colors uppercase tracking-wider"
            >
              <Printer size={13} /> Print / Export
            </button>
            <button
              onClick={onReset}
              className="flex items-center gap-2 px-4 py-2 bg-[#f8f6f3] hover:bg-[#f0ede8] border border-[#e2ddd6] text-slate-500 text-xs font-bold rounded transition-colors uppercase tracking-wider"
            >
              <RotateCcw size={13} /> New Estimate
            </button>
          </div>
        </div>
      </div>

      {/* ── Tab navigation ── */}
      <div className="flex gap-1 bg-white border border-[#e2ddd6] rounded-xl p-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 flex-1 justify-center px-3 py-2 rounded text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === tab.id
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-[#111] hover:bg-[#f8f6f3]'
            }`}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* ── NARRATIVE / SOURCES TAB ── */}
      {(activeTab === 'narrative' || activeTab === 'sources') && (
        <NarrativePanel
          narrative={packet.narrative}
          liveFactors={packet.live_data_factors}
          activeView={activeTab}
        />
      )}

      {/* ── ESTIMATE TAB ── */}
      {activeTab === 'estimate' && <>

      {/* Key metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Material',     value: fmt(result.total_material),  sub: `${((result.total_material / result.grand_total) * 100).toFixed(0)}% of total` },
          { label: 'Labor',        value: fmt(result.total_labor),     sub: `${result.total_labor_hours.toFixed(0)} hrs` },
          { label: 'Equipment',    value: fmt(result.total_equipment), sub: 'Staging & access' },
          { label: 'Total Direct', value: fmt(result.total_direct),    sub: 'Before markups' },
        ].map((s, i) => (
          <div key={i} className="card p-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
            <p className="text-base font-black text-[#111] tabular-nums">{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Main 3-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left col: confidence + market */}
        <div className="space-y-4">
          <ConfidenceMeter confidence={confidence} />
          <MarketGauge result={result} />
          {criticalCount > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-2 flex items-center gap-2">
              <AlertTriangle size={14} className="text-orange-600 flex-shrink-0" />
              <p className="text-sm text-orange-700 font-bold">{criticalCount} high-priority risk flag{criticalCount > 1 ? 's' : ''} below</p>
            </div>
          )}
        </div>

        {/* Right: line item breakdown */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={15} className="text-brand-500" />
            <p className="text-sm font-black text-[#111]">Cost Breakdown</p>
          </div>
          <LineItemTable result={result} />

          <details className="mt-4">
            <summary className="text-xs text-slate-400 cursor-pointer hover:text-[#111] transition-colors select-none font-bold">
              View applied multipliers audit trail
            </summary>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {result.multipliers_summary.map((m, i) => (
                <div key={i} className="flex items-center justify-between bg-[#f8f6f3] border border-[#e2ddd6] rounded px-2 py-1.5">
                  <span className="text-xs text-slate-500">{m.name}</span>
                  <span className="text-xs font-black text-[#111] tabular-nums">×{m.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </details>
        </div>
      </div>

      {/* Risk flags */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={14} className="text-amber-600" />
          <p className="text-sm font-black text-[#111]">Risk Flags <span className="text-slate-400 font-normal">({risk_flags.length})</span></p>
        </div>
        <RiskFlagPanel flags={risk_flags} />
      </div>

      {/* AI Advisor */}
      <AIAdvisorCard
        commentary={aiCommentary}
        loading={aiLoading}
        onRequest={onGetAI}
        hasKey={hasAIKey}
      />

      {/* Assumptions & Exclusions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AssumptionsCard title="Assumptions" items={assumptions} icon={<Eye size={14} />} />
        <AssumptionsCard title="Exclusions"  items={exclusions}  icon={<FileText size={14} />} />
      </div>

      </> /* end estimate tab */}
    </div>
  );
}
