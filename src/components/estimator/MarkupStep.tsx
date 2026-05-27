'use client';
import { Percent, DollarSign, Shield } from 'lucide-react';

interface MarkupFormState {
  custom_contingency_pct: number;
  custom_profit_pct: number;
  custom_labor_rate: number;
  include_bond: boolean;
}

interface MarkupStepProps {
  values: MarkupFormState;
  onChange: (key: keyof MarkupFormState, value: number | boolean) => void;
}

function SliderRow({ label, hint, value, min, max, step, format, onChange, color }: {
  label: string; hint: string; value: number; min: number; max: number; step: number;
  format: (v: number) => string; onChange: (v: number) => void; color?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="neo-label mb-0">{label}</label>
        <span className="text-sm font-black tabular-nums border-2 border-black px-2 py-0.5"
          style={{ background: color ?? '#FFD93D', boxShadow:'2px 2px 0 #000' }}>
          {format(value)}
        </span>
      </div>
      {/* Custom hard slider track */}
      <div className="relative h-4 border-2 border-black bg-white cursor-pointer"
        onClick={e => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pctClick = (e.clientX - rect.left) / rect.width;
          const newVal = min + pctClick * (max - min);
          onChange(Math.round(newVal / step) * step);
        }}>
        <div className="absolute inset-y-0 left-0 border-r-2 border-black transition-all"
          style={{ width:`${pct}%`, background: color ?? '#FFD93D' }} />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
        />
      </div>
      <p className="text-[10px] font-bold text-black/50 mt-1 uppercase tracking-wide">{hint}</p>
    </div>
  );
}

export default function MarkupStep({ values, onChange }: MarkupStepProps) {
  const totalMarkup = 15 + values.custom_contingency_pct * 100 + values.custom_profit_pct * 100 + (values.include_bond ? 1 : 0);

  return (
    <div className="space-y-7">
      {/* Overhead note */}
      <div className="border-4 border-black p-4 bg-[#FFD93D]" style={{ boxShadow:'6px 6px 0 #000' }}>
        <div className="flex items-start gap-3">
          <span className="w-8 h-8 flex-shrink-0 flex items-center justify-center border-2 border-black bg-black text-[#FFD93D]">
            <Percent size={15} strokeWidth={3} />
          </span>
          <div>
            <p className="text-sm font-black uppercase tracking-wide">Overhead: Fixed at 15%</p>
            <p className="text-xs font-medium mt-0.5 text-black/70">
              G&amp;A, insurance, office — industry standard for commercial glazing subcontractors.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <SliderRow label="Contingency"
          hint="3–5% standard · 7–10% renovation/occupied · Applies to direct cost"
          value={values.custom_contingency_pct} min={0.01} max={0.15} step={0.005}
          format={v => `${(v * 100).toFixed(1)}%`}
          onChange={v => onChange('custom_contingency_pct', v)}
          color="#C4B5FD"
        />
        <SliderRow label="Profit / Fee"
          hint="8–12% industry standard for specialty glazing subs"
          value={values.custom_profit_pct} min={0.03} max={0.25} step={0.005}
          format={v => `${(v * 100).toFixed(1)}%`}
          onChange={v => onChange('custom_profit_pct', v)}
          color="#FF6B6B"
        />
      </div>

      {/* Labor rate override */}
      <div>
        <label className="neo-label flex items-center gap-1.5">
          <DollarSign size={12} strokeWidth={3} /> Custom Labor Rate Override ($/hr all-in)
        </label>
        <div className="flex items-center gap-0">
          <input
            type="number" min={40} max={200}
            value={values.custom_labor_rate || ''}
            onChange={e => onChange('custom_labor_rate', parseFloat(e.target.value) || 0)}
            placeholder="Leave blank to use regional rate"
            className="neo-input flex-1"
          />
          {values.custom_labor_rate > 0 && (
            <button
              onClick={() => onChange('custom_labor_rate', 0)}
              className="neo-btn-ghost px-3 py-2.5 text-xs -ml-[3px]"
            >
              Clear
            </button>
          )}
        </div>
        <p className="text-[10px] font-bold text-black/50 mt-1.5 uppercase tracking-wide">
          All-in including benefits. Blank = RSMeans 2024 regional rate.
        </p>
      </div>

      {/* Bond toggle */}
      <div>
        <label className="neo-label">Performance &amp; Payment Bond</label>
        <button
          onClick={() => onChange('include_bond', !values.include_bond)}
          className="relative w-full text-left group outline-none"
        >
          <div className="absolute inset-0 border-3 border-black transition-all duration-150
            group-hover:translate-x-[2px] group-hover:translate-y-[2px]"
            style={{ border:'3px solid #000', background: values.include_bond ? '#FF6B6B' : '#000' }} />
          <div className={`relative border-3 border-black p-4 flex items-center gap-3 transition-all duration-150
            group-hover:-translate-x-[2px] group-hover:-translate-y-[2px] bg-white`}
            style={{ border:'3px solid #000' }}>
            <span className={`w-9 h-9 flex items-center justify-center border-2 border-black flex-shrink-0
              ${values.include_bond ? 'bg-[#FF6B6B] text-black' : 'bg-white text-black/40'}`}>
              <Shield size={18} strokeWidth={3} />
            </span>
            <div>
              <p className="text-sm font-black uppercase tracking-wide">
                {values.include_bond ? 'Bond Included — 1% of Contract' : 'No Bond — Click to Include'}
              </p>
              <p className="text-[10px] font-bold text-black/50 mt-0.5 uppercase tracking-wide">
                Required for federal/Davis-Bacon and most public projects.
              </p>
            </div>
            {values.include_bond && (
              <span className="ml-auto neo-badge">Active</span>
            )}
          </div>
        </button>
      </div>

      {/* Summary */}
      <div className="border-4 border-black p-4 bg-white" style={{ boxShadow:'8px 8px 0 #000' }}>
        <p className="neo-label mb-3">Markup Summary</p>
        <div className="space-y-2">
          {[
            { label: 'Overhead',     value: '15.0%',                                                note: 'Fixed',    bg: '#FFD93D' },
            { label: 'Contingency',  value: `${(values.custom_contingency_pct * 100).toFixed(1)}%`, note: '',         bg: '#C4B5FD' },
            { label: 'Profit / Fee', value: `${(values.custom_profit_pct * 100).toFixed(1)}%`,      note: '',         bg: '#FF6B6B' },
            { label: 'Bond',         value: values.include_bond ? '1.0%' : '—',                    note: '',         bg: '#FFFDF5' },
          ].map((row, i) => (
            <div key={i} className="flex items-center justify-between border-b border-black/10 pb-1.5">
              <span className="text-sm font-bold uppercase tracking-wide">{row.label}
                {row.note && <span className="font-medium text-black/40 ml-1 text-xs normal-case tracking-normal">({row.note})</span>}
              </span>
              <span className="text-sm font-black tabular-nums border-2 border-black px-2 py-0.5"
                style={{ background: row.bg }}>{row.value}</span>
            </div>
          ))}
          <div className="pt-2 flex items-center justify-between">
            <span className="text-sm font-black uppercase tracking-wide">Total</span>
            <span className="text-base font-black tabular-nums border-3 border-black px-3 py-1 bg-black text-[#FFD93D]"
              style={{ border:'3px solid #000' }}>
              ~{totalMarkup.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
