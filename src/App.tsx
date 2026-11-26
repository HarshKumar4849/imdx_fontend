import { lazy, Suspense, useEffect, useState } from 'react';
import { HomeHero } from './components/landing/HomeHero';
import { CATALOG_OFFERS } from './data/dashboardData';
import {
  clearLocalStore,
  imdxApi,
  loadLocalStore,
  persistLocalStore,
} from './services/imdxApi';

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

export function App() {
  const [appSection, setAppSection] = useState<'landing' | 'onboarding' | 'portal'>('landing');
  const [portalMode, setPortalMode] = useState<'workspace' | 'admin'>('workspace');
  const [activeWorkspaceNav, setActiveWorkspaceNav] = useState<WorkspaceNavKey>('dashboard');
  const [activeAdminNav, setActiveAdminNav] = useState<AdminNavKey>('dashboard');

  const [store, setStore] = useState<ImdxAppStore>(() => loadLocalStore());
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRegisterDatasetOpen, setIsRegisterDatasetOpen] = useState(false);

  // Sync with backend REST API on mount if VITE_API_BASE_URL is configured
  useEffect(() => {
    let active = true;
    void imdxApi.bootstrap().then((hydrated) => {
      if (active) setStore(hydrated);
    });
    return () => {
      active = false;
    };
  }, []);

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

  const openOnboarding = () => {
    setAppSection('onboarding');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartApplication = () => {
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
  };

  const handleSubmitOnboarding = () => {
    const submittedState: OnboardingState = { ...store.onboarding, stage: 'submitted' };
    void imdxApi.submitApplication(submittedState);
    setStore((prev) => ({
      ...prev,
      onboarding: submittedState,
      ...pushAuditAndNotification(prev, 'Submitted Onboarding Application', prev.onboarding.applicationNumber, {
        title: 'Application submitted',
        detail: `${prev.onboarding.applicationNumber} queued for Admin verification.`,
      }),
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateDataset = (dataset: MyDatasetItem) => {
    void imdxApi.createDataset(dataset);
    setStore((prev) => ({
      ...prev,
      datasets: [dataset, ...prev.datasets],
      ...pushAuditAndNotification(prev, 'Registered Dataset', dataset.name, {
        title: 'Dataset registered',
        detail: `${dataset.name} (${dataset.status}) added to My Datasets.`,
        targetNav: 'datasets',
      }),
    }));
  };

  const handleUpdateDatasetStatus = (id: string, status: DatasetStatus) => {
    void imdxApi.updateDatasetStatus(id, status);
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
  };

  const handleDeleteDataset = (id: string) => {
    void imdxApi.deleteDataset(id);
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
  };

  const handleRequestConsent = (record: ConsentRequestRecord) => {
    void imdxApi.requestConsent(record);
    const offer = CATALOG_OFFERS.find((o) => o.id === record.offerId);
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
  };

  const handleSubscribeOffer = (offer: CatalogOffer, planId: PlanOptionId, purpose: string) => {
    const pricing = PLAN_PRICES_INR[planId];
    const subscription: SubscriptionRecord = {
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
      period: 'Nov 2026',
      amountInr: pricing.amountInr,
      amount: `₹${pricing.amountInr.toLocaleString('en-IN')}`,
      date: '26 Nov 2026',
      status: planId === 'pay-per-use' ? 'Pending' : 'Paid',
      kind: 'spending',
    };
    void imdxApi.createSubscription(subscription, transaction);
    setStore((prev) => ({
      ...prev,
      subscriptions: [subscription, ...prev.subscriptions.filter((s) => s.offerId !== offer.id)],
      billingTransactions: [transaction, ...prev.billingTransactions],
      ...pushAuditAndNotification(prev, 'Subscribed to Catalog Offer', `${offer.title} (${pricing.label})`, {
        title: 'Subscription active',
        detail: `Subscribed to ${offer.title} · Invoice ${transaction.id} created.`,
        targetNav: 'subscriptions',
      }),
    }));
  };

  const handleUnsubscribeOffer = (offerId: string) => {
    void imdxApi.deleteSubscription(offerId);
    const offer = CATALOG_OFFERS.find((o) => o.id === offerId);
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
  };

  const handleTriggerTransfer = (datasetTitle: string, protocol: string, direction: 'Inbound' | 'Outbound') => {
    const tx: TransferItem = {
      id: `TX-${Math.floor(9042 + Math.random() * 900)}`,
      dataset: datasetTitle,
      protocol,
      direction,
      volume: `${(12 + Math.random() * 68).toFixed(1)} MB`,
      status: 'Completed',
      timestamp: 'Just now',
    };
    void imdxApi.triggerTransfer(tx);
    setStore((prev) => ({
      ...prev,
      transfers: [tx, ...prev.transfers],
      ...pushAuditAndNotification(prev, 'Executed EDC Transfer', `${tx.id} · ${tx.dataset}`, {
        title: `Transfer ${tx.id} completed`,
        detail: `${tx.direction} transfer (${tx.volume}) finished cleanly.`,
        targetNav: 'transfers',
      }),
    }));
  };

  const handleUpdateAccessRequestStatus = (
    id: string,
    status: AccessRequestStatus,
    note?: string,
  ) => {
    void imdxApi.updateAccessRequest(id, status, note);
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
  };

  const handlePayTransaction = (txId: string) => {
    void imdxApi.payTransaction(txId);
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
  };

  const handleSaveSettings = (
    profile: { legalName: string; repName: string; workEmail: string },
    preferences: WorkspacePreferences,
  ) => {
    void imdxApi.savePreferences(preferences);
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

  const handleUpdateApplicationStatus = (status: ApplicationReviewStatus, note?: string) => {
    void imdxApi.updateApplicationDecision(store.onboarding.applicationNumber, status, note);
    setStore((prev) => ({
      ...prev,
      applicationStatus: status,
      reviewNote: note !== undefined ? note : prev.reviewNote,
    }));
  };

  const handleResetDemoData = () => {
    const fresh = clearLocalStore();
    setStore(fresh);
  };

  const userDisplayName =
    store.onboarding.representative.name ||
    store.onboarding.registration.fullName ||
    'Aarav Mehta';

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
          onGoToLanding={() => {
            setAppSection('landing');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onGoToOnboarding={openOnboarding}
        >
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
                      const offer = CATALOG_OFFERS.find((o) => o.id === offerId);
                      handleTriggerTransfer(
                        offer?.title ?? 'Catalog Dataset',
                        offer?.protocol ?? 'GTFS',
                        'Inbound',
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
        />

        <main>
          <Suspense fallback={<PanelLoadingFallback />}>
            {store.onboarding.stage === 'register' && (
              <div key="register" className="imdx-stage-enter">
                <RegisterScreen
                  data={store.onboarding.registration}
                  onChange={(registration) => updateOnboarding((prev) => ({ ...prev, registration }))}
                  onSubmit={handleStartApplication}
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
                      onNext={() => goToStage(2)}
                    />
                  )}

                  {store.onboarding.stage === 2 && (
                    <OnboardStep02
                      data={store.onboarding.representative}
                      onChange={(representative) =>
                        updateOnboarding((prev) => ({ ...prev, representative }))
                      }
                      onBack={() => goToStage(1)}
                      onNext={() => goToStage(3)}
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
