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
        <label className="neo-label">Estimate Mode</label>
        <div className="flex gap-0">
          {(['Quick', 'Detailed'] as const).map((m, i) => (
            <button
              key={m}
              onClick={() => onChange('mode', m)}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest border-3 border-black transition-all duration-100
                ${i === 0 ? '' : '-ml-[3px]'}
                ${values.mode === m
                  ? 'bg-[#FF6B6B] text-black z-10 relative'
                  : 'bg-white text-black/50 hover:bg-[#FFD93D] hover:text-black'
                }`}
              style={{ border:'3px solid #000', boxShadow: values.mode === m ? '3px 3px 0 #000' : 'none' }}
            >
              {m}
              <span className="block text-[9px] font-bold opacity-70 mt-0.5 normal-case tracking-normal">
                {m === 'Quick' ? 'ROM / Budget' : 'Bid-Grade'}
              </span>
            </button>
          ))}
        </div>
        <p className="text-[10px] font-bold text-black/50 mt-1.5 uppercase tracking-wide">
          {values.mode === 'Quick' ? 'Rough order-of-magnitude. Useful for early budget pricing.' : 'Full multiplier stack. Suitable for competitive bid submissions.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="neo-label flex items-center gap-1.5">
            <SquareStack size={12} strokeWidth={3} /> Total Square Footage (SF)
          </label>
          <input type="number" min={1}
            value={values.total_sf || ''}
            onChange={e => onChange('total_sf', parseFloat(e.target.value) || 0)}
            placeholder="e.g. 2500"
            className="neo-input text-lg"
          />
          <p className="text-[10px] font-bold text-black/40 mt-1.5 uppercase tracking-wide">Glazed area only — no opaque panels</p>
        </div>
        <div>
          <label className="neo-label flex items-center gap-1.5">
            <Hash size={12} strokeWidth={3} /> Number of Openings / Panels
          </label>
          <input type="number" min={0}
            value={values.num_openings || ''}
            onChange={e => onChange('num_openings', parseInt(e.target.value) || 0)}
            placeholder="e.g. 48"
            className="neo-input text-lg"
          />
          <p className="text-[10px] font-bold text-black/40 mt-1.5 uppercase tracking-wide">Optional — improves confidence score</p>
        </div>
      </div>

      {values.total_sf > 0 && values.num_openings > 0 && (
        <div className="flex items-center gap-2 text-xs font-bold border-2 border-black px-3 py-2 bg-[#FFD93D]"
          style={{ boxShadow:'3px 3px 0 #000' }}>
          <Info size={12} strokeWidth={3} />
          Avg opening: <span className="font-black ml-1">{(values.total_sf / values.num_openings).toFixed(1)} SF</span>
          {values.total_sf / values.num_openings > 150 && (
            <span className="ml-2 text-[#FF6B6B]">&mdash; large panel, verify crane scope</span>
          )}
        </div>
      )}

      {/* Glass type */}
      <div>
        <label className="neo-label flex items-center gap-1.5">
          <FlaskConical size={12} strokeWidth={3} /> Glass Type
        </label>
        <div className="relative">
          <select
            value={values.glass_type_id}
            onChange={e => onChange('glass_type_id', e.target.value)}
            className="neo-select pr-8"
          >
            <option value="">— Select glass type —</option>
            {glassTypes.map(g => (
              <option key={g.id} value={g.id}>
                {g.name} — ×{g.cost_multiplier.toFixed(2)} material / +{g.lead_time_impact_weeks}wk lead
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-black text-xs">▼</span>
        </div>
        {selectedGlass && (
          <div className="mt-2 border-2 border-black px-3 py-2.5 bg-[#C4B5FD]">
            <p className="text-xs font-medium leading-relaxed">{selectedGlass.performance_notes}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-[10px] font-black uppercase tracking-wide">Mat. ×{selectedGlass.cost_multiplier}</span>
              <span className="text-[10px] font-black uppercase tracking-wide">+{selectedGlass.lead_time_impact_weeks}wk lead</span>
            </div>
          </div>
        )}
      </div>

      {/* Special requirements */}
      <div>
        <label className="neo-label">Special Requirements</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { key: 'has_fire_rating',         icon: <Flame size={16} strokeWidth={3} />,   label: 'Fire-Rated',  bg: '#FF6B6B', note: 'Significant premium. UL listing required.' },
            { key: 'has_blast_security',       icon: <Shield size={16} strokeWidth={3} />,  label: 'Blast/Sec.',  bg: '#000000', note: 'Highest cost. Federal projects.' },
            { key: 'has_acoustic_requirement', icon: <Volume2 size={16} strokeWidth={3} />, label: 'Acoustic',    bg: '#C4B5FD', note: 'Laminated acoustic glass required.' },
          ].map(req => {
            const active = !!values[req.key as keyof QuantityFormState];
            return (
              <button
                key={req.key}
                onClick={() => onChange(req.key as keyof QuantityFormState, !values[req.key as keyof QuantityFormState])}
                className="relative text-left group outline-none"
              >
                <div className="absolute inset-0 border-3 border-black transition-all duration-150
                  group-hover:translate-x-[2px] group-hover:translate-y-[2px]"
                  style={{ border:'3px solid #000', background: req.bg }} />
                <div className={`relative border-3 border-black p-3 transition-all duration-150
                  group-hover:-translate-x-[2px] group-hover:-translate-y-[2px]
                  ${active ? 'bg-[#FFFDF5]' : 'bg-white'}`}
                  style={{ border:'3px solid #000' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-7 h-7 flex items-center justify-center border-2 border-black
                      ${active ? 'bg-black text-[#FFD93D]' : 'bg-white text-black'}`}>
                      {req.icon}
                    </span>
                    <span className="text-xs font-black uppercase tracking-wide">{req.label}</span>
                    {active && <span className="ml-auto text-[9px] font-black bg-[#FFD93D] border border-black px-1">ON</span>}
                  </div>
                  <p className="text-[10px] font-medium text-black/60">{req.note}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
