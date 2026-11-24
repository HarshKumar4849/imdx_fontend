import { useState } from 'react';
import type { OnboardingStage } from '../types/onboarding';

interface TrackApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationNumber: string;
  currentStage: OnboardingStage;
  workEmail: string;
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
  workEmail,
}: TrackApplicationModalProps) {
  const [lookupInput, setLookupInput] = useState(applicationNumber);
  const [lookupResult, setLookupResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = lookupInput.trim().toUpperCase();
    if (!normalized) {
      setLookupResult('Please enter an application number.');
      return;
    }
    if (normalized === applicationNumber) {
      setLookupResult(STAGE_LABEL[currentStage]);
    } else {
      setLookupResult(`No active application found for "${normalized}".`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="track-modal-title"
    >
      <div className="w-full max-w-[520px] rounded-[20px] bg-white border border-[#c1c1c1] p-6 sm:p-8 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="track-modal-title" className="text-[22px] font-semibold text-[#0f0f0f]">
              Track My Application
            </h2>
            <p className="mt-1 text-[15px] text-[#808080]">
              Enter your IMDX application number to check your current onboarding status.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#808080] hover:text-[#0f0f0f] text-[22px] leading-none px-2 py-1 cursor-pointer"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleLookup} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="track-app-number"
              className="block text-[15px] font-medium text-[#0f0f0f] mb-2"
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
              className="w-full h-[48px] rounded-[11px] border border-[#c1c1c1] px-4 text-[16px] text-[#0f0f0f] focus:outline-none focus:border-[#002456]"
            />
          </div>

          <div className="rounded-[12px] bg-[#f8f8f8] border border-[#e3e3e3] p-4 text-[14px] space-y-1">
            <div className="flex justify-between gap-2">
              <span className="text-[#808080]">Active Application:</span>
              <span className="font-semibold text-[#0f0f0f]">{applicationNumber}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-[#808080]">Status:</span>
              <span className="font-medium text-[#002456] text-right">
                {STAGE_LABEL[currentStage]}
              </span>
            </div>
            {workEmail && (
              <div className="flex justify-between gap-2">
                <span className="text-[#808080]">Work Email:</span>
                <span className="text-[#0f0f0f] truncate">{workEmail}</span>
              </div>
            )}
          </div>

          {lookupResult && (
            <p className="text-[14px] font-medium text-[#059669] bg-[#dcffe5] rounded-[10px] px-4 py-2.5">
              {lookupResult}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-[44px] px-6 rounded-[45px] border border-[#c1c1c1] bg-[#fcfcfc] text-[16px] font-semibold text-[#0f0f0f] hover:bg-[#f2f2f2] cursor-pointer"
            >
              Close
            </button>
            <button
              type="submit"
              className="h-[44px] px-6 rounded-[45px] bg-[#32c4a6] hover:bg-[#2ab195] text-[16px] font-semibold text-white cursor-pointer transition-colors"
            >
              Check Status
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
