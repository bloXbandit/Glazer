'use client';
import { useState, useCallback } from 'react';
import { ChevronRight, ChevronLeft, Calculator, Building, FileText, Phone } from 'lucide-react';
import Link from 'next/link';
import type { EstimatePacket, EstimateInput, ProjectType, BuildingType, WorkCondition, AccessCondition, EstimateMode, LiveDataFactor } from '@/types';
import { runEstimate } from '@/lib/estimateEngine';
import { syncRepo } from '@/lib/repository';
import { getBenchmark } from '@/data/pricingBenchmarks';
import StepperNav from '@/components/estimator/StepperNav';
import WorkTypeCard from '@/components/estimator/WorkTypeCard';
import ConditionsStep from '@/components/estimator/ConditionsStep';
import QuantityStep from '@/components/estimator/QuantityStep';
import MarkupStep from '@/components/estimator/MarkupStep';
import ResultsPanel from '@/components/estimator/ResultsPanel';

// ─────────────────────────────────────────────────────────
// Form state defaults
// ─────────────────────────────────────────────────────────
interface FormState {
  work_type_id: string;
  region_id: string;
  project_type: string;
  building_type: string;
  work_condition: string;
  access_condition: string;
  total_sf: number;
  num_openings: number;
  glass_type_id: string;
  mode: EstimateMode;
  has_fire_rating: boolean;
  has_blast_security: boolean;
  has_acoustic_requirement: boolean;
  custom_contingency_pct: number;
  custom_profit_pct: number;
  custom_labor_rate: number;
  include_bond: boolean;
}

const DEFAULTS: FormState = {
  work_type_id: '',
  region_id: '',
  project_type: 'private',
  building_type: 'office',
  work_condition: 'new_construction',
  access_condition: 'ground_level',
  total_sf: 0,
  num_openings: 0,
  glass_type_id: 'low_e_clear',
  mode: 'Quick',
  has_fire_rating: false,
  has_blast_security: false,
  has_acoustic_requirement: false,
  custom_contingency_pct: 0.05,
  custom_profit_pct: 0.10,
  custom_labor_rate: 0,
  include_bond: false,
};

// ─────────────────────────────────────────────────────────
// Validation helpers
// ─────────────────────────────────────────────────────────
function canProceedFromStep(step: number, form: FormState): boolean {
  switch (step) {
    case 1: return !!form.work_type_id;
    case 2: return !!form.region_id && !!form.project_type && !!form.building_type && !!form.work_condition && !!form.access_condition;
    case 3: return form.total_sf > 0 && !!form.glass_type_id;
    case 4: return true;
    default: return true;
  }
}

function getStepError(step: number, form: FormState): string {
  switch (step) {
    case 1: return 'Select a glazing system to continue.';
    case 2: return 'Complete all region and project conditions.';
    case 3: return 'Enter total square footage and select a glass type.';
    default: return '';
  }
}

