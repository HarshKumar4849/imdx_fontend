import { useEffect, useState } from 'react';
import { POLICIES } from '../../data/onboardingConstants';
import type { PolicyItem } from '../../types/onboarding';
import { ModalPortal } from '../ModalPortal';
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

  useEffect(() => {
    if (!activePolicy) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActivePolicy(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activePolicy]);

  const handlePolicyInteraction = (policy: PolicyItem) => {
    setError('');
    setActivePolicy(policy);
  };

  const handleCheckboxClick = (policy: PolicyItem) => {
    setError('');
    if (acceptedPolicies[policy.id]) {
      onChange({ ...acceptedPolicies, [policy.id]: false });
      return;
    }
    // Require opening and agreeing inside the policy document popup first
    setActivePolicy(policy);
  };

  const handleAgreePolicy = () => {
    if (!activePolicy) return;
    setError('');
    onChange({ ...acceptedPolicies, [activePolicy.id]: true });
    setActivePolicy(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allAccepted) {
      setError(
        `Please open and agree to each of the ${POLICIES.length} policies one by one (${acceptedCount} of ${POLICIES.length} agreed).`,
      );
      return;
    }
    onNext();
  };

  const activePolicyIndex = activePolicy
    ? POLICIES.findIndex((p) => p.id === activePolicy.id)
    : -1;
  const isCurrentActiveAccepted = activePolicy ? Boolean(acceptedPolicies[activePolicy.id]) : false;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="imdx-kicker">IMDX / STEP 05</p>
          <h2 className="mt-0.5 text-[19px] sm:text-[21px] text-[#102529] leading-tight">
            Accept Policies
          </h2>
          <p className="mt-1 text-[13px] sm:text-[14px] text-[#59666d]">
            Click each policy below to open its agreement document and click Agree one by one to
            proceed with your IMDX application.
          </p>
        </div>

        <span
          className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1 font-mono text-[11px] font-bold border ${
            allAccepted
              ? 'bg-[#dcffe5] text-[#087d68] border-[#16a34a]/30'
              : 'bg-white/80 text-[#002456] border-[#008fa7]/25'
          }`}
        >
          {acceptedCount} / {POLICIES.length} Policies Agreed
        </span>
      </div>

      <div className="imdx-card rounded-[14px] px-5 sm:px-6 py-1.5">
        <div className="divide-y divide-[#0f766e]/12">
          {POLICIES.map((policy, idx) => {
            const isAccepted = Boolean(acceptedPolicies[policy.id]);
            return (
              <div
                key={policy.id}
                onClick={() => handlePolicyInteraction(policy)}
                style={{ ['--stagger-i' as string]: idx }}
                className="imdx-stagger-row flex items-center justify-between gap-4 py-3 cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="imdx-gradient-text font-mono text-[12px] font-bold shrink-0">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handlePolicyInteraction(policy);
                    }}
                    className="text-left text-[14px] sm:text-[14.5px] font-medium text-[#002456] underline decoration-[#45c0b2] underline-offset-4 group-hover:text-[#008fa7] cursor-pointer"
                  >
                    {policy.title}
                  </button>
                </div>

                <input
                  type="checkbox"
                  aria-label={`Agree to ${policy.title}`}
                  checked={isAccepted}
                  onClick={(event) => event.stopPropagation()}
                  onChange={() => handleCheckboxClick(policy)}
                  className="size-[18px] shrink-0 rounded-[4px] border border-[#bfd8d4] accent-[#00a5c3] cursor-pointer"
                />
              </div>
            );
          })}
        </div>
      </div>

      {error && <p className="mt-4 text-[14px] text-[#dc2626]">{error}</p>}

      <StepActions onBack={onBack} />

      {activePolicy && (
        <ModalPortal>
          <div
            className="imdx-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-[#05080d]/60 backdrop-blur-xs px-4 py-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="policy-modal-title"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setActivePolicy(null);
              }
            }}
          >
          <div className="imdx-modal-panel imdx-modal-surface w-full max-w-[740px] rounded-[20px] overflow-hidden flex flex-col max-h-[90vh]">
            {/* PDF Viewer Style Top Toolbar */}
            <div className="bg-gradient-to-r from-[#002456] to-[#035877] px-5 sm:px-7 py-3.5 text-white flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="inline-flex items-center rounded bg-white/15 px-2 py-0.5 font-mono text-[11px] font-bold tracking-wider uppercase text-[#5eead4]">
                  PDF
                </span>
                <div className="min-w-0">
                  <p className="truncate font-mono text-[12px] text-white/90">
                    {activePolicy.docCode}
                  </p>
                  <p className="text-[11px] text-white/70">
                    Document {activePolicyIndex + 1} of {POLICIES.length} · {activePolicy.version} ·
                    Effective {activePolicy.effectiveDate}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActivePolicy(null)}
                className="text-white/80 hover:text-white text-[24px] leading-none px-2 py-0.5 cursor-pointer"
                aria-label="Close policy document"
              >
                &times;
              </button>
            </div>

            {/* Scrollable Document Sheet */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-gradient-to-br from-[#dff6f1] via-[#e4f2fb] to-[#dfe9fa]">
              <div className="bg-gradient-to-br from-[#f8fefe] via-[#f6fbff] to-[#f4f8ff] border border-[#b4d7de] rounded-[12px] shadow-sm px-6 sm:px-9 py-7 sm:py-8">
                <div className="border-b border-[#e2e8f0] pb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="imdx-kicker">IMDX GOVERNANCE FRAMEWORK</p>
                    <h3
                      id="policy-modal-title"
                      className="mt-1 text-[22px] sm:text-[25px] font-bold text-[#102529]"
                    >
                      {activePolicy.title}
                    </h3>
                  </div>
                  <span className="rounded-full bg-[#eefaf7] border border-[#45c0b2]/35 px-3 py-1 font-mono text-[11px] font-semibold text-[#087d68]">
                    {activePolicy.docCode}
                  </span>
                </div>

                <p className="mt-4 text-[15px] leading-relaxed text-[#334155] font-medium">
                  {activePolicy.summary}
                </p>

                <div className="mt-5 space-y-4">
                  {activePolicy.sections.map((section) => (
                    <section key={section.heading}>
                      <h4 className="text-[15px] font-bold text-[#002456]">{section.heading}</h4>
                      <p className="mt-1 text-[14px] leading-relaxed text-[#475569]">
                        {section.body}
                      </p>
                    </section>
                  ))}
                </div>

                <div className="mt-6 rounded-[10px] border border-[#0f766e]/15 bg-[#f4fbfa] px-4 py-3 text-[13px] text-[#475569]">
                  By clicking <strong className="text-[#102529]">Agree</strong> below, your
                  authorized representative confirms that your organization has read and accepts the{' '}
                  <strong className="text-[#102529]">{activePolicy.title}</strong> (
                  {activePolicy.version}) as part of IMDX onboarding.
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="bg-gradient-to-r from-[#ecfcf8] via-[#eff8fe] to-[#ecf3ff] border-t border-[#b4d7de] px-5 sm:px-7 py-4 flex flex-wrap items-center justify-between gap-3">
              <span className="text-[13px] text-[#59666d]">
                {isCurrentActiveAccepted
                  ? 'You have agreed to this policy.'
                  : 'Review the document above and click Agree to confirm.'}
              </span>
              <div className="flex items-center gap-3 ml-auto">
                <button
                  type="button"
                  onClick={() => setActivePolicy(null)}
                  className="h-[42px] px-5 rounded-[45px] border border-[#bfd8d4] bg-white text-[14px] font-semibold text-[#102529] hover:bg-[#e5faf6] cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleAgreePolicy}
                  className="h-[42px] px-6 rounded-[45px] imdx-btn-primary text-[14px] font-semibold cursor-pointer"
                >
                  {isCurrentActiveAccepted ? 'Agreed ✓' : 'Agree'}
                </button>
              </div>
            </div>
          </div>
          </div>
        </ModalPortal>
      )}
    </form>
  );
}
