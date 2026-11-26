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
  nextWidthClass = 'min-w-[126px] px-7',
  compactNext = false,
}: StepActionsProps) {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="h-[40px] min-w-[116px] px-6 rounded-[45px] bg-white/90 border border-[#bfd8d4] text-[#102529] text-[14px] font-semibold hover:bg-[#e5faf6] hover:border-[#00a5c3]/50 transition-all cursor-pointer"
        >
          {backLabel}
        </button>
      )}
      <button
        type="submit"
        onClick={onNext}
        className={`${
          compactNext
            ? 'h-[38px] min-w-[116px] px-6 text-[14px]'
            : `h-[40px] ${nextWidthClass} text-[14px]`
        } rounded-[45px] imdx-btn-primary font-semibold cursor-pointer`}
      >
        {nextLabel}
      </button>
    </div>
  );
}
