import { lazy, Suspense, useEffect, useState } from 'react';
import { HomeHero } from './components/landing/HomeHero';
import { CATALOG_OFFERS } from './data/dashboardData';
import {
  clearLocalStore,
  createInitialStore,
  cygnusApi,
  imdxApi,
  isAgentHost,
  isBackendConfigured,
  isPlatformConfigured,
  loadAdminSession,
  loadLocalStore,
  loadUserSession,
  persistLocalStore,
  saveAdminSession,
  saveApplicationToken,
  saveUserSession,
} from './services/imdxApi';
import type { PersistedAdminSession, PersistedUserSession } from './services/cygnusApi';

import { AuthModal, AuthStandalonePage, type AuthScreenView } from './components/AuthModal';
import { PublicPoliciesView } from './components/PublicPoliciesView';

const ApplicationBanner = lazy(() =>
  import('./components/ApplicationBanner').then((m) => ({ default: m.ApplicationBanner })),
);
const Header = lazy(() => import('./components/Header').then((m) => ({ default: m.Header })));
const InternalBackdrop = lazy(() =>
  import('./components/InternalBackdrop').then((m) => ({ default: m.InternalBackdrop })),
);
const StepProgress = lazy(() =>
  import('./components/StepProgress').then((m) => ({ default: m.StepProgress })),
);
const TrackApplicationModal = lazy(() =>
  import('./components/TrackApplicationModal').then((m) => ({ default: m.TrackApplicationModal })),
);
const AdminDashboardView = lazy(() =>
  import('./components/dashboard/AdminDashboardView').then((m) => ({
    default: m.AdminDashboardView,
  })),
);
const CatalogPage = lazy(() =>
  import('./components/dashboard/CatalogPage').then((m) => ({ default: m.CatalogPage })),
);
const DashboardLayout = lazy(() =>
  import('./components/dashboard/DashboardLayout').then((m) => ({ default: m.DashboardLayout })),
);
const DashboardOverview = lazy(() =>
  import('./components/dashboard/DashboardOverview').then((m) => ({
    default: m.DashboardOverview,
  })),
);
const MyDatasetsPage = lazy(() =>
  import('./components/dashboard/MyDatasetsPage').then((m) => ({ default: m.MyDatasetsPage })),
);
const RegisterDatasetModal = lazy(() =>
  import('./components/dashboard/RegisterDatasetModal').then((m) => ({
    default: m.RegisterDatasetModal,
  })),
);
const BillingPage = lazy(() =>
  import('./components/dashboard/WorkspaceSubPages').then((m) => ({ default: m.BillingPage })),
);
const ComputePage = lazy(() =>
  import('./components/dashboard/WorkspaceSubPages').then((m) => ({ default: m.ComputePage })),
);
const SettingsPage = lazy(() =>
  import('./components/dashboard/WorkspaceSubPages').then((m) => ({ default: m.SettingsPage })),
);
const SubscriptionsPage = lazy(() =>
  import('./components/dashboard/WorkspaceSubPages').then((m) => ({
    default: m.SubscriptionsPage,
  })),
);
const TransfersPage = lazy(() =>
  import('./components/dashboard/WorkspaceSubPages').then((m) => ({ default: m.TransfersPage })),
);
const ApplicationSubmitted = lazy(() =>
  import('./components/steps/ApplicationSubmitted').then((m) => ({
    default: m.ApplicationSubmitted,
  })),
);
const OnboardStep01 = lazy(() =>
  import('./components/steps/OnboardStep01').then((m) => ({ default: m.OnboardStep01 })),
);
const OnboardStep02 = lazy(() =>
  import('./components/steps/OnboardStep02').then((m) => ({ default: m.OnboardStep02 })),
);
const OnboardStep03 = lazy(() =>
  import('./components/steps/OnboardStep03').then((m) => ({ default: m.OnboardStep03 })),
);
const OnboardStep04 = lazy(() =>
  import('./components/steps/OnboardStep04').then((m) => ({ default: m.OnboardStep04 })),
);
const OnboardStep05 = lazy(() =>
  import('./components/steps/OnboardStep05').then((m) => ({ default: m.OnboardStep05 })),
);
const OnboardStep06 = lazy(() =>
  import('./components/steps/OnboardStep06').then((m) => ({ default: m.OnboardStep06 })),
);
const RegisterScreen = lazy(() =>
  import('./components/steps/RegisterScreen').then((m) => ({ default: m.RegisterScreen })),
);

function RouteLoadingFallback() {
  return (
    <div className="min-h-screen imdx-internal-canvas flex items-center justify-center p-6 text-[#002456]">
      <div className="imdx-card rounded-[14px] px-5 py-3.5 flex items-center gap-3">
        <span className="size-4 rounded-full border-2 border-[#00a5c3] border-t-transparent animate-spin" />
        <span className="text-[13.5px] font-medium">Loading IMDX…</span>
      </div>
    </div>
  );
}

function PanelLoadingFallback() {
  return (
    <div className="imdx-card rounded-[12px] p-8 flex items-center justify-center gap-3 text-[13px] text-[#475569]">
      <span className="size-4 rounded-full border-2 border-[#00a5c3] border-t-transparent animate-spin" />
      <span>Loading view…</span>
    </div>
  );
}
import type {
  AccessRequestStatus,
  AdminNavKey,
  ApplicationReviewStatus,
  BillingTransaction,
  CatalogOffer,
  ConsentRequestRecord,
  DatasetStatus,
  ImdxAppStore,
  MyDatasetItem,
  NotificationItem,
  PlanOptionId,
  SubscriptionRecord,
  TransferItem,
  WorkspaceNavKey,
  WorkspacePreferences,
} from './types/dashboard';
import type { OnboardingStage, OnboardingState } from './types/onboarding';
import { updateCardSpotlight } from './utils/spotlight';

