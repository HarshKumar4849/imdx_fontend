import stepCheckIcon from '../assets/step-check.svg';
import { STEPPER_STEPS } from '../data/onboardingConstants';

interface StepProgressProps {
  currentStep: 1 | 2 | 3 | 4 | 5 | 6;
  onStepSelect?: (step: 1 | 2 | 3 | 4 | 5 | 6) => void;
}

export function StepProgress({ currentStep, onStepSelect }: StepProgressProps) {
  return (
    <div className="bg-white border border-[#c1c1c1] rounded-[12px] sm:rounded-[16px] px-4 sm:px-10 py-7 mb-9 overflow-x-auto">
      <div className="min-w-[680px]">
        <div className="grid grid-cols-6 relative">
          {STEPPER_STEPS.map((item, idx) => {
            const isCompleted = item.step < currentStep;
            const isCurrent = item.step === currentStep;
            const isClickable = isCompleted && Boolean(onStepSelect);

            return (
              <div key={item.step} className="relative flex flex-col items-center text-center">
                {/* Left connector */}
                {idx > 0 && (
                  <div
                    className={`absolute top-[13px] right-1/2 left-0 h-[2px] ${
                      item.step <= currentStep ? 'bg-[#32c4a6]' : 'bg-[#d9d9d9]'
                    }`}
                  />
                )}
                {/* Right connector */}
                {idx < STEPPER_STEPS.length - 1 && (
                  <div
                    className={`absolute top-[13px] left-1/2 right-0 h-[2px] ${
                      item.step < currentStep ? 'bg-[#32c4a6]' : 'bg-[#d9d9d9]'
                    }`}
                  />
                )}

                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepSelect?.(item.step)}
                  className={`relative z-10 flex items-center justify-center rounded-full transition-transform ${
                    isClickable ? 'cursor-pointer hover:scale-105' : 'cursor-default'
                  }`}
                  style={{ width: 27, height: 27 }}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={`${item.label}: ${item.titleLines.join(' ')}`}
                >
                  {isCompleted ? (
                    <span className="flex items-center justify-center size-[27px] rounded-full bg-[#32c4a6]">
                      <img
                        src={stepCheckIcon}
                        alt=""
                        width={12}
                        height={7}
                        className="shrink-0"
                      />
                    </span>
                  ) : isCurrent ? (
                    <span className="flex items-center justify-center size-[27px] rounded-full bg-[#32c4a6]">
                      <span className="size-[13px] rounded-full bg-white" />
                    </span>
                  ) : (
                    <span className="size-[18px] rounded-full bg-[#c9c9c9]" />
                  )}
                </button>

                <span
                  className={`mt-2 text-[15px] leading-tight text-[#0f0f0f] ${
                    isCurrent ? 'font-semibold' : 'font-normal'
                  }`}
                >
                  {item.label}
                </span>

                <div
                  className={`mt-1.5 text-[15px] sm:text-[16px] leading-snug text-[#808080] ${
                    isCurrent ? 'font-semibold text-[#555555]' : 'font-normal'
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
