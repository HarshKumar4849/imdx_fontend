interface ApplicationBannerProps {
  applicationNumber: string;
  underlineNumber?: boolean;
}

export function ApplicationBanner({
  applicationNumber,
  underlineNumber = false,
}: ApplicationBannerProps) {
  return (
    <div className="mb-4 imdx-card rounded-[12px] px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="imdx-kicker">IMDX / ONBOARDING APPLICATION</p>
        <h1 className="mt-0.5 text-[19px] sm:text-[21px] text-[#102529] leading-tight">
          Your Application
        </h1>
        <p className="mt-0.5 text-[13px] text-[#59666d] leading-snug">
          Keep your reference number safe to access your application link and track your
          registration status.
        </p>
      </div>

      <div className="rounded-[10px] border border-[#00a5c3]/30 bg-[#e5faf6]/80 px-3.5 py-1.5 text-right shrink-0">
        <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-[#087d68]">
          Application ID
        </p>
        <p
          className={`mt-0.5 font-mono text-[14px] font-bold text-[#002456] ${
            underlineNumber ? 'underline decoration-[#32c4a6] underline-offset-4' : ''
          }`}
        >
          {applicationNumber}
        </p>
      </div>
    </div>
  );
}
