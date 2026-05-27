'use client';
import { CheckCircle2, Clock, Package } from 'lucide-react';
import type { WorkType } from '@/types';

interface PricingBand { low: number; mid: number; high: number; }
interface WorkTypeCardProps {
  workType: WorkType;
  pricing: PricingBand;
  selected: boolean;
  onSelect: (id: string) => void;
}

const DIFFICULTY_BG: Record<string, string> = {
  'Low':       'bg-[#FFD93D]',
  'Medium':    'bg-[#C4B5FD]',
  'High':      'bg-[#FF6B6B]',
  'Very High': 'bg-black text-white',
};

const CARD_ACCENT: Record<string, string> = {
  storefront:           '#FFD93D',
  stick_curtain_wall:   '#C4B5FD',
  unitized_curtain_wall:'#FF6B6B',
  window_wall:          '#C4B5FD',
  interior_partition:   '#FFD93D',
  glass_railing:        '#FF6B6B',
  skylight:             '#FFD93D',
  fire_rated:           '#FF6B6B',
  blast_security:       '#000000',
  residential_window:   '#C4B5FD',
  decorative_glass:     '#FFD93D',
};

export default function WorkTypeCard({ workType, pricing, selected, onSelect }: WorkTypeCardProps) {
  const accent = CARD_ACCENT[workType.id] ?? '#FFD93D';
  const isBlack = accent === '#000000';

  return (
    <button
      onClick={() => onSelect(workType.id)}
      className="relative w-full text-left group outline-none"
      style={{ display: 'block' }}
    >
      {/* Hard shadow backing slab (moves with hover via CSS) */}
      <div
        className="absolute inset-0 border-4 border-black transition-all duration-200 ease-out
          group-hover:translate-x-[3px] group-hover:translate-y-[3px]"
        style={{ background: accent, zIndex: 0 }}
      />

      {/* Card face — lifts upward on hover */}
      <div
        className={`relative z-10 border-4 border-black p-4 transition-all duration-200 ease-out
          group-hover:-translate-x-[3px] group-hover:-translate-y-[3px]
          ${selected ? 'bg-[#FFFDF5]' : 'bg-white'}`}
      >
        {/* Selected check */}
        {selected && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-[#FF6B6B] border-2 border-black flex items-center justify-center">
            <CheckCircle2 size={13} strokeWidth={3} className="text-black" />
          </div>
        )}

        {/* Header row: CSI + difficulty */}
        <div className="flex items-center gap-2 mb-3">
          <span className="font-mono font-black text-[9px] uppercase tracking-widest border-2 border-black px-1.5 py-0.5 bg-white">
            {workType.csi_division}
          </span>
          <span className={`font-black text-[9px] uppercase tracking-widest border-2 border-black px-1.5 py-0.5
            ${DIFFICULTY_BG[workType.difficulty_rating] ?? 'bg-[#FFD93D]'}`}>
            {workType.difficulty_rating}
          </span>
        </div>

        {/* Name */}
        <h3 className={`font-black text-sm uppercase tracking-tight leading-snug mb-1.5
          ${selected ? 'text-[#FF6B6B]' : 'text-black group-hover:text-[#FF6B6B]'} transition-colors duration-100`}>
          {workType.name}
        </h3>

        {/* Description */}
        <p className="text-xs font-medium text-black/60 leading-relaxed mb-4 line-clamp-2">
          {workType.short_description}
        </p>

        {/* Pricing band */}
        <div className="mb-4 border-t-2 border-black pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-black uppercase tracking-widest">$/SF Range</span>
            <span className="text-[9px] font-bold text-black/50">Installed</span>
          </div>
          {/* Hard bar */}
          <div className="relative h-3 border-2 border-black overflow-hidden bg-white">
            <div
              className="absolute inset-y-0 left-0 border-r-2 border-black transition-all"
              style={{ width: '30%', background: accent === '#000000' ? '#FF6B6B' : accent }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs font-black text-black">${pricing.low}</span>
            <span className="text-xs font-black text-[#FF6B6B] border-b-2 border-[#FF6B6B]">${pricing.mid} mid</span>
            <span className="text-xs font-black text-black">${pricing.high}</span>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-wide">
          <span className="flex items-center gap-1">
            <Clock size={10} strokeWidth={3} />
            {workType.typical_lead_time_weeks.min}–{workType.typical_lead_time_weeks.max}wk
          </span>
          <span className="flex items-center gap-1">
            <Package size={10} strokeWidth={3} />
            {workType.procurement_risk}
          </span>
        </div>

        {/* Selected accent bar at bottom */}
        {selected && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 border-t-2 border-black"
            style={{ background: accent === '#000000' ? '#FF6B6B' : accent }} />
        )}
      </div>
    </button>
  );
}
