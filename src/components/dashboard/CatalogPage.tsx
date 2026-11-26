import { useMemo, useState } from 'react';
import { CATALOG_OFFERS } from '../../data/dashboardData';
import type {
  CatalogOffer,
  ConsentRequestRecord,
  PlanOptionId,
  SubscriptionRecord,
} from '../../types/dashboard';

interface CatalogPageProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  subscriptions: SubscriptionRecord[];
  consentRequests: ConsentRequestRecord[];
  onRequestConsent: (record: ConsentRequestRecord) => void;
  onSubscribeOffer: (offer: CatalogOffer, planId: PlanOptionId, purpose: string) => void;
  onUnsubscribeOffer: (offerId: string) => void;
}

type DetailTab = 'overview' | 'specifications' | 'quality';

const PLAN_OPTIONS: Array<{ id: PlanOptionId; title: string; pricing: string; amountInr: number }> = [
  { id: 'pay-per-use', title: 'Pay per use', pricing: '₹ 150.00 INR / download', amountInr: 150 },
  { id: 'subscription', title: 'Subscription', pricing: '₹ 2999.00 INR / 30 days', amountInr: 2999 },
  {
    id: 'hybrid',
    title: 'Hybrid',
    pricing: '₹ 1499 INR base (paid up front) + 15 included, ₹ 120.00 INR / unit overage',
    amountInr: 1499,
  },
  { id: 'one-time', title: 'One time', pricing: '₹ 599.00 INR one-time, 1 download', amountInr: 599 },
];

