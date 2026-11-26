import imdxLogo from '../assets/imdx-logo.webp';

interface HeaderProps {
  onLogoClick: () => void;
  onTrackClick: () => void;
  onOpenWorkspace: () => void;
}

export function Header({ onLogoClick, onTrackClick, onOpenWorkspace }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 w-full bg-gradient-to-r from-[#001a3d] via-[#002456] to-[#035877] border-b border-[#45c0b2]/35 h-[56px] px-3 sm:px-6 flex items-center justify-between shadow-[0_8px_28px_-12px_rgba(0,36,86,0.45)]">
      <button
        type="button"
        onClick={onLogoClick}
        className="relative h-[42px] w-[114px] overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#45c0b2] rounded"
        aria-label="IMDX Home"
      >
        <img
          src={imdxLogo}
          alt="IMDX Logo"
          className="absolute h-[267.95%] left-0 top-[-79.91%] w-full max-w-none pointer-events-none"
        />
      </button>

      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={onOpenWorkspace}
          className="h-[32px] px-3.5 rounded-full border border-white/25 bg-white/10 hover:bg-white/20 text-white font-medium text-[13px] backdrop-blur-sm transition-all cursor-pointer whitespace-nowrap"
        >
          Workspace
        </button>

        <button
          type="button"
          onClick={onTrackClick}
          className="h-[32px] px-3.5 rounded-full bg-white/95 hover:bg-white text-[#002456] font-semibold text-[13px] transition-all cursor-pointer whitespace-nowrap shadow-sm"
        >
          Track my application
        </button>
      </div>
    </header>
  );
}
