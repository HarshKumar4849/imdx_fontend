import { useState } from 'react';
import mailIcon from '../../assets/mail-icon.svg';
import submittedCheck from '../../assets/submitted-check.svg';
import { imdxApi } from '../../services/imdxApi';
import type { ApplicationReviewStatus } from '../../types/dashboard';
import { ApplicationBanner } from '../ApplicationBanner';

interface ApplicationSubmittedProps {
  applicationNumber: string;
  workEmail: string;
  applicationStatus: ApplicationReviewStatus;
  reviewNote?: string;
  onOpenWorkspace: () => void;
}

export function ApplicationSubmitted({
  applicationNumber,
  workEmail,
  applicationStatus,
  reviewNote,
  onOpenWorkspace,
}: ApplicationSubmittedProps) {
  const isApproved = applicationStatus === 'Approved';
  const isChangesRequested = applicationStatus === 'Changes Requested';
  const [resubmitting, setResubmitting] = useState(false);
  const [resubmitNotice, setResubmitNotice] = useState('');

  const handleResubmit = async () => {
    setResubmitting(true);
    setResubmitNotice('');
    try {
      await imdxApi.resubmitApplication();
      setResubmitNotice('Application resubmitted to Governance Desk for review.');
    } catch (err) {
      setResubmitNotice(err instanceof Error ? err.message : 'Unable to resubmit right now.');
    } finally {
      setResubmitting(false);
    }
  };

  return (
    <div className="max-w-[940px] mx-auto px-4 sm:px-6 pt-5 pb-10">
      <ApplicationBanner applicationNumber={applicationNumber} />

      <div className="imdx-card rounded-[14px] overflow-hidden">
        <div className="imdx-rule-animate h-[3px] w-full bg-gradient-to-r from-[#45c0b2] via-[#00a5c3] to-[#3987cf]" />

        <div className="px-5 sm:px-8 py-6 sm:py-7">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center size-[68px] rounded-full bg-[#dcffe5] ring-6 ring-[#45c0b2]/15">
              <div className="flex items-center justify-center size-[46px] rounded-full bg-[#16a34a] shadow-md">
                <img
                  src={submittedCheck}
                  alt="Submitted"
                  width={22}
                  height={20}
                  className="shrink-0"
                />
              </div>
            </div>

            <p className="mt-3.5 imdx-kicker">IMDX / APPLICATION RECEIVED</p>
            <h2 className="mt-1 text-[22px] sm:text-[26px] text-[#102529] leading-tight">
              Application Successfully <span className="imdx-gradient-text">Submitted!</span>
            </h2>
            <p className="mt-1.5 text-[13.5px] sm:text-[14.5px] text-[#59666d]">
              Your organization application has been received and submitted for review.
            </p>
          </div>

          <hr className="my-5 border-[#0f766e]/15" />

          <div>
            <h3 className="text-[16px] font-bold text-[#102529]">What happens next?</h3>

            <div className="mt-4 space-y-4">
              <div className="flex gap-3.5">
                <div className="flex flex-col items-center">
                  <span className="imdx-gradient-text font-mono text-[13px] font-bold leading-6">
                    01
                  </span>
                  <div className="mt-1.5 w-[2px] flex-1 bg-gradient-to-b from-[#45c0b2] to-[#d4e5e2] min-h-[42px]" />
                </div>
                <div className="pb-1">
                  <p className="text-[15px] font-bold text-[#102529]">Application under review</p>
                  <p className="mt-0.5 text-[13.5px] text-[#59666d]">
                    Our admin team will review your application and undergo the necessary
                    verification &amp; approval process.
                  </p>
                  {applicationStatus === 'Under Review' && (
                    <span className="mt-2 inline-flex items-center justify-center rounded-[45px] bg-[#ffeedc] text-[#d97706] text-[12px] font-semibold px-3.5 py-1">
                      Current status
                    </span>
                  )}
                  {isChangesRequested && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center justify-center rounded-[45px] bg-[#fee2e2] text-[#dc2626] text-[12px] font-semibold px-3.5 py-1">
                        Changes requested{reviewNote ? `: ${reviewNote}` : ''}
                      </span>
                      <button
                        type="button"
                        onClick={handleResubmit}
                        disabled={resubmitting}
                        className="h-[28px] px-3.5 rounded-full bg-[#002456] text-white text-[11.5px] font-semibold cursor-pointer disabled:opacity-60"
                      >
                        {resubmitting ? 'Resubmitting…' : 'Resubmit Application'}
                      </button>
                      {resubmitNotice && (
                        <span className="text-[12px] font-medium text-[#059669]">
                          {resubmitNotice}
                        </span>
                      )}
                    </div>
                  )}
                  {isApproved && (
                    <span className="mt-2 inline-flex items-center justify-center rounded-[45px] bg-[#dcffe5] text-[#059669] text-[12px] font-semibold px-3.5 py-1">
                      Completed — Approved by Admin
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-3.5">
                <div className="flex flex-col items-center">
                  <span className="imdx-gradient-text font-mono text-[13px] font-bold leading-6">
                    02
                  </span>
                  <div className="mt-1.5 w-[2px] flex-1 bg-[#d4e5e2] min-h-[42px]" />
                </div>
                <div className="pb-1">
                  <p className="text-[15px] font-bold text-[#102529]">Decision Notification</p>
                  <p className="mt-0.5 text-[13.5px] text-[#59666d]">
                    We will notify you by email once a decision has been made.
                  </p>
                </div>
              </div>

              <div className="flex gap-3.5">
                <div className="flex flex-col items-center">
                  <span className="imdx-gradient-text font-mono text-[13px] font-bold leading-6">
                    03
                  </span>
                </div>
                <div>
                  <p className="text-[15px] font-bold text-[#102529]">Access IMDX Dashboard</p>
                  <p className="mt-0.5 text-[13.5px] text-[#59666d]">
                    Once approved you will receive the instructions to securely access your
                    dashboard.
                  </p>
                  {isApproved && (
                    <span className="mt-2 inline-flex items-center justify-center rounded-[45px] bg-[#dcffe5] text-[#059669] text-[12px] font-semibold px-3.5 py-1">
                      Current status — Workspace ready
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-[12px] border border-[#00a5c3]/20 bg-[#e5faf6]/60 p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <img src={mailIcon} alt="" width={28} height={28} className="shrink-0 mt-0.5" />
                <div>
                  <p className="text-[14.5px] font-bold text-[#102529]">Stay updated via email</p>
                  <p className="mt-0.5 text-[13px] text-[#59666d]">
                    Please check your registered work email
                    {workEmail ? ` (${workEmail})` : ''} for application updates.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenWorkspace}
                className="h-[38px] px-5 rounded-[45px] imdx-btn-primary text-[13.5px] font-semibold cursor-pointer shrink-0"
              >
                Open IMDX Dashboard →
              </button>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-[13.5px] text-[#59666d]">
        Thank you for joining IMDX. We appreciate your interest in joining the mobility data
        exchange ecosystem.
      </p>
    </div>
  );
}
