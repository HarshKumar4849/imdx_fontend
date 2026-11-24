import imdxLogo from '../assets/imdx-logo.png';

interface HeaderProps {
  onLogoClick: () => void;
  onTrackClick: () => void;
  onOpenWorkspace: () => void;
}

export function Header({ onLogoClick, onTrackClick, onOpenWorkspace }: HeaderProps) {
  return (
    <header className="w-full bg-[#002456] h-[71px] px-3 sm:px-6 flex items-center justify-between">
      <button
        type="button"
        onClick={onLogoClick}
        className="relative h-[57px] w-[152px] overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#32c4a6] rounded"
        aria-label="IMDX Home"
      >
        <img
          src={imdxLogo}
          alt="IMDX Logo"
          className="absolute h-[267.95%] left-0 top-[-79.91%] w-full max-w-none pointer-events-none"
        />
      </button>

      <div className="flex items-center gap-4 sm:gap-6">
        <button
          type="button"
          onClick={onOpenWorkspace}
          className="text-white/90 hover:text-[#32c4a6] font-medium text-[15px] sm:text-[16px] transition-colors cursor-pointer whitespace-nowrap"
        >
          Workspace
        </button>

        <button
          type="button"
          onClick={onTrackClick}
          className="text-white font-semibold text-[16px] sm:text-[18px] hover:text-[#32c4a6] transition-colors cursor-pointer whitespace-nowrap px-2 py-1"
        >
          Track my application
        </button>
      </div>
    </header>
  );
}
