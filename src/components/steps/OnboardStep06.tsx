import editIcon from '../../assets/edit-icon.svg';
import { POLICIES } from '../../data/onboardingConstants';
import type { DocumentSlotKey, OnboardingState } from '../../types/onboarding';
import { StepActions } from '../StepActions';

interface OnboardStep06Props {
  state: OnboardingState;
  onEditStep: (step: 1 | 2 | 4 | 5) => void;
  onBack: () => void;
  onSubmitApplication: () => void;
}

const DOC_REVIEW_LABELS: Array<{ key: DocumentSlotKey; label: string }> = [
  { key: 'incorporationCertificate', label: 'Incorporation Certificate' },
  { key: 'pan', label: 'PAN' },
  { key: 'gstCertificate', label: 'GST Certificate' },
  { key: 'authorizationLetter', label: 'Authorization Letter' },
];

export function OnboardStep06({
  state,
  onEditStep,
  onBack,
  onSubmitApplication,
}: OnboardStep06Props) {
  const { organization, representative, documents, acceptedPolicies } = state;
  const acceptedCount = POLICIES.filter((p) => acceptedPolicies[p.id]).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitApplication();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-5">
        <p className="imdx-kicker">IMDX / STEP 06</p>
        <h2 className="mt-0.5 text-[19px] sm:text-[21px] text-[#102529] leading-tight">
          Review Application
        </h2>
        <p className="mt-1 text-[13px] sm:text-[14px] text-[#59666d]">
          Review your application details carefully and ensure all information is accurate before
          submitting it for approval.
        </p>
      </div>

      <div className="space-y-4">
        {/* 1. Organization Details */}
        <section style={{ ['--stagger-i' as string]: 0 }} className="imdx-stagger-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[16px] sm:text-[17px] font-bold text-[#102529] flex items-center gap-2.5">
              <span className="imdx-gradient-text font-mono text-[13px]">01</span>
              Organization Details
            </h3>
            <button
              type="button"
              onClick={() => onEditStep(1)}
              className="p-1 rounded-md hover:bg-white/80 transition-colors cursor-pointer"
              aria-label="Edit Organization Details"
            >
              <img src={editIcon} alt="Edit" width={20} height={20} className="shrink-0" />
            </button>
          </div>
          <div className="imdx-card rounded-[12px] px-5 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-3.5 gap-x-6">
              <div>
                <p className="text-[12.5px] text-[#59666d]">Organization Name</p>
                <p className="mt-0.5 text-[14px] font-bold text-[#102529] break-words">
                  {organization.legalName || '—'}
                </p>
              </div>
              <div>
                <p className="text-[12.5px] text-[#59666d]">PAN</p>
                <p className="mt-0.5 text-[14px] font-bold text-[#102529] font-mono">
                  {organization.pan || '—'}
                </p>
              </div>
              <div>
                <p className="text-[12.5px] text-[#59666d]">GSTIN</p>
                <p className="mt-0.5 text-[14px] font-bold text-[#102529] font-mono">
                  {organization.gstin || 'Not provided'}
                </p>
              </div>
              <div className="md:col-span-3">
                <p className="text-[12.5px] text-[#59666d]">Registered Address</p>
                <p className="mt-0.5 text-[14px] font-bold text-[#102529]">
                  {organization.registeredAddress}
                  {organization.country ? `, ${organization.country}` : ''}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Authorized representative */}
        <section style={{ ['--stagger-i' as string]: 1 }} className="imdx-stagger-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[16px] sm:text-[17px] font-bold text-[#102529] flex items-center gap-2.5">
              <span className="imdx-gradient-text font-mono text-[13px]">02</span>
              Authorized representative
            </h3>
            <button
              type="button"
              onClick={() => onEditStep(2)}
              className="p-1 rounded-md hover:bg-white/80 transition-colors cursor-pointer"
              aria-label="Edit Authorized Representative"
            >
              <img src={editIcon} alt="Edit" width={20} height={20} className="shrink-0" />
            </button>
          </div>
          <div className="imdx-card rounded-[12px] px-5 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-3.5 gap-x-6">
              <div>
                <p className="text-[12.5px] text-[#59666d]">Name</p>
                <p className="mt-0.5 text-[14px] font-bold text-[#102529]">
                  {representative.name || '—'}
                </p>
              </div>
              <div>
                <p className="text-[12.5px] text-[#59666d]">Designation</p>
                <p className="mt-0.5 text-[14px] font-bold text-[#102529]">
                  {representative.designation || '—'}
                </p>
              </div>
              <div>
                <p className="text-[12.5px] text-[#59666d]">Email</p>
                <p className="mt-0.5 text-[14px] font-bold text-[#102529] break-all">
                  {representative.email || '—'}
                </p>
              </div>
              <div>
                <p className="text-[12.5px] text-[#59666d]">Phone Number</p>
                <p className="mt-0.5 text-[14px] font-bold text-[#102529]">
                  {representative.countryCode} {representative.phoneNumber || '—'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Documents */}
        <section style={{ ['--stagger-i' as string]: 2 }} className="imdx-stagger-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[16px] sm:text-[17px] font-bold text-[#102529] flex items-center gap-2.5">
              <span className="imdx-gradient-text font-mono text-[13px]">03</span>
              Documents
            </h3>
            <button
              type="button"
              onClick={() => onEditStep(4)}
              className="p-1 rounded-md hover:bg-white/80 transition-colors cursor-pointer"
              aria-label="Edit Documents"
            >
              <img src={editIcon} alt="Edit" width={20} height={20} className="shrink-0" />
            </button>
          </div>
          <div className="imdx-card rounded-[12px] px-5 py-4 space-y-2">
            {DOC_REVIEW_LABELS.map(({ key, label }) => {
              const doc = documents[key];
              return (
                <p key={key} className="text-[13.5px] sm:text-[14px] font-medium text-[#102529]">
                  <span className="text-[#59666d]">{label} : </span>
                  <span className="underline decoration-[#45c0b2] underline-offset-4">
                    {doc.fileName ? `${doc.fileName} · ${doc.fileSizeLabel}` : 'Not uploaded'}
                  </span>
                </p>
              );
            })}
          </div>
        </section>

        {/* 4. Policies Accepted */}
        <section style={{ ['--stagger-i' as string]: 3 }} className="imdx-stagger-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[16px] sm:text-[17px] font-bold text-[#102529] flex items-center gap-2.5">
              <span className="imdx-gradient-text font-mono text-[13px]">04</span>
              Policies Accepted
            </h3>
            <button
              type="button"
              onClick={() => onEditStep(5)}
              className="p-1 rounded-md hover:bg-white/80 transition-colors cursor-pointer"
              aria-label="Edit Policies Accepted"
            >
              <img src={editIcon} alt="Edit" width={20} height={20} className="shrink-0" />
            </button>
          </div>
          <div className="imdx-card rounded-[12px] px-5 py-4">
            <p className="text-[14px] font-semibold text-[#087d68]">
              {acceptedCount} of {POLICIES.length} policies accepted
            </p>
          </div>
        </section>
      </div>

      <StepActions
        onBack={onBack}
        nextLabel="Submit Application"
        nextWidthClass="min-w-[170px] px-7"
      />
    </form>
  );
}
