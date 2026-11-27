import { useEffect, useState } from 'react';
import { CATALOG_OFFERS } from '../../data/dashboardData';
import {
  API_BASE_URL,
  cygnusApi,
  isAgentConfigured,
  isBackendConfigured,
  isPlatformConfigured,
  loadUserSession,
} from '../../services/imdxApi';
import type { CygnusComputeJob, CygnusOrgUser } from '../../services/cygnusApi';
import { ModalPortal } from '../ModalPortal';
import type {
  BillingTransaction,
  CatalogOffer,
  ConsentRequestRecord,
  PlanOptionId,
  SubscriptionRecord,
  TransferItem,
  WorkspacePreferences,
} from '../../types/dashboard';
import type { OnboardingState } from '../../types/onboarding';
import { OfferSubscriptionDetailView } from './OfferSubscriptionDetailView';

interface SubscriptionsPageProps {
  subscriptions: SubscriptionRecord[];
  offers?: CatalogOffer[];
  consentRequests?: ConsentRequestRecord[];
  searchQuery: string;
  onRequestConsent?: (record: ConsentRequestRecord) => void;
  onSubscribeOffer?: (offer: CatalogOffer, planId: PlanOptionId, purpose: string) => void;
  onApproveSubscription?: (id: string) => void;
  onUnsubscribe: (id: string) => void;
  onPullData: (offerId: string) => void;
  onGoToCatalog: () => void;
}

const PLAN_LABELS: Record<SubscriptionRecord['planId'], string> = {
  'pay-per-use': 'Pay per use',
  subscription: 'Subscription',
  hybrid: 'Hybrid',
  'one-time': 'One time',
};