const PLAN_PRICES_INR: Record<PlanOptionId, { amountInr: number; label: string }> = {
  'pay-per-use': { amountInr: 150, label: 'Pay Per Use' },
  subscription: { amountInr: 2999, label: 'Subscription' },
  hybrid: { amountInr: 1499, label: 'Hybrid' },
  'one-time': { amountInr: 599, label: 'One Time' },
};

type AppSection = 'landing' | 'onboarding' | 'portal' | 'auth' | 'policies';

function resolveInitialLocation(): {
  section: AppSection;
  authView: AuthScreenView;
  authMode: 'workspace' | 'admin';
  authToken: string;
  ssoError: boolean;
  portalMode: 'workspace' | 'admin';
  workspaceNav: WorkspaceNavKey;
  adminNav: AdminNavKey;
  policySlug?: string;
  openTrackModal: boolean;
} {
  if (typeof window === 'undefined') {
    return {
      section: 'landing',
      authView: 'login',
      authMode: 'admin',
      authToken: '',
      ssoError: false,
      portalMode: 'workspace',
      workspaceNav: 'dashboard',
      adminNav: 'dashboard',
      openTrackModal: false,
    };
  }

  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const params = new URLSearchParams(window.location.search);
  const hashToken = window.location.hash.replace(/^#/, '');
  const queryToken = params.get('token') ?? '';
  const agentHost = isAgentHost();
  const hasUser = Boolean(loadUserSession()?.token);
  const hasAdmin = Boolean(loadAdminSession()?.token);

  if (path === '/sso' || params.get('code')) {
    return {
      section: 'portal',
      authView: 'login',
      authMode: 'workspace',
      authToken: '',
      ssoError: false,
      portalMode: 'workspace',
      workspaceNav: 'dashboard',
      adminNav: 'dashboard',
      openTrackModal: false,
    };
  }

  if (path === '/set-password' || path === '/invite') {
    return {
      section: 'auth',
      authView: 'set-password',
      authMode: agentHost ? 'workspace' : 'admin',
      authToken: hashToken || queryToken,
      ssoError: false,
      portalMode: 'workspace',
      workspaceNav: 'dashboard',
      adminNav: 'dashboard',
      openTrackModal: false,
    };
  }

  if (path === '/forgot-password') {
    return {
      section: 'auth',
      authView: 'forgot-password',
      authMode: agentHost ? 'workspace' : 'admin',
      authToken: '',
      ssoError: false,
      portalMode: 'workspace',
      workspaceNav: 'dashboard',
      adminNav: 'dashboard',
      openTrackModal: false,
    };
  }

  if (path === '/login') {
    if (agentHost && hasUser) {
      return {
        section: 'portal',
        authView: 'login',
        authMode: 'workspace',
        authToken: '',
        ssoError: false,
        portalMode: 'workspace',
        workspaceNav: 'dashboard',
        adminNav: 'dashboard',
        openTrackModal: false,
      };
    }
    if (!agentHost && hasAdmin) {
      return {
        section: 'portal',
        authView: 'login',
        authMode: 'admin',
        authToken: '',
        ssoError: false,
        portalMode: 'admin',
        workspaceNav: 'dashboard',
        adminNav: 'dashboard',
        openTrackModal: false,
      };
    }
    return {
      section: 'auth',
      authView: 'login',
      authMode: agentHost ? 'workspace' : 'admin',
      authToken: '',
      ssoError: params.get('error') === 'sso',
      portalMode: 'workspace',
      workspaceNav: 'dashboard',
      adminNav: 'dashboard',
      openTrackModal: false,
    };
  }

  if (path === '/apply' || path === '/application' || path === '/track' || (path === '/' && queryToken)) {
    return {
      section: 'onboarding',
      authView: 'login',
      authMode: 'workspace',
      authToken: '',
      ssoError: false,
      portalMode: 'workspace',
      workspaceNav: 'dashboard',
      adminNav: 'dashboard',
      openTrackModal: path === '/track',
    };
  }

  if (path === '/policies' || path.startsWith('/policies/')) {
    const slug = path.startsWith('/policies/') ? decodeURIComponent(path.slice('/policies/'.length)) : undefined;
    return {
      section: 'policies',
      authView: 'login',
      authMode: 'workspace',
      authToken: '',
      ssoError: false,
      portalMode: 'workspace',
      workspaceNav: 'dashboard',
      adminNav: 'dashboard',
      policySlug: slug || undefined,
      openTrackModal: false,
    };
  }

  if (path.startsWith('/admin')) {
    let adminNav: AdminNavKey = 'dashboard';
    if (path.includes('/participants')) adminNav = 'participants';
    else if (path.includes('/applications')) adminNav = 'applications';
    else if (path.includes('/policies')) adminNav = 'policies';
    else if (path.includes('/audit') || path.includes('/verify')) adminNav = 'audit-log';
    else if (path.includes('/purposes')) adminNav = 'purposes';
    else if (path.includes('/capacity') || path.includes('/cluster-health')) adminNav = 'capacity';

    if (isPlatformConfigured() && !hasAdmin) {
      return {
        section: 'auth',
        authView: 'login',
        authMode: 'admin',
        authToken: '',
        ssoError: false,
        portalMode: 'admin',
        workspaceNav: 'dashboard',
        adminNav,
        openTrackModal: false,
      };
    }
    return {
      section: 'portal',
      authView: 'login',
      authMode: 'admin',
      authToken: '',
      ssoError: false,
      portalMode: 'admin',
      workspaceNav: 'dashboard',
      adminNav,
      openTrackModal: false,
    };
  }

  if (path.startsWith('/workspace') || (agentHost && hasUser) || path === '/datasets' || path === '/catalog' || path === '/subscriptions' || path === '/transfers' || path === '/billing' || path === '/compute' || path === '/settings') {
    let workspaceNav: WorkspaceNavKey = 'dashboard';
    if (path.startsWith('/datasets')) workspaceNav = 'datasets';
    else if (path.startsWith('/catalog')) workspaceNav = 'catalog';
    else if (path.startsWith('/subscriptions')) workspaceNav = 'subscriptions';
    else if (path.startsWith('/transfers')) workspaceNav = 'transfers';
    else if (path.startsWith('/billing')) workspaceNav = 'billing';
    else if (path.startsWith('/compute')) workspaceNav = 'compute';
    else if (path.startsWith('/settings')) workspaceNav = 'settings';
    return {
      section: 'portal',
      authView: 'login',
      authMode: 'workspace',
      authToken: '',
      ssoError: false,
      portalMode: 'workspace',
      workspaceNav,
      adminNav: 'dashboard',
      openTrackModal: false,
    };
  }

  if (agentHost && !hasUser) {
    return {
      section: 'auth',
      authView: 'login',
      authMode: 'workspace',
      authToken: '',
      ssoError: params.get('error') === 'sso',
      portalMode: 'workspace',
      workspaceNav: 'dashboard',
      adminNav: 'dashboard',
      openTrackModal: false,
    };
  }

  return {
    section: 'landing',
    authView: 'login',
    authMode: 'admin',
    authToken: '',
    ssoError: false,
    portalMode: 'workspace',
    workspaceNav: 'dashboard',
    adminNav: 'dashboard',
    openTrackModal: false,
  };
}

export function App() {
  const [initialLoc] = useState(resolveInitialLocation);
  const [appSection, setAppSection] = useState<AppSection>(initialLoc.section);
  const [authView, setAuthView] = useState<AuthScreenView>(initialLoc.authView);
  const [authInviteToken, setAuthInviteToken] = useState(initialLoc.authToken);
  const [policySlug, setPolicySlug] = useState<string | undefined>(initialLoc.policySlug);
  const [applyLinkSentEmail, setApplyLinkSentEmail] = useState<string | null>(null);
  const [portalMode, setPortalMode] = useState<'workspace' | 'admin'>(initialLoc.portalMode);
  const [activeWorkspaceNav, setActiveWorkspaceNav] = useState<WorkspaceNavKey>(initialLoc.workspaceNav);
  const [activeAdminNav, setActiveAdminNav] = useState<AdminNavKey>(initialLoc.adminNav);

  const [store, setStore] = useState<ImdxAppStore>(() => {
    const base = loadLocalStore();
    if (typeof window !== 'undefined' && window.location.pathname.replace(/\/+$/, '') === '/apply') {
      saveApplicationToken(null);
      return {
        ...base,
        onboarding: createInitialStore().onboarding,
        applicationStatus: 'Under Review',
        reviewNote: '',
      };
    }
    return base;
  });
  const [liveCatalog, setLiveCatalog] = useState<CatalogOffer[] | undefined>(undefined);
  const [userSession, setUserSession] = useState<PersistedUserSession | null>(() =>
    loadUserSession(),
  );
  const [adminSession, setAdminSession] = useState<PersistedAdminSession | null>(() =>
    loadAdminSession(),
  );
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [apiFeedback, setApiFeedback] = useState<{ kind: 'error' | 'info'; message: string } | null>(
    null,
  );
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(initialLoc.openTrackModal);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRegisterDatasetOpen, setIsRegisterDatasetOpen] = useState(false);

  const reportError = (err: unknown, fallback: string) => {
    setApiFeedback({
      kind: 'error',
      message: err instanceof Error && err.message ? err.message : fallback,
    });
  };

  // Handle URL magic-link fragment (/application#<token>), query (?token=...), invite/set-password fragment, or SSO handoff (/sso?code=...)
  useEffect(() => {
    let active = true;
    const path = window.location.pathname.replace(/\/+$/, '') || '/';
    const params = new URLSearchParams(window.location.search);
    const hashToken = window.location.hash.replace(/^#/, '');
    const appToken =
      path === '/application' && hashToken ? hashToken : params.get('token');
    const ssoCode = params.get('code');

    if (path === '/set-password' || path === '/invite') {
      if (window.location.hash || params.get('token')) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    } else if (appToken && path !== '/invite' && path !== '/apply') {
      saveApplicationToken(appToken);
      window.history.replaceState(null, '', window.location.pathname);
      if (isPlatformConfigured()) {
        void imdxApi
          .fetchPublicApplication(appToken, loadLocalStore().onboarding)
          .then((res) => {
            if (!active) return;
            setStore((prev) => ({
              ...prev,
              onboarding: res.onboarding,
              applicationStatus: res.applicationStatus,
              reviewNote: res.reviewNote,
            }));
          })
          .catch((err) => {
            if (active) reportError(err, 'This application link is invalid or expired. Use Track my application.');
          });
      }
    } else if (ssoCode && isPlatformConfigured()) {
      window.history.replaceState(null, '', '/');
      void cygnusApi
        .ssoExchange(ssoCode)
        .then(async (res) => {
          if (!active) return;
          const next: PersistedUserSession = {
            ...res,
            expiresAt: Date.now() + res.expiresIn * 1000,
          };
          try {
            const me = await cygnusApi.getOrgUserMe();
            next.signatoryVerified = me.signatoryVerified;
          } catch {
            // keep SSO payload signatoryVerified value
          }
          saveUserSession(next);
          setUserSession(next);
          setPortalMode('workspace');
          setAppSection('portal');
        })
        .catch(() => {
          if (!active) return;
          setAuthView('login');
          setApiFeedback({ kind: 'error', message: 'Your sign-in link did not work. Please sign in again.' });
          setAppSection('auth');
        });
    }

    return () => {
      active = false;
    };
  }, []);

  // Sync live Cygnus Agent workspace data when authenticated
  useEffect(() => {
    let active = true;
    if (!userSession?.token) return;
    void imdxApi
      .syncWorkspace()
      .then(({ liveCatalog: catalog, ...patch }) => {
        if (!active) return;
        if (catalog) setLiveCatalog(catalog);
        if (Object.keys(patch).length > 0) {
          setStore((prev) => ({ ...prev, ...patch }));
        }
      })
      .catch((err) => {
        if (active) reportError(err, 'Failed to sync workspace data from Cygnus Agent.');
      });
    return () => {
      active = false;
    };
  }, [userSession]);

  // Sync live Cygnus Platform admin data when admin is authenticated
  useEffect(() => {
    let active = true;
    if (!adminSession?.token) return;
    void imdxApi
      .syncAdmin()
      .then((patch) => {
        if (!active) return;
        if (Object.keys(patch).length > 0) {
          setStore((prev) => ({ ...prev, ...patch }));
        }
      })
      .catch((err) => {
        if (active) reportError(err, 'Failed to sync governance data from Cygnus Platform.');
      });
    return () => {
      active = false;
    };
  }, [adminSession]);

  // Persist every store update cleanly in localStorage
  useEffect(() => {
    persistLocalStore(store);
  }, [store]);

  const updateOnboarding = (updater: (prev: OnboardingState) => OnboardingState) => {
    setStore((prev) => ({ ...prev, onboarding: updater(prev.onboarding) }));
  };

  const pushAuditAndNotification = (
    prev: ImdxAppStore,
    auditAction: string,
    auditTarget: string,
    notification?: Omit<NotificationItem, 'id' | 'read' | 'timestamp'>,
    outcome: 'Success' | 'Warning' = 'Success',
  ): Pick<ImdxAppStore, 'auditLogs' | 'notifications'> => {
    const nextLogs = [
      {
        id: `log-${Date.now()}`,
        actor: prev.onboarding.representative.email || 'aarav@abcmobility.in',
        action: auditAction,
        target: auditTarget,
        timestamp: 'Just now',
        outcome,
      },
      ...prev.auditLogs,
    ];
    const nextNotifs = notification
      ? [
          {
            id: `notif-${Date.now()}`,
            timestamp: 'Just now',
            read: false,
            ...notification,
          },
          ...prev.notifications,
        ]
      : prev.notifications;
    return { auditLogs: nextLogs, notifications: nextNotifs };
  };

  const goToStage = (stage: OnboardingStage) => {
    updateOnboarding((prev) => ({ ...prev, stage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openWorkspace = (nav: WorkspaceNavKey = 'dashboard') => {
    setPortalMode('workspace');
    setActiveWorkspaceNav(nav);
    setAppSection('portal');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartNewOnboarding = () => {
    saveApplicationToken(null);
    setApplyLinkSentEmail(null);
    setApiFeedback(null);
    setStore((prev) => ({
      ...prev,
      onboarding: createInitialStore().onboarding,
      applicationStatus: 'Under Review',
      reviewNote: '',
    }));
    setAppSection('onboarding');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openOnboarding = () => {
    if (store.onboarding.stage === 'submitted') {
      handleStartNewOnboarding();
      return;
    }
    setApplyLinkSentEmail(null);
    setAppSection('onboarding');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartApplication = async (captchaToken?: string): Promise<boolean> => {
    setApiFeedback(null);
    try {
      await imdxApi.startApplication({ ...store.onboarding.registration, captchaToken });
      if (isPlatformConfigured()) {
        // Real Cygnus Platform sends a private /application#<token> continuation link via email.
        setApplyLinkSentEmail(store.onboarding.registration.workEmail.trim());
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return true;
      }
      updateOnboarding((prev) => ({
        ...prev,
        stage: 1,
        representative: {
          ...prev.representative,
          name: prev.representative.name || prev.registration.fullName,
          email: prev.representative.email || prev.registration.workEmail,
          countryCode: prev.representative.phoneNumber
            ? prev.representative.countryCode
            : prev.registration.countryCode,
          phoneNumber: prev.representative.phoneNumber || prev.registration.phoneNumber,
        },
      }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return true;
    } catch (err) {
      reportError(err, 'Unable to start application on Cygnus Platform.');
      return false;
    }
  };

  const handleSubmitOnboarding = async () => {
    setApiFeedback(null);
    const submittedState: OnboardingState = { ...store.onboarding, stage: 'submitted' };
    try {
      await imdxApi.submitApplication(submittedState);
      setStore((prev) => ({
        ...prev,
        onboarding: submittedState,
        applicationStatus: 'Under Review',
        reviewNote: '',
        ...pushAuditAndNotification(
          prev,
          'Submitted Onboarding Application',
          prev.onboarding.applicationNumber,
          {
            title: 'Application submitted',
            detail: `${prev.onboarding.applicationNumber} queued for Admin verification.`,
          },
        ),
      }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      reportError(err, 'Application submission failed on Cygnus Platform.');
    }
  };

  const handleCreateDataset = async (dataset: MyDatasetItem, endpointUrl?: string) => {
    setApiFeedback(null);
    try {
      const saved = await imdxApi.createDataset(dataset, endpointUrl);
      setStore((prev) => ({
        ...prev,
        datasets: [saved, ...prev.datasets],
        ...pushAuditAndNotification(prev, 'Registered Dataset', saved.name, {
          title: 'Dataset registered',
          detail: `${saved.name} (${saved.status}) added to My Datasets.`,
          targetNav: 'datasets',
        }),
      }));
    } catch (err) {
      reportError(err, 'Failed to register dataset on Cygnus Agent.');
    }
  };

  const handleUpdateDatasetStatus = async (id: string, status: DatasetStatus) => {
    setApiFeedback(null);
    try {
      await imdxApi.updateDatasetStatus(id, status);
      setStore((prev) => {
        const target = prev.datasets.find((d) => d.id === id);
        return {
          ...prev,
          datasets: prev.datasets.map((d) => (d.id === id ? { ...d, status } : d)),
          ...pushAuditAndNotification(
            prev,
            `Dataset Status -> ${status}`,
            target?.name ?? id,
            status === 'Published'
              ? {
                  title: 'Dataset published',
                  detail: `${target?.name ?? 'Dataset'} is now visible in IMDX Catalog.`,
                  targetNav: 'datasets',
                }
              : undefined,
          ),
        };
      });
    } catch (err) {
      reportError(err, 'Unable to update dataset publish state.');
    }
  };

  const handleDeleteDataset = async (id: string) => {
    setApiFeedback(null);
    try {
      await imdxApi.deleteDataset(id);
      setStore((prev) => {
        const target = prev.datasets.find((d) => d.id === id);
        return {
          ...prev,
          datasets: prev.datasets.filter((item) => item.id !== id),
          ...pushAuditAndNotification(
            prev,
            'Removed Dataset',
            target?.name ?? id,
            undefined,
            'Warning',
          ),
        };
      });
    } catch (err) {
      reportError(err, 'Unable to delete dataset.');
    }
  };

  const handleRequestConsent = async (record: ConsentRequestRecord) => {
    setApiFeedback(null);
    try {
      await imdxApi.requestConsent(record);
      const offer = (liveCatalog ?? CATALOG_OFFERS).find((o) => o.id === record.offerId);
      setStore((prev) => {
        const filtered = prev.consentRequests.filter((c) => c.offerId !== record.offerId);
        return {
          ...prev,
          consentRequests: [record, ...filtered],
          ...pushAuditAndNotification(
            prev,
            'Requested Data Consent',
            offer?.title ?? record.offerId,
            {
              title: 'Consent request submitted',
              detail: `Sent consent request for ${offer?.title ?? 'dataset'} (${record.duration}).`,
              targetNav: 'catalog',
            },
          ),
        };
      });
    } catch (err) {
      reportError(err, 'Failed to submit consent request.');
    }
  };

  const handleSubscribeOffer = async (
    offer: CatalogOffer,
    planId: PlanOptionId,
    purpose: string,
  ) => {
    setApiFeedback(null);
    const pricing = PLAN_PRICES_INR[planId];
    const fallbackSub: SubscriptionRecord = {
      offerId: offer.id,
      planId,
      purpose,
      subscribedAt: 'Just now',
      status: 'Active',
    };
    const transaction: BillingTransaction = {
      id: `TXN-${Math.floor(78900 + Math.random() * 900)}`,
      dataset: offer.title,
      counterparty: offer.publisher,
      type: pricing.label,
      period: new Date().toLocaleString('en-IN', { month: 'short', year: 'numeric' }),
      amountInr: pricing.amountInr,
      amount: `₹${pricing.amountInr.toLocaleString('en-IN')}`,
      date: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      status: planId === 'pay-per-use' ? 'Pending' : 'Paid',
      kind: 'spending',
    };
    try {
      const serverSub = await imdxApi.createSubscription(offer, planId, purpose);
      const subscription = serverSub ?? fallbackSub;
      setStore((prev) => ({
        ...prev,
        subscriptions: [subscription, ...prev.subscriptions.filter((s) => s.offerId !== offer.id)],
        billingTransactions: [transaction, ...prev.billingTransactions],
        ...pushAuditAndNotification(
          prev,
          'Subscribed to Catalog Offer',
          `${offer.title} (${pricing.label})`,
          {
            title: 'Subscription active',
            detail: `Subscribed to ${offer.title} · Invoice ${transaction.id} created.`,
            targetNav: 'subscriptions',
          },
        ),
      }));
    } catch (err) {
      reportError(err, 'Subscription request failed.');
    }
  };

  const handleUnsubscribeOffer = async (offerId: string) => {
    setApiFeedback(null);
    try {
      await imdxApi.revokeSubscription(offerId);
      const offer = (liveCatalog ?? CATALOG_OFFERS).find((o) => o.id === offerId);
      setStore((prev) => ({
        ...prev,
        subscriptions: prev.subscriptions.filter((s) => s.offerId !== offerId),
        ...pushAuditAndNotification(
          prev,
          'Cancelled Subscription',
          offer?.title ?? offerId,
          undefined,
          'Warning',
        ),
      }));
    } catch (err) {
      reportError(err, 'Unable to revoke subscription.');
    }
  };

  const handleTriggerTransfer = async (
    datasetTitle: string,
    protocol: string,
    direction: 'Inbound' | 'Outbound',
    subscriptionId?: string,
  ) => {
    setApiFeedback(null);
    try {
      const serverTx = subscriptionId ? await imdxApi.triggerTransfer(subscriptionId) : null;
      const tx: TransferItem = serverTx ?? {
        id: `TX-${Math.floor(9042 + Math.random() * 900)}`,
        dataset: datasetTitle,
        protocol,
        direction,
        volume: `${(12 + Math.random() * 68).toFixed(1)} MB`,
        status: 'Completed',
        timestamp: 'Just now',
      };
      setStore((prev) => ({
        ...prev,
        transfers: [tx, ...prev.transfers],
        ...pushAuditAndNotification(prev, 'Executed EDC Transfer', `${tx.id} · ${tx.dataset}`, {
          title: `Transfer ${tx.id} completed`,
          detail: `${tx.direction} transfer (${tx.volume}) finished cleanly.`,
          targetNav: 'transfers',
        }),
      }));
    } catch (err) {
      reportError(err, 'Transfer blocked or failed on EDC connector.');
    }
  };

  const handleUpdateAccessRequestStatus = async (
    id: string,
    status: AccessRequestStatus,
    note?: string,
  ) => {
    setApiFeedback(null);
    try {
      await imdxApi.updateAccessRequest(id, status);
      setStore((prev) => {
        const target = prev.accessRequests.find((r) => r.id === id);
        return {
          ...prev,
          accessRequests: prev.accessRequests.map((r) =>
            r.id === id ? { ...r, status, note: note ?? r.note } : r,
          ),
          ...pushAuditAndNotification(
            prev,
            `Access Request -> ${status}`,
            target ? `${target.org} (${target.dataset})` : id,
            {
              title: `Access request ${status.toLowerCase()}`,
              detail: target
                ? `${target.org} request for ${target.dataset} marked ${status}.`
                : `Access request updated to ${status}.`,
              targetNav: 'dashboard',
            },
            status === 'Approved' ? 'Success' : 'Warning',
          ),
        };
      });
    } catch (err) {
      reportError(err, 'Unable to update consent decision.');
    }
  };

  const handlePayTransaction = async (txId: string) => {
    setApiFeedback(null);
    try {
      await imdxApi.payTransaction(txId);
      setStore((prev) => ({
        ...prev,
        billingTransactions: prev.billingTransactions.map((t) =>
          t.id === txId ? { ...t, status: 'Paid' } : t,
        ),
        ...pushAuditAndNotification(prev, 'Settled Billing Invoice', txId, {
          title: `Invoice ${txId} paid`,
          detail: 'Payment recorded cleanly in your IMDX billing ledger.',
          targetNav: 'billing',
        }),
      }));
    } catch (err) {
      reportError(err, 'Unable to settle invoice payment.');
    }
  };

  const handleSaveSettings = (
    profile: { legalName: string; repName: string; workEmail: string },
    preferences: WorkspacePreferences,
  ) => {
    setStore((prev) => ({
      ...prev,
      onboarding: {
        ...prev.onboarding,
        organization: { ...prev.onboarding.organization, legalName: profile.legalName },
        representative: {
          ...prev.onboarding.representative,
          name: profile.repName,
          email: profile.workEmail,
        },
      },
      preferences,
      ...pushAuditAndNotification(prev, 'Updated Workspace Settings', profile.legalName),
    }));
  };

  const handleUpdateApplicationStatus = async (status: ApplicationReviewStatus, note?: string) => {
    setApiFeedback(null);
    try {
      await imdxApi.updateApplicationDecision(store.onboarding.applicationNumber, status, note);
      setStore((prev) => ({
        ...prev,
        applicationStatus: status,
        reviewNote: note !== undefined ? note : prev.reviewNote,
      }));
    } catch (err) {
      reportError(err, 'Unable to submit governance application decision.');
    }
  };

  const handleSignOut = async () => {
    if (userSession?.token && isPlatformConfigured()) {
      await cygnusApi.logoutUser(userSession.token).catch(() => undefined);
    }
    if (adminSession?.token && isPlatformConfigured()) {
      await cygnusApi.logoutAdmin(adminSession.token).catch(() => undefined);
    }
    saveUserSession(null);
    saveAdminSession(null);
    setUserSession(null);
    setAdminSession(null);
    setLiveCatalog(undefined);
    setApiFeedback({ kind: 'info', message: 'Signed out cleanly.' });
    if (isPlatformConfigured()) {
      setAuthView('login');
      setAuthInviteToken('');
      setAppSection('auth');
    }
  };

  const handleResetDemoData = () => {
    const fresh = clearLocalStore();
    setStore(fresh);
  };

  const userDisplayName =
    userSession?.email ||
    adminSession?.email ||
    store.onboarding.representative.name ||
    store.onboarding.registration.fullName ||
    'Aarav Mehta';

  const isAuthenticated =
    portalMode === 'admin' ? Boolean(adminSession?.token) : Boolean(userSession?.token);

  if (appSection === 'auth') {
    return (
      <>
        <AuthStandalonePage
          key={`${authView}-${authInviteToken}`}
          initialMode={initialLoc.authMode}
          initialView={authView}
          inviteOrResetToken={authInviteToken}
          ssoError={initialLoc.ssoError}
          onUserSignedIn={(session) => {
            setUserSession(session);
            setPortalMode('workspace');
            setAppSection('portal');
            setApiFeedback({ kind: 'info', message: `Signed in as ${session.email}.` });
          }}
          onAdminSignedIn={(session) => {
            setAdminSession(session);
            setPortalMode('admin');
            setAppSection('portal');
            setApiFeedback({ kind: 'info', message: `Signed in to Governance Desk (${session.email}).` });
          }}
          onNavigateToApply={handleStartNewOnboarding}
          onNavigateToTrack={() => {
            setAppSection('onboarding');
            setIsTrackModalOpen(true);
          }}
          onGoHome={() => {
            setAppSection('landing');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </>
    );
  }

  if (appSection === 'policies') {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <div className="min-h-screen imdx-internal-canvas text-[#102529]">
          <InternalBackdrop />
          <Header
            onLogoClick={() => {
              setAppSection('landing');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onTrackClick={() => {
              setAppSection('onboarding');
              setIsTrackModalOpen(true);
            }}
            onOpenWorkspace={() => openWorkspace('dashboard')}
          />
          <PublicPoliciesView
            slug={policySlug}
            onSelectSlug={(nextSlug) => setPolicySlug(nextSlug)}
            onStartOnboarding={handleStartNewOnboarding}
          />
        </div>
      </Suspense>
    );
  }

  if (appSection === 'landing') {
    return (
      <HomeHero
        onStartOnboarding={openOnboarding}
        onOpenWorkspace={() => openWorkspace('dashboard')}
      />
    );
  }

  if (appSection === 'portal') {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <DashboardLayout
          portalMode={portalMode}
          onPortalModeChange={setPortalMode}
          activeWorkspaceNav={activeWorkspaceNav}
          onWorkspaceNavChange={setActiveWorkspaceNav}
          activeAdminNav={activeAdminNav}
          onAdminNavChange={setActiveAdminNav}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            if (portalMode === 'workspace' && activeWorkspaceNav === 'dashboard' && q.trim()) {
              setActiveWorkspaceNav('datasets');
            }
          }}
          notifications={store.notifications}
          onMarkNotificationRead={(id) =>
            setStore((prev) => ({
              ...prev,
              notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
            }))
          }
          onMarkAllNotificationsRead={() =>
            setStore((prev) => ({
              ...prev,
              notifications: prev.notifications.map((n) => ({ ...n, read: true })),
            }))
          }
          userDisplayName={userDisplayName}
          isBackendLive={isBackendConfigured()}
          isAuthenticated={isAuthenticated}
          onSignInClick={() => setIsAuthModalOpen(true)}
          onSignOutClick={handleSignOut}
          onGoToLanding={() => {
            setAppSection('landing');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onGoToOnboarding={openOnboarding}
        >
          {apiFeedback && (
            <div
              role="status"
              className={`mb-4 rounded-[10px] border px-4 py-2.5 text-[12.5px] flex items-center justify-between gap-3 ${
                apiFeedback.kind === 'error'
                  ? 'border-[#fca5a5] bg-[#fef2f2] text-[#991b1b]'
                  : 'border-[#99f6e4] bg-[#ecfdf5] text-[#065f46]'
              }`}
            >
              <span>{apiFeedback.message}</span>
              <button
                type="button"
                onClick={() => setApiFeedback(null)}
                className="font-semibold underline cursor-pointer shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}
          <Suspense fallback={<PanelLoadingFallback />}>
            {portalMode === 'admin' ? (
              <AdminDashboardView
                activeNav={activeAdminNav}
                onNavigate={setActiveAdminNav}
                onboardingState={store.onboarding}
                datasets={store.datasets}
                subscriptionsCount={store.subscriptions.length}
                applicationStatus={store.applicationStatus}
                reviewNote={store.reviewNote}
                searchQuery={searchQuery}
                participants={store.participants}
                policies={store.policies}
                auditLogs={store.auditLogs}
                purposes={store.purposes}
                onParticipantsChange={(participants) => setStore((prev) => ({ ...prev, participants }))}
                onPoliciesChange={(policies) => setStore((prev) => ({ ...prev, policies }))}
                onPurposesChange={(purposes) => setStore((prev) => ({ ...prev, purposes }))}
                onAppendAudit={(action, target, outcome) =>
                  setStore((prev) => ({
                    ...prev,
                    ...pushAuditAndNotification(prev, action, target, undefined, outcome),
                  }))
                }
                onUpdateApplicationStatus={handleUpdateApplicationStatus}
              />
            ) : (
              <>
                {activeWorkspaceNav === 'dashboard' && (
                  <DashboardOverview
                    datasets={store.datasets}
                    subscriptionsCount={store.subscriptions.length}
                    accessRequests={store.accessRequests}
                    onUpdateAccessRequestStatus={handleUpdateAccessRequestStatus}
                    onRegisterDatasetClick={() => setIsRegisterDatasetOpen(true)}
                    onNavigate={setActiveWorkspaceNav}
                  />
                )}

                {activeWorkspaceNav === 'datasets' && (
                  <MyDatasetsPage
                    datasets={store.datasets}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onRegisterDatasetClick={() => setIsRegisterDatasetOpen(true)}
                    onUpdateDatasetStatus={handleUpdateDatasetStatus}
                    onDeleteDataset={handleDeleteDataset}
                  />
                )}

                {activeWorkspaceNav === 'catalog' && (
                  <CatalogPage
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    offers={liveCatalog}
                    subscriptions={store.subscriptions}
                    consentRequests={store.consentRequests}
                    onRequestConsent={handleRequestConsent}
                    onSubscribeOffer={handleSubscribeOffer}
                    onUnsubscribeOffer={handleUnsubscribeOffer}
                  />
                )}

                {activeWorkspaceNav === 'subscriptions' && (
                  <SubscriptionsPage
                    subscriptions={store.subscriptions}
                    searchQuery={searchQuery}
                    onUnsubscribe={handleUnsubscribeOffer}
                    onPullData={(offerId) => {
                      const offer = (liveCatalog ?? CATALOG_OFFERS).find((o) => o.id === offerId);
                      void handleTriggerTransfer(
                        offer?.title ?? 'Catalog Dataset',
                        offer?.protocol ?? 'GTFS',
                        'Inbound',
                        offerId,
                      );
                    }}
                    onGoToCatalog={() => setActiveWorkspaceNav('catalog')}
                  />
                )}

                {activeWorkspaceNav === 'transfers' && (
                  <TransfersPage
                    transfers={store.transfers}
                    searchQuery={searchQuery}
                    onTriggerSync={() =>
                      handleTriggerTransfer('Road Network Infrastructure', 'GTFS', 'Inbound')
                    }
                  />
                )}

                {activeWorkspaceNav === 'compute' && <ComputePage />}

                {activeWorkspaceNav === 'billing' && (
                  <BillingPage
                    transactions={store.billingTransactions}
                    preferences={store.preferences}
                    onboardingState={store.onboarding}
                    onPayTransaction={handlePayTransaction}
                  />
                )}

                {activeWorkspaceNav === 'settings' && (
                  <SettingsPage
                    onboardingState={store.onboarding}
                    preferences={store.preferences}
                    onSaveSettings={handleSaveSettings}
                    onResetDemoData={handleResetDemoData}
                  />
                )}
              </>
            )}
          </Suspense>
        </DashboardLayout>

        {isRegisterDatasetOpen && (
          <RegisterDatasetModal
            isOpen={isRegisterDatasetOpen}
            onClose={() => setIsRegisterDatasetOpen(false)}
            onCreate={handleCreateDataset}
          />
        )}

        {isAuthModalOpen && (
          <AuthModal
            isOpen={isAuthModalOpen}
            initialMode={portalMode}
            onClose={() => setIsAuthModalOpen(false)}
            onUserSignedIn={(session) => {
              setUserSession(session);
              setPortalMode('workspace');
              setApiFeedback({ kind: 'info', message: `Signed in as ${session.email}.` });
            }}
            onAdminSignedIn={(session) => {
              setAdminSession(session);
              setPortalMode('admin');
              setApiFeedback({ kind: 'info', message: `Signed in to Governance Desk (${session.email}).` });
            }}
          />
        )}
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <div
        onPointerMove={updateCardSpotlight}
        className="min-h-screen imdx-internal-canvas text-[#102529]"
      >
        <InternalBackdrop />
        <Header
          onLogoClick={() => {
            setAppSection('landing');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onTrackClick={() => setIsTrackModalOpen(true)}
          onOpenWorkspace={() => openWorkspace('dashboard')}
          onStartNewApplication={
            store.onboarding.stage !== 'register' ? handleStartNewOnboarding : undefined
          }
        />

        <main>
          {apiFeedback && (
            <div className="max-w-[940px] mx-auto px-4 sm:px-6 pt-4">
              <div
                role="status"
                className={`rounded-[10px] border px-4 py-2.5 text-[12.5px] flex items-center justify-between gap-3 ${
                  apiFeedback.kind === 'error'
                    ? 'border-[#fca5a5] bg-[#fef2f2] text-[#991b1b]'
                    : 'border-[#99f6e4] bg-[#ecfdf5] text-[#065f46]'
                }`}
              >
                <span>{apiFeedback.message}</span>
                <button
                  type="button"
                  onClick={() => setApiFeedback(null)}
                  className="font-semibold underline cursor-pointer shrink-0"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
          <Suspense fallback={<PanelLoadingFallback />}>
            {store.onboarding.stage === 'register' && (
              <div key="register" className="imdx-stage-enter">
                <RegisterScreen
                  data={store.onboarding.registration}
                  onChange={(registration) => updateOnboarding((prev) => ({ ...prev, registration }))}
                  onSubmit={handleStartApplication}
                  linkSentEmail={applyLinkSentEmail}
                  onTrackApplication={() => setIsTrackModalOpen(true)}
                  onResetLinkSent={() => setApplyLinkSentEmail(null)}
                />
              </div>
            )}

            {typeof store.onboarding.stage === 'number' && (
              <div className="max-w-[940px] mx-auto px-4 sm:px-6 pt-5 pb-10">
                <ApplicationBanner
                  applicationNumber={store.onboarding.applicationNumber}
                  underlineNumber={store.onboarding.stage === 1}
                />

                <StepProgress
                  currentStep={store.onboarding.stage}
                  onStepSelect={(step) => goToStage(step)}
                />

                <div key={`step-${store.onboarding.stage}`} className="imdx-stage-enter">
                  {store.onboarding.stage === 1 && (
                    <OnboardStep01
                      data={store.onboarding.organization}
                      onChange={(organization) =>
                        updateOnboarding((prev) => ({ ...prev, organization }))
                      }
                      onNext={() => {
                        void imdxApi
                          .saveOrganizationStep(store.onboarding.organization)
                          .then(() => goToStage(2))
                          .catch((err) =>
                            reportError(err, 'Unable to save organization details to backend.'),
                          );
                      }}
                    />
                  )}

                  {store.onboarding.stage === 2 && (
                    <OnboardStep02
                      data={store.onboarding.representative}
                      onChange={(representative) =>
                        updateOnboarding((prev) => ({ ...prev, representative }))
                      }
                      onBack={() => goToStage(1)}
                      onNext={() => {
                        void imdxApi
                          .saveRepresentativeStep(store.onboarding.representative)
                          .then(() => goToStage(3))
                          .catch((err) =>
                            reportError(err, 'Unable to save representative details to backend.'),
                          );
                      }}
                    />
                  )}

                  {store.onboarding.stage === 3 && (
                    <OnboardStep03
                      selected={store.onboarding.deployment}
                      onSelect={(deployment) => updateOnboarding((prev) => ({ ...prev, deployment }))}
                      onBack={() => goToStage(2)}
                      onNext={() => goToStage(4)}
                    />
                  )}

                  {store.onboarding.stage === 4 && (
                    <OnboardStep04
                      applicationNumber={store.onboarding.applicationNumber}
                      documents={store.onboarding.documents}
                      onChange={(updater) =>
                        updateOnboarding((prev) => ({ ...prev, documents: updater(prev.documents) }))
                      }
                      onBack={() => goToStage(3)}
                      onNext={() => goToStage(5)}
                    />
                  )}

                  {store.onboarding.stage === 5 && (
                    <OnboardStep05
                      acceptedPolicies={store.onboarding.acceptedPolicies}
                      onChange={(acceptedPolicies) =>
                        updateOnboarding((prev) => ({ ...prev, acceptedPolicies }))
                      }
                      onBack={() => goToStage(4)}
                      onNext={() => goToStage(6)}
                    />
                  )}

                  {store.onboarding.stage === 6 && (
                    <OnboardStep06
                      state={store.onboarding}
                      onEditStep={(step) => goToStage(step)}
                      onBack={() => goToStage(5)}
                      onSubmitApplication={handleSubmitOnboarding}
                    />
                  )}
                </div>
              </div>
            )}

            {store.onboarding.stage === 'submitted' && (
              <div key="submitted" className="imdx-stage-enter">
                <ApplicationSubmitted
                  applicationNumber={store.onboarding.applicationNumber}
                  workEmail={
                    store.onboarding.registration.workEmail || store.onboarding.representative.email
                  }
                  applicationStatus={store.applicationStatus}
                  reviewNote={store.reviewNote}
                  onOpenWorkspace={() => openWorkspace('dashboard')}
                  onResubmitSuccess={() =>
                    setStore((prev) => ({
                      ...prev,
                      applicationStatus: 'Under Review',
                      reviewNote: '',
                      ...pushAuditAndNotification(
                        prev,
                        'Resubmitted Onboarding Application',
                        prev.onboarding.applicationNumber,
                        {
                          title: 'Application resubmitted',
                          detail: `${prev.onboarding.applicationNumber} sent back to Governance Desk.`,
                        },
                      ),
                    }))
                  }
                  onEditApplication={() => goToStage(1)}
                  onStartNewApplication={handleStartNewOnboarding}
                />
              </div>
            )}
          </Suspense>
        </main>

        {isTrackModalOpen && (
          <TrackApplicationModal
            isOpen={isTrackModalOpen}
            onClose={() => setIsTrackModalOpen(false)}
            applicationNumber={store.onboarding.applicationNumber}
            currentStage={store.onboarding.stage}
            applicationStatus={store.applicationStatus}
            reviewNote={store.reviewNote}
            workEmail={
              store.onboarding.registration.workEmail || store.onboarding.representative.email
            }
            onOpenWorkspace={() => openWorkspace('dashboard')}
          />
        )}
      </div>
    </Suspense>
  );
}

export default App;
