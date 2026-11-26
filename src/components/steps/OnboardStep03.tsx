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
      <div className="mb-4">
        <p className="imdx-kicker">IMDX / STEP 03</p>
        <h2 className="mt-0.5 text-[19px] sm:text-[21px] text-[#102529] leading-tight">
          Select your deployment preference
        </h2>
        <p className="mt-1 text-[13px] sm:text-[14px] text-[#59666d]">
          Choose your preferred deployment option for joining the IMDX network.
        </p>
      </div>

      <div className="imdx-card rounded-[14px] p-5 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => onSelect('hosted')}
            style={{ ['--stagger-i' as string]: 0 }}
            className={`imdx-stagger-card imdx-card-interactive text-left rounded-[12px] px-5 py-4 transition-all cursor-pointer ${
              selected === 'hosted'
                ? 'bg-gradient-to-br from-[#d9faf2] via-[#e4f5fe] to-[#dfecff] border-2 border-[#00a5c3] shadow-[0_10px_24px_-14px_rgba(0,165,195,0.45)]'
                : 'bg-gradient-to-br from-[#effcf9] via-[#eff8fe] to-[#edf4ff] border border-[#b4d7de] hover:border-[#00a5c3]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="imdx-kicker">01 / MANAGED WORKSPACE</p>
                <h3 className="mt-1 text-[16px] font-bold text-[#102529]">Hosted By IMDX</h3>
                <p className="mt-1 text-[13.5px] text-[#59666d]">
                  IMDX builds and runs your workspace for you.
                </p>
              </div>
              <span className="shrink-0 inline-flex items-center justify-center rounded-[45px] bg-[#dcffe5] text-[#059669] text-[12px] font-semibold px-3 py-0.5">
                Available
              </span>
            </div>
          </button>

          <div
            aria-disabled="true"
            className="text-left rounded-[12px] px-5 py-4 bg-gradient-to-br from-[#edf8f6] to-[#edf3fc] border border-[#c6dce2] cursor-not-allowed select-none opacity-85"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] tracking-[0.18em] text-[#7a8f93] uppercase font-bold">
                  02 / ON-PREMISE EDC
                </p>
                <h3 className="mt-1 text-[16px] font-bold text-[#102529]">Self-Hosted</h3>
                <p className="mt-1 text-[13.5px] text-[#59666d]">
                  Run the connector on your own infrastructure
                </p>
              </div>
              <span className="shrink-0 inline-flex items-center justify-center rounded-[45px] bg-[#ffeedc] text-[#d97706] text-[12px] font-semibold px-3 py-0.5 whitespace-nowrap">
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
