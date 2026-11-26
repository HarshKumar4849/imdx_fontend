import { useState } from 'react';
import { cygnusApi, isPlatformConfigured } from '../services/cygnusApi';
import type { ApplicationReviewStatus } from '../types/dashboard';
import type { OnboardingStage } from '../types/onboarding';
import { ModalPortal } from './ModalPortal';

interface TrackApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationNumber: string;
  currentStage: OnboardingStage;
  applicationStatus: ApplicationReviewStatus;
  reviewNote?: string;
  workEmail: string;
  onOpenWorkspace?: () => void;
}

const STAGE_LABEL: Record<OnboardingStage, string> = {
  register: 'Not Started (Registration Pending)',
  1: 'In Progress — Step 1: Organization Onboarding',
  2: 'In Progress — Step 2: Authorized Representative',
  3: 'In Progress — Step 3: Deployment Preference',
  4: 'In Progress — Step 4: Document Verification',
  5: 'In Progress — Step 5: Policy Acceptance',
  6: 'In Progress — Step 6: Review & Submit',
  submitted: 'Application Under Review',
};

export function TrackApplicationModal({
  isOpen,
  onClose,
  applicationNumber,
  currentStage,
  applicationStatus,
  reviewNote,
  workEmail,
  onOpenWorkspace,
}: TrackApplicationModalProps) {
  const [lookupInput, setLookupInput] = useState(applicationNumber);
  const [lookupResult, setLookupResult] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  if (!isOpen) return null;

  const resolvedStatusLabel =
    currentStage === 'submitted'
      ? applicationStatus === 'Approved'
        ? 'Approved — Workspace Provisioned'
        : applicationStatus === 'Changes Requested'
          ? 'Changes Requested by Admin'
          : 'Application Under Review'
      : STAGE_LABEL[currentStage];

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = lookupInput.trim().toUpperCase();
    if (!normalized) {
      setLookupResult('Please enter an application number.');
      return;
    }

    if (isPlatformConfigured() && workEmail) {
      setChecking(true);
      try {
        await cygnusApi.trackApplication({ number: normalized, email: workEmail });
        setLookupResult(
          `Tracking request submitted for ${normalized}. Check ${workEmail} for your private status link.`,
        );
        return;
      } catch (err) {
        setLookupResult(err instanceof Error ? err.message : 'Unable to check status right now.');
        return;
      } finally {
        setChecking(false);
      }
    }

    if (normalized === applicationNumber) {
      setLookupResult(resolvedStatusLabel);
    } else {
      setLookupResult(`No active application found for "${normalized}".`);
    }
  };

  return (
    <ModalPortal>
      <div
        className="imdx-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-[#05080d]/55 backdrop-blur-xs p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="track-modal-title"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
      <div className="imdx-modal-panel imdx-modal-surface w-full max-w-[440px] rounded-[14px] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="imdx-kicker">IMDX / APPLICATION TRACKER</p>
            <h2 id="track-modal-title" className="mt-0.5 text-[19px] text-[#102529]">
              Track My Application
            </h2>
            <p className="mt-1 text-[13px] text-[#59666d]">
              Enter your IMDX application number to check your current onboarding status.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#808080] hover:text-[#0f0f0f] text-[20px] leading-none px-1.5 py-0.5 cursor-pointer"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleLookup} className="mt-4 space-y-3.5">
          <div>
            <label
              htmlFor="track-app-number"
              className="block text-[13px] font-medium text-[#0f0f0f] mb-1.5"
            >
              Application Number
            </label>
            <input
              id="track-app-number"
              type="text"
              value={lookupInput}
              onChange={(e) => {
                setLookupInput(e.target.value);
                setLookupResult(null);
              }}
              placeholder="e.g. ZW4C-9CDM-UC84"
              className="w-full h-[40px] rounded-[9px] border border-[#c5dbd8] bg-white px-3.5 text-[14px] text-[#0f0f0f] focus:outline-none focus:border-[#008fa7] focus:ring-4 focus:ring-[#45c0b2]/15"
            />
          </div>

          <div className="rounded-[10px] bg-[#f8f8f8] border border-[#e3e3e3] p-3 text-[13px] space-y-1">
            <div className="flex justify-between gap-2">
              <span className="text-[#808080]">Active Application:</span>
              <span className="font-semibold text-[#0f0f0f]">{applicationNumber}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-[#808080]">Status:</span>
              <span className="font-medium text-[#002456] text-right">{resolvedStatusLabel}</span>
            </div>
            {reviewNote && currentStage === 'submitted' && (
              <div className="flex justify-between gap-2">
                <span className="text-[#808080]">Reviewer Note:</span>
                <span className="text-[#0f0f0f] text-right">{reviewNote}</span>
              </div>
            )}
            {workEmail && (
              <div className="flex justify-between gap-2">
                <span className="text-[#808080]">Work Email:</span>
                <span className="text-[#0f0f0f] truncate">{workEmail}</span>
              </div>
            )}
          </div>

          {lookupResult && (
            <p className="text-[13px] font-medium text-[#059669] bg-[#dcffe5] rounded-[8px] px-3.5 py-2">
              {lookupResult}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-2.5 pt-1">
            {onOpenWorkspace && (currentStage === 'submitted' || applicationStatus === 'Approved') && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenWorkspace();
                }}
                className="h-[38px] px-4 rounded-[45px] border border-[#008fa7]/35 bg-[#e5faf6] text-[13px] font-semibold text-[#002456] hover:bg-[#d3f5ee] cursor-pointer"
              >
                Open Workspace
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="h-[38px] px-5 rounded-[45px] border border-[#c1c1c1] bg-[#fcfcfc] text-[13.5px] font-semibold text-[#0f0f0f] hover:bg-[#f2f2f2] cursor-pointer"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={checking}
              className="h-[38px] px-5 rounded-[45px] imdx-btn-primary text-[13.5px] font-semibold cursor-pointer disabled:opacity-60"
            >
              {checking ? 'Checking…' : 'Check Status'}
            </button>
          </div>
        </form>
      </div>
      </div>
    </ModalPortal>
  );
}
