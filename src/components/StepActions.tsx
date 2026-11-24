interface StepActionsProps {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  backLabel?: string;
  nextWidthClass?: string;
  compactNext?: boolean;
}

export function StepActions({
  onBack,
  onNext,
  nextLabel = 'Next',
  backLabel = 'Back',
  nextWidthClass = 'w-[174px]',
  compactNext = false,
}: StepActionsProps) {
  return (
    <div className="mt-7 flex flex-wrap items-center justify-end gap-4">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="h-[57px] w-[174px] rounded-[45px] bg-[#fcfcfc] border border-[#c1c1c1] text-[#0f0f0f] text-[20px] sm:text-[24px] font-semibold hover:bg-[#f1f1f1] transition-colors cursor-pointer"
        >
          {backLabel}
        </button>
      )}
      <button
        type="submit"
        onClick={onNext}
        className={`${
          compactNext ? 'h-[48px] w-[151px] text-[18px]' : `h-[57px] ${nextWidthClass} text-[20px] sm:text-[24px]`
        } rounded-[45px] bg-[#32c4a6] hover:bg-[#2ab195] text-white font-semibold transition-colors cursor-pointer`}
      >
        {nextLabel}
      </button>
    </div>
  );
}
