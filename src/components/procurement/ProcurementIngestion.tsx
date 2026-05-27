'use client';

import { useState, useCallback } from 'react';
import {
  FileText, Upload, Zap, AlertTriangle, AlertCircle, Info,
  CheckCircle2, ChevronDown, ChevronUp, Clock, Shield,
  Truck, Wrench, DollarSign, Tag, Copy, Download,
} from 'lucide-react';
import type {
  ScopeIntelligence, ProcurementDocumentType,
  ProcurementLineItem, ProcurementRiskFlag,
  LeadTimeEntry, AccessAssumption,
} from '@/types';

// ── Constants ─────────────────────────────────────────────────

const DOC_TYPE_LABELS: Record<ProcurementDocumentType, string> = {
  subcontractor_proposal: 'Subcontractor Proposal',
  bid_tab: 'Bid Tab / Leveling Sheet',
  scope_exhibit: 'Scope Exhibit',
  rfq_response: 'RFQ Response',
  purchase_order: 'Purchase Order',
  subcontract_exhibit: 'Subcontract Exhibit',
  submittal_cover: 'Submittal Cover',
  change_order_proposal: 'Change Order Proposal',
};

const PRICE_CONFIDENCE_CONFIG = {
  proposed:   { label: 'Proposed',   color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/30' },
  leveled:    { label: 'Leveled',    color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30' },
  awarded:    { label: 'Awarded',    color: 'text-emerald-400',bg: 'bg-emerald-500/10',border: 'border-emerald-500/30' },
  historical: { label: 'Historical', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  indicative: { label: 'Indicative', color: 'text-slate-400',  bg: 'bg-slate-500/10',  border: 'border-slate-500/30' },
};

const RISK_CONFIG = {
  Critical: { color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/40',    icon: <AlertCircle size={13} /> },
  High:     { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: <AlertTriangle size={13} /> },
  Medium:   { color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  icon: <AlertTriangle size={13} /> },
  Low:      { color: 'text-slate-400',  bg: 'bg-slate-500/10',  border: 'border-slate-500/20',  icon: <Info size={13} /> },
};

const PARSE_CONFIDENCE_CONFIG = {
  high:   { label: 'High Confidence',   color: 'text-emerald-400', dot: 'bg-emerald-400' },
  medium: { label: 'Medium Confidence', color: 'text-amber-400',   dot: 'bg-amber-400' },
  low:    { label: 'Low Confidence',    color: 'text-red-400',     dot: 'bg-red-400' },
};

const WORK_TYPE_LABELS: Record<string, string> = {
  storefront: 'Storefront',
  stick_curtain_wall: 'Stick Curtain Wall',
  unitized_curtain_wall: 'Unitized Curtain Wall',
  window_wall: 'Window Wall',
  interior_partition: 'Interior Partition',
  glass_railing: 'Glass Railing',
  skylight: 'Skylight',
  fire_rated: 'Fire-Rated Glazing',
  blast_security: 'Blast / Security',
};

const fmt = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(2)}M`
    : `$${n.toLocaleString()}`;

// ── Sub-components ─────────────────────────────────────────────

function SectionCard({ title, icon, count, children }: {
  title: string;
  icon: React.ReactNode;
  count?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-[#2a2d3a] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#12141c] hover:bg-[#1a1d27] transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
          <span className="text-brand-400">{icon}</span>
          {title}
          {count !== undefined && (
            <span className="ml-1 text-xs text-slate-500 font-normal">({count})</span>
          )}
        </div>
        {open ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
      </button>
      {open && <div className="p-4 bg-[#0f1117] space-y-2">{children}</div>}
    </div>
  );
}

function ScopeList({ items, variant }: { items: string[]; variant: 'include' | 'exclude' }) {
  if (items.length === 0) {
    return <p className="text-xs text-slate-600 italic">None detected — review document manually.</p>;
  }
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
          <span className={`mt-0.5 shrink-0 ${variant === 'include' ? 'text-emerald-400' : 'text-red-400'}`}>
            {variant === 'include' ? '✓' : '✗'}
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function LineItemsTable({ items }: { items: ProcurementLineItem[] }) {
  if (items.length === 0) {
    return <p className="text-xs text-slate-600 italic">No line items extracted.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#2a2d3a] text-slate-500 text-left">
            <th className="pb-2 pr-3 font-medium">Description</th>
            <th className="pb-2 pr-3 font-medium text-right">Qty</th>
            <th className="pb-2 pr-3 font-medium">Unit</th>
            <th className="pb-2 pr-3 font-medium text-right">Unit $</th>
            <th className="pb-2 pr-3 font-medium text-right">Total</th>
            <th className="pb-2 font-medium">Confidence</th>
          </tr>
        </thead>
        <tbody>
          {items.map(li => {
            const cfg = PRICE_CONFIDENCE_CONFIG[li.price_confidence];
            return (
              <tr key={li.id} className={`border-b border-[#1e2130] ${li.is_alternate ? 'opacity-60' : ''}`}>
                <td className="py-2 pr-3 text-slate-200">
                  {li.description.slice(0, 60)}{li.description.length > 60 ? '…' : ''}
                  {li.is_alternate && (
                    <span className="ml-1 px-1 py-0.5 text-[10px] bg-slate-700/60 text-slate-400 rounded">ALT</span>
                  )}
                </td>
                <td className="py-2 pr-3 text-right text-slate-300">{li.quantity?.toLocaleString() ?? '—'}</td>
                <td className="py-2 pr-3 text-slate-400">{li.unit ?? '—'}</td>
                <td className="py-2 pr-3 text-right text-slate-300">
                  {li.unit_price !== undefined ? `$${li.unit_price.toFixed(0)}` : '—'}
                </td>
                <td className="py-2 pr-3 text-right font-medium text-slate-100">
                  {li.extended_price !== undefined ? fmt(li.extended_price) : '—'}
                </td>
                <td className="py-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                    {cfg.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function LeadTimesList({ items }: { items: LeadTimeEntry[] }) {
  if (items.length === 0) {
    return <p className="text-xs text-slate-600 italic">No lead times detected.</p>;
  }
  return (
    <div className="space-y-2">
      {items.map((lt, i) => (
        <div key={i} className="flex items-start gap-3 p-2 bg-[#12141c] rounded-lg border border-[#2a2d3a]">
          <Clock size={13} className="text-brand-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-200 font-medium">{lt.item}</p>
            <p className="text-xs text-brand-300 mt-0.5">
              {lt.weeks_min}–{lt.weeks_max ?? lt.weeks_typical} weeks{' '}
              <span className="text-slate-500">{lt.clock_start}</span>
            </p>
            {lt.notes && <p className="text-xs text-slate-500 mt-0.5">{lt.notes}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function AccessList({ items }: { items: AccessAssumption[] }) {
  if (items.length === 0) {
    return <p className="text-xs text-slate-600 italic">No access assumptions detected.</p>;
  }
  return (
    <div className="space-y-2">
      {items.map((a, i) => (
        <div key={i} className="flex items-start gap-3 p-2 bg-[#12141c] rounded-lg border border-[#2a2d3a]">
          <Wrench size={13} className="text-slate-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-200 font-medium capitalize">{a.method}</span>
              {a.floor_range && <span className="text-xs text-slate-500">{a.floor_range}</span>}
              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${a.included_in_price ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                {a.included_in_price ? 'Included' : 'By Others'}
              </span>
              <span className="text-[10px] text-slate-500 capitalize">by {a.provided_by}</span>
            </div>
            {a.assumptions_stated.length > 0 && (
              <ul className="mt-1 space-y-0.5">
                {a.assumptions_stated.map((s, j) => (
                  <li key={j} className="text-xs text-slate-500">• {s}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function RiskFlagsList({ flags }: { flags: ProcurementRiskFlag[] }) {
  if (flags.length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-emerald-400">
        <CheckCircle2 size={13} /> No risks flagged.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {flags.map(flag => {
        const cfg = RISK_CONFIG[flag.severity];
        return (
          <div key={flag.id} className={`p-3 rounded-lg border ${cfg.bg} ${cfg.border}`}>
            <div className="flex items-start gap-2">
              <span className={`mt-0.5 shrink-0 ${cfg.color}`}>{cfg.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-xs font-semibold ${cfg.color}`}>{flag.severity}</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wide">{flag.category.replace(/_/g, ' ')}</span>
                </div>
                <p className="text-xs text-slate-200">{flag.description}</p>
                {flag.source_text && (
                  <p className="text-xs text-slate-500 italic mt-1">"{flag.source_text}"</p>
                )}
                <p className="text-xs text-slate-400 mt-1.5 border-l-2 border-slate-600 pl-2">
                  {flag.recommendation}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────

interface ProcurementIngestionProps {
  onIntelligenceSaved?: (si: ScopeIntelligence) => void;
}

export default function ProcurementIngestion({ onIntelligenceSaved }: ProcurementIngestionProps) {
  const [docType, setDocType] = useState<ProcurementDocumentType>('subcontractor_proposal');
  const [rawText, setRawText] = useState('');
  const [subName, setSubName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectLocation, setProjectLocation] = useState('');
  const [bidDate, setBidDate] = useState('');

  const [loading, setLoading] = useState(false);
  const [aiEnhanced, setAiEnhanced] = useState(false);
  const [result, setResult] = useState<ScopeIntelligence | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleParse = useCallback(async () => {
    if (rawText.trim().length < 20) {
      setError('Please paste at least 20 characters of document text.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setNote(null);
    setSaved(false);

    try {
      const res = await fetch('/api/parse-procurement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_type: docType,
          raw_text: rawText,
          subcontractor_name: subName || undefined,
          project_name: projectName || undefined,
          project_location: projectLocation || undefined,
          bid_date: bidDate || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Parse failed.');
        return;
      }
      setResult(data.intelligence as ScopeIntelligence);
      setAiEnhanced(data.ai_enhanced === true);
      setNote(data.note ?? null);
    } catch {
      setError('Network error — could not reach parse API.');
    } finally {
      setLoading(false);
    }
  }, [rawText, docType, subName, projectName, projectLocation, bidDate]);

  const [saveResult, setSaveResult] = useState<{ saved: number; region_id: string; price_per_sf: number } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = useCallback(async () => {
    if (!result) return;
    setSaveError(null);
    try {
      const res = await fetch('/api/procurement-intel/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error ?? 'Save failed.');
        return;
      }
      setSaveResult(data);
      setSaved(true);
      onIntelligenceSaved?.(result);
    } catch {
      setSaveError('Network error — could not reach save API.');
    }
  }, [result, onIntelligenceSaved]);

  const handleDownload = useCallback(() => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scope-intel-${result.document_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result]);

  const handleCopy = useCallback(() => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
  }, [result]);

  return (
    <div className="space-y-5">
      {/* ── Input form ── */}
      <div className="bg-[#12141c] border border-[#2a2d3a] rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Upload size={15} className="text-brand-400" />
          <h2 className="text-sm font-semibold text-slate-200">Paste Procurement Document</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-2">
            <label className="text-xs text-slate-500 mb-1 block">Document Type</label>
            <select
              value={docType}
              onChange={e => setDocType(e.target.value as ProcurementDocumentType)}
              className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            >
              {Object.entries(DOC_TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1 block">Subcontractor Name</label>
            <input
              type="text"
              value={subName}
              onChange={e => setSubName(e.target.value)}
              placeholder="Optional"
              className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1 block">Bid Date</label>
            <input
              type="date"
              value={bidDate}
              onChange={e => setBidDate(e.target.value)}
              className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="col-span-2">
            <label className="text-xs text-slate-500 mb-1 block">Project Name</label>
            <input
              type="text"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              placeholder="Optional"
              className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="col-span-2">
            <label className="text-xs text-slate-500 mb-1 block">Project Location</label>
            <input
              type="text"
              value={projectLocation}
              onChange={e => setProjectLocation(e.target.value)}
              placeholder="e.g. Washington, D.C."
              className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-500 mb-1 block">
            Document Text <span className="text-slate-600">(paste full proposal, bid tab, or scope document)</span>
          </label>
          <textarea
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            rows={10}
            placeholder={`Paste raw text from the proposal, bid tab, or scope document here.

Examples:
• Subcontractor bid letter with scope inclusions and exclusions
• Line-by-line bid tab with quantities and unit prices
• Scope exhibit from subcontract
• RFQ response with lead times and warranty terms

The system will extract: scope inclusions/exclusions, line items, lead times, mobilization, access assumptions, warranty, and procurement risks.`}
            className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-4 py-3 text-xs text-slate-200 placeholder-slate-600 font-mono resize-y focus:outline-none focus:border-brand-500 leading-relaxed"
          />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-slate-600">{rawText.length.toLocaleString()} / 30,000 chars</span>
            {rawText.length > 25_000 && (
              <span className="text-xs text-amber-400">Approaching limit — document will be truncated for AI pass</span>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
            <AlertCircle size={13} /> {error}
          </div>
        )}

        <button
          onClick={handleParse}
          disabled={loading || rawText.trim().length < 20}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-semibold text-white transition-colors"
        >
          {loading ? (
            <>
              <span className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full" />
              Parsing document…
            </>
          ) : (
            <>
              <Zap size={14} />
              Extract Scope Intelligence
            </>
          )}
        </button>
      </div>

      {/* ── Results ── */}
      {result && (
        <div className="space-y-4">
          {/* Header bar */}
          <div className="flex items-start justify-between gap-3 p-4 bg-[#12141c] border border-[#2a2d3a] rounded-2xl">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <FileText size={14} className="text-brand-400" />
                <span className="text-sm font-semibold text-slate-100 truncate">
                  {result.project_name ?? 'Unnamed Project'}
                </span>
                {result.subcontractor_name && (
                  <span className="text-xs text-slate-500">— {result.subcontractor_name}</span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="text-slate-500">{DOC_TYPE_LABELS[result.document_type]}</span>
                {result.project_location && <span className="text-slate-500">· {result.project_location}</span>}
                {result.bid_date && <span className="text-slate-500">· {result.bid_date}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Parse confidence pill */}
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium border ${
                PRICE_CONFIDENCE_CONFIG[result.price_confidence].bg
              } ${PRICE_CONFIDENCE_CONFIG[result.price_confidence].border} ${
                PRICE_CONFIDENCE_CONFIG[result.price_confidence].color
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${PARSE_CONFIDENCE_CONFIG[result.parse_confidence].dot}`} />
                {PRICE_CONFIDENCE_CONFIG[result.price_confidence].label}
              </div>
              {aiEnhanced && (
                <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-purple-500/10 border border-purple-500/30 text-purple-400">
                  <Zap size={10} /> AI Enhanced
                </span>
              )}
            </div>
          </div>

          {note && (
            <div className="flex items-center gap-2 p-2.5 bg-slate-500/10 border border-slate-500/20 rounded-lg text-xs text-slate-400">
              <Info size={12} /> {note}
            </div>
          )}

          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Systems', value: result.glazing_systems.map(s => WORK_TYPE_LABELS[s] ?? s).join(', ') || '—', icon: <Tag size={12} /> },
              { label: 'Total SF', value: result.total_sf_proposed?.toLocaleString() ?? '—', icon: <FileText size={12} /> },
              { label: 'Total Price', value: result.total_price_proposed ? fmt(result.total_price_proposed) : '—', icon: <DollarSign size={12} /> },
              { label: 'Risks', value: `${result.risks.length} (${result.risks.filter(r => r.severity === 'Critical' || r.severity === 'High').length} high)`, icon: <Shield size={12} /> },
            ].map(stat => (
              <div key={stat.label} className="p-3 bg-[#12141c] border border-[#2a2d3a] rounded-xl">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                  <span className="text-brand-400">{stat.icon}</span>
                  {stat.label}
                </div>
                <p className="text-sm font-semibold text-slate-100 truncate">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Risk flags first — most important */}
          <SectionCard
            title="Procurement Risk Flags"
            icon={<Shield size={13} />}
            count={result.risks.length}
          >
            <RiskFlagsList flags={result.risks} />
          </SectionCard>

          {/* Scope inclusions/exclusions */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SectionCard
              title="Scope Inclusions"
              icon={<CheckCircle2 size={13} />}
              count={result.inclusions.length}
            >
              <ScopeList items={result.inclusions} variant="include" />
            </SectionCard>
            <SectionCard
              title="Scope Exclusions"
              icon={<AlertTriangle size={13} />}
              count={result.exclusions.length}
            >
              <ScopeList items={result.exclusions} variant="exclude" />
            </SectionCard>
          </div>

          {/* Line items */}
          <SectionCard
            title="Line Items"
            icon={<DollarSign size={13} />}
            count={result.line_items.length}
          >
            <LineItemsTable items={result.line_items} />
          </SectionCard>

          {/* Lead times */}
          <SectionCard
            title="Lead Times"
            icon={<Truck size={13} />}
            count={result.lead_times.length}
          >
            <LeadTimesList items={result.lead_times} />
          </SectionCard>

          {/* F&I + Access + Mob */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SectionCard title="F&I Breakdown" icon={<Wrench size={13} />}>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Material by</span>
                  <span className="text-slate-200 capitalize">{result.furnish_install.material_by}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Install by</span>
                  <span className="text-slate-200 capitalize">{result.furnish_install.install_by}</span>
                </div>
                {result.furnish_install.material_percentage !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Split</span>
                    <span className="text-slate-200">
                      {result.furnish_install.material_percentage}% mat / {result.furnish_install.labor_percentage}% labor
                    </span>
                  </div>
                )}
                <p className="text-slate-500 pt-1 border-t border-[#2a2d3a]">{result.furnish_install.notes}</p>
              </div>
            </SectionCard>

            <SectionCard title="Mobilization" icon={<Truck size={13} />}>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Included</span>
                  <span className={result.mobilization.included ? 'text-emerald-400' : 'text-amber-400'}>
                    {result.mobilization.included ? 'Yes' : 'No / Unconfirmed'}
                  </span>
                </div>
                {result.mobilization.mob_cost !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mob cost</span>
                    <span className="text-slate-200">{fmt(result.mobilization.mob_cost)}</span>
                  </div>
                )}
                {result.mobilization.trips_assumed !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Trips assumed</span>
                    <span className="text-slate-200">{result.mobilization.trips_assumed}</span>
                  </div>
                )}
                <p className="text-slate-500 pt-1 border-t border-[#2a2d3a]">{result.mobilization.notes}</p>
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Access Assumptions" icon={<Wrench size={13} />} count={result.access_assumptions.length}>
            <AccessList items={result.access_assumptions} />
          </SectionCard>

          {/* Warranty */}
          {result.warranty && (
            <SectionCard title="Warranty" icon={<Shield size={13} />}>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Duration</span>
                  <span className="text-slate-200 font-medium">{result.warranty.years}-year</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Scope</span>
                  <span className="text-slate-200">{result.warranty.scope}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Labor included</span>
                  <span className={result.warranty.labor_included ? 'text-emerald-400' : 'text-amber-400'}>
                    {result.warranty.labor_included ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Glass breakage excluded</span>
                  <span className={result.warranty.glass_breakage_excluded ? 'text-amber-400' : 'text-emerald-400'}>
                    {result.warranty.glass_breakage_excluded ? 'Yes — excluded' : 'No exclusion noted'}
                  </span>
                </div>
                {result.warranty.notes && (
                  <p className="text-slate-500 pt-1 border-t border-[#2a2d3a]">{result.warranty.notes}</p>
                )}
              </div>
            </SectionCard>
          )}

          {/* Action bar */}
          {saveError && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 mb-1">{saveError}</p>
          )}
          {saveResult && (
            <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2 mb-1">
              ✓ Saved {saveResult.saved} entr{saveResult.saved === 1 ? 'y' : 'ies'} — ${saveResult.price_per_sf}/SF · region: {saveResult.region_id} · benchmark will recalibrate after 3+ entries
            </p>
          )}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saved}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 disabled:opacity-50 border border-emerald-500/30 rounded-lg text-xs font-medium text-emerald-400 transition-colors"
            >
              <CheckCircle2 size={12} />
              {saved ? 'Saved to Intelligence' : 'Save as Intelligence Entry'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#12141c] hover:bg-[#1a1d27] border border-[#2a2d3a] rounded-lg text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Download size={12} /> Export JSON
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#12141c] hover:bg-[#1a1d27] border border-[#2a2d3a] rounded-lg text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Copy size={12} /> Copy JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
