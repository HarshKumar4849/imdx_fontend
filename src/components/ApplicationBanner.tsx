interface ApplicationBannerProps {
  applicationNumber: string;
  underlineNumber?: boolean;
}

export function ApplicationBanner({
  applicationNumber,
  underlineNumber = false,
}: ApplicationBannerProps) {
  return (
    <div className="mb-6">
      <h1 className="text-[24px] sm:text-[26px] font-semibold text-black leading-normal">
        Your Application
      </h1>
      <p className="mt-2 text-[16px] sm:text-[18px] text-[#808080] leading-relaxed">
        Your Application number is{' '}
        <span
          className={
            underlineNumber
              ? 'font-bold text-[#474545] underline decoration-solid underline-offset-4'
              : 'font-bold text-[#606060]'
          }
        >
          {applicationNumber}
        </span>
        . Keep it safe. You&apos;ll need it to access your application link and track your
        registration status.
      </p>
    </div>
  );
}
