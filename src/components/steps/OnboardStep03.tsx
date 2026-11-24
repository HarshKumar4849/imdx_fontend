import type { DeploymentOption } from '../../types/onboarding';
import { StepActions } from '../StepActions';

interface OnboardStep03Props {
  selected: DeploymentOption;
  onSelect: (option: DeploymentOption) => void;
  onBack: () => void;
  onNext: () => void;
}

export function OnboardStep03({ selected, onSelect, onBack, onNext }: OnboardStep03Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <h2 className="text-[24px] sm:text-[26px] font-semibold text-black leading-normal">
          Select your deployment preference
        </h2>
        <p className="mt-1.5 text-[16px] sm:text-[18px] text-[#808080]">
          Choose your preferred deployment option for joining the IMDX network.
        </p>
      </div>

      <div className="bg-white border border-[#c1c1c1] rounded-[11px] p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            type="button"
            onClick={() => onSelect('hosted')}
            className={`text-left rounded-[11px] px-7 py-6 transition-all cursor-pointer ${
              selected === 'hosted'
                ? 'bg-white border-2 border-[#32c4a6]'
                : 'bg-white border border-[#c1c1c1] hover:border-[#32c4a6]'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-[18px] font-medium text-[#0f0f0f]">Hosted By IMDX</h3>
                <p className="mt-1.5 text-[16px] sm:text-[18px] text-[#808080]">
                  IMDX builds and runs your workspace for you.
                </p>
              </div>
              <span className="shrink-0 inline-flex items-center justify-center rounded-[45px] bg-[#dcffe5] text-[#059669] text-[15px] sm:text-[16px] px-4 py-1">
                Available
              </span>
            </div>
          </button>

          <div
            aria-disabled="true"
            className="text-left rounded-[11px] px-7 py-6 bg-[#f8f8f8] border border-[#c1c1c1] cursor-not-allowed select-none"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-[18px] font-medium text-[#0f0f0f]">Self-Hosted</h3>
                <p className="mt-1.5 text-[16px] sm:text-[18px] text-[#808080]">
                  Run the connector on your own infrastructure
                </p>
              </div>
              <span className="shrink-0 inline-flex items-center justify-center rounded-[45px] bg-[#ffeedc] text-[#d97706] text-[15px] sm:text-[16px] px-4 py-1 whitespace-nowrap">
                Coming soon
              </span>
            </div>
          </div>
        </div>
      </div>

      <StepActions onBack={onBack} />
    </form>
  );
}
