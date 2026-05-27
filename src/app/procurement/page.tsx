'use client';

import { useState, useCallback } from 'react';
import { Building, FileText, AlertTriangle, CheckCircle2, Clock, DollarSign, ChevronRight, Tag, Shield, Truck, Info } from 'lucide-react';
import Link from 'next/link';
import ProcurementIngestion from '@/components/procurement/ProcurementIngestion';
import IngestDashboard from '@/components/procurement/IngestDashboard';
import { procurementIntelligenceEntries } from '@/data/procurementIntelligence';
import type { ScopeIntelligence } from '@/types';

// ── Constants ─────────────────────────────────────────────────

const PRICE_CONFIDENCE_CONFIG = {
  proposed:   { label: 'Proposed',   color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/30' },
  leveled:    { label: 'Leveled',    color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30' },
  awarded:    { label: 'Awarded',    color: 'text-emerald-400',bg: 'bg-emerald-500/10',border: 'border-emerald-500/30' },
  historical: { label: 'Historical', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  indicative: { label: 'Indicative', color: 'text-slate-400',  bg: 'bg-slate-500/10',  border: 'border-slate-500/30' },
};

const DOC_TYPE_SHORT: Record<string, string> = {
  subcontractor_proposal: 'Proposal',
  bid_tab: 'Bid Tab',
  scope_exhibit: 'Scope Exhibit',
  rfq_response: 'RFQ Response',
  purchase_order: 'Purchase Order',
  subcontract_exhibit: 'Subcontract',
  submittal_cover: 'Submittal',
  change_order_proposal: 'CO Proposal',
};

const WORK_TYPE_LABELS: Record<string, string> = {
  storefront: 'Storefront',
  stick_curtain_wall: 'Stick CW',
  unitized_curtain_wall: 'Unitized CW',
  window_wall: 'Window Wall',
  interior_partition: 'Interior Partition',
  glass_railing: 'Glass Railing',
  skylight: 'Skylight',
  fire_rated: 'Fire-Rated',
  blast_security: 'Blast / Security',
};

const fmt = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(2)}M`
    : `$${n.toLocaleString()}`;

// ── Intelligence entry card ────────────────────────────────────

function IntelligenceCard({ entry, onClick }: { entry: ScopeIntelligence; onClick: () => void }) {
  const pc = PRICE_CONFIDENCE_CONFIG[entry.price_confidence];
  const critHigh = entry.risks.filter(r => r.severity === 'Critical' || r.severity === 'High').length;

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 bg-[#12141c] hover:bg-[#1a1d27] border border-[#2a2d3a] hover:border-brand-500/40 rounded-xl transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-100 truncate group-hover:text-brand-300 transition-colors">
            {entry.project_name ?? 'Unnamed Project'}
          </p>
          {entry.subcontractor_name && (
            <p className="text-xs text-slate-500 truncate mt-0.5">{entry.subcontractor_name}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${pc.bg} ${pc.color} ${pc.border}`}>
            {pc.label}
          </span>
          <span className="text-xs text-slate-600 group-hover:text-slate-400 transition-colors">
            <ChevronRight size={13} />
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap text-[10px] text-slate-500 mb-3">
        <span className="bg-[#0f1117] border border-[#2a2d3a] px-1.5 py-0.5 rounded">
          {DOC_TYPE_SHORT[entry.document_type] ?? entry.document_type}
        </span>
        {entry.project_location && <span>{entry.project_location}</span>}
        {entry.bid_date && <span>· {entry.bid_date}</span>}
      </div>

      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3 text-slate-400">
          {entry.total_sf_proposed && (
            <span className="flex items-center gap-1">
              <FileText size={10} className="text-slate-600" />
              {entry.total_sf_proposed.toLocaleString()} SF
            </span>
          )}
          {entry.total_price_proposed && (
            <span className="flex items-center gap-1">
              <DollarSign size={10} className="text-slate-600" />
              {fmt(entry.total_price_proposed)}
            </span>
          )}
          {entry.lead_times.length > 0 && (
            <span className="flex items-center gap-1">
              <Clock size={10} className="text-slate-600" />
              {entry.lead_times[0].weeks_min}–{entry.lead_times[0].weeks_max ?? entry.lead_times[0].weeks_typical}w
            </span>
          )}
        </div>
        {critHigh > 0 && (
          <span className="flex items-center gap-1 text-orange-400">
            <AlertTriangle size={10} />
            {critHigh} risk{critHigh !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* System tags */}
      <div className="flex items-center gap-1 flex-wrap mt-2">
        {entry.glazing_systems.slice(0, 4).map(s => (
          <span key={s} className="text-[10px] px-1.5 py-0.5 bg-brand-500/10 border border-brand-500/20 text-brand-400 rounded">
            {WORK_TYPE_LABELS[s] ?? s}
          </span>
        ))}
      </div>
    </button>
  );
}

// ── Detail panel ───────────────────────────────────────────────

function DetailPanel({ entry, onClose }: { entry: ScopeIntelligence; onClose: () => void }) {
  const pc = PRICE_CONFIDENCE_CONFIG[entry.price_confidence];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-100">{entry.project_name ?? 'Unnamed Project'}</h2>
          {entry.subcontractor_name && (
            <p className="text-xs text-slate-500 mt-0.5">{entry.subcontractor_name}</p>
          )}
        </div>
        <button onClick={onClose} className="text-xs text-slate-500 hover:text-slate-300 underline shrink-0">
          ← Back
        </button>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className={`px-2 py-0.5 rounded border font-medium ${pc.bg} ${pc.color} ${pc.border}`}>{pc.label}</span>
        <span className="text-slate-500">{DOC_TYPE_SHORT[entry.document_type]}</span>
        {entry.project_location && <span className="text-slate-500">· {entry.project_location}</span>}
        {entry.bid_date && <span className="text-slate-500">· {entry.bid_date}</span>}
        {entry.quote_valid_until && <span className="text-amber-500">Expires {entry.quote_valid_until}</span>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
        {[
          { label: 'Total SF', value: entry.total_sf_proposed?.toLocaleString() ?? '—' },
          { label: 'Total Price', value: entry.total_price_proposed ? fmt(entry.total_price_proposed) : '—' },
          { label: 'Line Items', value: String(entry.line_items.length) },
          { label: 'Risk Flags', value: `${entry.risks.length} (${entry.risks.filter(r => r.severity === 'Critical' || r.severity === 'High').length} high)` },
        ].map(s => (
          <div key={s.label} className="p-3 bg-[#12141c] border border-[#2a2d3a] rounded-xl">
            <p className="text-slate-500 mb-0.5">{s.label}</p>
            <p className="font-semibold text-slate-100">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Risks */}
      {entry.risks.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
            <Shield size={11} /> Risk Flags
          </h3>
          {entry.risks.map(r => (
            <div key={r.id} className={`p-3 rounded-lg border text-xs ${
              r.severity === 'Critical' ? 'bg-red-500/10 border-red-500/30 text-red-300' :
              r.severity === 'High' ? 'bg-orange-500/10 border-orange-500/30 text-orange-300' :
              r.severity === 'Medium' ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' :
              'bg-slate-500/10 border-slate-500/20 text-slate-400'
            }`}>
              <div className="flex items-center gap-1.5 mb-1 font-semibold">
                <AlertTriangle size={11} /> {r.severity} — {r.category.replace(/_/g, ' ')}
              </div>
              <p className="text-slate-200 mb-1">{r.description}</p>
              <p className="text-slate-400 border-l-2 border-slate-600 pl-2">{r.recommendation}</p>
            </div>
          ))}
        </div>
      )}

      {/* Inclusions / Exclusions */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="p-3 bg-[#12141c] border border-[#2a2d3a] rounded-xl">
          <h3 className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1.5">
            <CheckCircle2 size={11} /> Inclusions ({entry.inclusions.length})
          </h3>
          <ul className="space-y-1">
            {entry.inclusions.map((item, i) => (
              <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>{item}
              </li>
            ))}
            {entry.inclusions.length === 0 && <li className="text-xs text-slate-600 italic">None recorded.</li>}
          </ul>
        </div>
        <div className="p-3 bg-[#12141c] border border-[#2a2d3a] rounded-xl">
          <h3 className="text-xs font-semibold text-red-400 mb-2 flex items-center gap-1.5">
            <AlertTriangle size={11} /> Exclusions ({entry.exclusions.length})
          </h3>
          <ul className="space-y-1">
            {entry.exclusions.map((item, i) => (
              <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                <span className="text-red-500 mt-0.5 shrink-0">✗</span>{item}
              </li>
            ))}
            {entry.exclusions.length === 0 && <li className="text-xs text-slate-600 italic">None recorded.</li>}
          </ul>
        </div>
      </div>

      {/* Line items */}
      {entry.line_items.length > 0 && (
        <div className="p-3 bg-[#12141c] border border-[#2a2d3a] rounded-xl overflow-x-auto">
          <h3 className="text-xs font-semibold text-slate-400 mb-3 flex items-center gap-1.5">
            <DollarSign size={11} /> Line Items
          </h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#2a2d3a] text-slate-500 text-left">
                <th className="pb-2 pr-3 font-medium">Description</th>
                <th className="pb-2 pr-3 font-medium text-right">Qty</th>
                <th className="pb-2 pr-3 font-medium">Unit</th>
                <th className="pb-2 pr-3 font-medium text-right">Unit $</th>
                <th className="pb-2 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {entry.line_items.map(li => (
                <tr key={li.id} className={`border-b border-[#1e2130] ${li.is_alternate ? 'opacity-60' : ''}`}>
                  <td className="py-1.5 pr-3 text-slate-200">
                    {li.description.slice(0, 55)}{li.description.length > 55 ? '…' : ''}
                    {li.is_alternate && <span className="ml-1 text-[10px] bg-slate-700 text-slate-400 px-1 rounded">ALT</span>}
                  </td>
                  <td className="py-1.5 pr-3 text-right text-slate-400">{li.quantity?.toLocaleString() ?? '—'}</td>
                  <td className="py-1.5 pr-3 text-slate-500">{li.unit}</td>
                  <td className="py-1.5 pr-3 text-right text-slate-300">{li.unit_price !== undefined ? `$${li.unit_price.toFixed(0)}` : '—'}</td>
                  <td className="py-1.5 text-right font-medium text-slate-100">{li.extended_price !== undefined ? fmt(li.extended_price) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lead times */}
      {entry.lead_times.length > 0 && (
        <div className="p-3 bg-[#12141c] border border-[#2a2d3a] rounded-xl">
          <h3 className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
            <Truck size={11} /> Lead Times
          </h3>
          <div className="space-y-2">
            {entry.lead_times.map((lt, i) => (
              <div key={i} className="flex items-start gap-2">
                <Clock size={11} className="text-brand-400 mt-0.5 shrink-0" />
                <div className="text-xs">
                  <span className="text-slate-200 font-medium">{lt.item}: </span>
                  <span className="text-brand-300">{lt.weeks_min}–{lt.weeks_max ?? lt.weeks_typical} weeks</span>
                  <span className="text-slate-500"> {lt.clock_start}</span>
                  {lt.notes && <p className="text-slate-500 mt-0.5">{lt.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warranty */}
      {entry.warranty && (
        <div className="p-3 bg-[#12141c] border border-[#2a2d3a] rounded-xl text-xs">
          <h3 className="font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
            <Shield size={11} /> Warranty — {entry.warranty.years}-Year
          </h3>
          <div className="space-y-1 text-slate-400">
            <p>Scope: <span className="text-slate-200">{entry.warranty.scope}</span></p>
            <p>Labor included: <span className={entry.warranty.labor_included ? 'text-emerald-400' : 'text-amber-400'}>{entry.warranty.labor_included ? 'Yes' : 'No'}</span></p>
            <p>Glass breakage excluded: <span className={entry.warranty.glass_breakage_excluded ? 'text-amber-400' : 'text-slate-200'}>{entry.warranty.glass_breakage_excluded ? 'Yes' : 'No'}</span></p>
            {entry.warranty.notes && <p className="text-slate-500 pt-1 border-t border-[#2a2d3a]">{entry.warranty.notes}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────

type Tab = 'library' | 'ingest' | 'file_ingest';

export default function ProcurementPage() {
  const [tab, setTab] = useState<Tab>('library');
  const [sessionEntries, setSessionEntries] = useState<ScopeIntelligence[]>([]);
  const [selected, setSelected] = useState<ScopeIntelligence | null>(null);

  const allEntries = [...procurementIntelligenceEntries, ...sessionEntries];

  const handleSaved = useCallback((si: ScopeIntelligence) => {
    setSessionEntries(prev => {
      if (prev.find(e => e.id === si.id)) return prev;
      return [si, ...prev];
    });
    setTab('library');
  }, []);

  const awardedCount = allEntries.filter(e => e.price_confidence === 'awarded').length;
  const totalSF = allEntries.reduce((s, e) => s + (e.total_sf_proposed ?? 0), 0);

  return (
    <div className="min-h-screen bg-[#FFFDF5] bg-grid text-black">
      {/* Header */}
      <header className="border-b-4 border-black bg-[#FFFDF5]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-black text-xs uppercase tracking-widest border-2 border-black px-2 py-1 hover:bg-[#FFD93D] transition-colors"
              style={{ boxShadow:'2px 2px 0 #000' }}>
              ← Estimator
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#C4B5FD] border-2 border-black flex items-center justify-center">
                <FileText size={12} strokeWidth={3} />
              </div>
              <span className="text-xs font-black uppercase tracking-widest">Procurement Intelligence</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
            <span className="border-2 border-black px-2 py-0.5 bg-[#FFD93D]">{allEntries.length} entries</span>
            <span className="border-2 border-black px-2 py-0.5 bg-[#C4B5FD]">{awardedCount} awarded</span>
            <span className="border-2 border-black px-2 py-0.5">{totalSF > 0 ? `${(totalSF / 1000).toFixed(0)}k` : '0'} SF</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {selected ? (
          <DetailPanel entry={selected} onClose={() => setSelected(null)} />
        ) : (
          <div className="space-y-5">
            {/* Authority disclaimer */}
            <div className="flex items-start gap-2.5 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-xs text-amber-400/80">
              <Info size={13} className="mt-0.5 shrink-0 text-amber-400" />
              <div>
                <span className="font-semibold text-amber-400">Authority Notice — </span>
                All entries in this library are classified as{' '}
                <span className="font-semibold">historical_scope_intelligence</span>, not{' '}
                <span className="font-semibold">verified_pricing_authority</span>, unless marked{' '}
                <span className="font-semibold text-emerald-400">Awarded</span>. Proposed and leveled prices
                inform directional benchmarking only. RSMeans 2024 and confirmed award data govern all
                cost estimates produced by the estimator engine.
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-[#0f1117] border border-[#2a2d3a] rounded-xl p-1 flex-wrap sm:flex-nowrap">
              {([
                { id: 'library',     label: `Library (${allEntries.length})`, icon: <Tag size={12} /> },
                { id: 'ingest',      label: 'Paste / Parse',                  icon: <FileText size={12} /> },
                { id: 'file_ingest', label: 'File Ingest',                    icon: <Building size={12} /> },
              ] as { id: Tab; label: string; icon: React.ReactNode }[]).map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    tab === t.id
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a1d27]'
                  }`}
                >
                  {t.icon}{t.label}
                </button>
              ))}
            </div>

            {/* Library tab */}
            {tab === 'library' && (
              <div className="space-y-3">
                {/* Session entries badge */}
                {sessionEntries.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                    <CheckCircle2 size={11} />
                    {sessionEntries.length} new entr{sessionEntries.length === 1 ? 'y' : 'ies'} added this session
                  </div>
                )}

                {allEntries.length === 0 ? (
                  <div className="text-center py-12 text-slate-600 text-sm">
                    No entries yet. Use the Ingest tab to parse your first document.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {allEntries.map(entry => (
                      <IntelligenceCard
                        key={entry.id}
                        entry={entry}
                        onClick={() => setSelected(entry)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Paste/parse tab */}
            {tab === 'ingest' && (
              <ProcurementIngestion onIntelligenceSaved={handleSaved} />
            )}

            {/* File ingest tab */}
            {tab === 'file_ingest' && (
              <IngestDashboard />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
