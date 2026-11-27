import { useMemo, useState } from 'react';
import searchIcon from '../../assets/search-icon.svg';
import type {
  CatalogOffer,
  CatalogProtocol,
  ConsentRequestRecord,
  PlanOptionId,
  SubscriptionRecord,
} from '../../types/dashboard';
import { OfferSubscriptionDetailView } from './OfferSubscriptionDetailView';

interface CatalogPageProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  offers?: CatalogOffer[];
  subscriptions: SubscriptionRecord[];
  consentRequests: ConsentRequestRecord[];
  onRequestConsent: (record: ConsentRequestRecord) => void;
  onSubscribeOffer: (offer: CatalogOffer, planId: PlanOptionId, purpose: string) => void;
  onUnsubscribeOffer: (offerId: string) => void;
}

const PROTOCOL_FILTERS: Array<'All' | CatalogProtocol> = [
  'All',
  'GTFS',
  'GTFS-RT',
  'OCPI',
  'GBFS',
  'EV_CHARGING',
  'MDS',
];

export function CatalogPage({
  searchQuery,
  onSearchChange,
  offers = [],
  subscriptions,
  consentRequests,
  onRequestConsent,
  onSubscribeOffer,
  onUnsubscribeOffer,
}: CatalogPageProps) {
  const catalogOffers = offers;
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [protocolFilter, setProtocolFilter] = useState<'All' | CatalogProtocol>('All');

  const matchingOffers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return catalogOffers.filter((offer) => {
      if (protocolFilter !== 'All' && offer.protocol !== protocolFilter) return false;
      if (!q) return true;
      return (
        offer.title.toLowerCase().includes(q) ||
        offer.description.toLowerCase().includes(q) ||
        offer.category.toLowerCase().includes(q) ||
        offer.protocol.toLowerCase().includes(q) ||
        offer.did.toLowerCase().includes(q) ||
        offer.datasetId.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, protocolFilter, catalogOffers]);

  const activeOffer: CatalogOffer | undefined = selectedOfferId
    ? catalogOffers.find((o) => o.id === selectedOfferId)
    : undefined;

  if (!activeOffer) {
    return (
      <div className="space-y-4">
        <div>
          <p className="text-[11.5px] font-medium text-[#64748b]">IMDX &gt; Catalog</p>
          <h1 className="mt-0.5 text-[22px] sm:text-[24px] font-semibold text-[#1e3a8a] leading-tight">
            Catalog
          </h1>
          <p className="mt-0.5 text-[13px] text-[#64748b]">
            Discover trusted mobility datasets across the IMDX ecosystem
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by protocol">
            {PROTOCOL_FILTERS.map((protocol) => {
              const active = protocolFilter === protocol;
              return (
                <button
                  key={protocol}
                  type="button"
                  onClick={() => setProtocolFilter(protocol)}
                  aria-pressed={active}
                  className={`h-[30px] px-3.5 rounded-full text-[12px] font-medium transition-all cursor-pointer ${
                    active
                      ? 'bg-[#002456] text-white shadow-xs'
                      : 'bg-[#e8e7e7]/90 hover:bg-[#dce3ea] text-[#102529]'
                  }`}
                >
                  {protocol}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-[240px] h-[34px] flex items-center rounded-[8px] border border-[#cbd5e1] bg-white px-3 gap-2 focus-within:border-[#008fa7] focus-within:ring-2 focus-within:ring-[#45c0b2]/15">
            <img src={searchIcon} alt="" width={14} height={14} className="shrink-0 opacity-65" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search dataset"
              aria-label="Search dataset"
              className="w-full min-w-0 bg-transparent text-[12.5px] text-[#0f0f0f] placeholder:text-[#94a3b8] focus:outline-none"
            />
          </div>
        </div>

        {matchingOffers.length === 0 ? (
          <div className="imdx-card rounded-[12px] p-10 text-center space-y-2">
            <p className="text-[14.5px] font-medium text-[#475569]">
              {catalogOffers.length === 0
                ? 'No datasets published in the catalog yet.'
                : 'No datasets match your current filter.'}
            </p>
            {(protocolFilter !== 'All' || searchQuery.trim()) && (
              <button
                type="button"
                onClick={() => {
                  setProtocolFilter('All');
                  onSearchChange('');
                }}
                className="text-[12.5px] font-semibold text-[#008fa7] hover:underline cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {matchingOffers.map((offer, idx) => (
              <article
                key={offer.id}
                style={{ ['--stagger-i' as string]: idx }}
                className="imdx-stagger-card imdx-card-interactive rounded-[12px] p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-[15px] font-bold text-[#102529] leading-snug">
                      {offer.title}
                    </h2>
                    <span className="inline-flex items-center rounded-full bg-[#e8e7e7] px-3 py-1 text-[11px] font-medium text-[#334155] shrink-0">
                      {offer.protocol}
                    </span>
                  </div>

                  <p className="text-[12.5px] text-[#334155] leading-relaxed line-clamp-3">
                    {offer.description} Source: {offer.publisher}. Licence: {offer.licence}.
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <span
                    className="font-mono text-[11px] text-[#334155] truncate"
                    title={offer.did}
                  >
                    {offer.did}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedOfferId(offer.id)}
                    className="text-[12.5px] font-medium text-[#102529] underline underline-offset-4 hover:text-[#008fa7] shrink-0 cursor-pointer"
                  >
                    View offer
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    );
  }

  const activeSubscription = subscriptions.find(
    (s) => s.offerId === activeOffer.id || s.datasetId === activeOffer.datasetId,
  );
  const activeConsent = consentRequests.find((c) => c.offerId === activeOffer.id);

  return (
    <OfferSubscriptionDetailView
      key={activeOffer.id}
      breadcrumbPrefix="IMDX > Catalog"
      heading="Catalog Offer Details"
      subtitle="Review schema, SLA metrics, data use consent, and subscription contract terms."
      backLabel="← Back to Catalog"
      offer={activeOffer}
      allOffers={matchingOffers.length > 0 ? matchingOffers : catalogOffers}
      subscription={activeSubscription}
      consent={activeConsent}
      onBack={() => setSelectedOfferId(null)}
      onSelectOffer={setSelectedOfferId}
      onRequestConsent={onRequestConsent}
      onSubscribeOffer={onSubscribeOffer}
      onUnsubscribeOffer={onUnsubscribeOffer}
    />
  );
}