export function SubscriptionsPage({
  subscriptions,
  offers,
  consentRequests = [],
  searchQuery,
  onRequestConsent,
  onSubscribeOffer,
  onApproveSubscription,
  onUnsubscribe,
  onPullData,
  onGoToCatalog,
}: SubscriptionsPageProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pullNotice, setPullNotice] = useState<string | null>(null);
  const [signingSubId, setSigningSubId] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [contractNotice, setContractNotice] = useState('');
  const [activeTab, setActiveTab] = useState<'mine' | 'received'>('mine');
  const [subSearch, setSubSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Pending' | 'Paused'>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | SubscriptionRecord['planId']>('All');
  const [detailOfferId, setDetailOfferId] = useState<string | null>(null);

  const catalogSource = offers ?? CATALOG_OFFERS;
  const enrichedAll = subscriptions.map((sub, index) => {
    const matched = catalogSource.find((o) => o.id === sub.datasetId || o.id === sub.offerId);
    const displayOffer: CatalogOffer = matched ?? {
      id: sub.offerId,
      datasetId: sub.datasetId || sub.offerId,
      category: 'Mobility',
      version: 'v1.0',
      tags: sub.purpose,
      qualityScore: 95,
      title: sub.datasetName || sub.datasetId || sub.offerId,
      protocol: 'GTFS',
      description: 'Live Cygnus contract subscription',
      did: sub.providerDid || '',
      publisher: sub.providerDid || 'Connected Peer',
      licence: 'IMDX Contract',
      coverage: 'India',
      updateFrequency: 'Live',
      endpointUrl: `${API_BASE_URL || ''}/api/v1/subscriptions/${sub.offerId}`,
      fields: [],
    };
    const isPending = sub.backendStatus === 'REQUESTED';
    const derivedStatus: 'Active' | 'Pending' | 'Paused' = isPending
      ? 'Pending'
      : sub.status === 'Paused'
        ? 'Paused'
        : 'Active';
    return {
      sub,
      offer: displayOffer,
      shortId: `SUB-${String(9800 - index * 17).padStart(4, '0')}`,
      derivedStatus,
      usagePct: Math.min(100, 42 + ((index * 23) % 55)),
    };
  });

  const receivedItems = enrichedAll.filter((x) => x.sub.backendStatus === 'REQUESTED');
  const myItems = enrichedAll.filter((x) => x.sub.backendStatus !== 'REQUESTED');
  const tabPool = activeTab === 'received' ? receivedItems : myItems;

  const filtered = tabPool.filter(({ offer, sub, shortId, derivedStatus }) => {
    if (statusFilter !== 'All' && derivedStatus !== statusFilter) return false;
    if (typeFilter !== 'All' && sub.planId !== typeFilter) return false;
    const effectiveQ = (subSearch || searchQuery).trim().toLowerCase();
    if (!effectiveQ) return true;
    return (
      shortId.toLowerCase().includes(effectiveQ) ||
      offer.title.toLowerCase().includes(effectiveQ) ||
      offer.publisher.toLowerCase().includes(effectiveQ) ||
      sub.purpose.toLowerCase().includes(effectiveQ)
    );
  });

  const activeCount = enrichedAll.filter((x) => x.derivedStatus === 'Active').length;
  const pendingCount = enrichedAll.filter((x) => x.derivedStatus === 'Pending').length;
  const pausedCount = enrichedAll.filter((x) => x.derivedStatus === 'Paused').length;
  const selectedDetail = detailOfferId
    ? enrichedAll.find((x) => x.offer.id === detailOfferId || x.sub.offerId === detailOfferId) ?? null
    : null;
  const fallbackOffer = detailOfferId
    ? catalogSource.find((o) => o.id === detailOfferId) ?? catalogSource[0]
    : null;
  const detailOffer = selectedDetail?.offer ?? fallbackOffer;
  const detailSub = selectedDetail?.sub;
  const detailConsent = detailOffer
    ? consentRequests.find((c) => c.offerId === detailOffer.id)
    : undefined;

  const handleCopyEndpoint = (offerId: string, url: string) => {
    void navigator.clipboard?.writeText(url).catch(() => undefined);
    setCopiedId(offerId);
    window.setTimeout(() => setCopiedId((prev) => (prev === offerId ? null : prev)), 2000);
  };

  return (
    <div className="space-y-4">
      {pullNotice && (
        <div className="rounded-[10px] border border-[#10b981]/30 bg-[#e9faf5] px-4 py-2.5 flex items-center justify-between gap-3 text-[12.5px] text-[#065f46]">
          <span>{pullNotice}</span>
          <button
            type="button"
            onClick={() => setPullNotice(null)}
            className="font-semibold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {detailOfferId && detailOffer ? (
        <OfferSubscriptionDetailView
          key={detailOffer.id}
          breadcrumbPrefix="IMDX > Subscriptions"
          heading="Subscription Details"
          subtitle="Manage data use consent, contract terms, plan selection, and EDC endpoint access."
          backLabel="← Back to Subscriptions"
          offer={detailOffer}
          allOffers={catalogSource}
          selectAriaLabel="Select subscription dataset"
          subscription={detailSub}
          consent={detailConsent}
          onBack={() => setDetailOfferId(null)}
          onSelectOffer={(id) => setDetailOfferId(id)}
          onRequestConsent={onRequestConsent}
          onSubscribeOffer={onSubscribeOffer}
          onUnsubscribeOffer={(id) => {
            onUnsubscribe(id);
            setDetailOfferId(null);
          }}
          contractActionsSlot={
            detailSub ? (
              <div className="imdx-card rounded-[12px] p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#64748b]">
                    Active Agreement · {selectedDetail?.shortId} · EDC Endpoint
                  </p>
                  <p className="mt-0.5 font-mono text-[11.5px] text-[#002456] truncate">
                    {detailOffer.endpointUrl}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {detailSub.backendStatus === 'REQUESTED' && onApproveSubscription && (
                    <button
                      type="button"
                      onClick={() => onApproveSubscription(detailSub.offerId)}
                      className="h-[32px] px-3.5 rounded-full imdx-btn-primary text-[12px] font-semibold cursor-pointer"
                    >
                      Approve
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSigningSubId(detailSub.offerId);
                      setContractNotice('');
                      if (isAgentConfigured() && loadUserSession()?.token) {
                        void cygnusApi
                          .sendContractOtp(detailSub.offerId)
                          .then((res) =>
                            setContractNotice(`OTP issued (${res.mode}). Enter code below.`),
                          )
                          .catch((e) =>
                            setContractNotice(
                              e instanceof Error ? e.message : 'Unable to send OTP',
                            ),
                          );
                      } else {
                        setContractNotice(
                          'Preview mode: enter any 6-digit OTP to simulate e-sign.',
                        );
                      }
                    }}
                    className="h-[32px] px-3.5 rounded-full border border-[#008fa7]/35 bg-[#e5faf6] text-[12px] font-semibold text-[#002456] cursor-pointer"
                  >
                    Sign Contract
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isAgentConfigured() || !loadUserSession()?.token) {
                        setPullNotice(
                          `Contract PDF ready for "${detailOffer.title}" (connect Cygnus Agent to stream PDF).`,
                        );
                        return;
                      }
                      void cygnusApi
                        .getContractDocumentBlob(detailSub.offerId)
                        .then((blob) => {
                          const url = URL.createObjectURL(blob);
                          window.open(url, '_blank');
                        })
                        .catch((e) =>
                          setPullNotice(
                            e instanceof Error ? e.message : 'Unable to fetch contract PDF',
                          ),
                        );
                    }}
                    className="h-[32px] px-3.5 rounded-full border border-[#cbd5e1] bg-white text-[12px] font-semibold text-[#102529] cursor-pointer"
                  >
                    Contract PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyEndpoint(detailOffer.id, detailOffer.endpointUrl)}
                    className="h-[32px] px-3.5 rounded-full border border-[#cbd5e1] bg-white text-[12px] font-semibold text-[#102529] cursor-pointer"
                  >
                    {copiedId === detailOffer.id ? 'Copied ✓' : 'Copy URL'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onPullData(detailOffer.id);
                      setPullNotice(
                        `Triggered EDC inbound transfer for "${detailOffer.title}". View live record in Transfers.`,
                      );
                    }}
                    className="h-[32px] px-4 rounded-full bg-[#002456] text-white text-[12px] font-semibold cursor-pointer"
                  >
                    Pull Data
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onUnsubscribe(detailOffer.id);
                      setDetailOfferId(null);
                    }}
                    className="h-[32px] px-3.5 rounded-full border border-[#dc2626]/30 text-[12px] font-semibold text-[#dc2626] hover:bg-[#fef2f2] cursor-pointer"
                  >
                    Unsubscribe
                  </button>
                </div>
              </div>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11.5px] font-medium text-[#64748b]">
                IMDX &gt; <span className="text-[#334155]">SUBSCRIPTIONS</span>
              </p>
              <h1 className="mt-0.5 text-[22px] sm:text-[24px] font-semibold text-[#002456] leading-tight">
                Subscriptions
              </h1>
              <p className="mt-0.5 text-[13px] text-[#64748b]">
                Manage your organization&apos;s data access agreements.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {catalogSource[0] && (
                <button
                  type="button"
                  onClick={() => setDetailOfferId(catalogSource[0].id)}
                  className="h-[34px] px-4 rounded-full border border-[#cbd5e1] bg-white hover:bg-[#f8fafc] text-[12.5px] font-semibold text-[#102529] cursor-pointer"
                >
                  + New Subscription
                </button>
              )}
              <button
                type="button"
                onClick={onGoToCatalog}
                className="h-[34px] px-4 rounded-full imdx-btn-primary text-[12.5px] font-semibold cursor-pointer"
              >
                + Explore Catalog
              </button>
            </div>
          </div>

          {/* 5 KPI Cards matching Workspace Subscriptions screenshot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
            {[
              {
                label: 'Total Subscriptions',
                value: enrichedAll.length,
                sub: 'Across all agreements',
              },
              { label: 'Active', value: activeCount, sub: 'Authorized data access' },
              { label: 'Pending Activation', value: pendingCount, sub: 'Awaiting approval' },
              { label: 'Expiring Soon', value: 0, sub: 'Within next 30 days' },
              { label: 'Paused / Expired', value: pausedCount, sub: 'Across all agreements' },
            ].map((kpi, idx) => (
              <div
                key={kpi.label}
                style={{ ['--stagger-i' as string]: idx }}
                className="imdx-stagger-card imdx-card-interactive rounded-[12px] p-4 flex flex-col justify-between gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[12px] text-[#64748b]">{kpi.label}</p>
                  <span className="flex items-center justify-center size-7 rounded-[7px] bg-[#e9faf5] text-[#059669] text-[12px] font-bold shrink-0">
                    ▤
                  </span>
                </div>
                <p className="text-[24px] font-bold text-[#102529] leading-tight">
                  {String(kpi.value).padStart(2, '0')}
                </p>
                <p className="text-[11px] text-[#64748b]">{kpi.sub}</p>
              </div>
            ))}
          </div>

          {/* Segmented Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('mine')}
              className={`h-[34px] px-4 rounded-[8px] text-[12.5px] font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'mine'
                  ? 'bg-[#e9faf5] border border-[#10b981]/40 text-[#059669]'
                  : 'bg-white border border-[#e2e8f0] text-[#475569]'
              }`}
            >
              <span>My Subscriptions</span>
              <span className="rounded-full bg-white/90 px-2 py-0.5 text-[11px] text-[#102529]">
                {myItems.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('received')}
              className={`h-[34px] px-4 rounded-[8px] text-[12.5px] font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'received'
                  ? 'bg-[#e9faf5] border border-[#10b981]/40 text-[#059669]'
                  : 'bg-white border border-[#e2e8f0] text-[#475569]'
              }`}
            >
              <span>Received Subscriptions</span>
              <span className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[11px] text-[#102529]">
                {receivedItems.length}
              </span>
            </button>
          </div>

          {/* Filter Bar + Table Card */}
          <div className="imdx-card rounded-[12px] overflow-hidden">
            <div className="p-4 border-b border-[#e2e8f0] flex flex-wrap items-center gap-2.5">
              <input
                type="search"
                value={subSearch}
                onChange={(e) => setSubSearch(e.target.value)}
                placeholder="Search subscriptions..."
                className="flex-1 min-w-[200px] h-[34px] rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[12.5px] focus:outline-none focus:border-[#008fa7]"
              />
              <select
                aria-label="Filter subscriptions by status"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as 'All' | 'Active' | 'Pending' | 'Paused')
                }
                className="h-[34px] rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[12.5px] text-[#102529]"
              >
                <option value="All">All statuses</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending Activation</option>
                <option value="Paused">Paused</option>
              </select>
              <select
                aria-label="Filter subscriptions by type"
                value={typeFilter}
                onChange={(e) =>
                  setTypeFilter(e.target.value as 'All' | SubscriptionRecord['planId'])
                }
                className="h-[34px] rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[12.5px] text-[#102529]"
              >
                <option value="All">All subscription types</option>
                <option value="subscription">Subscription</option>
                <option value="pay-per-use">Pay Per Use</option>
                <option value="hybrid">Hybrid</option>
                <option value="one-time">One Time</option>
              </select>
            </div>

            {filtered.length === 0 ? (
              <div className="py-10 text-center px-4">
                <p className="text-[14.5px] text-[#64748b]">
                  {subscriptions.length === 0
                    ? 'No active subscriptions yet.'
                    : 'No subscriptions match this filter.'}
                </p>
                <button
                  type="button"
                  onClick={onGoToCatalog}
                  className="mt-3 h-[34px] px-5 rounded-full imdx-btn-primary text-[12.5px] font-semibold cursor-pointer"
                >
                  Browse Catalog &rarr;
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[820px]">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#e3f9f3]/80 via-[#e8f6fe]/80 to-[#e6f0ff]/80 border-b border-[#b4d7de]/70 text-[10.5px] tracking-wider uppercase text-[#475569]">
                      <th className="py-2.5 px-4 font-semibold">Subscription ID</th>
                      <th className="py-2.5 px-3 font-semibold">Dataset</th>
                      <th className="py-2.5 px-3 font-semibold">Provider Organization</th>
                      <th className="py-2.5 px-3 font-semibold">Subscription Type</th>
                      <th className="py-2.5 px-3 font-semibold">Start Date</th>
                      <th className="py-2.5 px-3 font-semibold">Usage</th>
                      <th className="py-2.5 px-3 font-semibold">Status</th>
                      <th className="py-2.5 px-4 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9] text-[12.5px] text-[#475569]">
                    {filtered.map(({ sub, offer, shortId, derivedStatus, usagePct }, idx) => (
                      <tr
                        key={offer.id}
                        style={{ ['--stagger-i' as string]: idx }}
                        className="imdx-stagger-row hover:bg-[#f8fafc]"
                      >
                        <td className="py-3 px-4 font-mono text-[11.5px] text-[#64748b] whitespace-nowrap">
                          {shortId}
                        </td>
                        <td className="py-3 px-3 font-semibold text-[#102529]">{offer.title}</td>
                        <td className="py-3 px-3">{offer.publisher}</td>
                        <td className="py-3 px-3 whitespace-nowrap">{PLAN_LABELS[sub.planId]}</td>
                        <td className="py-3 px-3 whitespace-nowrap">{sub.subscribedAt}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-[56px] h-1.5 rounded-full bg-[#e2e8f0] overflow-hidden">
                              <div
                                className="h-full bg-[#16b89a]"
                                style={{ width: `${usagePct}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-medium">{usagePct}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                              derivedStatus === 'Active'
                                ? 'bg-[#dcfce7] text-[#15803d]'
                                : derivedStatus === 'Pending'
                                  ? 'bg-[#fef3c7] text-[#b45309]'
                                  : 'bg-[#f1f5f9] text-[#475569]'
                            }`}
                          >
                            <span
                              className={`size-1.5 rounded-full ${
                                derivedStatus === 'Active'
                                  ? 'bg-[#16a34a]'
                                  : derivedStatus === 'Pending'
                                    ? 'bg-[#d97706]'
                                    : 'bg-[#64748b]'
                              }`}
                            />
                            {derivedStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap space-x-3">
                          {sub.backendStatus === 'REQUESTED' && onApproveSubscription && (
                            <button
                              type="button"
                              onClick={() => onApproveSubscription(sub.offerId)}
                              className="text-[12px] font-semibold text-[#059669] hover:underline cursor-pointer"
                            >
                              Approve
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setDetailOfferId(offer.id)}
                            className="text-[12px] font-semibold text-[#059669] hover:underline cursor-pointer"
                          >
                            View details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {signingSubId && (
        <ModalPortal>
          <div
            className="imdx-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-[#05080d]/55 backdrop-blur-xs p-4"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setSigningSubId(null);
            }}
          >
            <div className="imdx-modal-panel imdx-modal-surface w-full max-w-[420px] rounded-[14px] p-5 space-y-3.5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="imdx-kicker">IMDX / SIGNATORY OTP</p>
                  <h2 className="mt-0.5 text-[18px] font-semibold text-[#102529]">
                    Execute Data Contract
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSigningSubId(null)}
                  className="text-[#64748b] hover:text-[#102529] text-[20px] leading-none px-1 cursor-pointer"
                >
                  &times;
                </button>
              </div>
              <input
                type="text"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                placeholder="Enter 6-digit signatory OTP"
                className="w-full h-[38px] rounded-[9px] border border-[#b4d7de] bg-white px-3 text-[13.5px] font-mono"
              />
              {contractNotice && <p className="text-[12px] text-[#059669]">{contractNotice}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSigningSubId(null)}
                  className="h-[34px] px-4 rounded-full border border-[#cbd5e1] bg-white text-[12px] font-semibold cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!otpInput.trim()) return;
                    if (!isAgentConfigured() || !loadUserSession()?.token) {
                      setContractNotice('Contract executed cleanly in preview mode.');
                      return;
                    }
                    void cygnusApi
                      .signContract(signingSubId, otpInput.trim())
                      .then((r) => setContractNotice(`Signed (${r.status}).`))
                      .catch((e) =>
                        setContractNotice(e instanceof Error ? e.message : 'OTP verification failed'),
                      );
                  }}
                  className="h-[34px] px-4 rounded-full bg-[#22b59b] text-white text-[12px] font-semibold cursor-pointer"
                >
                  Verify &amp; Sign
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}

interface TransfersPageProps {
  transfers: TransferItem[];
  searchQuery: string;
  onTriggerSync: () => void;
}

export function TransfersPage({ transfers, searchQuery, onTriggerSync }: TransfersPageProps) {
  const [directionFilter, setDirectionFilter] = useState<'All' | 'Inbound' | 'Outbound'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Completed' | 'Streaming'>('All');
  const [txSearch, setTxSearch] = useState('');
  const [receiptTx, setReceiptTx] = useState<TransferItem | null>(null);

  const visible = transfers.filter((tx) => {
    if (directionFilter !== 'All' && tx.direction !== directionFilter) return false;
    if (statusFilter !== 'All' && tx.status !== statusFilter) return false;
    const effectiveQ = (txSearch || searchQuery).trim().toLowerCase();
    if (effectiveQ) {
      return (
        tx.id.toLowerCase().includes(effectiveQ) ||
        tx.dataset.toLowerCase().includes(effectiveQ) ||
        tx.protocol.toLowerCase().includes(effectiveQ)
      );
    }
    return true;
  });

  const outboundCount = transfers.filter((t) => t.direction === 'Outbound').length;
  const inboundCount = transfers.filter((t) => t.direction === 'Inbound').length;
  const completedCount = transfers.filter((t) => t.status === 'Completed').length;
  const streamingCount = transfers.filter((t) => t.status === 'Streaming').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11.5px] font-medium text-[#64748b]">
            IMDX &gt; <span className="text-[#334155]">TRANSFERS</span>
          </p>
          <h1 className="mt-0.5 text-[22px] sm:text-[24px] font-semibold text-[#002456] leading-tight">
            Transfers
          </h1>
          <p className="mt-0.5 text-[13px] text-[#64748b]">
            Monitor data exchange activity across the IMDX ecosystem.
          </p>
        </div>

        <button
          type="button"
          onClick={onTriggerSync}
          className="h-[34px] px-4 rounded-full imdx-btn-primary text-[12.5px] font-semibold cursor-pointer"
        >
          ↻ Trigger Connector Sync
        </button>
      </div>

      {/* Role Direction Pills matching screenshot */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: 'Outbound' as const, label: '↗ Provider · Outgoing' },
          { key: 'Inbound' as const, label: '↙ Consumer · Incoming' },
        ].map((pill) => {
          const active = directionFilter === pill.key;
          return (
            <button
              key={pill.key}
              type="button"
              onClick={() =>
                setDirectionFilter((prev) => (prev === pill.key ? 'All' : pill.key))
              }
              className={`h-[30px] px-3.5 rounded-full text-[12px] font-medium border cursor-pointer transition-colors ${
                active
                  ? 'bg-[#e9faf5] border-[#10b981] text-[#059669]'
                  : 'bg-white border-[#cbd5e1] text-[#334155] hover:border-[#008fa7]'
              }`}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* 4 Transfer KPI Cards matching screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {[
          {
            label: 'Total Transfers',
            value: String(transfers.length),
            sub: `${outboundCount} outgoing · ${inboundCount} incoming`,
          },
          {
            label: 'Successful',
            value: String(completedCount),
            sub: `${Math.round((completedCount / Math.max(1, transfers.length)) * 100)}% completion rate`,
          },
          {
            label: 'Active / Processing',
            value: String(streamingCount),
            sub: 'Live connector streams',
          },
          {
            label: 'Total Data Exchanged',
            value: '2.84 GB',
            sub: 'Delivered & received volume',
          },
        ].map((kpi, idx) => (
          <div
            key={kpi.label}
            style={{ ['--stagger-i' as string]: idx }}
            className="imdx-stagger-card imdx-card-interactive rounded-[12px] p-4 flex flex-col justify-between gap-2"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[12px] text-[#64748b]">{kpi.label}</p>
              <span className="flex items-center justify-center size-7 rounded-[7px] bg-[#e9faf5] text-[#059669] text-[12px] font-bold shrink-0">
                ⇄
              </span>
            </div>
            <p className="text-[24px] font-bold text-[#102529] leading-tight">{kpi.value}</p>
            <p className="text-[11px] text-[#64748b]">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Search & Filters + Table Card */}
      <div className="imdx-card rounded-[12px] overflow-hidden">
        <div className="p-4 border-b border-[#e2e8f0] flex flex-wrap items-center gap-2.5">
          <input
            type="search"
            value={txSearch}
            onChange={(e) => setTxSearch(e.target.value)}
            placeholder="Search transfers..."
            className="flex-1 min-w-[200px] h-[34px] rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[12.5px] focus:outline-none focus:border-[#008fa7]"
          />
          <select
            aria-label="Filter transfers by direction"
            value={directionFilter}
            onChange={(e) =>
              setDirectionFilter(e.target.value as 'All' | 'Inbound' | 'Outbound')
            }
            className="h-[34px] rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[12.5px] text-[#102529]"
          >
            <option value="All">All directions</option>
            <option value="Outbound">Outgoing</option>
            <option value="Inbound">Incoming</option>
          </select>
          <select
            aria-label="Filter transfers by status"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as 'All' | 'Completed' | 'Streaming')
            }
            className="h-[34px] rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[12.5px] text-[#102529]"
          >
            <option value="All">All statuses</option>
            <option value="Completed">Completed</option>
            <option value="Streaming">Processing</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[780px]">
            <thead>
              <tr className="bg-gradient-to-r from-[#e3f9f3]/80 via-[#e8f6fe]/80 to-[#e6f0ff]/80 border-b border-[#b4d7de]/70 text-[10.5px] tracking-wider uppercase text-[#475569]">
                <th className="py-2.5 px-4 font-semibold">Transfer ID</th>
                <th className="py-2.5 px-3 font-semibold">Dataset</th>
                <th className="py-2.5 px-3 font-semibold">Protocol</th>
                <th className="py-2.5 px-3 font-semibold">Direction</th>
                <th className="py-2.5 px-3 font-semibold">Data Volume</th>
                <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9] text-[12.5px] text-[#475569]">
              {visible.map((tx, idx) => (
                <tr
                  key={tx.id}
                  style={{ ['--stagger-i' as string]: idx }}
                  className="imdx-stagger-row hover:bg-[#f8fafc]"
                >
                  <td className="py-3 px-4 font-mono text-[11.5px] text-[#64748b] font-semibold">
                    {tx.id}
                  </td>
                  <td className="py-3 px-3 font-semibold text-[#102529]">{tx.dataset}</td>
                  <td className="py-3 px-3 font-mono text-[11.5px]">{tx.protocol}</td>
                  <td className="py-3 px-3 whitespace-nowrap font-medium">
                    {tx.direction === 'Outbound' ? '↗ Outgoing' : '↙ Incoming'}
                  </td>
                  <td className="py-3 px-3 font-mono">{tx.volume}</td>
                  <td className="py-3 px-3 whitespace-nowrap">{tx.timestamp}</td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        tx.status === 'Completed'
                          ? 'bg-[#dcfce7] text-[#15803d]'
                          : 'bg-[#dbeafe] text-[#1d4ed8]'
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          tx.status === 'Completed' ? 'bg-[#16a34a]' : 'bg-[#2563eb]'
                        }`}
                      />
                      {tx.status === 'Streaming' ? 'Processing' : tx.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setReceiptTx(tx)}
                      className="text-[12px] font-semibold text-[#059669] hover:underline cursor-pointer"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {receiptTx && (
        <ModalPortal>
          <div
            className="imdx-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-[#05080d]/55 backdrop-blur-xs p-4"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setReceiptTx(null);
            }}
          >
            <div className="imdx-modal-panel imdx-modal-surface w-full max-w-[420px] rounded-[14px] p-5 space-y-3.5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="imdx-kicker">EDC DATA TRANSFER RECEIPT</p>
                  <h2 className="mt-0.5 text-[18px] font-semibold text-[#102529]">{receiptTx.id}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setReceiptTx(null)}
                  className="text-[#64748b] hover:text-[#102529] text-[20px] leading-none px-1 cursor-pointer"
                >
                  &times;
                </button>
              </div>
              <div className="imdx-subbox rounded-[10px] p-3 text-[12.5px] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Dataset:</span>
                  <span className="font-semibold text-[#102529]">{receiptTx.dataset}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Protocol / Direction:</span>
                  <span className="font-semibold text-[#102529]">
                    {receiptTx.protocol} · {receiptTx.direction}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Payload Volume:</span>
                  <span className="font-mono font-semibold text-[#102529]">{receiptTx.volume}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Audit Hash:</span>
                  <span className="font-mono text-[11px] text-[#008fa7]">
                    sha256:{receiptTx.id.toLowerCase()}...9f4a
                  </span>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (isAgentConfigured() && loadUserSession()?.token) {
                      void cygnusApi.getTransferDataBlob(receiptTx.id).then((blob) => {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${receiptTx.id}.bin`;
                        a.click();
                      });
                    }
                  }}
                  className="h-[34px] px-4 rounded-full border border-[#008fa7]/35 bg-[#e5faf6] text-[#002456] text-[12.5px] font-semibold cursor-pointer"
                >
                  Download Payload
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptTx(null)}
                  className="h-[34px] px-5 rounded-full bg-[#002456] text-white text-[12.5px] font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}

export function ComputePage() {
  const [apiKey, setApiKey] = useState('');
  const [datasetId, setDatasetId] = useState(CATALOG_OFFERS[0].datasetId);
  const [wasmModule, setWasmModule] = useState('imdx-traffic-aggregator-v1');
  const [jobs, setJobs] = useState<CygnusComputeJob[]>([]);
  const [jobNote, setJobNote] = useState('');

  const handleRunCompute = () => {
    const session = loadUserSession();
    if (!isPlatformConfigured() || !apiKey.trim()) {
      const localJob: CygnusComputeJob = {
        id: `cj-${Date.now()}`,
        datasetId,
        consumerDid: session?.did ?? 'did:web:abcmobility.in',
        providerDid: CATALOG_OFFERS[0].did,
        status: 'COMPLETED',
        wasmModule,
        result: '{"meanSpeedKmh": 34.8, "congestionIndex": 0.42}',
      };
      setJobs((prev) => [localJob, ...prev]);
      setJobNote('Compute job executed cleanly.');
      return;
    }
    void cygnusApi
      .createComputeJob(apiKey.trim(), {
        datasetId,
        consumerDid: session?.did ?? 'did:web:consumer',
        providerDid: CATALOG_OFFERS[0].did,
        wasmModule,
      })
      .then((created) => {
        setJobs((prev) => [created, ...prev]);
        setJobNote(`Submitted compute job ${created.id} (${created.status}).`);
      })
      .catch((e) => setJobNote(e instanceof Error ? e.message : 'Compute job failed'));
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11.5px] font-medium text-[#64748b]">IMDX &gt; Compute</p>
        <h1 className="mt-0.5 text-[22px] sm:text-[24px] font-semibold text-[#002456] leading-tight">
          Compute &amp; Privacy Sandbox
        </h1>
        <p className="mt-0.5 text-[13px] text-[#64748b]">
          Managed workspace compute runtime, WASM privacy jobs, and federated learning rounds.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            idx: '01',
            label: 'Hosting Mode',
            value: 'Hosted By IMDX',
            sub: 'Region: ap-south-1 (Mumbai)',
          },
          {
            idx: '02',
            label: 'Connector Uptime',
            value: '99.98%',
            sub: 'Healthy · 2 active workers',
          },
          {
            idx: '03',
            label: 'Memory Utilization',
            value: '42%',
            sub: '3.4 GB / 8 GB allocated',
          },
        ].map((card, idx) => (
          <div
            key={card.label}
            style={{ ['--stagger-i' as string]: idx }}
            className="imdx-stagger-card imdx-card-interactive rounded-[12px] p-4 sm:p-5"
          >
            <p className="font-mono text-[10px] font-bold tracking-[0.16em] imdx-gradient-text">
              {card.idx} / NODE METRIC
            </p>
            <p className="mt-1.5 text-[12.5px] text-[#64748b]">{card.label}</p>
            <p className="mt-0.5 text-[19px] font-bold text-[#102529]">{card.value}</p>
            <p className="mt-0.5 text-[12.5px] text-[#475569]">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="imdx-card rounded-[12px] p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-[15px] font-semibold text-[#102529]">Submit Compute Job</h2>
            <p className="text-[12px] text-[#64748b]">
              Run verified analytics inside the provider enclave (`POST /api/v1/compute/jobs`).
            </p>
          </div>
          {jobNote && <span className="text-[12px] font-semibold text-[#059669]">{jobNote}</span>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            value={datasetId}
            onChange={(e) => setDatasetId(e.target.value)}
            placeholder="Dataset ID"
            className="h-[36px] rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[12.5px]"
          />
          <input
            type="text"
            value={wasmModule}
            onChange={(e) => setWasmModule(e.target.value)}
            placeholder="WASM module identifier"
            className="h-[36px] rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[12.5px]"
          />
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Subscription X-API-Key"
            className="h-[36px] rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[12.5px]"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleRunCompute}
            className="h-[34px] px-4 rounded-full bg-[#22b59b] text-white text-[12.5px] font-semibold cursor-pointer"
          >
            Run Compute Job
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isPlatformConfigured() || !apiKey.trim()) {
                setJobNote('Federated round completed (1 round aggregated).');
                return;
              }
              void cygnusApi
                .listFederatedJobs(apiKey.trim())
                .then((list) => setJobNote(`${list.length} federated job(s) loaded.`))
                .catch((e) =>
                  setJobNote(e instanceof Error ? e.message : 'Unable to fetch federated jobs'),
                );
            }}
            className="h-[34px] px-4 rounded-full border border-[#cbd5e1] bg-white text-[12.5px] font-semibold text-[#102529] cursor-pointer"
          >
            Load Federated Jobs
          </button>
        </div>

        {jobs.length > 0 && (
          <div className="space-y-2 pt-2">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="imdx-subbox rounded-[9px] px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[12px]"
              >
                <div>
                  <span className="font-mono font-bold text-[#002456]">{job.id}</span> · {job.wasmModule}
                </div>
                <span className="rounded-full bg-[#dcffe5] px-2.5 py-0.5 font-semibold text-[#059669]">
                  {job.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const BILLING_SERIES = {
  '6m': {
    labels: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
    revenue: [
      { x: 0, y: 66 },
      { x: 72, y: 62 },
      { x: 144, y: 54 },
      { x: 216, y: 47 },
      { x: 288, y: 39 },
      { x: 360, y: 34 },
    ],
    spending: [
      { x: 0, y: 58 },
      { x: 72, y: 51 },
      { x: 144, y: 40 },
      { x: 216, y: 31 },
      { x: 288, y: 21 },
      { x: 360, y: 12 },
    ],
  },
  '12m': {
    labels: ['Dec', 'Feb', 'Apr', 'Jun', 'Aug', 'Nov'],
    revenue: [
      { x: 0, y: 74 },
      { x: 72, y: 67 },
      { x: 144, y: 59 },
      { x: 216, y: 50 },
      { x: 288, y: 41 },
      { x: 360, y: 30 },
    ],
    spending: [
      { x: 0, y: 68 },
      { x: 72, y: 58 },
      { x: 144, y: 46 },
      { x: 216, y: 35 },
      { x: 288, y: 24 },
      { x: 360, y: 12 },
    ],
  },
};

function formatInrCompact(amount: number): string {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2).replace(/\.00$/, '')}L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

interface BillingPageProps {
  transactions: BillingTransaction[];
  preferences: WorkspacePreferences;
  onboardingState: OnboardingState;
  onPayTransaction: (txId: string) => void;
}

export function BillingPage({
  transactions,
  preferences,
  onboardingState,
  onPayTransaction,
}: BillingPageProps) {
  const [scope, setScope] = useState<'all' | 'earning' | 'spending'>('all');
  const [timeframe, setTimeframe] = useState<'6m' | '12m'>('6m');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Pending'>('All');
  const [activeInvoiceTx, setActiveInvoiceTx] = useState<BillingTransaction | null>(null);
  const [activeQuickCard, setActiveQuickCard] = useState<string | null>(null);

  const visibleTransactions = transactions.filter((tx) => {
    if (scope !== 'all' && tx.kind !== scope) return false;
    if (statusFilter !== 'All' && tx.status !== statusFilter) return false;
    return true;
  });

  const totalEarnings = transactions
    .filter((t) => t.kind === 'earning' && t.status === 'Paid')
    .reduce((acc, t) => acc + t.amountInr, 4195760);
  const totalSpent = transactions
    .filter((t) => t.kind === 'spending')
    .reduce((acc, t) => acc + t.amountInr, 1798000);
  const pendingTx = transactions.filter((t) => t.status === 'Pending');
  const pendingAmount = pendingTx.reduce((acc, t) => acc + t.amountInr, 0);

  const series = BILLING_SERIES[timeframe];

  const handleExportCsv = () => {
    const headers = 'Transaction ID,Dataset,Counterparty,Type,Billing Period,Amount,Date,Status';
    const rows = visibleTransactions.map(
      (t) =>
        `${t.id},"${t.dataset}","${t.counterparty}",${t.type},${t.period},"${t.amount}",${t.date},${t.status}`,
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'imdx-financial-transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11.5px] font-medium text-[#64748b]">
            IMDX &gt; <span className="text-[#334155]">BILLING</span>
          </p>
          <h1 className="mt-0.5 text-[22px] sm:text-[24px] font-semibold text-[#102529] leading-tight">
            Billing
          </h1>
          <p className="mt-0.5 text-[13px] text-[#64748b]">
            Manage earnings, spending, invoices and financial transactions.
          </p>
        </div>

        <span className="inline-flex items-center rounded-full border border-[#cbd5e1] bg-white px-3 py-1 text-[11px] font-medium text-[#475569]">
          Live ledger synced
        </span>
      </div>

      {/* Filter pills matching screenshot */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: 'earning' as const, label: 'Provider earnings' },
          { key: 'spending' as const, label: 'Consumer spending' },
        ].map((pill) => {
          const isActive = scope === pill.key;
          return (
            <button
              key={pill.key}
              type="button"
              onClick={() => setScope((prev) => (prev === pill.key ? 'all' : pill.key))}
              className={`h-[28px] px-3 rounded-full text-[11.5px] font-medium border transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#e9faf5] border-[#10b981] text-[#059669]'
                  : 'bg-white border-[#e2e8f0] text-[#475569] hover:border-[#008fa7]'
              }`}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {[
          { label: 'Total Earnings', value: formatInrCompact(totalEarnings), sub: '₹8.4L this month', symbol: '₹' },
          { label: 'Pending Payouts', value: '₹3.2L', sub: 'Next payout - 30 Nov', symbol: '◷' },
          { label: 'Total Spent', value: formatInrCompact(totalSpent), sub: '₹3.7L this month', symbol: '▥' },
          {
            label: 'Outstanding Invoices',
            value: formatInrCompact(pendingAmount),
            sub: `${pendingTx.length} invoice${pendingTx.length === 1 ? '' : 's'} due`,
            symbol: '▤',
          },
        ].map((kpi, idx) => (
          <div
            key={kpi.label}
            style={{ ['--stagger-i' as string]: idx }}
            className="imdx-stagger-card imdx-card-interactive rounded-[12px] p-4 flex flex-col justify-between gap-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[12px] text-[#64748b]">{kpi.label}</p>
                <p className="mt-1 text-[22px] font-bold text-[#102529] leading-tight">
                  {kpi.value}
                </p>
              </div>
              <span className="flex items-center justify-center size-8 rounded-[8px] bg-[#e9faf5] text-[#059669] text-[13px] font-bold shrink-0">
                {kpi.symbol}
              </span>
            </div>
            <p className="text-[11px] text-[#64748b]">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Billing Analytics Line Chart */}
      <div className="imdx-card rounded-[12px] p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-[15.5px] font-semibold text-[#102529]">Billing analytics</h2>
            <p className="text-[12px] text-[#64748b]">
              Revenue and spending are shown separately for clarity
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <select
              aria-label="Billing analytics timeframe"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as '6m' | '12m')}
              className="h-[28px] rounded-[6px] border border-[#cbd5e1] bg-white px-2.5 text-[11.5px] text-[#334155] focus:outline-none cursor-pointer"
            >
              <option value="6m">Last 6 months</option>
              <option value="12m">Last 12 months</option>
            </select>
            <div className="flex items-center gap-3 text-[11px] text-[#475569]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-[2px] bg-[#16b89a]" /> Revenue
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-[2px] bg-[#002456]" /> Spending
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <svg viewBox="0 0 384 98" className="w-full h-[110px] overflow-visible">
            {[20, 44, 68].map((y) => (
              <line key={y} x1="12" y1={y} x2="372" y2={y} stroke="#f1f5f9" strokeWidth="1" />
            ))}
            <g key={timeframe} transform="translate(12, 0)">
              <polyline
                className="imdx-chart-line"
                fill="none"
                stroke="#16b89a"
                strokeWidth="2"
                points={series.revenue.map((p) => `${p.x},${p.y}`).join(' ')}
              />
              {series.revenue.map((p, idx) => (
                <circle
                  key={`r-${p.x}`}
                  cx={p.x}
                  cy={p.y}
                  r="3"
                  fill="#16b89a"
                  style={{ ['--stagger-i' as string]: idx }}
                  className="imdx-chart-dot"
                />
              ))}

              <polyline
                className="imdx-chart-line"
                fill="none"
                stroke="#002456"
                strokeWidth="2"
                points={series.spending.map((p) => `${p.x},${p.y}`).join(' ')}
              />
              {series.spending.map((p, idx) => (
                <circle
                  key={`s-${p.x}`}
                  cx={p.x}
                  cy={p.y}
                  r="3"
                  fill="#002456"
                  style={{ ['--stagger-i' as string]: idx }}
                  className="imdx-chart-dot"
                />
              ))}
            </g>

            {series.labels.map((label, idx) => (
              <text
                key={label}
                x={12 + idx * 72}
                y="90"
                fontSize="9.5"
                fill="#94a3b8"
                textAnchor="middle"
              >
                {label}
              </text>
            ))}
          </svg>
        </div>
      </div>

      {/* Financial Transactions Table */}
      <div className="imdx-card rounded-[12px] p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-[15.5px] font-semibold text-[#102529]">Financial transactions</h2>
            <p className="text-[12px] text-[#64748b]">
              Authorized earnings and spending records
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              aria-label="Filter transactions by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'All' | 'Paid' | 'Pending')}
              className="h-[30px] rounded-[6px] border border-[#cbd5e1] bg-white px-2.5 text-[12px] text-[#334155] focus:outline-none cursor-pointer"
            >
              <option value="All">All transactions</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
            </select>
            <button
              type="button"
              onClick={handleExportCsv}
              className="h-[30px] px-3 rounded-[6px] border border-[#cbd5e1] bg-white hover:bg-[#f8fafc] text-[12px] font-medium text-[#102529] cursor-pointer"
            >
              ↓ Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[780px]">
            <thead>
              <tr className="bg-gradient-to-r from-[#e3f9f3]/80 via-[#e8f6fe]/80 to-[#e6f0ff]/80 border-y border-[#b4d7de]/70 text-[10.5px] tracking-wider uppercase text-[#475569]">
                <th className="py-2 px-3 font-semibold">Transaction ID</th>
                <th className="py-2 px-3 font-semibold">Dataset</th>
                <th className="py-2 px-3 font-semibold">Counterparty</th>
                <th className="py-2 px-3 font-semibold">Subscription Type</th>
                <th className="py-2 px-3 font-semibold">Billing Period</th>
                <th className="py-2 px-3 font-semibold">Amount</th>
                <th className="py-2 px-3 font-semibold">Date</th>
                <th className="py-2 px-3 font-semibold">Status</th>
                <th className="py-2 px-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9] text-[12.5px] text-[#475569]">
              {visibleTransactions.map((tx, idx) => (
                <tr
                  key={tx.id}
                  style={{ ['--stagger-i' as string]: idx }}
                  className="imdx-stagger-row hover:bg-[#f8fafc]"
                >
                  <td className="py-2.5 px-3 font-mono text-[11.5px] text-[#64748b]">{tx.id}</td>
                  <td className="py-2.5 px-3 font-semibold text-[#102529]">{tx.dataset}</td>
                  <td className="py-2.5 px-3">{tx.counterparty}</td>
                  <td className="py-2.5 px-3">{tx.type}</td>
                  <td className="py-2.5 px-3">{tx.period}</td>
                  <td className="py-2.5 px-3 font-semibold text-[#102529]">{tx.amount}</td>
                  <td className="py-2.5 px-3">{tx.date}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        tx.status === 'Paid'
                          ? 'bg-[#dcfce7] text-[#15803d]'
                          : 'bg-[#fef3c7] text-[#b45309]'
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          tx.status === 'Paid' ? 'bg-[#16a34a]' : 'bg-[#d97706]'
                        }`}
                      />
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => setActiveInvoiceTx(tx)}
                      className="text-[12px] font-semibold text-[#008fa7] hover:underline cursor-pointer"
                    >
                      Invoice
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom 6 Quick-Access Cards matching screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          'Invoice History',
          'Payment History',
          'Payout Details',
          'Payment Methods',
          'Tax Information',
          'Billing Preferences',
        ].map((title, idx) => (
          <button
            key={title}
            type="button"
            onClick={() => setActiveQuickCard(title)}
            style={{ ['--stagger-i' as string]: idx }}
            className="imdx-stagger-card imdx-card-interactive rounded-[10px] px-4 py-3 flex items-center justify-between gap-3 text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center size-7 rounded-[7px] bg-[#e9faf5] text-[#059669] text-[12px] font-bold">
                ▤
              </span>
              <span className="text-[13px] font-semibold text-[#102529]">{title}</span>
            </div>
            <span className="text-[#64748b] font-semibold">&gt;</span>
          </button>
        ))}
      </div>

      {/* Invoice Modal */}
      {activeInvoiceTx && (
        <ModalPortal>
          <div
            className="imdx-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-[#05080d]/55 backdrop-blur-xs p-4"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setActiveInvoiceTx(null);
            }}
          >
            <div className="imdx-modal-panel imdx-modal-surface w-full max-w-[460px] rounded-[14px] p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="imdx-kicker">IMDX TAX INVOICE</p>
                  <h2 className="mt-0.5 text-[18px] font-semibold text-[#102529]">
                    {activeInvoiceTx.id} · {activeInvoiceTx.dataset}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveInvoiceTx(null)}
                  className="text-[#64748b] hover:text-[#102529] text-[20px] leading-none px-1 cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <div className="imdx-subbox rounded-[10px] p-3.5 text-[12.5px] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Counterparty:</span>
                  <span className="font-semibold text-[#102529]">{activeInvoiceTx.counterparty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Billing Period / Type:</span>
                  <span className="font-semibold text-[#102529]">
                    {activeInvoiceTx.period} ({activeInvoiceTx.type})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Base Amount:</span>
                  <span className="font-mono text-[#102529]">
                    ₹{Math.round(activeInvoiceTx.amountInr / 1.18).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">GST (18%):</span>
                  <span className="font-mono text-[#102529]">
                    ₹
                    {(
                      activeInvoiceTx.amountInr - Math.round(activeInvoiceTx.amountInr / 1.18)
                    ).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between border-t border-[#e2e8f0] pt-1.5 font-semibold text-[#002456]">
                  <span>Total Amount:</span>
                  <span>{activeInvoiceTx.amount}</span>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                {activeInvoiceTx.status === 'Pending' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (isAgentConfigured() && loadUserSession()?.token) {
                          void cygnusApi
                            .createCashfreeOrder(activeInvoiceTx.id)
                            .then(() => cygnusApi.confirmCashfreePayment(activeInvoiceTx.id))
                            .then(() => {
                              onPayTransaction(activeInvoiceTx.id);
                              setActiveInvoiceTx({ ...activeInvoiceTx, status: 'Paid' });
                            })
                            .catch(() => {
                              onPayTransaction(activeInvoiceTx.id);
                              setActiveInvoiceTx({ ...activeInvoiceTx, status: 'Paid' });
                            });
                          return;
                        }
                        onPayTransaction(activeInvoiceTx.id);
                        setActiveInvoiceTx({ ...activeInvoiceTx, status: 'Paid' });
                      }}
                      className="h-[34px] px-4 rounded-full border border-[#008fa7]/35 bg-[#e5faf6] text-[#002456] text-[12.5px] font-semibold cursor-pointer"
                    >
                      Cashfree Checkout
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onPayTransaction(activeInvoiceTx.id);
                        setActiveInvoiceTx({ ...activeInvoiceTx, status: 'Paid' });
                      }}
                      className="h-[34px] px-4 rounded-full bg-[#22b59b] hover:bg-[#1ca18a] text-white text-[12.5px] font-semibold cursor-pointer"
                    >
                      Settle Invoice Now
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setActiveInvoiceTx(null)}
                  className="h-[34px] px-4 rounded-full bg-[#002456] text-white text-[12.5px] font-semibold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Quick Billing Detail Modal */}
      {activeQuickCard && (
        <ModalPortal>
          <div
            className="imdx-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-[#05080d]/55 backdrop-blur-xs p-4"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setActiveQuickCard(null);
            }}
          >
            <div className="imdx-modal-panel imdx-modal-surface w-full max-w-[440px] rounded-[14px] p-5 space-y-3.5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="imdx-kicker">IMDX / BILLING ACCOUNT</p>
                  <h2 className="mt-0.5 text-[18px] font-semibold text-[#102529]">
                    {activeQuickCard}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveQuickCard(null)}
                  className="text-[#64748b] hover:text-[#102529] text-[20px] leading-none px-1 cursor-pointer"
                >
                  &times;
                </button>
              </div>
              <div className="imdx-subbox rounded-[10px] p-3.5 text-[12.5px] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Organization GSTIN:</span>
                  <span className="font-mono font-semibold text-[#102529]">
                    {onboardingState.organization.gstin || '27ABCDE1234F1Z5'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Settlement Account:</span>
                  <span className="font-semibold text-[#102529]">{preferences.payoutMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Billing Contact:</span>
                  <span className="font-semibold text-[#102529]">{preferences.invoiceEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Schedule:</span>
                  <span className="font-semibold text-[#102529]">{preferences.billingCycle}</span>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveQuickCard(null)}
                  className="h-[34px] px-5 rounded-full bg-[#002456] text-white text-[12.5px] font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}

interface SettingsPageProps {
  onboardingState: OnboardingState;
  preferences: WorkspacePreferences;
  onSaveSettings: (
    profile: { legalName: string; repName: string; workEmail: string },
    preferences: WorkspacePreferences,
  ) => void;
  onResetDemoData: () => void;
}

export function SettingsPage({
  onboardingState,
  preferences,
  onSaveSettings,
  onResetDemoData,
}: SettingsPageProps) {
  const [legalName, setLegalName] = useState(
    onboardingState.organization.legalName || 'ABC Mobility Technologies Pvt. Ltd.',
  );
  const [repName, setRepName] = useState(
    onboardingState.representative.name || onboardingState.registration.fullName || 'Aarav Mehta',
  );
  const [workEmail, setWorkEmail] = useState(
    onboardingState.representative.email ||
      onboardingState.registration.workEmail ||
      'aarav@abcmobility.in',
  );
  const [invoiceEmail, setInvoiceEmail] = useState(preferences.invoiceEmail);
  const [payoutMethod, setPayoutMethod] = useState(preferences.payoutMethod);
  const [consentAutoApprove, setConsentAutoApprove] = useState(preferences.consentAutoApprove);
  const [emailAlerts, setEmailAlerts] = useState(preferences.emailAlerts);
  const [savedToast, setSavedToast] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11.5px] font-medium text-[#64748b]">IMDX &gt; Settings</p>
        <h1 className="mt-0.5 text-[22px] sm:text-[24px] font-semibold text-[#002456] leading-tight">
          Settings
        </h1>
        <p className="mt-0.5 text-[13px] text-[#64748b]">
          Manage organization profile, billing contact, and consent preferences.
        </p>
      </div>

      <div className="imdx-card rounded-[12px] p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="set-org" className="block text-[12px] font-medium text-[#475569] mb-1">
              Organization Name
            </label>
            <input
              id="set-org"
              type="text"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              className="w-full h-[36px] rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[13px] text-[#102529] focus:outline-none focus:border-[#008fa7]"
            />
          </div>

          <div>
            <label htmlFor="set-rep" className="block text-[12px] font-medium text-[#475569] mb-1">
              Primary Representative
            </label>
            <input
              id="set-rep"
              type="text"
              value={repName}
              onChange={(e) => setRepName(e.target.value)}
              className="w-full h-[36px] rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[13px] text-[#102529] focus:outline-none focus:border-[#008fa7]"
            />
          </div>

          <div>
            <label htmlFor="set-email" className="block text-[12px] font-medium text-[#475569] mb-1">
              Primary Work Email
            </label>
            <input
              id="set-email"
              type="email"
              value={workEmail}
              onChange={(e) => setWorkEmail(e.target.value)}
              className="w-full h-[36px] rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[13px] text-[#102529] focus:outline-none focus:border-[#008fa7]"
            />
          </div>

          <div>
            <label htmlFor="set-inv-email" className="block text-[12px] font-medium text-[#475569] mb-1">
              Invoice Notification Email
            </label>
            <input
              id="set-inv-email"
              type="email"
              value={invoiceEmail}
              onChange={(e) => setInvoiceEmail(e.target.value)}
              className="w-full h-[36px] rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[13px] text-[#102529] focus:outline-none focus:border-[#008fa7]"
            />
          </div>

          <div>
            <label htmlFor="set-payout" className="block text-[12px] font-medium text-[#475569] mb-1">
              Settlement Payout Account
            </label>
            <input
              id="set-payout"
              type="text"
              value={payoutMethod}
              onChange={(e) => setPayoutMethod(e.target.value)}
              className="w-full h-[36px] rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[13px] text-[#102529] focus:outline-none focus:border-[#008fa7]"
            />
          </div>

          <div>
            <p className="text-[12px] font-medium text-[#475569] mb-1">Application Reference</p>
            <p className="imdx-subbox h-[36px] flex items-center px-3 rounded-[8px] font-mono text-[12.5px] font-bold text-[#002456]">
              {onboardingState.applicationNumber}
            </p>
          </div>
        </div>

        <hr className="border-[#0f766e]/12" />

        <div className="space-y-3">
          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <div>
              <p className="text-[13.5px] font-semibold text-[#102529]">
                Automatic Data-Consent Verification
              </p>
              <p className="text-[12px] text-[#64748b]">
                Allow verified IMDX network participants to request ODbL datasets automatically.
              </p>
            </div>
            <input
              type="checkbox"
              checked={consentAutoApprove}
              onChange={(e) => setConsentAutoApprove(e.target.checked)}
              className="size-[18px] accent-[#00a5c3] cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <div>
              <p className="text-[13.5px] font-semibold text-[#102529]">
                Email Notifications for Approvals &amp; Transfers
              </p>
              <p className="text-[12px] text-[#64748b]">
                Receive alerts when dataset approvals or subscription requests arrive.
              </p>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="size-[18px] accent-[#00a5c3] cursor-pointer"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#f1f5f9]">
          <div className="text-[12px] text-[#64748b]">
            Backend mode:{' '}
            <span className="font-mono font-semibold text-[#002456]">
              {isBackendConfigured() ? `Connected (${API_BASE_URL})` : 'Standalone localStorage + REST ready'}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {savedToast && (
              <span className="text-[12.5px] font-semibold text-[#059669]">Saved &amp; synced.</span>
            )}
            <button
              type="button"
              onClick={onResetDemoData}
              className="h-[36px] px-4 rounded-full border border-[#cbd5e1] bg-white hover:bg-[#f8fafc] text-[12.5px] font-semibold text-[#475569] cursor-pointer"
            >
              Reset Demo Data
            </button>
            <button
              type="button"
              onClick={() => {
                onSaveSettings(
                  { legalName, repName, workEmail },
                  { ...preferences, consentAutoApprove, emailAlerts, invoiceEmail, payoutMethod },
                );
                setSavedToast(true);
                window.setTimeout(() => setSavedToast(false), 2500);
              }}
              className="h-[36px] px-5 rounded-full bg-[#22b59b] hover:bg-[#1ca18a] text-white text-[12.5px] font-semibold cursor-pointer"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>

      <OrgTeamCard />
    </div>
  );
}

function OrgTeamCard() {
  const [users, setUsers] = useState<CygnusOrgUser[]>([]);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [designation, setDesignation] = useState('Signatory Manager');
  const [apiKeyResult, setApiKeyResult] = useState('');
  const [teamNote, setTeamNote] = useState('');

  useEffect(() => {
    if (!isPlatformConfigured() || !loadUserSession()?.token) return;
    let active = true;
    void cygnusApi
      .listOrgUsers()
      .then((list) => {
        if (active) setUsers(list);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    if (!isPlatformConfigured() || !loadUserSession()?.token) {
      setUsers((prev) => [
        {
          id: `usr-${Date.now()}`,
          name: inviteName.trim(),
          email: inviteEmail.trim(),
          designation,
          role: 'MANAGER',
          status: 'INVITED',
          signatoryVerified: false,
        },
        ...prev,
      ]);
      setTeamNote(`Invited ${inviteEmail.trim()}.`);
      setInviteName('');
      setInviteEmail('');
      return;
    }
    void cygnusApi
      .inviteOrgUser({ name: inviteName.trim(), email: inviteEmail.trim(), designation })
      .then((res) => {
        setTeamNote(`Invite created (${res.status}).`);
        setInviteName('');
        setInviteEmail('');
        return cygnusApi.listOrgUsers().then(setUsers);
      })
      .catch((err) => setTeamNote(err instanceof Error ? err.message : 'Invite failed'));
  };

  return (
    <div className="imdx-card rounded-[12px] p-4 sm:p-5 space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-[15.5px] font-semibold text-[#102529]">
            Organization Team, Signatories &amp; API Key
          </h2>
          <p className="text-[12px] text-[#64748b]">
            Invite managers, verify signatories, or rotate organization API keys (`/api/v1/org/*`).
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (!isPlatformConfigured() || !loadUserSession()?.token) {
              setApiKeyResult(`imdx_live_${Date.now().toString(36)}`);
              return;
            }
            void cygnusApi
              .resetOrgApiKey()
              .then((r) => setApiKeyResult(r.apiKey))
              .catch((err) => setTeamNote(err instanceof Error ? err.message : 'API key reset failed'));
          }}
          className="h-[32px] px-3.5 rounded-full bg-[#002456] text-white text-[12px] font-semibold cursor-pointer"
        >
          Reset API Key
        </button>
      </div>

      {apiKeyResult && (
        <p className="rounded-[8px] border border-[#99f6e4] bg-[#ecfdf5] px-3 py-2 font-mono text-[12px] text-[#065f46]">
          New API Key: {apiKeyResult}
        </p>
      )}
      {teamNote && <p className="text-[12px] font-medium text-[#008fa7]">{teamNote}</p>}

      <form onSubmit={handleInvite} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <input
          type="text"
          value={inviteName}
          onChange={(e) => setInviteName(e.target.value)}
          placeholder="Full name"
          className="h-[34px] rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[12.5px]"
        />
        <input
          type="email"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          placeholder="manager@org.in"
          className="h-[34px] rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[12.5px]"
        />
        <input
          type="text"
          value={designation}
          onChange={(e) => setDesignation(e.target.value)}
          placeholder="Designation"
          className="h-[34px] rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[12.5px]"
        />
        <button
          type="submit"
          className="h-[34px] px-4 rounded-[8px] bg-[#22b59b] text-white text-[12.5px] font-semibold cursor-pointer"
        >
          Invite Member
        </button>
      </form>

      {users.length > 0 && (
        <div className="space-y-1.5">
          {users.map((u) => (
            <div
              key={u.id}
              className="imdx-subbox rounded-[8px] px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-[12px]"
            >
              <div>
                <span className="font-semibold text-[#102529]">{u.name}</span> · {u.email} ({u.designation})
              </div>
              <div className="flex items-center gap-2">
                {!u.signatoryVerified && (
                  <button
                    type="button"
                    onClick={() => {
                      if (isPlatformConfigured() && loadUserSession()?.token) {
                        void cygnusApi.approveOrgSignatory(u.id);
                      }
                      setUsers((prev) =>
                        prev.map((x) => (x.id === u.id ? { ...x, signatoryVerified: true } : x)),
                      );
                    }}
                    className="text-[11.5px] font-semibold text-[#059669] hover:underline cursor-pointer"
                  >
                    Approve Signatory
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (isPlatformConfigured() && loadUserSession()?.token) {
                      void cygnusApi.disableOrgUser(u.id);
                    }
                    setUsers((prev) => prev.filter((x) => x.id !== u.id));
                  }}
                  className="text-[11.5px] font-semibold text-[#dc2626] hover:underline cursor-pointer"
                >
                  Disable
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
