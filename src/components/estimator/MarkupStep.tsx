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

function SliderRow({ label, hint, value, min, max, step, format, onChange }: {
  label: string; hint: string; value: number; min: number; max: number; step: number;
  format: (v: number) => string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
        <span className="text-sm font-black text-[#111] tabular-nums bg-[#f8f6f3] border border-[#e2ddd6] rounded px-2 py-0.5">
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[#e2ddd6]
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                   [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-500
                   [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
                   [&::-webkit-slider-thumb]:shadow-sm"
      />
      <p className="text-xs text-slate-400 mt-1">{hint}</p>
    </div>
  );
}

export default function MarkupStep({ values, onChange }: MarkupStepProps) {
  return (
    <div className="space-y-7">
      {/* Fixed overhead note */}
      <div className="bg-brand-500/8 border border-brand-500/25 rounded-xl p-4" style={{ background: 'rgba(232,85,48,0.06)' }}>
        <div className="flex items-start gap-3">
          <Percent size={15} className="text-brand-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-black text-brand-700 mb-1">Overhead: Fixed at 15%</p>
            <p className="text-xs text-slate-500">
              Overhead (G&A, insurance, office) is fixed at 15% of direct cost as the industry standard for commercial glazing subcontractors.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <SliderRow
          label="Contingency"
          hint="Recommended: 3–5% standard, 7–10% renovation/occupied. Applies to direct cost."
          value={values.custom_contingency_pct}
          min={0.01} max={0.15} step={0.005}
          format={v => `${(v * 100).toFixed(1)}%`}
          onChange={v => onChange('custom_contingency_pct', v)}
        />
        <SliderRow
          label="Profit / Fee"
          hint="Industry standard: 8–12% for specialty glazing subcontractors. Applied to cost + overhead + contingency."
          value={values.custom_profit_pct}
          min={0.03} max={0.25} step={0.005}
          format={v => `${(v * 100).toFixed(1)}%`}
          onChange={v => onChange('custom_profit_pct', v)}
        />
      </div>

      {/* Labor rate override */}
      <div>
        <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
          <DollarSign size={13} className="text-slate-400" />
          Custom Labor Rate Override ($/hr all-in)
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number" min={40} max={200}
            value={values.custom_labor_rate || ''}
            onChange={e => onChange('custom_labor_rate', parseFloat(e.target.value) || 0)}
            placeholder="Leave blank to use regional rate"
            className="flex-1 bg-white border border-[#e2ddd6] rounded-lg px-3 py-2.5
                       text-sm text-[#111] placeholder-slate-400
                       focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
          />
          {values.custom_labor_rate > 0 && (
            <button
              onClick={() => onChange('custom_labor_rate', 0)}
              className="text-xs text-slate-500 hover:text-[#111] px-3 py-2.5 border border-[#e2ddd6] bg-white hover:bg-[#f8f6f3] rounded-lg transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-1">
          All-in rate including benefits burden. Leave blank to use the regional benchmark rate (RSMeans 2024).
        </p>
      </div>

      {/* Bond toggle */}
      <div>
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Performance &amp; Payment Bond</label>
        <button
          onClick={() => onChange('include_bond', !values.include_bond)}
          className={`flex items-center gap-3 w-full text-left p-4 rounded-xl border transition-all duration-150 ${
            values.include_bond
              ? 'border-brand-400 bg-brand-500/8' : 'border-[#e2ddd6] bg-white hover:border-[#ccc8c0]'
          }`}
          style={values.include_bond ? { background: 'rgba(232,85,48,0.06)' } : {}}
        >
          <Shield size={17} className={values.include_bond ? 'text-brand-500' : 'text-slate-400'} />
          <div>
            <p className={`text-sm font-bold ${values.include_bond ? 'text-brand-700' : 'text-slate-600'}`}>
              {values.include_bond ? 'Bond Included (1% of contract value)' : 'No Bond (click to include)'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Federal/Davis-Bacon and most public projects require a performance &amp; payment bond. Typically 0.5–1.5%.
            </p>
          </div>
        </button>
      </div>

      {/* Summary preview */}
      <div className="bg-[#f8f6f3] border border-[#e2ddd6] rounded-xl p-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Markup Summary</p>
        <div className="space-y-2">
          {[
            { label: 'Overhead',     value: '15.0%',                                              note: 'Fixed' },
            { label: 'Contingency',  value: `${(values.custom_contingency_pct * 100).toFixed(1)}%`, note: '' },
            { label: 'Profit / Fee', value: `${(values.custom_profit_pct * 100).toFixed(1)}%`,      note: '' },
            { label: 'Bond',         value: values.include_bond ? '1.0%' : 'Not included',          note: '' },
          ].map((row, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{row.label}</span>
              <span className="text-sm font-black text-[#111] tabular-nums">
                {row.value}
                {row.note && <span className="text-slate-400 font-normal ml-1 text-xs">({row.note})</span>}
              </span>
            </div>
          ))}
          <div className="border-t border-[#e2ddd6] pt-2 mt-2 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-600">Total markup on direct cost</span>
            <span className="text-sm font-black text-brand-600 tabular-nums">
              ~{(15 + values.custom_contingency_pct * 100 + values.custom_profit_pct * 100 + (values.include_bond ? 1 : 0)).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