export function CatalogPage({
  searchQuery,
  subscriptions,
  consentRequests,
  onRequestConsent,
  onSubscribeOffer,
  onUnsubscribeOffer,
}: CatalogPageProps) {
  const [selectedOfferId, setSelectedOfferId] = useState<string>(CATALOG_OFFERS[0].id);
  const [detailTab, setDetailTab] = useState<DetailTab>('overview');

  const [consentPurpose, setConsentPurpose] = useState('Transport planning & analytics');
  const [accessScope, setAccessScope] = useState('Aggregated records');
  const [consentDuration, setConsentDuration] = useState('1 Month');

  const [selectedPlan, setSelectedPlan] = useState<PlanOptionId | null>(null);
  const [subscribePurpose, setSubscribePurpose] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [subscribeError, setSubscribeError] = useState('');
  const [consentNotice, setConsentNotice] = useState('');

  const matchingOffers = useMemo(() => {
    if (!searchQuery.trim()) return CATALOG_OFFERS;
    const q = searchQuery.toLowerCase();
    return CATALOG_OFFERS.filter(
      (offer) =>
        offer.title.toLowerCase().includes(q) ||
        offer.category.toLowerCase().includes(q) ||
        offer.protocol.toLowerCase().includes(q) ||
        offer.datasetId.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  const activeOffer: CatalogOffer =
    CATALOG_OFFERS.find((o) => o.id === selectedOfferId) ?? CATALOG_OFFERS[0];

  const activeSubscription = subscriptions.find((s) => s.offerId === activeOffer.id);
  const isSubscribed = Boolean(activeSubscription);
  const activeConsent = consentRequests.find((c) => c.offerId === activeOffer.id);
  const isConsentRequested = Boolean(activeConsent);

  const handleRequestConsent = () => {
    if (!consentPurpose.trim()) {
      setConsentNotice('Please enter a consent purpose.');
      return;
    }
    onRequestConsent({
      offerId: activeOffer.id,
      purpose: consentPurpose.trim(),
      scope: accessScope,
      duration: consentDuration,
      status: 'Pending Review',
      requestedAt: 'Just now',
    });
    setConsentNotice('Consent request sent to data owner.');
  };

  const handleSubscribe = () => {
    if (isSubscribed) {
      onUnsubscribeOffer(activeOffer.id);
      setSubscribeError('');
      return;
    }
    if (!selectedPlan) {
      setSubscribeError('Please choose a plan option above before subscribing.');
      return;
    }
    if (!subscribePurpose) {
      setSubscribeError('Please select a purpose before subscribing.');
      return;
    }
    if (!agreedTerms) {
      setSubscribeError('Please confirm that you have read the contract and agreed to the terms.');
      return;
    }
    setSubscribeError('');
    onSubscribeOffer(activeOffer, selectedPlan, subscribePurpose);
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb & Header */}
      <div>
        <p className="text-[11.5px] font-medium text-[#64748b]">IMDX &gt; Catalog</p>
        <h1 className="mt-0.5 text-[22px] sm:text-[24px] font-semibold text-[#1e3a8a] leading-tight">
          Catalog
        </h1>
        <p className="mt-0.5 text-[13px] text-[#64748b]">
          Discover trusted mobility datasets across the IMDX ecosystem
        </p>
      </div>

      {/* Hero Dataset Card */}
      <div className="imdx-card rounded-[12px] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <span className="flex items-center justify-center size-12 rounded-[10px] bg-[#e9faf5] text-[#059669] shrink-0">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <ellipse cx="12" cy="5" rx="8" ry="3" />
              <path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
              <path d="M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
            </svg>
          </span>

          <div className="min-w-0">
            <p className="text-[11.5px] text-[#64748b]">{activeOffer.category}</p>
            <h2 className="mt-0.5 text-[18px] sm:text-[20px] font-semibold text-[#1e3a8a] leading-snug">
              {activeOffer.title}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px]">
              <span className="text-[#475569]">{activeOffer.publisher}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#e9faf5] border border-[#10b981]/25 px-2.5 py-0.5 text-[11px] font-semibold text-[#059669]">
                ✓ Verified Provider
              </span>
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="text-[11px] text-[#64748b]">Data quality</p>
          <p className="text-[22px] font-bold text-[#059669] leading-tight">
            {activeOffer.qualityScore} %
          </p>
          <p className="text-[11px] font-semibold text-[#059669]">Excellent</p>
        </div>
      </div>

      {/* Sub-Tabs Bar + Subtle Dataset Switcher */}
      <div className="border-b border-[#d4e5e2] flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-6">
          {(
            [
              { key: 'overview', label: 'Overview' },
              { key: 'specifications', label: 'Specifications' },
              { key: 'quality', label: 'Data quality' },
            ] as const
          ).map((tab) => {
            const isActive = detailTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setDetailTab(tab.key)}
                className={`relative pb-2.5 text-[13px] cursor-pointer transition-colors ${
                  isActive
                    ? 'font-semibold text-[#059669]'
                    : 'font-medium text-[#475569] hover:text-[#102529]'
                }`}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute left-0 right-0 -bottom-[1px] h-[2.5px] rounded-full bg-[#10b981]" />
                )}
              </button>
            );
          })}
        </div>

        <select
          aria-label="Select catalog dataset"
          value={activeOffer.id}
          onChange={(e) => {
            setSelectedOfferId(e.target.value);
            setDetailTab('overview');
            setSubscribeError('');
            setConsentNotice('');
          }}
          className="mb-1.5 h-[28px] rounded-[6px] border border-[#cbd5e1] bg-white/90 px-2.5 text-[11.5px] text-[#334155] focus:outline-none focus:border-[#008fa7] cursor-pointer"
        >
          {(matchingOffers.length > 0 ? matchingOffers : CATALOG_OFFERS).map((offer) => (
            <option key={offer.id} value={offer.id}>
              {offer.title} ({offer.datasetId})
            </option>
          ))}
        </select>
      </div>

      {detailTab === 'overview' && (
        <div
          key={`${activeOffer.id}-overview`}
          className="imdx-stage-enter grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch"
        >
          {/* Left Column */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="imdx-card rounded-[12px] p-4 sm:p-5">
              <h3 className="text-[14px] font-semibold text-[#102529]">Dataset overview</h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#475569]">
                {activeOffer.description}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11.5px] text-[#64748b]">Dataset ID</p>
                  <p className="mt-0.5 text-[13px] font-semibold text-[#102529]">
                    {activeOffer.datasetId}
                  </p>
                </div>
                <div>
                  <p className="text-[11.5px] text-[#64748b]">Category</p>
                  <p className="mt-0.5 text-[13px] font-semibold text-[#102529]">
                    {activeOffer.category}
                  </p>
                </div>
                <div>
                  <p className="text-[11.5px] text-[#64748b]">Version</p>
                  <p className="mt-0.5 text-[13px] font-semibold text-[#102529]">
                    {activeOffer.version}
                  </p>
                </div>
                <div>
                  <p className="text-[11.5px] text-[#64748b]">Tags</p>
                  <p className="mt-0.5 text-[13px] font-semibold text-[#102529]">
                    {activeOffer.tags}
                  </p>
                </div>
              </div>
            </div>

            <div className="imdx-card rounded-[12px] p-4 sm:p-5 space-y-3.5 flex-1 flex flex-col justify-between">
              <div className="space-y-3.5">
                <div>
                  <h3 className="text-[14px] font-semibold text-[#102529]">
                    Data consent request
                  </h3>
                  <p className="mt-0.5 text-[12px] text-[#64748b]">
                    Data owner has to allow you to use the data before you can subscribe. Request
                    consent here and come back once it is granted.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="consent-purpose-input"
                    className="block text-[11.5px] text-[#64748b] mb-1"
                  >
                    Consent Purpose
                  </label>
                  <input
                    id="consent-purpose-input"
                    type="text"
                    value={consentPurpose}
                    onChange={(e) => setConsentPurpose(e.target.value)}
                    className="w-full h-[36px] rounded-full border border-[#cbd5e1] bg-white px-4 text-[12.5px] text-[#102529] focus:outline-none focus:border-[#008fa7]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="consent-scope-select"
                      className="block text-[11.5px] text-[#64748b] mb-1"
                    >
                      Requested access scope
                    </label>
                    <select
                      id="consent-scope-select"
                      value={accessScope}
                      onChange={(e) => setAccessScope(e.target.value)}
                      className="w-full h-[36px] rounded-[10px] border border-[#cbd5e1] bg-white px-3 text-[12.5px] text-[#102529] focus:outline-none focus:border-[#008fa7] cursor-pointer"
                    >
                      <option value="Aggregated records">Aggregated records</option>
                      <option value="Full dataset records">Full dataset records</option>
                      <option value="API streaming read">API streaming read</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="consent-duration-select"
                      className="block text-[11.5px] text-[#64748b] mb-1"
                    >
                      Consent Duration
                    </label>
                    <select
                      id="consent-duration-select"
                      value={consentDuration}
                      onChange={(e) => setConsentDuration(e.target.value)}
                      className="w-full h-[36px] rounded-[10px] border border-[#cbd5e1] bg-white px-3 text-[12.5px] text-[#102529] focus:outline-none focus:border-[#008fa7] cursor-pointer"
                    >
                      <option value="1 Month">1 Month</option>
                      <option value="3 Months">3 Months</option>
                      <option value="6 Months">6 Months</option>
                      <option value="12 Months">12 Months</option>
                    </select>
                  </div>
                </div>
              </div>

              {consentNotice && (
                <p className="text-[11.5px] font-medium text-[#059669]">{consentNotice}</p>
              )}

              <button
                type="button"
                onClick={handleRequestConsent}
                className={`w-full h-[36px] rounded-full text-[13px] font-semibold transition-colors cursor-pointer ${
                  isConsentRequested
                    ? 'bg-[#dcfce7] text-[#15803d] border border-[#16a34a]/30'
                    : 'bg-[#22b59b] hover:bg-[#1ca18a] text-white'
                }`}
              >
                {activeConsent?.status === 'Granted'
                  ? 'Consent Granted ✓'
                  : isConsentRequested
                    ? 'Consent Requested ✓'
                    : 'Request Consent'}
              </button>
            </div>
          </div>

          {/* Right Column: Contract details */}
          <div className="lg:col-span-5 imdx-card rounded-[12px] p-4 sm:p-5 flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <h3 className="text-[14px] font-semibold text-[#102529]">Contract details</h3>

              <div className="space-y-2.5 text-[12.5px]">
                <div>
                  <p className="text-[11px] text-[#64748b]">Contract Price</p>
                  <p className="font-semibold text-[#102529]">₹ 599.00 INR /30 days</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#64748b]">Billing Cycle</p>
                  <p className="font-semibold text-[#102529]">30 days</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#64748b]">Usage cap</p>
                  <p className="font-semibold text-[#102529]">Unlimited</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#64748b]">Allowed purpose</p>
                  <p className="font-semibold text-[#102529]">Planning &amp; analytics</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#64748b]">Classification</p>
                  <p className="font-semibold text-[#102529]">Public</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#64748b]">Terms version</p>
                  <p className="font-semibold text-[#102529]">v2</p>
                </div>
              </div>

              <div className="pt-2 space-y-2.5 text-[12px]">
                <div className="grid grid-cols-[88px_1fr] gap-2">
                  <span className="font-semibold text-[#102529]">Liability</span>
                  <span className="text-[#475569]">
                    Provided as is. The data belongs to the publisher and is redistributed under{' '}
                    {activeOffer.licence}
                  </span>
                </div>
                <div className="grid grid-cols-[88px_1fr] gap-2">
                  <span className="font-semibold text-[#102529]">Governing</span>
                  <span className="text-[#475569]">India</span>
                </div>
                <div className="grid grid-cols-[88px_1fr] gap-2">
                  <span className="font-semibold text-[#102529]">Delivery notes</span>
                  <span className="text-[#475569] break-all">
                    Attribution required: {activeOffer.publisher}. License: {activeOffer.licence} (
                    {activeOffer.endpointUrl})
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-[8px] border border-[#a7f3d0] bg-[#e9faf5] px-3 py-2 flex items-center gap-2 text-[11.5px] font-medium text-[#065f46]">
              <span>🛡</span>
              <span>Contract protected by IMDX consent and access controls</span>
            </div>
          </div>
        </div>
      )}

      {detailTab === 'specifications' && (
        <div
          key={`${activeOffer.id}-specs`}
          className="imdx-stage-enter imdx-card rounded-[12px] p-4 sm:p-5 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[12.5px]">
            <div>
              <p className="text-[11px] text-[#64748b]">Protocol Standard</p>
              <p className="mt-0.5 font-mono font-semibold text-[#002456]">
                {activeOffer.protocol}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[#64748b]">Coverage</p>
              <p className="mt-0.5 font-semibold text-[#102529]">{activeOffer.coverage}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#64748b]">Update Frequency</p>
              <p className="mt-0.5 font-semibold text-[#102529]">{activeOffer.updateFrequency}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[480px]">
              <thead>
                <tr className="bg-gradient-to-r from-[#e3f9f3]/80 via-[#e8f6fe]/80 to-[#e6f0ff]/80 border-y border-[#b4d7de]/70 text-[12px] text-[#102529]">
                  <th className="py-2.5 px-3 font-semibold">Field</th>
                  <th className="py-2.5 px-3 font-semibold">Type</th>
                  <th className="py-2.5 px-3 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9] text-[13px] text-[#475569]">
                {activeOffer.fields.map((field) => (
                  <tr key={field.name}>
                    <td className="py-2.5 px-3 font-mono text-[12px] text-[#002456] font-semibold">
                      {field.name}
                    </td>
                    <td className="py-2.5 px-3">{field.type}</td>
                    <td className="py-2.5 px-3">{field.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {detailTab === 'quality' && (
        <div
          key={`${activeOffer.id}-quality`}
          className="imdx-stage-enter imdx-card rounded-[12px] p-4 sm:p-5 space-y-3"
        >
          <h3 className="text-[14px] font-semibold text-[#102529]">
            Validation &amp; Quality Breakdown ({activeOffer.qualityScore}%)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Completeness', pct: `${activeOffer.qualityScore}%` },
              { label: 'Freshness', pct: '94%' },
              { label: 'Schema validity', pct: '98%' },
              { label: 'Consistency', pct: '92%' },
            ].map((row) => (
              <div key={row.label} className="space-y-1">
                <div className="flex justify-between text-[12.5px]">
                  <span className="text-[#475569]">{row.label}</span>
                  <span className="font-semibold text-[#102529]">{row.pct}</span>
                </div>
                <div className="h-[6px] rounded-full bg-[#e2e8f0] overflow-hidden">
                  <div className="imdx-bar-animate h-full rounded-full bg-[#22b59b]" style={{ width: row.pct }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Choose Plan Card */}
      <div className="imdx-card rounded-[12px] p-4 sm:p-5 space-y-3">
        <h3 className="text-[14px] font-semibold text-[#102529]">Choose Plan</h3>
        <div className="space-y-2">
          {PLAN_OPTIONS.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <label
                key={plan.id}
                className={`flex flex-wrap items-center gap-3 rounded-[8px] border px-3.5 py-2.5 cursor-pointer transition-colors ${
                  isSelected
                    ? 'border-[#00a5c3] bg-gradient-to-r from-[#d5faf0] via-[#e2f4fe] to-[#dfecff] shadow-xs'
                    : 'border-[#b4d7de]/75 bg-gradient-to-r from-[#effcf9] via-[#eff8fe] to-[#edf4ff] hover:border-[#00a5c3]/65'
                }`}
              >
                <input
                  type="radio"
                  name="catalog-plan"
                  checked={isSelected}
                  onChange={() => {
                    setSelectedPlan(plan.id);
                    if (subscribeError) setSubscribeError('');
                  }}
                  className="size-4 accent-[#10b981] cursor-pointer"
                />
                <span className="text-[13px] font-semibold text-[#102529] min-w-[92px]">
                  {plan.title}
                </span>
                <span className="text-[12.5px] text-[#64748b]">{plan.pricing}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Subscribe Card */}
      <div className="imdx-card rounded-[12px] p-4 sm:p-5 space-y-3">
        <h3 className="text-[14px] font-semibold text-[#102529]">Subscribe</h3>

        <div>
          <label
            htmlFor="subscribe-purpose-select"
            className="block text-[11.5px] text-[#64748b] mb-1"
          >
            Purpose (what this data will be used for)
          </label>
          <select
            id="subscribe-purpose-select"
            value={subscribePurpose}
            onChange={(e) => {
              setSubscribePurpose(e.target.value);
              if (subscribeError) setSubscribeError('');
            }}
            className="w-full h-[36px] rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[12.5px] text-[#102529] focus:outline-none focus:border-[#008fa7] cursor-pointer"
          >
            <option value="">Select purpose</option>
            <option value="Urban & Transport Planning">Urban &amp; Transport Planning</option>
            <option value="Traffic & Congestion Modelling">Traffic &amp; Congestion Modelling</option>
            <option value="EV Infrastructure Planning">EV Infrastructure Planning</option>
            <option value="Fleet Telemetry & Routing">Fleet Telemetry &amp; Routing</option>
          </select>
          <p className="mt-1.5 text-[11.5px] font-medium text-[#475569]">
            Used both for the subscription contract and the data use consent request below
          </p>
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreedTerms}
            onChange={(e) => {
              setAgreedTerms(e.target.checked);
              if (subscribeError) setSubscribeError('');
            }}
            className="size-4 rounded accent-[#22b59b] cursor-pointer"
          />
          <span className="text-[12px] text-[#64748b]">
            I have read the contract and agreed to the terms.
          </span>
        </label>

        {subscribeError && <p className="text-[12px] text-[#dc2626]">{subscribeError}</p>}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSubscribe}
            className={`h-[34px] px-7 rounded-full text-[12.5px] font-semibold transition-colors cursor-pointer ${
              isSubscribed
                ? 'bg-[#dcfce7] text-[#15803d] border border-[#16a34a]/30'
                : 'bg-[#22b59b] hover:bg-[#1ca18a] text-white'
            }`}
          >
            {isSubscribed ? 'Subscribed ✓' : 'Subscribe'}
          </button>
        </div>
      </div>
    </div>
  );
}
