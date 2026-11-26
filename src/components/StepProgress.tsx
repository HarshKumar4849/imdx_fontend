import stepCheckIcon from '../assets/step-check.svg';
import { STEPPER_STEPS } from '../data/onboardingConstants';

interface StepProgressProps {
  currentStep: 1 | 2 | 3 | 4 | 5 | 6;
  onStepSelect?: (step: 1 | 2 | 3 | 4 | 5 | 6) => void;
}

export function StepProgress({ currentStep, onStepSelect }: StepProgressProps) {
  return (
    <div className="imdx-card rounded-[12px] px-3 sm:px-6 py-3.5 mb-5 overflow-x-auto">
      <div className="min-w-[580px]">
        <div className="grid grid-cols-6 relative">
          {STEPPER_STEPS.map((item, idx) => {
            const isCompleted = item.step < currentStep;
            const isCurrent = item.step === currentStep;
            const isClickable = isCompleted && Boolean(onStepSelect);

            return (
              <div key={item.step} className="relative flex flex-col items-center text-center">
                {idx > 0 && (
                  <div
                    className={`absolute top-[11px] right-1/2 left-0 h-[2px] ${
                      item.step <= currentStep
                        ? 'bg-gradient-to-r from-[#45c0b2] to-[#00a5c3]'
                        : 'bg-[#d4e5e2]'
                    }`}
                  />
                )}
                {idx < STEPPER_STEPS.length - 1 && (
                  <div
                    className={`absolute top-[11px] left-1/2 right-0 h-[2px] ${
                      item.step < currentStep
                        ? 'bg-gradient-to-r from-[#45c0b2] to-[#00a5c3]'
                        : 'bg-[#d4e5e2]'
                    }`}
                  />
                )}

                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepSelect?.(item.step)}
                  className={`relative z-10 flex items-center justify-center rounded-full transition-transform ${
                    isClickable ? 'cursor-pointer hover:scale-110' : 'cursor-default'
                  }`}
                  style={{ width: 24, height: 24 }}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={`${item.label}: ${item.titleLines.join(' ')}`}
                >
                  {isCompleted ? (
                    <span className="flex items-center justify-center size-[24px] rounded-full bg-gradient-to-br from-[#45c0b2] to-[#00a5c3] shadow-sm">
                      <img
                        src={stepCheckIcon}
                        alt=""
                        width={10}
                        height={6}
                        className="shrink-0"
                      />
                    </span>
                  ) : isCurrent ? (
                    <span className="flex items-center justify-center size-[24px] rounded-full bg-gradient-to-br from-[#45c0b2] to-[#00a5c3] ring-4 ring-[#45c0b2]/25">
                      <span className="size-[9px] rounded-full bg-white" />
                    </span>
                  ) : (
                    <span className="size-[15px] rounded-full bg-[#c9deda] border-2 border-white" />
                  )}
                </button>

                <span
                  className={`mt-1.5 font-mono text-[10px] uppercase tracking-[0.08em] ${
                    isCurrent
                      ? 'font-bold text-[#008fa7]'
                      : isCompleted
                        ? 'font-semibold text-[#087d68]'
                        : 'text-[#6a7d82]'
                  }`}
                >
                  {item.label}
                </span>

                <div
                  className={`mt-0.5 text-[12px] leading-tight ${
                    isCurrent
                      ? 'font-semibold text-[#102529]'
                      : 'font-normal text-[#59666d]'
                  }`}
                >
                  {item.titleLines.map((line) => (
                    <div key={line}>{line}</div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
