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
  const colorBg = confidence.level === 'High' ? '#FFD93D' : confidence.level === 'Medium' ? '#C4B5FD' : '#FF6B6B';

  return (
    <div className="border-4 border-black p-4 bg-white" style={{ boxShadow:'6px 6px 0 #000' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-black uppercase tracking-widest">Confidence</p>
        <span className="text-[10px] font-black border-2 border-black px-2 py-0.5"
          style={{ background: colorBg }}>{confidence.level}</span>
      </div>
      <div className="relative h-3 border-2 border-black mb-3 bg-white overflow-hidden">
        <div className="absolute inset-y-0 left-0 border-r-2 border-black transition-all duration-700"
          style={{ width:`${confidence.score}%`, background: colorBg }} />
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl font-black tabular-nums">{confidence.score}<span className="text-sm font-bold text-black/40">/100</span></span>
        <button onClick={() => setExpanded(!expanded)}
          className="text-[10px] font-black uppercase tracking-widest border-2 border-black px-2 py-0.5 hover:bg-[#FFD93D] transition-colors flex items-center gap-1">
          Details {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </button>
      </div>
      <p className="text-xs font-medium text-black/60 leading-relaxed">{confidence.summary}</p>
      {expanded && (
        <div className="mt-3 space-y-1.5 border-t-2 border-black pt-3">
          {confidence.factors.map((f, i) => (
            <div key={i} className="flex items-start gap-2 text-xs font-medium">
              <span className={`mt-0.5 flex-shrink-0 ${f.satisfied ? 'text-black' : 'text-black/20'}`}>
                {f.satisfied ? <CheckCircle2 size={12} strokeWidth={3} /> : <Minus size={12} strokeWidth={3} />}
              </span>
              <div>
                <span className={f.satisfied ? 'text-black' : 'text-black/40'}>{f.label}</span>
                <span className="text-black/40 ml-1">— {f.note}</span>
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
const MARKET_STYLE: Record<string, { bg: string; icon: ReactNode }> = {
  'Below Market':            { bg:'#FF6B6B', icon:<TrendingDown size={14} strokeWidth={3}/> },
  'Competitive':             { bg:'#FFD93D', icon:<Minus size={14} strokeWidth={3}/> },
  'Premium':                 { bg:'#C4B5FD', icon:<TrendingUp size={14} strokeWidth={3}/> },
  'High Risk / Over Market': { bg:'#FF6B6B', icon:<AlertTriangle size={14} strokeWidth={3}/> },
};

function MarketGauge({ result }: { result: EstimateResult }) {
  const style = MARKET_STYLE[result.market_position] ?? MARKET_STYLE['Competitive'];
  const pct = Math.min(100, Math.max(0,
    ((result.effective_per_sf - result.benchmark_low) / Math.max(1, result.benchmark_high - result.benchmark_low)) * 100
  ));

  return (
    <div className="border-4 border-black p-4 bg-white" style={{ boxShadow:'6px 6px 0 #000' }}>
      <p className="text-[10px] font-black uppercase tracking-widest mb-3">Market Position</p>
      <div className="flex items-center gap-2 border-2 border-black px-3 py-2 mb-3 font-black text-sm"
        style={{ background: style.bg }}>
        {style.icon}<span className="uppercase tracking-wide">{result.market_position}</span>
      </div>
      <div className="space-y-1">
        <div className="relative h-3 border-2 border-black bg-white overflow-visible">
          <div className="absolute inset-y-0 left-0 bg-black/10 border-r-2 border-black" style={{ width:`${pct}%` }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-2 h-5 bg-black z-10"
            style={{ left:`calc(${pct}% - 4px)` }} />
        </div>
        <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
          <span>${result.benchmark_low}</span>
          <span>${result.benchmark_mid}</span>
          <span>${result.benchmark_high}</span>
        </div>
        <p className="text-center text-xs font-black mt-1">
          Your rate: <span className="border-b-2 border-black">${result.effective_per_sf.toFixed(0)}/SF</span>
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
      <div className="border-4 border-black p-4 flex items-center gap-3 bg-[#FFD93D]" style={{ boxShadow:'4px 4px 0 #000' }}>
        <CheckCircle2 size={17} strokeWidth={3} />
        <p className="text-xs font-bold uppercase tracking-wide">No critical risk flags detected.</p>
      </div>
    );
  }

  const sevBg: Record<string, string> = { Critical:'#FF6B6B', High:'#FF6B6B', Medium:'#C4B5FD', Low:'#FFD93D' };

  return (
    <div className="space-y-2">
      {flags.map((flag) => (
        <div key={flag.id} className="border-3 border-black p-3" style={{ border:'3px solid #000', background: sevBg[flag.severity] ?? '#FFD93D', boxShadow:'3px 3px 0 #000' }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-black uppercase tracking-widest border-2 border-black px-1.5 py-0.5 bg-black text-white">{flag.severity}</span>
            <span className="text-[9px] font-bold uppercase tracking-wide text-black/60">{flag.category}</span>
          </div>
          <p className="text-xs font-bold leading-relaxed">{flag.message}</p>
          <p className="text-[10px] font-medium text-black/70 mt-1">→ {flag.recommendation}</p>
        </div>
      ))}
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
      <table className="w-full text-sm border-2 border-black">
        <thead>
          <tr className="bg-black text-white">
            <th className="text-left text-[9px] font-black uppercase tracking-widest p-2">Item</th>
            <th className="text-right text-[9px] font-black uppercase tracking-widest p-2">$/SF</th>
            <th className="text-right text-[9px] font-black uppercase tracking-widest p-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {result.line_items.map((item, i) => (
            <tr key={i} className="border-b-2 border-black" style={{ background: item.category === 'markup' ? '#FFFDF5' : '#fff' }}>
              <td className="py-2 px-2">
                <div className="font-bold text-xs">{item.label}</div>
                {item.multipliers_applied.length > 0 && (
                  <div className="text-[9px] text-black/40 mt-0.5 font-medium">{item.multipliers_applied.join(' · ')}</div>
                )}
              </td>
              <td className="py-2 px-2 text-right text-[10px] font-bold text-black/50 tabular-nums">{item.per_sf ? fmtSF(item.per_sf) : '—'}</td>
              <td className="py-2 px-2 text-right font-black text-xs tabular-nums">{fmt(item.adjusted_value)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-4 border-black bg-[#FFD93D]">
            <td colSpan={2} className="pt-2 pb-2 px-2 font-black text-sm uppercase tracking-wide">Total Contract Value</td>
            <td className="pt-2 pb-2 px-2 text-right font-black text-xl tabular-nums">{fmt(result.grand_total)}</td>
          </tr>
          <tr className="border-t border-black/20">
            <td colSpan={2} className="pt-1 pb-1 px-2 text-[10px] font-bold uppercase tracking-wide text-black/50">Effective rate</td>
            <td className="pt-1 pb-1 px-2 text-right text-xs font-black tabular-nums">${result.effective_per_sf.toFixed(2)}/SF</td>
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
    <div className="border-4 border-black p-5 bg-white" style={{ boxShadow:'8px 8px 0 #000' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-9 h-9 flex items-center justify-center border-2 border-black bg-[#C4B5FD]">
            <Brain size={17} strokeWidth={3} />
          </span>
          <div>
            <p className="font-black text-sm uppercase tracking-wide">AI Estimator Advisory</p>
            <p className="text-[10px] font-bold text-black/50 uppercase tracking-wide">Estimate packet — no prices invented</p>
          </div>
        </div>
        {!commentary && (
          <button onClick={onRequest} disabled={loading || !hasKey}
            className={`neo-btn text-xs px-3 py-2 ${loading || !hasKey ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {loading ? 'Analyzing…' : !hasKey ? 'Add OpenAI Key' : 'Get AI Analysis →'}
          </button>
        )}
      </div>
      {!hasKey && !commentary && (
        <div className="border-2 border-black p-4 bg-[#FFFDF5]">
          <p className="text-xs font-medium">Add <code className="font-black bg-[#FFD93D] px-1">OPENAI_API_KEY</code> to <code className="font-black bg-[#FFD93D] px-1">.env.local</code> to enable AI commentary.</p>
        </div>
      )}
      {loading && (
        <div className="flex items-center gap-3 py-4">
          <div className="w-4 h-4 border-2 border-black animate-spin" style={{ borderTopColor:'transparent' }} />
          <p className="text-xs font-black uppercase tracking-widest">Analyzing…</p>
        </div>
      )}
      {commentary && (
        <div className="border-2 border-black p-4 bg-[#FFFDF5]">
          <p className="text-xs font-medium leading-relaxed whitespace-pre-wrap">{commentary}</p>
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
    <div className="border-4 border-black bg-white" style={{ boxShadow:'4px 4px 0 #000' }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 text-left hover:bg-[#FFFDF5] transition-colors">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-black uppercase tracking-wide">{title}</span>
          <span className="text-[9px] font-black border-2 border-black px-1.5 py-0.5 bg-[#FFD93D]">{items.length}</span>
        </div>
        {open ? <ChevronUp size={13} strokeWidth={3} /> : <ChevronDown size={13} strokeWidth={3} />}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t-2 border-black">
          <ul className="space-y-1.5 pt-3">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs font-medium">
                <span className="font-black mt-0.5 flex-shrink-0">—</span>
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
      <div className="relative border-4 border-black bg-white" style={{ boxShadow:'10px 10px 0 #000' }}>
        <div className="absolute inset-0 bg-[#FFD93D] translate-x-[10px] translate-y-[10px] -z-10 border-4 border-black" />
        <div className="p-5">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="bracket-tag">{packet.mode} Estimate</span>
                <span className="text-[10px] font-black border-2 border-black px-2 py-0.5 bg-[#C4B5FD]">{packet.project_type_label}</span>
              </div>
              <p className="text-xs font-bold text-black/60 mb-3 uppercase tracking-wide">{packet.work_type_name} · {packet.region_name} · {packet.total_sf.toLocaleString()} SF</p>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-black tabular-nums">{fmt(result.grand_total)}</span>
                <span className="text-xl font-black text-[#FF6B6B] tabular-nums border-b-4 border-[#FF6B6B]">${result.effective_per_sf.toFixed(0)}/SF</span>
              </div>
              <p className="text-[10px] font-bold text-black/50 mt-1 uppercase tracking-wide">{packet.work_condition_label}</p>
            </div>
            <div className="flex flex-wrap gap-2 md:flex-col md:items-end shrink-0">
              <button onClick={() => { sessionStorage.setItem('glaze_print_packet', JSON.stringify(packet)); window.open('/print', '_blank'); }}
                className="neo-btn-yellow flex items-center gap-2 text-xs px-4 py-2">
                <Printer size={13} strokeWidth={3} /> Print / Export
              </button>
              <button onClick={onReset} className="neo-btn-ghost flex items-center gap-2 text-xs px-4 py-2">
                <RotateCcw size={13} strokeWidth={3} /> New Estimate
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab navigation ── */}
      <div className="flex gap-0 border-4 border-black">
        {TABS.map((tab, i) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 flex-1 justify-center px-3 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all duration-100 ${i > 0 ? 'border-l-4 border-black' : ''} ${activeTab === tab.id ? 'bg-[#FF6B6B] text-black' : 'bg-white text-black/50 hover:bg-[#FFD93D] hover:text-black'}`}>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Material',     value: fmt(result.total_material),  sub: `${((result.total_material / result.grand_total) * 100).toFixed(0)}% of total`, bg:'#FFD93D' },
          { label: 'Labor',        value: fmt(result.total_labor),     sub: `${result.total_labor_hours.toFixed(0)} hrs`,                                   bg:'#C4B5FD' },
          { label: 'Equipment',    value: fmt(result.total_equipment), sub: 'Staging & access',                                                             bg:'#FFFDF5' },
          { label: 'Total Direct', value: fmt(result.total_direct),    sub: 'Before markups',                                                               bg:'#FF6B6B' },
        ].map((s, i) => (
          <div key={i} className="relative">
            <div className="absolute inset-0 border-4 border-black translate-x-[4px] translate-y-[4px]" style={{ background: s.bg }} />
            <div className="relative border-4 border-black p-3 bg-white">
              <p className="text-[9px] font-black uppercase tracking-widest mb-1 text-black/60">{s.label}</p>
              <p className="text-sm font-black tabular-nums">{s.value}</p>
              <p className="text-[10px] font-bold text-black/50 mt-0.5">{s.sub}</p>
            </div>
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
            <div className="border-2 border-black px-4 py-2 flex items-center gap-2 bg-[#FF6B6B]" style={{ boxShadow:'2px 2px 0 #000' }}>
              <AlertTriangle size={14} strokeWidth={3} />
              <p className="text-xs font-black uppercase tracking-wide">{criticalCount} high-priority flag{criticalCount > 1 ? 's' : ''}</p>
            </div>
          )}
        </div>

        {/* Right: line item breakdown */}
        <div className="lg:col-span-2 border-4 border-black p-5 bg-white" style={{ boxShadow:'6px 6px 0 #000' }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-7 h-7 flex items-center justify-center border-2 border-black bg-[#FFD93D]">
              <DollarSign size={13} strokeWidth={3} />
            </span>
            <p className="text-sm font-black uppercase tracking-wide">Cost Breakdown</p>
          </div>
          <LineItemTable result={result} />
          <details className="mt-4">
            <summary className="text-[10px] font-black uppercase tracking-widest cursor-pointer border-2 border-black px-2 py-1 inline-block hover:bg-[#FFD93D] transition-colors select-none">
              Multipliers Audit Trail
            </summary>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {result.multipliers_summary.map((m, i) => (
                <div key={i} className="flex items-center justify-between border-2 border-black px-2 py-1.5 bg-[#FFFDF5]">
                  <span className="text-[10px] font-bold uppercase tracking-wide">{m.name}</span>
                  <span className="text-xs font-black tabular-nums">×{m.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </details>
        </div>
      </div>

      {/* Risk flags */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={14} strokeWidth={3} />
          <p className="text-sm font-black uppercase tracking-wide">Risk Flags</p>
          <span className="text-[9px] font-black border-2 border-black px-1.5 py-0.5 bg-[#FF6B6B]">{risk_flags.length}</span>
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
