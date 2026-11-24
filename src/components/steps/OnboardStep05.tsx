import { useState } from 'react';
import { POLICIES } from '../../data/onboardingConstants';
import type { PolicyItem } from '../../types/onboarding';
import { StepActions } from '../StepActions';

interface OnboardStep05Props {
  acceptedPolicies: Record<string, boolean>;
  onChange: (next: Record<string, boolean>) => void;
  onBack: () => void;
  onNext: () => void;
}

export function OnboardStep05({
  acceptedPolicies,
  onChange,
  onBack,
  onNext,
}: OnboardStep05Props) {
  const [activePolicy, setActivePolicy] = useState<PolicyItem | null>(null);
  const [error, setError] = useState('');

  const acceptedCount = POLICIES.filter((p) => acceptedPolicies[p.id]).length;
  const allAccepted = acceptedCount === POLICIES.length;

  const togglePolicy = (id: string) => {
    setError('');
    onChange({ ...acceptedPolicies, [id]: !acceptedPolicies[id] });
  };

  const handleToggleAll = () => {
    setError('');
    const nextValue = !allAccepted;
    onChange(Object.fromEntries(POLICIES.map((p) => [p.id, nextValue])));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allAccepted) {
      setError(`Please review and accept all ${POLICIES.length} policies (${acceptedCount} of ${POLICIES.length} accepted).`);
      return;
    }
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-[24px] sm:text-[26px] font-semibold text-black leading-normal">
            Accept Policies
          </h2>
          <p className="mt-1.5 text-[16px] sm:text-[18px] text-[#808080]">
            Please review and agree to the required terms and policies to proceed with your IMDX
            application.
          </p>
        </div>

        <button
          type="button"
          onClick={handleToggleAll}
          className="text-[15px] font-medium text-[#002456] hover:underline cursor-pointer"
        >
          {allAccepted ? 'Uncheck all' : 'Accept all policies'}
        </button>
      </div>

      <div className="bg-white border border-[#c1c1c1] rounded-[20px] px-6 sm:px-10 py-3">
        <div className="divide-y divide-[#c1c1c1]/60">
          {POLICIES.map((policy, idx) => (
            <div
              key={policy.id}
              className="flex items-center justify-between gap-4 py-5"
            >
              <button
                type="button"
                onClick={() => setActivePolicy(policy)}
                className={`text-left text-[17px] sm:text-[18px] underline underline-offset-4 hover:opacity-80 cursor-pointer ${
                  idx === 0 ? 'text-[#002456]' : 'text-[#0f0f0f]'
                }`}
              >
                {policy.title}
              </button>

              <input
                type="checkbox"
                aria-label={`Accept ${policy.title}`}
                checked={Boolean(acceptedPolicies[policy.id])}
                onChange={() => togglePolicy(policy.id)}
                className="size-[30px] shrink-0 rounded-[5px] border border-[#a29f9f] accent-[#32c4a6] cursor-pointer"
              />
            </div>
          ))}
        </div>
      </div>

      {error && <p className="mt-4 text-[14px] text-[#dc2626]">{error}</p>}

      <StepActions onBack={onBack} />

      {activePolicy && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="policy-modal-title"
        >
          <div className="w-full max-w-[560px] rounded-[20px] bg-white border border-[#c1c1c1] p-6 sm:p-8 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <h3 id="policy-modal-title" className="text-[22px] font-semibold text-[#0f0f0f]">
                {activePolicy.title}
              </h3>
              <button
                type="button"
                onClick={() => setActivePolicy(null)}
                className="text-[#808080] hover:text-[#0f0f0f] text-[22px] leading-none px-2 py-1 cursor-pointer"
                aria-label="Close policy preview"
              >
                &times;
              </button>
            </div>
            <p className="mt-4 text-[16px] leading-relaxed text-[#474545]">{activePolicy.summary}</p>
            <p className="mt-3 text-[14px] text-[#808080]">
              By checking this policy, your authorized representative confirms your organization&apos;s
              compliance with the {activePolicy.title} as part of IMDX onboarding.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setActivePolicy(null)}
                className="h-[44px] px-6 rounded-[45px] border border-[#c1c1c1] bg-[#fcfcfc] text-[16px] font-semibold text-[#0f0f0f] hover:bg-[#f2f2f2] cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  onChange({ ...acceptedPolicies, [activePolicy.id]: true });
                  setActivePolicy(null);
                }}
                className="h-[44px] px-6 rounded-[45px] bg-[#32c4a6] hover:bg-[#2ab195] text-[16px] font-semibold text-white cursor-pointer"
              >
                Agree &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
