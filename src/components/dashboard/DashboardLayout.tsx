import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import imdxLogoDark from '../../assets/imdx-logo-dark.webp';
import searchIcon from '../../assets/search-icon.svg';
import { isAgentHost } from '../../services/cygnusApi';
import type { AdminNavKey, NotificationItem, WorkspaceNavKey } from '../../types/dashboard';
import { updateCardSpotlight } from '../../utils/spotlight';
import { InternalBackdrop } from '../InternalBackdrop';

interface DashboardLayoutProps {
  portalMode: 'workspace' | 'admin';
  onPortalModeChange: (mode: 'workspace' | 'admin') => void;
  activeWorkspaceNav: WorkspaceNavKey;
  onWorkspaceNavChange: (nav: WorkspaceNavKey) => void;
  activeAdminNav: AdminNavKey;
  onAdminNavChange: (nav: AdminNavKey) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  userDisplayName: string;
  userRoleLabel?: string;
  pendingApplicationsCount?: number;
  onGoToLanding: () => void;
  onGoToOnboarding: () => void;
  isBackendLive?: boolean;
  isAuthenticated?: boolean;
  onSignInClick?: () => void;
  onSignOutClick?: () => void;
  children: ReactNode;
}

function SidebarIcon({ name, active }: { name: string; active: boolean }) {
  const stroke = active ? '#059669' : '#475569';
  const common = {
    width: 17,
    height: 17,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke,
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (name) {
    case 'dashboard':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case 'datasets':
    case 'participants':
      return (
        <svg {...common}>
          <ellipse cx="12" cy="5" rx="8" ry="3" />
          <path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
          <path d="M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
        </svg>
      );
    case 'catalog':
    case 'applications':
      return (
        <svg {...common}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case 'subscriptions':
    case 'policies':
      return (
        <svg {...common}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="8" y1="13" x2="16" y2="13" />
          <line x1="8" y1="17" x2="13" y2="17" />
        </svg>
      );
    case 'transfers':
    case 'audit-log':
      return (
        <svg {...common}>
          <polyline points="17 1 21 5 17 9" />
          <path d="M3 5h18" />
          <polyline points="7 23 3 19 7 15" />
          <path d="M21 19H3" />
        </svg>
      );
    case 'billing':
    case 'capacity':
      return (
        <svg {...common}>
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      );
    case 'purposes':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      );
    case 'verify-audit':
      return (
        <svg {...common}>
          <path d="M9 12l2 2 4-4" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
    case 'cluster-health':
      return (
        <svg {...common}>
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
  }
}

const WORKSPACE_NAV_ITEMS: Array<{ key: WorkspaceNavKey; label: string }> = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'datasets', label: 'My Datasets' },
  { key: 'catalog', label: 'Catalog' },
  { key: 'subscriptions', label: 'Subscriptions' },
  { key: 'transfers', label: 'Transfers' },
  { key: 'compute', label: 'Compute' },
  { key: 'billing', label: 'Billing' },
  { key: 'settings', label: 'Settings' },
];

const ADMIN_NAV_ITEMS: Array<{ key: AdminNavKey; label: string }> = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'participants', label: 'Participants' },
  { key: 'applications', label: 'Applications' },
  { key: 'policies', label: 'Policies' },
  { key: 'audit-log', label: 'Audit Logs' },
  { key: 'verify-audit', label: 'Verify Audit' },
  { key: 'purposes', label: 'Purposes' },
  { key: 'cluster-health', label: 'Cluster Health' },
  { key: 'capacity', label: 'Capacity' },
];

