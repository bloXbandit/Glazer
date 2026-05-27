'use client';
import { CheckCircle2, Clock, Package, Zap } from 'lucide-react';
import type { WorkType } from '@/types';

interface PricingBand {
  low: number;
  mid: number;
  high: number;
}

interface WorkTypeCardProps {
  workType: WorkType;
  pricing: PricingBand;
  selected: boolean;
  onSelect: (id: string) => void;
}

const DIFFICULTY_COLOR: Record<string, string> = {
  'Low':       'text-emerald-700 bg-emerald-50  border-emerald-200',
  'Medium':    'text-amber-700   bg-amber-50    border-amber-200',
  'High':      'text-orange-700  bg-orange-50   border-orange-200',
  'Very High': 'text-red-700     bg-red-50      border-red-200',
};

const PROCUREMENT_COLOR: Record<string, string> = {
  'Low':       'text-emerald-600',
  'Medium':    'text-amber-600',
  'High':      'text-orange-600',
  'Very High': 'text-red-600',
};

export default function WorkTypeCard({ workType, pricing, selected, onSelect }: WorkTypeCardProps) {
  return (
    <button
      onClick={() => onSelect(workType.id)}
      className={`relative w-full text-left rounded-xl border transition-all duration-150 p-4 group
        ${selected
          ? 'border-brand-500 bg-white shadow-[0_0_0_2px_rgba(232,85,48,0.2)]'
          : 'border-[#e2ddd6] bg-white hover:border-[#ccc8c0] hover:shadow-sm'
        }`}
    >
      {/* Selected indicator */}
      {selected && (
        <span className="absolute top-3 right-3 text-brand-500">
          <CheckCircle2 size={17} />
        </span>
      )}

      {/* CSI badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-mono font-bold text-slate-400 border border-[#e2ddd6] rounded px-1.5 py-0.5 uppercase">
          CSI {workType.csi_division}
        </span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${DIFFICULTY_COLOR[workType.difficulty_rating]}`}>
          {workType.difficulty_rating}
        </span>
      </div>

      {/* Name */}
      <h3 className={`font-black text-sm leading-snug mb-1 transition-colors ${
        selected ? 'text-brand-600' : 'text-[#111] group-hover:text-brand-600'
      }`}>
        {workType.name}
      </h3>

      {/* Description */}
      <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-2">
        {workType.short_description}
      </p>

      {/* Pricing band */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Benchmark Range</span>
          <span className="text-[10px] text-slate-400 font-bold">$/SF installed</span>
        </div>
        <div className="relative h-1.5 bg-[#f0ede8] rounded-full overflow-hidden">
          <div className="absolute inset-y-0 left-0 right-0 bg-gradient-to-r from-emerald-400/40 via-brand-400/50 to-amber-400/40 rounded-full" />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs font-bold text-emerald-600">${pricing.low}</span>
          <span className="text-xs font-black text-brand-600">${pricing.mid} mid</span>
          <span className="text-xs font-bold text-amber-600">${pricing.high}</span>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
        <span className="flex items-center gap-1">
          <Clock size={11} />
          {workType.typical_lead_time_weeks.min}–{workType.typical_lead_time_weeks.max} wks
        </span>
        <span className="flex items-center gap-1">
          <Package size={11} />
          <span className={PROCUREMENT_COLOR[workType.procurement_risk]}>
            {workType.procurement_risk} risk
          </span>
        </span>
      </div>
    </button>
  );
}
