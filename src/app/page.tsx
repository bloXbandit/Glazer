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

  const handleNext = useCallback(async () => {
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
        let benchmarkOverride: import('@/types').PricingBenchmark | undefined;
        try {
          const bmRes = await fetch(`/api/benchmarks?work_type_id=${input.work_type_id}&region_id=${input.region_id}`);
          if (bmRes.ok) {
            const bmData = await bmRes.json();
            if (bmData.calibrated) benchmarkOverride = bmData.benchmark;
          }
        } catch { /* fall back to static */ }
        const result = runEstimate(input, liveFactors, benchmarkOverride);
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
    <div className="min-h-screen bg-[#FFFDF5] bg-grid flex flex-col">

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="border-b-4 border-black bg-[#FFFDF5] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

          {/* Logo — compact broken-glass wordmark */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center justify-center w-8 h-8 bg-[#FFD93D] border-2 border-black"
              style={{ boxShadow:'3px 3px 0 #000' }}>
              <Building size={14} strokeWidth={3} className="text-black" />
            </div>
            <div className="leading-none">
              <span className="block font-black text-black text-[11px] uppercase tracking-[0.12em]">Baltimore</span>
              <span className="block font-black text-[#FF6B6B] text-[11px] uppercase tracking-[0.12em]">Glass Co.</span>
            </div>
            <span className="hidden sm:inline neo-badge ml-1">DMV</span>
          </div>

          {/* Stepper */}
          <div className="flex-1 flex justify-center">
            <StepperNav currentStep={step} onStepClick={setStep} completedSteps={completedSteps} />
          </div>

          {/* Right nav */}
          <div className="flex items-center gap-1 shrink-0">
            <div className="hidden md:flex items-center gap-1">
              <Link href="/procurement"
                className="flex items-center gap-1.5 px-2.5 py-1.5 border-2 border-transparent hover:border-black hover:bg-[#C4B5FD] font-bold text-xs uppercase tracking-wide transition-all duration-100">
                <FileText size={11} strokeWidth={3} /> Procurement
              </Link>
              <Link href="/clients"
                className="flex items-center gap-1.5 px-2.5 py-1.5 border-2 border-transparent hover:border-black hover:bg-[#C4B5FD] font-bold text-xs uppercase tracking-wide transition-all duration-100">
                <Phone size={11} strokeWidth={3} /> Clients
              </Link>
            </div>
            <div className="hidden lg:block text-[10px] font-black uppercase tracking-widest ml-1">
              {liveDataStatus === 'idle' && (
                <button onClick={fetchLiveData} className="neo-btn-ghost text-[10px] py-1 px-2">Live Data</button>
              )}
              {liveDataStatus === 'loading' && (
                <span className="border-2 border-black px-2 py-1 bg-[#C4B5FD]">Loading…</span>
              )}
              {liveDataStatus === 'fresh' && (
                <span className="border-2 border-black px-2 py-1 bg-[#FFD93D]">⚡ {liveFactors.length} Live</span>
              )}
              {liveDataStatus === 'error' && (
                <span className="border-2 border-black px-2 py-1 bg-[#FF6B6B]">Offline</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">

        {/* ── Step 1 Hero ─────────────────────────────────────── */}
        {step === 1 && (
          <div className="mb-10">
            {/* Broken-glass title block */}
            <div className="relative inline-block mb-6">
              {/* Yellow backing slab */}
              <div className="absolute inset-0 bg-[#FFD93D] translate-x-[6px] translate-y-[6px] border-4 border-black" />
              <div className="relative bg-white border-4 border-black px-6 py-4 overflow-hidden"
                style={{ boxShadow:'none' }}>

                {/* Crack SVG overlay */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 90"
                  preserveAspectRatio="none" style={{ opacity:0.22 }}>
                  <g stroke="#000" strokeWidth="1.2" fill="none">
                    <line x1="250" y1="45" x2="30"  y2="5"  />
                    <line x1="250" y1="45" x2="470" y2="8"  />
                    <line x1="250" y1="45" x2="15"  y2="80" />
                    <line x1="250" y1="45" x2="485" y2="85" />
                    <line x1="250" y1="45" x2="130" y2="90" />
                    <line x1="250" y1="45" x2="370" y2="90" />
                    <line x1="250" y1="45" x2="250" y2="0"  />
                    <line x1="250" y1="45" x2="80"  y2="42" />
                    <line x1="250" y1="45" x2="420" y2="48" />
                    <circle cx="250" cy="45" r="5" fill="#000" opacity="0.5" />
                    <circle cx="250" cy="45" r="2" fill="#000" opacity="0.8" />
                  </g>
                </svg>

                {/* Shard layer A — upper-left fragment drifts */}
                <div className="shard-a absolute inset-0 flex items-center px-6"
                  style={{ clipPath:'polygon(0 0, 58% 0, 46% 52%, 38% 68%, 0 100%)', transform:'translate(-1px,-1px)' }}>
                  <h1 className="font-black text-3xl sm:text-4xl md:text-5xl text-[#FF6B6B] uppercase tracking-tighter leading-none whitespace-nowrap select-none">
                    BALTIMORE GLASS CO.
                  </h1>
                </div>

                {/* Shard layer B — upper-right fragment drifts opposite */}
                <div className="shard-b absolute inset-0 flex items-center px-6"
                  style={{ clipPath:'polygon(58% 0, 100% 0, 100% 55%, 62% 55%, 46% 52%)', transform:'translate(1px,-1px)' }}>
                  <h1 className="font-black text-3xl sm:text-4xl md:text-5xl text-black uppercase tracking-tighter leading-none whitespace-nowrap select-none">
                    BALTIMORE GLASS CO.
                  </h1>
                </div>

                {/* Shard layer C — lower fragment */}
                <div className="shard-c absolute inset-0 flex items-center px-6"
                  style={{ clipPath:'polygon(0 100%, 38% 68%, 46% 52%, 62% 55%, 100% 55%, 100% 100%)', transform:'translate(0.5px, 1px)' }}>
                  <h1 className="font-black text-3xl sm:text-4xl md:text-5xl text-black uppercase tracking-tighter leading-none whitespace-nowrap select-none">
                    BALTIMORE GLASS CO.
                  </h1>
                </div>

                {/* Base text (gives layout size) */}
                <h1 className="font-black text-3xl sm:text-4xl md:text-5xl text-black uppercase tracking-tighter leading-none whitespace-nowrap"
                  style={{ WebkitTextStroke:'2px #000', color:'transparent' }}>
                  BALTIMORE GLASS CO.
                </h1>
              </div>
            </div>

            {/* Sub-heading */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="bracket-tag">Step 1 of 4 — Glazing Scope</span>
              <p className="text-sm font-bold text-black/60 max-w-xl">
                Select your system. Each has its own benchmark pricing, productivity rates, and risk profile.
              </p>
            </div>
          </div>
        )}

        {/* Step headings for steps 2–4 */}
        {step >= 2 && step < 5 && (
          <div className="mb-8">
            <div className="inline-block mb-3">
              <span className="bracket-tag">Step {step} of 4 — {STEP_LABELS[step - 1]}</span>
            </div>
            {step === 2 && (
              <h1 className="text-3xl font-black text-black uppercase tracking-tight leading-tight">
                Region &amp; <span className="bg-[#C4B5FD] px-2 border-2 border-black">Project Conditions</span>
              </h1>
            )}
            {step === 3 && (
              <h1 className="text-3xl font-black text-black uppercase tracking-tight leading-tight">
                Quantities &amp; <span className="bg-[#FFD93D] px-2 border-2 border-black">Glass Type</span>
              </h1>
            )}
            {step === 4 && (
              <h1 className="text-3xl font-black text-black uppercase tracking-tight leading-tight">
                Markup &amp; <span className="bg-[#FF6B6B] px-2 border-2 border-black">Override Settings</span>
              </h1>
            )}
          </div>
        )}

        {/* Step 1: Glazing Scope Selection */}
        {step === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
                <button onClick={handleBack} className="neo-btn-ghost flex items-center gap-2 px-5 py-2.5">
                  <ChevronLeft size={15} strokeWidth={3} />
                  Back
                </button>
              )}
              {error && (
                <p className="text-xs font-bold text-black bg-[#FF6B6B] border-2 border-black px-3 py-1.5 flex items-center gap-1.5"
                  style={{ boxShadow:'3px 3px 0 #000' }}>
                  ⚠ {error}
                </p>
              )}
            </div>

            <button onClick={handleNext} className="neo-btn flex items-center gap-2 px-7 py-3 text-sm">
              {step === 4 ? (
                <><Calculator size={15} strokeWidth={3} /> Calculate</>
              ) : (
                <>Next <ChevronRight size={15} strokeWidth={3} /></>
              )}
            </button>
          </div>
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t-4 border-black bg-black py-5 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-black text-[#FFD93D] text-xs uppercase tracking-[0.18em]">
            Baltimore Glass Co. · Est. Estimating Platform
          </span>
          <span className="font-bold text-white/50 text-[10px] uppercase tracking-widest">
            RSMeans 2024 · DMV Bid Records · CSI Div. 08
          </span>
          <span className="font-black text-[#FF6B6B] text-[10px] uppercase tracking-widest">v1.0</span>
        </div>
      </footer>
    </div>
  );
}