export default function HomePage() {
  const [step, setStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [form, setForm] = useState<FormState>(DEFAULTS);
  const [packet, setPacket] = useState<EstimatePacket | null>(null);
  const [error, setError] = useState('');
  const [aiCommentary, setAiCommentary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [liveFactors, setLiveFactors] = useState<LiveDataFactor[]>([]);
  const [liveDataStatus, setLiveDataStatus] = useState<'idle' | 'loading' | 'fresh' | 'error'>('idle');

  const workTypes = syncRepo.getWorkTypes();

  // Fetch live market calibration data (BLS PPI + SAM.gov)
  const fetchLiveData = useCallback(async () => {
    setLiveDataStatus('loading');
    try {
      const res = await fetch('/api/live-data');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const cache = await res.json();
      if (cache.factors?.length > 0) {
        setLiveFactors(cache.factors);
        setLiveDataStatus('fresh');
      } else {
        setLiveDataStatus('error');
      }
    } catch {
      setLiveDataStatus('error');
    }
  }, []);

  const updateForm = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setError('');
  }, []);

  const handleNext = useCallback(() => {
    if (!canProceedFromStep(step, form)) {
      setError(getStepError(step, form));
      return;
    }
    setError('');
    setCompletedSteps(prev => Array.from(new Set([...prev, step])));
    if (step === 4) {
      // Calculate estimate
      try {
        const input: EstimateInput = {
          work_type_id: form.work_type_id,
          glass_type_id: form.glass_type_id,
          region_id: form.region_id,
          project_type: form.project_type as ProjectType,
          building_type: form.building_type as BuildingType,
          work_condition: form.work_condition as WorkCondition,
          access_condition: form.access_condition as AccessCondition,
          total_sf: form.total_sf,
          num_openings: form.num_openings,
          mode: form.mode,
          custom_contingency_pct: form.custom_contingency_pct,
          custom_profit_pct: form.custom_profit_pct,
          custom_labor_rate: form.custom_labor_rate > 0 ? form.custom_labor_rate : undefined,
          include_bond: form.include_bond,
          has_fire_rating: form.has_fire_rating,
          has_blast_security: form.has_blast_security,
          has_acoustic_requirement: form.has_acoustic_requirement,
        };
        const result = runEstimate(input, liveFactors);
        setPacket(result);
        setCompletedSteps(prev => Array.from(new Set([...prev, 4, 5])));
        setStep(5);
      } catch (e) {
        setError(`Calculation error: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    } else {
      setStep(s => s + 1);
    }
  }, [step, form, liveFactors]);

  const handleBack = useCallback(() => {
    setError('');
    setStep(s => Math.max(1, s - 1));
  }, []);

  const handleReset = useCallback(() => {
    setForm(DEFAULTS);
    setStep(1);
    setCompletedSteps([]);
    setPacket(null);
    setAiCommentary('');
    setError('');
    // Keep liveFactors — no need to re-fetch on reset
  }, []);

  const handleGetAI = useCallback(async () => {
    if (!packet) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: packet.ai_context, narrative: packet.narrative }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setAiCommentary(data.commentary);
    } catch (e) {
      setAiCommentary('AI analysis unavailable. Check that OPENAI_API_KEY is set in .env.local');
    } finally {
      setAiLoading(false);
    }
  }, [packet]);

  const selectedWorkType = workTypes.find(w => w.id === form.work_type_id);
  const hasAIKey = process.env.NEXT_PUBLIC_HAS_AI_KEY === 'true';

  const STEP_LABELS = ['Glazing Scope', 'Conditions', 'Quantities', 'Markups', 'Results'];

  return (
    <div className="min-h-screen bg-[#f0ede8] bg-grid flex flex-col">

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="border-b border-[#e2ddd6] bg-white/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 bg-brand-500 rounded flex items-center justify-center">
              <Building size={14} className="text-white" />
            </div>
            <span className="font-black text-[#111] text-sm tracking-tight">GlazePro</span>
            <span className="hidden sm:inline text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-[#e2ddd6] px-2 py-0.5 rounded-sm">
              DMV Market
            </span>
          </div>

          {/* Stepper */}
          <div className="flex-1 flex justify-center">
            <StepperNav
              currentStep={step}
              onStepClick={setStep}
              completedSteps={completedSteps}
            />
          </div>

          {/* Right nav */}
          <div className="flex items-center gap-1 shrink-0">
            <div className="hidden md:flex items-center gap-1 mr-2">
              <Link
                href="/procurement"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-slate-500 hover:text-[#111] hover:bg-[#f0ede8] transition-colors"
              >
                <FileText size={11} />
                Procurement
              </Link>
              <Link
                href="/clients"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-slate-500 hover:text-[#111] hover:bg-[#f0ede8] transition-colors"
              >
                <Phone size={11} />
                Clients
              </Link>
            </div>

            {/* Live data pill */}
            <div className="hidden lg:block text-[10px] font-bold uppercase tracking-widest">
              {liveDataStatus === 'idle' && (
                <button onClick={fetchLiveData} className="border border-[#e2ddd6] px-2.5 py-1 rounded text-slate-400 hover:border-brand-500/50 hover:text-brand-600 transition-colors">
                  Fetch Live Data
                </button>
              )}
              {liveDataStatus === 'loading' && (
                <span className="border border-[#e2ddd6] px-2.5 py-1 rounded text-slate-400">Loading…</span>
              )}
              {liveDataStatus === 'fresh' && (
                <span className="border border-emerald-500/40 px-2.5 py-1 rounded text-emerald-700 bg-emerald-50">
                  ⚡ {liveFactors.length} Live
                </span>
              )}
              {liveDataStatus === 'error' && (
                <span className="border border-amber-400/40 px-2.5 py-1 rounded text-amber-700 bg-amber-50">
                  Live Unavailable
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">

        {/* Step heading */}
        {step < 5 && (
          <div className="mb-7">
            <span className="bracket-tag mb-3 inline-block">
              Step {step} of 4 — {STEP_LABELS[step - 1]}
            </span>
            {step === 1 && (
              <>
                <h1 className="text-3xl font-black text-[#111] leading-tight">
                  Select your <span className="text-brand-500">Glazing</span> Scope
                </h1>
                <p className="text-slate-500 text-sm mt-1.5 max-w-xl">
                  Each system has its own benchmark pricing, productivity rates, and risk profile.
                </p>
              </>
            )}
            {step === 2 && (
              <>
                <h1 className="text-3xl font-black text-[#111] leading-tight">Region &amp; Project Conditions</h1>
                <p className="text-slate-500 text-sm mt-1.5">Applies regional multipliers, prevailing wage, and complexity adjustments.</p>
              </>
            )}
            {step === 3 && (
              <>
                <h1 className="text-3xl font-black text-[#111] leading-tight">Quantities &amp; Glass Type</h1>
                <p className="text-slate-500 text-sm mt-1.5">Enter scope quantities for your <span className="font-semibold text-[#111]">{selectedWorkType?.name ?? 'selected system'}</span> estimate.</p>
              </>
            )}
            {step === 4 && (
              <>
                <h1 className="text-3xl font-black text-[#111] leading-tight">Markup &amp; Override Settings</h1>
                <p className="text-slate-500 text-sm mt-1.5">Adjust overhead, contingency, and profit to match your company's rates.</p>
              </>
            )}
          </div>
        )}

        {/* Step 1: Glazing Scope Selection */}
        {step === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {workTypes.map(wt => {
              const bench = getBenchmark(wt.id, 'national');
              return (
                <WorkTypeCard
                  key={wt.id}
                  workType={wt}
                  pricing={bench
                    ? { low: bench.price_low, mid: bench.price_mid, high: bench.price_high }
                    : { low: 0, mid: 0, high: 0 }
                  }
                  selected={form.work_type_id === wt.id}
                  onSelect={id => updateForm('work_type_id', id)}
                />
              );
            })}
          </div>
        )}

        {/* Step 2: Conditions */}
        {step === 2 && (
          <div className="max-w-3xl">
            <ConditionsStep
              values={{
                region_id: form.region_id,
                project_type: form.project_type,
                building_type: form.building_type,
                work_condition: form.work_condition,
                access_condition: form.access_condition,
              }}
              onChange={(key, value) => updateForm(key as keyof FormState, value)}
            />
          </div>
        )}

        {/* Step 3: Quantities */}
        {step === 3 && (
          <div className="max-w-2xl">
            <QuantityStep
              values={{
                total_sf: form.total_sf,
                num_openings: form.num_openings,
                glass_type_id: form.glass_type_id,
                mode: form.mode,
                has_fire_rating: form.has_fire_rating,
                has_blast_security: form.has_blast_security,
                has_acoustic_requirement: form.has_acoustic_requirement,
              }}
              workTypeName={selectedWorkType?.name ?? ''}
              onChange={(key, value) => updateForm(key as keyof FormState, value as FormState[keyof FormState])}
            />
          </div>
        )}

        {/* Step 4: Markups */}
        {step === 4 && (
          <div className="max-w-xl">
            <MarkupStep
              values={{
                custom_contingency_pct: form.custom_contingency_pct,
                custom_profit_pct: form.custom_profit_pct,
                custom_labor_rate: form.custom_labor_rate,
                include_bond: form.include_bond,
              }}
              onChange={(key, value) => updateForm(key as keyof FormState, value as FormState[keyof FormState])}
            />
          </div>
        )}

        {/* Step 5: Results */}
        {step === 5 && packet && (
          <ResultsPanel
            packet={packet}
            aiCommentary={aiCommentary}
            aiLoading={aiLoading}
            onGetAI={handleGetAI}
            hasAIKey={hasAIKey}
            onReset={handleReset}
          />
        )}

        {/* ── Navigation bar ────────────────────────────────────── */}
        {step < 5 && (
          <div className="mt-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {step > 1 && (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-[#f8f6f3] border border-[#e2ddd6] hover:border-[#ccc8c0] text-[#111] text-sm font-medium rounded-lg transition-colors"
                >
                  <ChevronLeft size={15} />
                  Back
                </button>
              )}
              {error && (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-1.5 flex items-center gap-1.5">
                  ⚠ {error}
                </p>
              )}
            </div>

            <button
              onClick={handleNext}
              className={`flex items-center gap-2 px-7 py-2.5 text-sm font-black rounded-lg uppercase tracking-wider transition-all duration-150 ${
                step === 4
                  ? 'bg-brand-500 hover:bg-brand-600 text-white shadow-md shadow-brand-500/25'
                  : 'bg-brand-500 hover:bg-brand-600 text-white shadow-md shadow-brand-500/25'
              }`}
            >
              {step === 4 ? (
                <>
                  <Calculator size={15} />
                  Calculate →
                </>
              ) : (
                <>
                  Next →
                </>
              )}
            </button>
          </div>
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-[#e2ddd6] bg-white/60 py-4 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <span>GlazePro Estimating Platform · DMV Commercial Glazing</span>
          <span>RSMeans 2024 · DMV Regional Bid Records · CSI Div. 08</span>
          <span>MVP v1.0</span>
        </div>
      </footer>
    </div>
  );
}
