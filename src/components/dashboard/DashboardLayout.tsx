import { useState } from 'react';
import type { ReactNode } from 'react';
import imdxLogoDark from '../../assets/imdx-logo-dark.png';
import navBilling from '../../assets/nav-billing.svg';
import navCatalog from '../../assets/nav-catalog.svg';
import navCompute from '../../assets/nav-compute.svg';
import navDashboard from '../../assets/nav-dashboard.svg';
import navDatasets from '../../assets/nav-datasets.svg';
import navSettings from '../../assets/nav-settings.svg';
import navSubscriptions from '../../assets/nav-subscriptions.svg';
import navTransfers from '../../assets/nav-transfers.svg';
import searchIcon from '../../assets/search-icon.svg';
import type { AdminNavKey, WorkspaceNavKey } from '../../types/dashboard';

interface DashboardLayoutProps {
  portalMode: 'workspace' | 'admin';
  onPortalModeChange: (mode: 'workspace' | 'admin') => void;
  activeWorkspaceNav: WorkspaceNavKey;
  onWorkspaceNavChange: (nav: WorkspaceNavKey) => void;
  activeAdminNav: AdminNavKey;
  onAdminNavChange: (nav: AdminNavKey) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onGoToOnboarding: () => void;
  children: ReactNode;
}

const WORKSPACE_NAV_ITEMS: Array<{
  key: WorkspaceNavKey;
  label: string;
  icon: string;
  width: number;
  height: number;
}> = [
  { key: 'dashboard', label: 'Dashboard', icon: navDashboard, width: 19.25, height: 19.25 },
  { key: 'datasets', label: 'My Datasets', icon: navDatasets, width: 16, height: 18 },
  { key: 'catalog', label: 'Catalog', icon: navCatalog, width: 18, height: 20 },
  { key: 'subscriptions', label: 'Subscriptions', icon: navSubscriptions, width: 22.5, height: 19.5 },
  { key: 'transfers', label: 'Transfers', icon: navTransfers, width: 18, height: 18 },
  { key: 'compute', label: 'Compute', icon: navCompute, width: 18, height: 20 },
  { key: 'billing', label: 'Billing', icon: navBilling, width: 19.5, height: 21.5 },
  { key: 'settings', label: 'Settings', icon: navSettings, width: 19, height: 19 },
];

const ADMIN_NAV_ITEMS: Array<{
  key: AdminNavKey;
  label: string;
  icon: string;
  width: number;
  height: number;
}> = [
  { key: 'dashboard', label: 'Dashboard', icon: navDashboard, width: 19.25, height: 19.25 },
  { key: 'participants', label: 'Participants', icon: navDatasets, width: 16, height: 18 },
  { key: 'applications', label: 'Applications', icon: navCatalog, width: 18, height: 20 },
  { key: 'policies', label: 'Policies', icon: navSubscriptions, width: 22.5, height: 19.5 },
  { key: 'audit-log', label: 'Audit Log', icon: navTransfers, width: 18, height: 18 },
  { key: 'purposes', label: 'Purposes', icon: navCompute, width: 18, height: 20 },
  { key: 'capacity', label: 'Capacity', icon: navBilling, width: 19.5, height: 21.5 },
  { key: 'settings', label: 'Settings', icon: navSettings, width: 19, height: 19 },
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
  onGoToOnboarding,
  children,
}: DashboardLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5f7fa] flex flex-col">
      {/* Top white header */}
      <header className="h-[71px] w-full bg-white border-b border-[#d3d3d3] px-3 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onWorkspaceNavChange('dashboard')}
            className="relative h-[50px] w-[156px] overflow-hidden cursor-pointer shrink-0"
            aria-label="IMDX Workspace Home"
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
            className="hidden md:inline-flex items-center justify-center h-9 px-2.5 rounded-lg border border-[#e2e8f0] text-[#475569] hover:bg-[#f8fafc] text-[13px] cursor-pointer"
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isSidebarCollapsed ? '»' : '«'}
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Role & flow switcher */}
          <div className="hidden sm:flex items-center rounded-full border border-[#e2e8f0] bg-[#f8fafc] p-0.5 text-[13px]">
            <button
              type="button"
              onClick={() => onPortalModeChange('workspace')}
              className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                portalMode === 'workspace'
                  ? 'bg-[#002456] text-white'
                  : 'text-[#475569] hover:text-[#0f0f0f]'
              }`}
            >
              Workspace
            </button>
            <button
              type="button"
              onClick={() => onPortalModeChange('admin')}
              className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                portalMode === 'admin'
                  ? 'bg-[#002456] text-white'
                  : 'text-[#475569] hover:text-[#0f0f0f]'
              }`}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={onGoToOnboarding}
              className="px-3 py-1 rounded-full font-medium text-[#002456] hover:bg-[#e2e8f0]/60 transition-colors cursor-pointer"
            >
              Onboarding
            </button>
          </div>

          <div className="relative w-[190px] sm:w-[280px] h-[40px] flex items-center bg-white border border-[#e2e8f0] rounded-[8px] px-3 gap-2 focus-within:border-[#002456]">
            <img src={searchIcon} alt="" width={17} height={17} className="shrink-0" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search dataset"
              className="w-full bg-transparent text-[14px] text-[#0f0f0f] placeholder:text-[#94a3b8] focus:outline-none"
            />
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-[calc(100vh-71px)]">
        {/* Left Navy Sidebar */}
        <aside
          className={`bg-[#002456] shrink-0 transition-all duration-200 ${
            isSidebarCollapsed ? 'w-[69px]' : 'w-[69px] md:w-[270px] lg:w-[305px]'
          }`}
        >
          <nav className="py-0 flex flex-col" aria-label="Workspace Navigation">
            {portalMode === 'workspace'
              ? WORKSPACE_NAV_ITEMS.map((item) => {
                  const isActive = activeWorkspaceNav === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => onWorkspaceNavChange(item.key)}
                      title={item.label}
                      className={`h-[53px] w-full flex items-center gap-4 px-6 transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[rgba(255,255,255,0.39)]'
                          : 'hover:bg-[rgba(255,255,255,0.12)]'
                      }`}
                    >
                      <span className="w-[22px] flex items-center justify-center shrink-0">
                        <img
                          src={item.icon}
                          alt=""
                          width={item.width}
                          height={item.height}
                          className="shrink-0"
                        />
                      </span>
                      {!isSidebarCollapsed && (
                        <span className="hidden md:inline text-[18px] text-[#fcfcfc] font-normal whitespace-nowrap">
                          {item.label}
                        </span>
                      )}
                    </button>
                  );
                })
              : ADMIN_NAV_ITEMS.map((item) => {
                  const isActive = activeAdminNav === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => onAdminNavChange(item.key)}
                      title={item.label}
                      className={`h-[53px] w-full flex items-center gap-4 px-6 transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[rgba(255,255,255,0.39)]'
                          : 'hover:bg-[rgba(255,255,255,0.12)]'
                      }`}
                    >
                      <span className="w-[22px] flex items-center justify-center shrink-0">
                        <img
                          src={item.icon}
                          alt=""
                          width={item.width}
                          height={item.height}
                          className="shrink-0"
                        />
                      </span>
                      {!isSidebarCollapsed && (
                        <span className="hidden md:inline text-[18px] text-[#fcfcfc] font-normal whitespace-nowrap">
                          {item.label}
                        </span>
                      )}
                    </button>
                  );
                })}
          </nav>
        </aside>

        {/* Main Workspace Content */}
        <main className="flex-1 min-w-0 px-5 sm:px-8 py-5 sm:py-6">{children}</main>
      </div>
    </div>
  );
}
