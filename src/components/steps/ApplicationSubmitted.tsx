import mailIcon from '../../assets/mail-icon.svg';
import submittedCheck from '../../assets/submitted-check.svg';
import { ApplicationBanner } from '../ApplicationBanner';

interface ApplicationSubmittedProps {
  applicationNumber: string;
  workEmail: string;
  onOpenWorkspace: () => void;
}

export function ApplicationSubmitted({
  applicationNumber,
  workEmail,
  onOpenWorkspace,
}: ApplicationSubmittedProps) {
  return (
    <div className="max-w-[1380px] mx-auto px-4 sm:px-8 pt-10 pb-14">
      <ApplicationBanner applicationNumber={applicationNumber} />

      <div className="bg-white border border-[#c1c1c1] rounded-[11px] px-6 sm:px-14 py-9 sm:py-11">
        {/* Confirmation header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center size-[103px] rounded-full bg-[#dcffe5]">
            <div className="flex items-center justify-center size-[69px] rounded-full bg-[#16a34a]">
              <img
                src={submittedCheck}
                alt="Submitted"
                width={30}
                height={27}
                className="shrink-0"
              />
            </div>
          </div>

          <h2 className="mt-5 text-[28px] sm:text-[36px] font-semibold text-black leading-tight">
            Application Successfully Submitted !
          </h2>
          <p className="mt-2.5 text-[17px] sm:text-[20px] text-[#808080]">
            Your organization application has been received and submitted for review.
          </p>
        </div>

        <hr className="my-9 border-[#d9d9d9]" />

        {/* What happens next */}
        <div>
          <h3 className="text-[20px] font-medium text-[#0f0f0f]">What happens next?</h3>

          <div className="mt-7 space-y-6">
            {/* 1 */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className="text-[18px] text-black leading-7">1)</span>
                <div className="mt-2 w-px flex-1 bg-[#c1c1c1] min-h-[72px]" />
              </div>
              <div className="pb-2">
                <p className="text-[20px] font-semibold text-[#0f0f0f]">Application under review</p>
                <p className="mt-1.5 text-[18px] sm:text-[20px] font-medium text-[#808080]">
                  Our admin team will review your application and undergo the necessary verification
                  &amp; approval process
                </p>
                <span className="mt-3 inline-flex items-center justify-center rounded-[45px] bg-[#ffeedc] text-[#d97706] text-[16px] sm:text-[18px] px-5 py-2">
                  Current status
                </span>
              </div>
            </div>

            {/* 2 */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className="text-[18px] text-black leading-7">2)</span>
                <div className="mt-2 w-px flex-1 bg-[#c1c1c1] min-h-[72px]" />
              </div>
              <div className="pb-2">
                <p className="text-[20px] font-semibold text-[#0f0f0f]">Decision Notification</p>
                <p className="mt-1.5 text-[18px] sm:text-[20px] font-medium text-[#808080]">
                  We will notify you by email once a decision has been made.
                </p>
              </div>
            </div>

            {/* 3 */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className="text-[18px] text-black leading-7">3)</span>
              </div>
              <div>
                <p className="text-[20px] font-semibold text-[#0f0f0f]">Access IMDX Dashboard</p>
                <p className="mt-1.5 text-[18px] sm:text-[20px] font-medium text-[#808080]">
                  Once approved you will receive the instructions to securely access your dashboard.
                </p>
              </div>
            </div>
          </div>

          {/* Stay updated via email */}
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <img src={mailIcon} alt="" width={38} height={38} className="shrink-0 mt-0.5" />
              <div>
                <p className="text-[20px] font-semibold text-[#0f0f0f]">Stay updated via email</p>
                <p className="mt-1 text-[17px] sm:text-[20px] font-medium text-[#808080]">
                  Please check your registered work email
                  {workEmail ? ` (${workEmail})` : ''} for application updates.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenWorkspace}
              className="h-[52px] px-7 rounded-[45px] bg-[#32c4a6] hover:bg-[#2ab195] text-white text-[18px] font-semibold transition-colors cursor-pointer shrink-0"
            >
              Open IMDX Dashboard
            </button>
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-[17px] sm:text-[20px] text-[#808080]">
        Thank you for joining IMDX. We appreciate your interest in joining the mobility data
        exchange ecosystem.
      </p>
    </div>
  );
}