export function DashboardLayout({
  portalMode,
  onPortalModeChange,
  activeWorkspaceNav,
  onWorkspaceNavChange,
  activeAdminNav,
  onAdminNavChange,
  searchQuery,
  onSearchChange,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  userDisplayName,
  userRoleLabel,
  pendingApplicationsCount,
  onGoToLanding,
  onGoToOnboarding,
  isBackendLive,
  isAuthenticated,
  onSignInClick,
  onSignOutClick,
  children,
}: DashboardLayoutProps) {
  const showDemoSwitcher = !isAuthenticated && !isAgentHost();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSupportNotice, setShowSupportNotice] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showNotifications) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowNotifications(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showNotifications]);

  const activeRouteKey = `${portalMode}-${portalMode === 'workspace' ? activeWorkspaceNav : activeAdminNav}`;
  const unreadCount = notifications.filter((n) => !n.read).length;
  const initials =
    userDisplayName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'AM';

  return (
    <div
      onPointerMove={updateCardSpotlight}
      className={`min-h-screen imdx-internal-canvas imdx-has-sidebar flex flex-col${
        isSidebarCollapsed ? ' imdx-sidebar-collapsed' : ''
      }`}
    >
      <InternalBackdrop />
      {/* Top Clean Header */}
      <header className="h-[56px] w-full bg-gradient-to-r from-[#ebfcf8]/92 via-[#eff9fe]/92 to-[#ebf2ff]/92 backdrop-blur-md border-b border-[#008fc3]/18 px-3 sm:px-5 flex items-center justify-between gap-2.5 sticky top-0 z-30">
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() =>
              portalMode === 'admin'
                ? onAdminNavChange('dashboard')
                : onWorkspaceNavChange('dashboard')
            }
            className="relative h-[40px] w-[118px] overflow-hidden cursor-pointer shrink-0"
            aria-label={portalMode === 'admin' ? 'IMDX Admin Home' : 'IMDX Workspace Home'}
          >
            <img
              src={imdxLogoDark}
              alt="IMDX India Mobility Data Exchange"
              className="absolute h-[311.48%] left-0 top-[-116.43%] w-full max-w-none pointer-events-none"
            />
          </button>

          <button
            type="button"
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            className="hidden md:inline-flex items-center justify-center h-7 px-2 rounded-md border border-[#e2e8f0] text-[#475569] hover:bg-[#f8fafc] text-[12px] cursor-pointer"
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isSidebarCollapsed ? '»' : '«'}
          </button>
        </div>

        {/* Search Input */}
        <div className="hidden sm:flex relative flex-1 min-w-0 max-w-[230px] xl:max-w-[300px] h-[34px] items-center bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-3 gap-2 focus-within:border-[#008fa7] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#45c0b2]/15 transition-all">
          <img src={searchIcon} alt="" width={14} height={14} className="shrink-0 opacity-70" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={
              portalMode === 'admin'
                ? 'Search participants, applications, events...'
                : 'Search datasets, transfers, subscriptions...'
            }
            className="w-full min-w-0 bg-transparent text-[12.5px] text-[#0f0f0f] placeholder:text-[#94a3b8] focus:outline-none"
          />
        </div>

        {/* Right Controls: Portal Switcher + Bell + User Profile */}
        <div className="flex items-center gap-2 shrink-0">
          {showDemoSwitcher && (
            <div className="hidden lg:flex items-center rounded-full border border-[#e2e8f0] bg-[#f8fafc] p-0.5 text-[11.5px] gap-0.5">
              <button
                type="button"
                onClick={onGoToLanding}
                className="px-2.5 py-1 rounded-full font-medium text-[#475569] hover:text-[#102529] transition-colors cursor-pointer"
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => onPortalModeChange('workspace')}
                className={`px-2.5 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                  portalMode === 'workspace'
                    ? 'bg-[#002456] text-white shadow-xs'
                    : 'text-[#475569] hover:text-[#102529]'
                }`}
              >
                Workspace
              </button>
              <button
                type="button"
                onClick={() => onPortalModeChange('admin')}
                className={`px-2.5 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                  portalMode === 'admin'
                    ? 'bg-[#002456] text-white shadow-xs'
                    : 'text-[#475569] hover:text-[#102529]'
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={onGoToOnboarding}
                className="px-2.5 py-1 rounded-full font-medium text-[#008fa7] hover:bg-white transition-colors cursor-pointer"
              >
                Onboarding
              </button>
            </div>
          )}

          <div ref={notificationsRef} className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications((prev) => !prev)}
              className="relative flex items-center justify-center size-8 rounded-full hover:bg-[#f1f5f9] text-[#475569] cursor-pointer"
              aria-label="Notifications"
              aria-expanded={showNotifications}
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center size-4 rounded-full bg-[#ef4444] text-white text-[9.5px] font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="imdx-modal-panel imdx-modal-surface absolute right-0 mt-2 w-[min(320px,calc(100vw-24px))] rounded-[12px] p-3 text-[12px] z-50 space-y-2">
                <div className="flex items-center justify-between border-b border-[#008fc3]/15 pb-1.5">
                  <span className="font-semibold text-[#102529]">
                    Notifications ({unreadCount} unread)
                  </span>
                  <div className="flex items-center gap-2.5">
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          onMarkAllNotificationsRead();
                          setShowNotifications(false);
                        }}
                        className="text-[#059669] font-medium hover:underline cursor-pointer"
                      >
                        Mark all
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowNotifications(false)}
                      className="text-[#64748b] hover:text-[#102529] font-semibold px-1 cursor-pointer"
                      aria-label="Close notifications"
                    >
                      Close &times;
                    </button>
                  </div>
                </div>
                <div className="max-h-[240px] overflow-y-auto divide-y divide-[#008fc3]/10">
                  {notifications.length === 0 ? (
                    <p className="py-4 text-center text-[#64748b]">No notifications yet.</p>
                  ) : (
                    notifications.slice(0, 6).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onMarkNotificationRead(item.id);
                          if (item.targetNav) {
                            onPortalModeChange('workspace');
                            onWorkspaceNavChange(item.targetNav);
                          }
                          setShowNotifications(false);
                        }}
                        className={`w-full text-left py-2 px-1.5 rounded hover:bg-white/60 cursor-pointer transition-colors ${
                          item.read ? 'opacity-65' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-[#002456] truncate">{item.title}</span>
                          <span className="text-[10px] text-[#94a3b8] shrink-0">{item.timestamp}</span>
                        </div>
                        <p className="mt-0.5 text-[#475569] leading-snug">{item.detail}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pl-1">
            {onSignInClick && !isAuthenticated && (
              <button
                type="button"
                onClick={onSignInClick}
                className="h-[30px] px-3 rounded-full border border-[#008fa7]/40 bg-[#e5faf6] hover:bg-[#d2f5ee] text-[11.5px] font-semibold text-[#002456] cursor-pointer whitespace-nowrap"
              >
                {isBackendLive ? 'Sign In' : 'Cygnus Auth'}
              </button>
            )}
            {onSignOutClick && isAuthenticated && (
              <button
                type="button"
                onClick={onSignOutClick}
                className="h-[30px] px-3 rounded-full border border-[#cbd5e1] bg-white/85 hover:bg-[#f8fafc] text-[11.5px] font-semibold text-[#475569] cursor-pointer whitespace-nowrap"
              >
                Sign Out
              </button>
            )}
            <span className="flex items-center justify-center size-8 rounded-full bg-[#002456] text-white text-[11px] font-bold shrink-0">
              {initials}
            </span>
            <div className="hidden md:block leading-tight">
              <p className="text-[12.5px] font-semibold text-[#102529]">{userDisplayName}</p>
              <p className="text-[10.5px] text-[#64748b]">
                {userRoleLabel || (portalMode === 'admin' ? 'Governance Desk' : 'Organization Admin')}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile & Tablet Portal Switcher + Search Bar */}
      <div className="lg:hidden border-b border-[#008fc3]/15 bg-gradient-to-r from-[#ebfcf8]/95 via-[#eff9fe]/95 to-[#ebf2ff]/95 px-3 py-2 space-y-2">
        {showDemoSwitcher && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11.5px]">
            <button
              type="button"
              onClick={onGoToLanding}
              className="px-3 py-1 rounded-full border border-[#b4d7de] bg-white/80 font-medium text-[#475569] hover:text-[#102529] shrink-0 cursor-pointer"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => onPortalModeChange('workspace')}
              className={`px-3 py-1 rounded-full font-semibold shrink-0 cursor-pointer transition-all ${
                portalMode === 'workspace'
                  ? 'bg-[#002456] text-white shadow-xs'
                  : 'border border-[#b4d7de] bg-white/80 text-[#475569]'
              }`}
            >
              Workspace
            </button>
            <button
              type="button"
              onClick={() => onPortalModeChange('admin')}
              className={`px-3 py-1 rounded-full font-semibold shrink-0 cursor-pointer transition-all ${
                portalMode === 'admin'
                  ? 'bg-[#002456] text-white shadow-xs'
                  : 'border border-[#b4d7de] bg-white/80 text-[#475569]'
              }`}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={onGoToOnboarding}
              className="px-3 py-1 rounded-full border border-[#008fa7]/30 bg-white/80 font-medium text-[#008fa7] shrink-0 cursor-pointer"
            >
              Onboarding
            </button>
          </div>
        )}

        <div className="sm:hidden flex h-[34px] items-center bg-white/90 border border-[#b4d7de] rounded-[8px] px-3 gap-2 focus-within:border-[#008fa7]">
          <img src={searchIcon} alt="" width={14} height={14} className="shrink-0 opacity-70" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={
              portalMode === 'admin'
                ? 'Search participants, applications, events...'
                : 'Search datasets, transfers, subscriptions...'
            }
            className="w-full min-w-0 bg-transparent text-[12.5px] text-[#0f0f0f] placeholder:text-[#94a3b8] focus:outline-none"
          />
        </div>
      </div>

      <div className="flex flex-1 min-h-[calc(100vh-56px)]">
        {/* Left Sidebar */}
        <aside
          className={`bg-gradient-to-b from-[#ecfcf8]/92 via-[#eff8fe]/92 to-[#eaf2ff]/92 backdrop-blur-md border-r border-[#008fc3]/18 shrink-0 flex flex-col justify-between transition-all duration-200 ${
            isSidebarCollapsed ? 'w-[60px]' : 'w-[60px] md:w-[215px] lg:w-[230px]'
          }`}
        >
          <nav className="py-3 px-2 flex flex-col gap-1" aria-label="Workspace Navigation">
            {portalMode === 'workspace'
              ? WORKSPACE_NAV_ITEMS.map((item) => {
                  const isActive = activeWorkspaceNav === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => onWorkspaceNavChange(item.key)}
                      title={item.label}
                      className={`h-[38px] w-full flex items-center gap-3 px-3 rounded-[8px] transition-all cursor-pointer border-l-[3px] ${
                        isActive
                          ? 'bg-[#e9faf5] border-[#10b981] text-[#059669] font-semibold'
                          : 'border-transparent text-[#334155] hover:bg-[#f1f5f9] hover:text-[#102529]'
                      }`}
                    >
                      <span className="w-[18px] flex items-center justify-center shrink-0">
                        <SidebarIcon name={item.key} active={isActive} />
                      </span>
                      {!isSidebarCollapsed && (
                        <span className="hidden md:inline text-[13.5px] whitespace-nowrap">
                          {item.label}
                        </span>
                      )}
                    </button>
                  );
                })
              : ADMIN_NAV_ITEMS.map((item) => {
                  const isActive = activeAdminNav === item.key;
                  const showAppBadge =
                    item.key === 'applications' &&
                    typeof pendingApplicationsCount === 'number' &&
                    pendingApplicationsCount > 0;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => onAdminNavChange(item.key)}
                      title={item.label}
                      className={`h-[38px] w-full flex items-center justify-between gap-2 px-3 rounded-[8px] transition-all cursor-pointer border-l-[3px] ${
                        isActive
                          ? 'bg-[#e9faf5] border-[#10b981] text-[#059669] font-semibold'
                          : 'border-transparent text-[#334155] hover:bg-[#f1f5f9] hover:text-[#102529]'
                      }`}
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <span className="w-[18px] flex items-center justify-center shrink-0">
                          <SidebarIcon name={item.key} active={isActive} />
                        </span>
                        {!isSidebarCollapsed && (
                          <span className="hidden md:inline text-[13.5px] whitespace-nowrap truncate">
                            {item.label}
                          </span>
                        )}
                      </span>
                      {!isSidebarCollapsed && showAppBadge && (
                        <span className="hidden md:inline-flex items-center justify-center min-w-[22px] h-[20px] px-1.5 rounded-full bg-[#002456] text-white text-[11px] font-semibold">
                          {pendingApplicationsCount}
                        </span>
                      )}
                    </button>
                  );
                })}
          </nav>

          {/* Bottom Sidebar Footer matching screenshots */}
          {!isSidebarCollapsed && (
            <div className="hidden md:block p-3 border-t border-[#008fc3]/15 space-y-2">
              {portalMode === 'admin' ? (
                <>
                  <button
                    type="button"
                    onClick={() => onAdminNavChange('settings')}
                    className={`h-[36px] w-full flex items-center gap-3 px-3 rounded-[8px] transition-all cursor-pointer border-l-[3px] ${
                      activeAdminNav === 'settings'
                        ? 'bg-[#e9faf5] border-[#10b981] text-[#059669] font-semibold'
                        : 'border-transparent text-[#334155] hover:bg-[#f1f5f9] hover:text-[#102529]'
                    }`}
                  >
                    <span className="w-[18px] flex items-center justify-center shrink-0">
                      <SidebarIcon name="settings" active={activeAdminNav === 'settings'} />
                    </span>
                    <span className="text-[13.5px] whitespace-nowrap">Settings</span>
                  </button>
                  <div className="imdx-subbox rounded-[10px] px-3 py-2.5">
                    <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#102529]">
                      <span className="size-2 rounded-full bg-[#10b981]" />
                      <span>Platform operational</span>
                    </div>
                    <p className="mt-0.5 pl-3.5 text-[11px] text-[#64748b]">Production · IMDX</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="imdx-subbox rounded-[10px] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[#102529]">
                        <span className="text-[#008fa7]">☍</span> IMDX Network
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-medium text-[#059669]">
                        <span className="size-1.5 rounded-full bg-[#10b981]" />
                        Connected
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-[#64748b]">Provider + Consumer</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowSupportNotice((prev) => !prev)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-[12.5px] text-[#475569] hover:text-[#102529] cursor-pointer"
                  >
                    <span className="inline-flex items-center justify-center size-4 rounded-full border border-[#94a3b8] text-[10px]">
                      ?
                    </span>
                    <span>Help &amp; Support</span>
                  </button>
                  {showSupportNotice && (
                    <p className="px-2 text-[11px] text-[#059669]">
                      Desk: support@imdx.org · SLA 99.9%
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </aside>

        {/* Main Workspace Content */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-4 sm:py-5">
          <div key={activeRouteKey} className="max-w-[1120px] mx-auto imdx-stage-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
