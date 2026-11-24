import { useState } from 'react';
import { ApplicationBanner } from './components/ApplicationBanner';
import { Header } from './components/Header';
import { StepProgress } from './components/StepProgress';
import { TrackApplicationModal } from './components/TrackApplicationModal';
import { AdminDashboardView } from './components/dashboard/AdminDashboardView';
import { CatalogPage } from './components/dashboard/CatalogPage';
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { MyDatasetsPage } from './components/dashboard/MyDatasetsPage';
import { RegisterDatasetModal } from './components/dashboard/RegisterDatasetModal';
import {
  BillingPage,
  ComputePage,
  SettingsPage,
  SubscriptionsPage,
  TransfersPage,
} from './components/dashboard/WorkspaceSubPages';
import { ApplicationSubmitted } from './components/steps/ApplicationSubmitted';
import { OnboardStep01 } from './components/steps/OnboardStep01';
import { OnboardStep02 } from './components/steps/OnboardStep02';
import { OnboardStep03 } from './components/steps/OnboardStep03';
import { OnboardStep04 } from './components/steps/OnboardStep04';
import { OnboardStep05 } from './components/steps/OnboardStep05';
import { OnboardStep06 } from './components/steps/OnboardStep06';
import { RegisterScreen } from './components/steps/RegisterScreen';
import { INITIAL_MY_DATASETS } from './data/dashboardData';
import { INITIAL_ONBOARDING_STATE } from './data/onboardingConstants';
import type { AdminNavKey, MyDatasetItem, WorkspaceNavKey } from './types/dashboard';
import type { OnboardingStage, OnboardingState } from './types/onboarding';

