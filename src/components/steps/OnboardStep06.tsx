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
      <div className="mb-8">
        <h2 className="text-[24px] sm:text-[26px] font-semibold text-black leading-normal">
          Review Application
        </h2>
        <p className="mt-1.5 text-[16px] sm:text-[18px] text-[#808080]">
          Review your application details carefully and ensure all information is accurate before
          submitting it for approval.
        </p>
      </div>

      <div className="space-y-8">
        {/* 1. Organization Details */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[22px] sm:text-[24px] font-semibold text-black">
              1. Organization Details
            </h3>
            <button
              type="button"
              onClick={() => onEditStep(1)}
              className="p-1.5 rounded-md hover:bg-[#ededed] transition-colors cursor-pointer"
              aria-label="Edit Organization Details"
            >
              <img src={editIcon} alt="Edit" width={32} height={32} className="shrink-0" />
            </button>
          </div>
          <div className="bg-white border border-[#c1c1c1] rounded-[11px] px-7 py-7">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 gap-x-8">
              <div>
                <p className="text-[17px] sm:text-[18px] text-[#808080]">Organization Name</p>
                <p className="mt-1 text-[17px] sm:text-[18px] font-bold text-black break-words">
                  {organization.legalName || '—'}
                </p>
              </div>
              <div>
                <p className="text-[17px] sm:text-[18px] text-[#808080]">PAN</p>
                <p className="mt-1 text-[17px] sm:text-[18px] font-bold text-black">
                  {organization.pan || '—'}
                </p>
              </div>
              <div>
                <p className="text-[17px] sm:text-[18px] text-[#808080]">GSTIN</p>
                <p className="mt-1 text-[17px] sm:text-[18px] font-bold text-black">
                  {organization.gstin || 'Not provided'}
                </p>
              </div>
              <div className="md:col-span-3">
                <p className="text-[17px] sm:text-[18px] text-[#808080]">Registered Address</p>
                <p className="mt-1 text-[17px] sm:text-[18px] font-bold text-black">
                  {organization.registeredAddress}
                  {organization.country ? `, ${organization.country}` : ''}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Authorized representative */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[22px] sm:text-[24px] font-semibold text-black">
              2. Authorized representative
            </h3>
            <button
              type="button"
              onClick={() => onEditStep(2)}
              className="p-1.5 rounded-md hover:bg-[#ededed] transition-colors cursor-pointer"
              aria-label="Edit Authorized Representative"
            >
              <img src={editIcon} alt="Edit" width={32} height={32} className="shrink-0" />
            </button>
          </div>
          <div className="bg-white border border-[#c1c1c1] rounded-[11px] px-7 py-7">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 gap-x-8">
              <div>
                <p className="text-[17px] sm:text-[18px] text-[#808080]">Name</p>
                <p className="mt-1 text-[17px] sm:text-[18px] font-bold text-black">
                  {representative.name || '—'}
                </p>
              </div>
              <div>
                <p className="text-[17px] sm:text-[18px] text-[#808080]">Designation</p>
                <p className="mt-1 text-[17px] sm:text-[18px] font-bold text-black">
                  {representative.designation || '—'}
                </p>
              </div>
              <div>
                <p className="text-[17px] sm:text-[18px] text-[#808080]">Email</p>
                <p className="mt-1 text-[17px] sm:text-[18px] font-bold text-black break-all">
                  {representative.email || '—'}
                </p>
              </div>
              <div>
                <p className="text-[17px] sm:text-[18px] text-[#808080]">Phone Number</p>
                <p className="mt-1 text-[17px] sm:text-[18px] font-bold text-black">
                  {representative.countryCode} {representative.phoneNumber || '—'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Documents */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[22px] sm:text-[24px] font-semibold text-black">3. Documents</h3>
            <button
              type="button"
              onClick={() => onEditStep(4)}
              className="p-1.5 rounded-md hover:bg-[#ededed] transition-colors cursor-pointer"
              aria-label="Edit Documents"
            >
              <img src={editIcon} alt="Edit" width={32} height={32} className="shrink-0" />
            </button>
          </div>
          <div className="bg-white border border-[#c1c1c1] rounded-[11px] px-7 py-7 space-y-3">
            {DOC_REVIEW_LABELS.map(({ key, label }) => {
              const doc = documents[key];
              return (
                <p key={key} className="text-[17px] sm:text-[18px] font-medium text-[#0f0f0f]">
                  <span className="text-[#808080]">{label} : </span>
                  <span className="underline underline-offset-4">
                    {doc.fileName ? `${doc.fileName} · ${doc.fileSizeLabel}` : 'Not uploaded'}
                  </span>
                </p>
              );
            })}
          </div>
        </section>

        {/* 4. Policies Accepted */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[22px] sm:text-[24px] font-semibold text-black">
              4. Policies Accepted
            </h3>
            <button
              type="button"
              onClick={() => onEditStep(5)}
              className="p-1.5 rounded-md hover:bg-[#ededed] transition-colors cursor-pointer"
              aria-label="Edit Policies Accepted"
            >
              <img src={editIcon} alt="Edit" width={32} height={32} className="shrink-0" />
            </button>
          </div>
          <div className="bg-white border border-[#c1c1c1] rounded-[11px] px-7 py-8">
            <p className="text-[18px] font-medium text-[#0f0f0f]">
              {acceptedCount} of {POLICIES.length}
            </p>
          </div>
        </section>
      </div>

      <StepActions
        onBack={onBack}
        nextLabel="Submit Application"
        nextWidthClass="w-[260px] sm:w-[291px]"
      />
    </form>
  );
}
