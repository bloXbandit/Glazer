'use client';
import { MapPin, Building2, HardHat, Wrench, ArrowUpSquare } from 'lucide-react';
import { regions, projectConditionMultipliers } from '@/data/regions';

interface ConditionsFormState {
  region_id: string;
  project_type: string;
  building_type: string;
  work_condition: string;
  access_condition: string;
}

interface ConditionsStepProps {
  values: ConditionsFormState;
  onChange: (key: keyof ConditionsFormState, value: string) => void;
}

const projectTypes = projectConditionMultipliers.filter(c => c.condition_type === 'project_type');
const buildingTypes = projectConditionMultipliers.filter(c => c.condition_type === 'building_type');
const workConditions = projectConditionMultipliers.filter(c => c.condition_type === 'work_condition');
const accessConditions = projectConditionMultipliers.filter(c => c.condition_type === 'access');

function SelectRow({
  icon, label, value, onChange, options, hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string; description: string }[];
  hint?: string;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[10px] font-black text-black uppercase tracking-widest mb-2">
        <span className="text-black">{icon}</span>
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="neo-select pr-8"
        >
          <option value="">— Select —</option>
          {options.map(o => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-black text-xs">▼</span>
      </div>
      {hint && <p className="text-[10px] font-bold text-black/50 mt-1.5 uppercase tracking-wide">{hint}</p>}
      {value && (
        <p className="text-xs font-medium text-black/60 mt-1">
          {options.find(o => o.id === value)?.description}
        </p>
      )}
    </div>
  );
}

export default function ConditionsStep({ values, onChange }: ConditionsStepProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SelectRow icon={<MapPin size={13} strokeWidth={3} />} label="Region"
          value={values.region_id} onChange={v => onChange('region_id', v)}
          options={regions.map(r => ({ id: r.id, label: r.name, description: r.description }))}
          hint="Regional material + labor cost multipliers" />
        <SelectRow icon={<HardHat size={13} strokeWidth={3} />} label="Project Type"
          value={values.project_type} onChange={v => onChange('project_type', v)}
          options={projectTypes.map(p => ({ id: p.condition_id, label: p.label, description: p.description }))}
          hint="Prevailing wage / Davis-Bacon requirements" />
        <SelectRow icon={<Building2 size={13} strokeWidth={3} />} label="Building Type"
          value={values.building_type} onChange={v => onChange('building_type', v)}
          options={buildingTypes.map(b => ({ id: b.condition_id, label: b.label, description: b.description }))}
          hint="Building complexity + access requirements" />
        <SelectRow icon={<Wrench size={13} strokeWidth={3} />} label="Work Condition"
          value={values.work_condition} onChange={v => onChange('work_condition', v)}
          options={workConditions.map(w => ({ id: w.condition_id, label: w.label, description: w.description }))}
          hint="Renovation + occupied-building work carries premium" />
        <SelectRow icon={<ArrowUpSquare size={13} strokeWidth={3} />} label="Height & Access"
          value={values.access_condition} onChange={v => onChange('access_condition', v)}
          options={accessConditions.map(a => ({ id: a.condition_id, label: a.label, description: a.description }))}
          hint="High-rise / swing-stage adds 25–40% multiplier" />
      </div>

      {/* Multiplier preview */}
      {values.region_id && (
        <div className="border-4 border-black p-4" style={{ boxShadow:'6px 6px 0 #000', background:'#FFFDF5' }}>
          <p className="text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="inline-block w-3 h-3 bg-[#FFD93D] border-2 border-black" />
            Applied Multipliers Preview
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[
              { label: 'Region (Mat.)', value: regions.find(r => r.id === values.region_id)?.material_cost_multiplier },
              { label: 'Region (Labor)', value: regions.find(r => r.id === values.region_id)?.labor_cost_multiplier },
              { label: 'Wage',          value: projectTypes.find(p => p.condition_id === values.project_type)?.wage_multiplier },
              { label: 'Building',      value: buildingTypes.find(b => b.condition_id === values.building_type)?.complexity_multiplier },
              { label: 'Work Cond.',    value: workConditions.find(w => w.condition_id === values.work_condition)?.difficulty_multiplier },
              { label: 'Access',        value: accessConditions.find(a => a.condition_id === values.access_condition)?.access_multiplier },
            ].filter(m => m.value !== undefined).map((m, i) => (
              <div key={i} className="flex items-center justify-between border-2 border-black px-3 py-2 bg-white">
                <span className="text-[10px] font-bold uppercase tracking-wide">{m.label}</span>
                <span className={`text-sm font-black tabular-nums border-b-2 ${
                  (m.value ?? 1) > 1.2 ? 'border-[#FF6B6B] text-[#FF6B6B]' :
                  (m.value ?? 1) > 1.0 ? 'border-[#C4B5FD] text-black' : 'border-[#FFD93D] text-black'
                }`}>
                  ×{m.value?.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
