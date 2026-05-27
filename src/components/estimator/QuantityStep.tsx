'use client';
import { SquareStack, Hash, FlaskConical, Flame, Shield, Volume2, Zap, Info } from 'lucide-react';
import { glassTypes } from '@/data/glassTypes';

interface QuantityFormState {
  total_sf: number;
  num_openings: number;
  glass_type_id: string;
  mode: 'Quick' | 'Detailed';
  has_fire_rating: boolean;
  has_blast_security: boolean;
  has_acoustic_requirement: boolean;
}

interface QuantityStepProps {
  values: QuantityFormState;
  workTypeName: string;
  onChange: (key: keyof QuantityFormState, value: string | number | boolean) => void;
}

export default function QuantityStep({ values, workTypeName, onChange }: QuantityStepProps) {
  const selectedGlass = glassTypes.find(g => g.id === values.glass_type_id);

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div>
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Estimate Mode</label>
        <div className="flex gap-2">
          {(['Quick', 'Detailed'] as const).map(m => (
            <button
              key={m}
              onClick={() => onChange('mode', m)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition-all duration-150 ${
                values.mode === m
                  ? 'border-brand-500 bg-brand-500/10 text-brand-600'
                  : 'border-[#e2ddd6] bg-white text-slate-500 hover:text-[#111] hover:border-[#ccc8c0]'
              }`}
            >
              {m} Estimate
              {m === 'Quick' && <span className="block text-[10px] font-normal opacity-70 mt-0.5">ROM / Budget</span>}
              {m === 'Detailed' && <span className="block text-[10px] font-normal opacity-70 mt-0.5">Bid-Grade</span>}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-2">
          {values.mode === 'Quick'
            ? 'Quick mode generates a rough order-of-magnitude. Useful for budgeting and early pricing.'
            : 'Detailed mode applies full multiplier stack and is suitable for competitive bid submissions.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
            <SquareStack size={13} className="text-slate-400" />
            Total Square Footage (SF)
          </label>
          <input
            type="number" min={1}
            value={values.total_sf || ''}
            onChange={e => onChange('total_sf', parseFloat(e.target.value) || 0)}
            placeholder="e.g. 2500"
            className="w-full bg-white border border-[#e2ddd6] rounded-lg px-3 py-2.5
                       text-sm text-[#111] placeholder-slate-400
                       focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
          />
          <p className="text-xs text-slate-400 mt-1">Glazed area only — do not include adjacent opaque panels unless in scope</p>
        </div>

        <div>
          <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
            <Hash size={13} className="text-slate-400" />
            Number of Openings / Panels
          </label>
          <input
            type="number" min={0}
            value={values.num_openings || ''}
            onChange={e => onChange('num_openings', parseInt(e.target.value) || 0)}
            placeholder="e.g. 48"
            className="w-full bg-white border border-[#e2ddd6] rounded-lg px-3 py-2.5
                       text-sm text-[#111] placeholder-slate-400
                       focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
          />
          <p className="text-xs text-slate-400 mt-1">Optional but improves confidence score and unit-count accuracy</p>
        </div>
      </div>

      {values.total_sf > 0 && values.num_openings > 0 && (
        <div className="flex items-center gap-2 text-xs bg-[#f8f6f3] border border-[#e2ddd6] rounded-lg px-3 py-2 text-slate-500">
          <Info size={12} className="text-brand-500 flex-shrink-0" />
          Average opening size: <span className="font-black text-[#111] ml-1">{(values.total_sf / values.num_openings).toFixed(1)} SF</span>
          {values.total_sf / values.num_openings > 150 && (
            <span className="text-amber-600 ml-2">— large panel, verify crane/equipment scope</span>
          )}
        </div>
      )}

      {/* Glass type */}
      <div>
        <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
          <FlaskConical size={13} className="text-slate-400" />
          Glass Type
        </label>
        <select
          value={values.glass_type_id}
          onChange={e => onChange('glass_type_id', e.target.value)}
          className="w-full bg-white border border-[#e2ddd6] rounded-lg px-3 py-2.5
                     text-sm text-[#111] focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30
                     transition-colors appearance-none cursor-pointer"
        >
          <option value="">— Select glass type —</option>
          {glassTypes.map(g => (
            <option key={g.id} value={g.id}>
              {g.name} — ×{g.cost_multiplier.toFixed(2)} material / +{g.lead_time_impact_weeks} wk lead
            </option>
          ))}
        </select>
        {selectedGlass && (
          <div className="mt-2 bg-[#f8f6f3] border border-[#e2ddd6] rounded-lg px-3 py-2.5">
            <p className="text-xs text-slate-600 leading-relaxed">{selectedGlass.performance_notes}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-xs text-slate-400">Material multiplier: <span className="text-amber-600 font-black">×{selectedGlass.cost_multiplier}</span></span>
              <span className="text-xs text-slate-400">Lead time impact: <span className="text-amber-600 font-black">+{selectedGlass.lead_time_impact_weeks} wks</span></span>
            </div>
          </div>
        )}
      </div>

      {/* Special requirements */}
      <div>
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Special Requirements</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { key: 'has_fire_rating',          icon: <Flame size={14} />,   label: 'Fire-Rated Glazing', note: 'Adds significant premium. UL listing required.' },
            { key: 'has_blast_security',        icon: <Shield size={14} />,  label: 'Blast / Security',   note: 'Highest-cost category. Federal projects typical.' },
            { key: 'has_acoustic_requirement',  icon: <Volume2 size={14} />, label: 'Acoustic Control',   note: 'Laminated acoustic glass required.' },
          ].map(req => (
            <button
              key={req.key}
              onClick={() => onChange(req.key as keyof QuantityFormState, !values[req.key as keyof QuantityFormState])}
              className={`text-left p-3 rounded-xl border transition-all duration-150 ${
                values[req.key as keyof QuantityFormState]
                  ? 'border-amber-400 bg-amber-50'
                  : 'border-[#e2ddd6] bg-white hover:border-[#ccc8c0]'
              }`}
            >
              <div className={`flex items-center gap-2 mb-1 font-bold text-sm ${
                values[req.key as keyof QuantityFormState] ? 'text-amber-700' : 'text-slate-600'
              }`}>
                {req.icon} {req.label}
              </div>
              <p className="text-xs text-slate-400">{req.note}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
