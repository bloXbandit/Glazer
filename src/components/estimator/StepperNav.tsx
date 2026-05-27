'use client';

const STEPS = [
  { id: 1, label: 'Scope' },
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
        const isCurrent   = currentStep === step.id;
        const isClickable = isCompleted || step.id <= Math.max(...completedSteps, 1);

        return (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => isClickable && onStepClick(step.id)}
              disabled={!isClickable}
              className={`flex items-center gap-1.5 px-2 py-1 text-[10px] font-black uppercase tracking-widest
                transition-all duration-100 border-2
                ${isCurrent
                  ? 'border-black bg-[#FF6B6B] text-black'
                  : isCompleted
                  ? 'border-black bg-[#FFD93D] text-black hover:-translate-y-px cursor-pointer'
                  : 'border-black/20 bg-transparent text-black/25 cursor-not-allowed'
                }`}
              style={isCurrent ? { boxShadow:'2px 2px 0 #000' } : isCompleted ? { boxShadow:'2px 2px 0 #000' } : {}}
            >
              <span className={`inline-flex items-center justify-center w-4 h-4 font-black text-[9px]
                border-2 ${isCurrent ? 'border-black bg-black text-[#FF6B6B]' : isCompleted ? 'border-black bg-black text-[#FFD93D]' : 'border-black/20 bg-transparent text-black/25'}`}>
                {isCompleted && !isCurrent ? '✓' : step.id}
              </span>
              <span className="hidden md:inline">{step.label}</span>
            </button>

            {idx < STEPS.length - 1 && (
              <div className={`w-4 h-0.5 transition-colors ${
                completedSteps.includes(step.id) ? 'bg-black' : 'bg-black/15'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