export function App() {
  const [appSection, setAppSection] = useState<'onboarding' | 'portal'>('onboarding');
  const [portalMode, setPortalMode] = useState<'workspace' | 'admin'>('workspace');
  const [activeWorkspaceNav, setActiveWorkspaceNav] = useState<WorkspaceNavKey>('dashboard');
  const [activeAdminNav, setActiveAdminNav] = useState<AdminNavKey>('dashboard');

  const [state, setState] = useState<OnboardingState>(INITIAL_ONBOARDING_STATE);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);

  const [datasets, setDatasets] = useState<MyDatasetItem[]>(INITIAL_MY_DATASETS);
  const [subscribedOfferIds, setSubscribedOfferIds] = useState<string[]>(['cat-1', 'cat-3']);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRegisterDatasetOpen, setIsRegisterDatasetOpen] = useState(false);

  const goToStage = (stage: OnboardingStage) => {
    setState((prev) => ({ ...prev, stage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openWorkspace = (nav: WorkspaceNavKey = 'dashboard') => {
    setPortalMode('workspace');
    setActiveWorkspaceNav(nav);
    setAppSection('portal');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartApplication = () => {
    setState((prev) => ({
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

  const handleToggleSubscribe = (offerId: string) => {
    setSubscribedOfferIds((prev) =>
      prev.includes(offerId) ? prev.filter((id) => id !== offerId) : [...prev, offerId],
    );
  };

  if (appSection === 'portal') {
    return (
      <>
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
          onGoToOnboarding={() => setAppSection('onboarding')}
        >
          {portalMode === 'admin' ? (
            <AdminDashboardView activeNav={activeAdminNav} onboardingState={state} />
          ) : (
            <>
              {activeWorkspaceNav === 'dashboard' && (
                <DashboardOverview
                  datasets={datasets}
                  subscriptionsCount={subscribedOfferIds.length}
                  onRegisterDatasetClick={() => setIsRegisterDatasetOpen(true)}
                  onNavigate={setActiveWorkspaceNav}
                />
              )}

              {activeWorkspaceNav === 'datasets' && (
                <MyDatasetsPage
                  datasets={datasets}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onRegisterDatasetClick={() => setIsRegisterDatasetOpen(true)}
                  onDeleteDataset={(id) =>
                    setDatasets((prev) => prev.filter((item) => item.id !== id))
                  }
                />
              )}

              {activeWorkspaceNav === 'catalog' && (
                <CatalogPage
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  subscribedOfferIds={subscribedOfferIds}
                  onToggleSubscribe={handleToggleSubscribe}
                />
              )}

              {activeWorkspaceNav === 'subscriptions' && (
                <SubscriptionsPage
                  subscribedOfferIds={subscribedOfferIds}
                  onToggleSubscribe={handleToggleSubscribe}
                  onGoToCatalog={() => setActiveWorkspaceNav('catalog')}
                />
              )}

              {activeWorkspaceNav === 'transfers' && <TransfersPage />}
              {activeWorkspaceNav === 'compute' && <ComputePage />}
              {activeWorkspaceNav === 'billing' && <BillingPage />}
              {activeWorkspaceNav === 'settings' && <SettingsPage onboardingState={state} />}
            </>
          )}
        </DashboardLayout>

        <RegisterDatasetModal
          isOpen={isRegisterDatasetOpen}
          onClose={() => setIsRegisterDatasetOpen(false)}
          onCreate={(ds) => setDatasets((prev) => [ds, ...prev])}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8] text-[#0f0f0f]">
      <Header
        onLogoClick={() => goToStage('register')}
        onTrackClick={() => setIsTrackModalOpen(true)}
        onOpenWorkspace={() => openWorkspace('dashboard')}
      />

      <main>
        {state.stage === 'register' && (
          <RegisterScreen
            data={state.registration}
            onChange={(registration) => setState((prev) => ({ ...prev, registration }))}
            onSubmit={handleStartApplication}
          />
        )}

        {typeof state.stage === 'number' && (
          <div className="max-w-[1380px] mx-auto px-4 sm:px-8 pt-10 pb-14">
            <ApplicationBanner
              applicationNumber={state.applicationNumber}
              underlineNumber={state.stage === 1}
            />

            <StepProgress currentStep={state.stage} onStepSelect={(step) => goToStage(step)} />

            {state.stage === 1 && (
              <OnboardStep01
                data={state.organization}
                onChange={(organization) => setState((prev) => ({ ...prev, organization }))}
                onNext={() => goToStage(2)}
              />
            )}

            {state.stage === 2 && (
              <OnboardStep02
                data={state.representative}
                onChange={(representative) => setState((prev) => ({ ...prev, representative }))}
                onBack={() => goToStage(1)}
                onNext={() => goToStage(3)}
              />
            )}

            {state.stage === 3 && (
              <OnboardStep03
                selected={state.deployment}
                onSelect={(deployment) => setState((prev) => ({ ...prev, deployment }))}
                onBack={() => goToStage(2)}
                onNext={() => goToStage(4)}
              />
            )}

            {state.stage === 4 && (
              <OnboardStep04
                documents={state.documents}
                onChange={(updater) =>
                  setState((prev) => ({ ...prev, documents: updater(prev.documents) }))
                }
                onBack={() => goToStage(3)}
                onNext={() => goToStage(5)}
              />
            )}

            {state.stage === 5 && (
              <OnboardStep05
                acceptedPolicies={state.acceptedPolicies}
                onChange={(acceptedPolicies) =>
                  setState((prev) => ({ ...prev, acceptedPolicies }))
                }
                onBack={() => goToStage(4)}
                onNext={() => goToStage(6)}
              />
            )}

            {state.stage === 6 && (
              <OnboardStep06
                state={state}
                onEditStep={(step) => goToStage(step)}
                onBack={() => goToStage(5)}
                onSubmitApplication={() => goToStage('submitted')}
              />
            )}
          </div>
        )}

        {state.stage === 'submitted' && (
          <ApplicationSubmitted
            applicationNumber={state.applicationNumber}
            workEmail={state.registration.workEmail || state.representative.email}
            onOpenWorkspace={() => openWorkspace('dashboard')}
          />
        )}
      </main>

      <TrackApplicationModal
        isOpen={isTrackModalOpen}
        onClose={() => setIsTrackModalOpen(false)}
        applicationNumber={state.applicationNumber}
        currentStage={state.stage}
        workEmail={state.registration.workEmail || state.representative.email}
      />
    </div>
  );
}

export default App;
