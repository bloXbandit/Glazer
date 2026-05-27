'use client';
import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, ExternalLink, Zap, Hash, FileText } from 'lucide-react';
import type { EstimateNarrative, NarrativeSection, CitationRecord, LiveDataFactor } from '@/types';

// ── Citation badge ────────────────────────────────────────────
function CitationBadge({ id, citations }: { id: string; citations: CitationRecord[] }) {
  const [open, setOpen] = useState(false);
  const cite = citations.find(c => c.id === id);
  if (!cite) return null;
  const idx = citations.indexOf(cite) + 1;

  return (
    <span className="relative inline-block align-baseline ml-0.5">
      <button
        onClick={() => setOpen(v => !v)}
        className="text-[10px] font-black text-brand-600 bg-brand-500/10 border border-brand-500/30 rounded px-1 py-0 leading-4 hover:bg-brand-500/20 transition-colors font-mono"
      >
        [{idx}]
      </button>
      {open && (
        <div className="absolute z-20 left-0 top-5 w-64 bg-white border border-[#e2ddd6] rounded-lg p-3 shadow-xl text-xs">
          <p className="font-black text-[#111] mb-1">{cite.title}</p>
          <p className="text-slate-500 mb-1">{cite.publisher}</p>
          <p className="text-slate-400 italic mb-2">{cite.usage_note}</p>
          {cite.url && cite.url !== '#' && (
            <a href={cite.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-brand-600 hover:text-brand-700">
              <ExternalLink size={10} /> View source
            </a>
          )}
          <button onClick={() => setOpen(false)} className="absolute top-1.5 right-2 text-slate-400 hover:text-[#111] text-xs">✕</button>
        </div>
      )}
    </span>
  );
}

// ── Data point row ────────────────────────────────────────────
function DataPointRow({ label, value, isLive }: { label: string; value: string; isLive: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-[#e2ddd6] last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <div className="flex items-center gap-1.5">
        {isLive && (
          <span className="flex items-center gap-0.5 text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1 py-0">
            <Zap size={8} /> LIVE
          </span>
        )}
        <span className="text-xs font-black text-[#111] tabular-nums">{value}</span>
      </div>
    </div>
  );
}

// ── Single narrative section ──────────────────────────────────
function NarrativeSectionCard({
  section,
  citations,
  index,
}: {
  section: NarrativeSection;
  citations: CitationRecord[];
  index: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasDataPoints = section.data_points.length > 0;
  const hasCitations = section.citation_ids.length > 0;

  return (
    <div className="border border-[#e2ddd6] rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#f8f6f3] hover:bg-[#f0ede8] transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-black text-brand-600 bg-brand-500/10 border border-brand-500/30 rounded w-5 h-5 flex items-center justify-center flex-shrink-0">
            {index + 1}
          </span>
          <span className="text-sm font-bold text-[#111]">{section.heading}</span>
        </div>
        <div className="flex items-center gap-2">
          {hasCitations && (
            <span className="text-[10px] text-slate-400 flex items-center gap-0.5 font-bold">
              <Hash size={9} />{section.citation_ids.length}
            </span>
          )}
          {expanded ? <ChevronUp size={13} className="text-slate-400" /> : <ChevronDown size={13} className="text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 py-3 bg-white space-y-3">
          <p className="text-sm text-slate-600 leading-relaxed">
            {section.body}
            {hasCitations && (
              <span className="ml-1">
                {section.citation_ids.map(id => (
                  <CitationBadge key={id} id={id} citations={citations} />
                ))}
              </span>
            )}
          </p>
          {hasDataPoints && (
            <div className="bg-[#f8f6f3] border border-[#e2ddd6] rounded-lg p-3">
              {section.data_points.map((dp, i) => (
                <DataPointRow key={i} label={dp.label} value={dp.value} isLive={dp.is_live_data} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Source citations list ─────────────────────────────────────
function CitationsList({ citations }: { citations: CitationRecord[] }) {
  const SOURCE_TYPE_COLOR: Record<string, string> = {
    pricing:               'text-emerald-700 bg-emerald-50  border-emerald-200',
    historical_project:    'text-blue-700    bg-blue-50     border-blue-200',
    scope_definition:      'text-purple-700  bg-purple-50   border-purple-200',
    technical_engineering: 'text-amber-700   bg-amber-50    border-amber-200',
    code_compliance:       'text-red-700     bg-red-50      border-red-200',
    manufacturer_product:  'text-slate-600   bg-[#f8f6f3]   border-[#e2ddd6]',
    educational_reference: 'text-slate-600   bg-[#f8f6f3]   border-[#e2ddd6]',
  };

  return (
    <div className="space-y-2">
      {citations.map((cite, i) => (
        <div key={cite.id} className="flex gap-3 p-3 bg-white border border-[#e2ddd6] rounded-lg">
          <span className="text-xs font-black text-brand-600 mt-0.5 flex-shrink-0 font-mono">[{i + 1}]</span>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start gap-2 mb-1">
              <p className="text-sm font-bold text-[#111]">{cite.title}</p>
              <span className={`text-[10px] font-black border rounded px-1.5 py-0.5 uppercase tracking-wider ${SOURCE_TYPE_COLOR[cite.source_type] ?? SOURCE_TYPE_COLOR.educational_reference}`}>
                {cite.source_type.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-0.5">{cite.publisher}{cite.date_published ? ` · ${cite.date_published}` : ''}</p>
            <p className="text-xs text-slate-400 italic mb-1">{cite.usage_note}</p>
            {cite.url && cite.url !== '#' && (
              <a href={cite.url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 font-bold">
                <ExternalLink size={10} /> {cite.url.length > 60 ? cite.url.slice(0, 60) + '…' : cite.url}
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Live data status bar ──────────────────────────────────────
function LiveDataBar({ liveFactors }: { liveFactors: LiveDataFactor[] }) {
  if (liveFactors.length === 0) return (
    <div className="flex items-center gap-2 px-3 py-2 bg-[#f8f6f3] border border-[#e2ddd6] rounded-lg text-xs text-slate-400">
      <Zap size={12} className="text-slate-300" />
      No live market data applied — RSMeans 2024 baseline only. Run /api/live-data to fetch BLS PPI and SAM.gov factors.
    </div>
  );

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
      <Zap size={12} className="text-emerald-600 flex-shrink-0" />
      <span className="text-xs font-black text-emerald-700">Live data applied:</span>
      {liveFactors.map(f => (
        <span key={f.id} className="text-xs text-slate-600">
          {f.label} ({f.source.toUpperCase().replace('_', '.')}, {f.as_of_date})
        </span>
      ))}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────
interface NarrativePanelProps {
  narrative: EstimateNarrative;
  liveFactors: LiveDataFactor[];
  activeView: 'narrative' | 'sources';
}

export default function NarrativePanel({ narrative, liveFactors, activeView }: NarrativePanelProps) {
  if (activeView === 'sources') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <FileText size={15} className="text-brand-500" />
          <h3 className="text-sm font-black text-[#111]">Source Citations</h3>
          <span className="text-xs text-slate-400">({narrative.all_citations.length} sources)</span>
        </div>
        <p className="text-xs text-slate-500">
          Every number in this estimate traces back to a cited source. Pricing data comes exclusively from RSMeans 2024 and verified DMV bid records — no AI-invented values.
        </p>
        <CitationsList citations={narrative.all_citations} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={15} className="text-brand-500" />
          <h3 className="text-sm font-black text-[#111]">{narrative.title}</h3>
        </div>
        <p className="text-xs text-slate-500">{narrative.subtitle}</p>
      </div>

      <LiveDataBar liveFactors={liveFactors} />

      <div className="space-y-3">
        {narrative.sections.map((section, i) => (
          <NarrativeSectionCard
            key={section.id}
            section={section}
            citations={narrative.all_citations}
            index={i}
          />
        ))}
      </div>

      <p className="text-xs text-slate-400 text-right">
        {narrative.all_citations.length} sources cited · Generated {new Date(narrative.generated_at).toLocaleString()}
      </p>
    </div>
  );
}
