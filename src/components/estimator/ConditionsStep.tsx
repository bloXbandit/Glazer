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
      <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
        <span className="text-slate-400">{icon}</span>
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-white border border-[#e2ddd6] rounded-lg px-3 py-2.5
                   text-sm text-[#111] focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30
                   transition-colors appearance-none cursor-pointer"
      >
        <option value="">— Select —</option>
        {options.map(o => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </select>
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
      {value && (
        <p className="text-xs text-slate-500 mt-1 italic">
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
        <SelectRow
          icon={<MapPin size={13} />}
          label="Region"
          value={values.region_id}
          onChange={v => onChange('region_id', v)}
          options={regions.map(r => ({ id: r.id, label: r.name, description: r.description }))}
          hint="Applies regional material and labor cost multipliers"
        />
        <SelectRow
          icon={<HardHat size={13} />}
          label="Project Type"
          value={values.project_type}
          onChange={v => onChange('project_type', v)}
          options={projectTypes.map(p => ({ id: p.condition_id, label: p.label, description: p.description }))}
          hint="Determines wage rate requirements (prevailing wage, Davis-Bacon)"
        />
        <SelectRow
          icon={<Building2 size={13} />}
          label="Building Type"
          value={values.building_type}
          onChange={v => onChange('building_type', v)}
          options={buildingTypes.map(b => ({ id: b.condition_id, label: b.label, description: b.description }))}
          hint="Applies building complexity and access requirements"
        />
        <SelectRow
          icon={<Wrench size={13} />}
          label="Work Condition"
          value={values.work_condition}
          onChange={v => onChange('work_condition', v)}
          options={workConditions.map(w => ({ id: w.condition_id, label: w.label, description: w.description }))}
          hint="Renovation and occupied-building work carries significant premium"
        />
        <SelectRow
          icon={<ArrowUpSquare size={13} />}
          label="Height & Access"
          value={values.access_condition}
          onChange={v => onChange('access_condition', v)}
          options={accessConditions.map(a => ({ id: a.condition_id, label: a.label, description: a.description }))}
          hint="High-rise and swing-stage work adds 25–40% access multiplier"
        />
      </div>

      {/* Multiplier preview */}
      {values.region_id && (
        <div className="bg-[#f8f6f3] border border-[#e2ddd6] rounded-xl p-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Applied Multipliers Preview</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[
              { label: 'Region (Material)', value: regions.find(r => r.id === values.region_id)?.material_cost_multiplier },
              { label: 'Region (Labor)',    value: regions.find(r => r.id === values.region_id)?.labor_cost_multiplier },
              { label: 'Wage',             value: projectTypes.find(p => p.condition_id === values.project_type)?.wage_multiplier },
              { label: 'Building Type',    value: buildingTypes.find(b => b.condition_id === values.building_type)?.complexity_multiplier },
              { label: 'Work Condition',   value: workConditions.find(w => w.condition_id === values.work_condition)?.difficulty_multiplier },
              { label: 'Access',           value: accessConditions.find(a => a.condition_id === values.access_condition)?.access_multiplier },
            ].filter(m => m.value !== undefined).map((m, i) => (
              <div key={i} className="flex items-center justify-between bg-white border border-[#e2ddd6] rounded-lg px-3 py-2">
                <span className="text-xs text-slate-500">{m.label}</span>
                <span className={`text-xs font-black tabular-nums ${
                  (m.value ?? 1) > 1.2 ? 'text-amber-600' :
                  (m.value ?? 1) > 1.0 ? 'text-brand-600' : 'text-slate-600'
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
