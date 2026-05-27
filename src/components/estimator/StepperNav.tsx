'use client';
import { CheckCircle2, Circle } from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Glazing Scope' },
  { id: 2, label: 'Conditions' },
  { id: 3, label: 'Quantities' },
  { id: 4, label: 'Markups' },
  { id: 5, label: 'Results' },
];

interface StepperNavProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  completedSteps: number[];
}

export default function StepperNav({ currentStep, onStepClick, completedSteps }: StepperNavProps) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, idx) => {
        const isCompleted = completedSteps.includes(step.id);
        const isCurrent = currentStep === step.id;
        const isClickable = isCompleted || step.id <= Math.max(...completedSteps, 1);

        return (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => isClickable && onStepClick(step.id)}
              disabled={!isClickable}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-all duration-150 uppercase tracking-wider ${
                isCurrent
                  ? 'bg-brand-500/10 text-brand-600'
                  : isCompleted
                  ? 'text-slate-500 hover:text-[#111] hover:bg-[#f0ede8] cursor-pointer'
                  : 'text-slate-300 cursor-not-allowed'
              }`}
            >
              <span className={`flex-shrink-0`}>
                {isCompleted && !isCurrent ? (
                  <CheckCircle2 size={14} className="text-emerald-600" />
                ) : (
                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-black border ${
                    isCurrent
                      ? 'border-brand-500 bg-brand-500 text-white'
                      : 'border-[#e2ddd6] text-slate-400'
                  }`}>
                    {step.id}
                  </span>
                )}
              </span>
              <span className="hidden sm:inline">{step.label}</span>
            </button>
            {idx < STEPS.length - 1 && (
              <div className={`w-6 h-px mx-0.5 transition-colors ${
                completedSteps.includes(step.id) ? 'bg-[#ccc8c0]' : 'bg-[#e2ddd6]'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
