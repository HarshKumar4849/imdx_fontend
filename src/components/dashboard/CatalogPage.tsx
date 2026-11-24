import { useMemo, useState } from 'react';
import searchIcon from '../../assets/search-icon.svg';
import { CATALOG_OFFERS, CATALOG_PROTOCOLS } from '../../data/dashboardData';
import type { CatalogOffer, CatalogProtocol } from '../../types/dashboard';

interface CatalogPageProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  subscribedOfferIds: string[];
  onToggleSubscribe: (offerId: string) => void;
}

export function CatalogPage({
  searchQuery,
  onSearchChange,
  subscribedOfferIds,
  onToggleSubscribe,
}: CatalogPageProps) {
  const [selectedProtocol, setSelectedProtocol] = useState<'All' | CatalogProtocol>('All');
  const [activeOffer, setActiveOffer] = useState<CatalogOffer | null>(null);

  const filteredOffers = useMemo(() => {
    return CATALOG_OFFERS.filter((offer) => {
      if (selectedProtocol !== 'All' && offer.protocol !== selectedProtocol) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          offer.title.toLowerCase().includes(q) ||
          offer.description.toLowerCase().includes(q) ||
          offer.protocol.toLowerCase().includes(q) ||
          offer.did.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedProtocol, searchQuery]);

  if (activeOffer) {
    const isSubscribed = subscribedOfferIds.includes(activeOffer.id);

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[16px] sm:text-[18px] text-[#a9a9a9]">
              <button
                type="button"
                onClick={() => setActiveOffer(null)}
                className="hover:text-[#002456] cursor-pointer"
              >
                Workspace &gt; Catalog
              </button>{' '}
              &gt; {activeOffer.title}
            </p>
            <h1 className="mt-2 text-[28px] sm:text-[32px] font-bold text-black leading-tight">
              {activeOffer.title}
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setActiveOffer(null)}
            className="h-[40px] px-5 rounded-[45px] border border-[#c1c1c1] bg-white text-[15px] font-semibold text-[#0f0f0f] hover:bg-[#f2f2f2] cursor-pointer"
          >
            Back to Catalog
          </button>
        </div>

        {/* 1. Summary banner card */}
        <div className="bg-white border border-[#c7c4c4] rounded-[11px] p-6 sm:p-7 flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-[820px]">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-[45px] bg-[#e8e7e7] px-4 py-1 text-[15px] text-[#0f0f0f]">
                {activeOffer.protocol}
              </span>
              <span className="font-['Roboto_Mono',monospace] text-[13px] text-[#403939]">
                {activeOffer.did}
              </span>
            </div>
            <p className="mt-3 text-[17px] text-[#403939] leading-relaxed">
              {activeOffer.description}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onToggleSubscribe(activeOffer.id)}
            className={`h-[44px] px-7 rounded-[45px] text-[16px] font-semibold transition-colors cursor-pointer shrink-0 ${
              isSubscribed
                ? 'bg-[#dcffe5] text-[#059669] border border-[#059669]/30'
                : 'bg-[#32c4a6] hover:bg-[#2ab195] text-white'
            }`}
          >
            {isSubscribed ? 'Subscribed' : 'Subscribe to Offer'}
          </button>
        </div>

        {/* 2. Two-column cards (Metadata + Access & Licensing) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white border border-[#c7c4c4] rounded-[11px] p-6 sm:p-7 space-y-5">
            <h2 className="text-[20px] font-semibold text-[#0f0f0f]">Dataset Metadata</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-[16px]">
              <div>
                <p className="text-[#808080]">Publisher</p>
                <p className="mt-1 font-semibold text-[#0f0f0f]">{activeOffer.publisher}</p>
              </div>
              <div>
                <p className="text-[#808080]">Licence</p>
                <p className="mt-1 font-semibold text-[#0f0f0f]">{activeOffer.licence}</p>
              </div>
              <div>
                <p className="text-[#808080]">Coverage</p>
                <p className="mt-1 font-semibold text-[#0f0f0f]">{activeOffer.coverage}</p>
              </div>
              <div>
                <p className="text-[#808080]">Update Frequency</p>
                <p className="mt-1 font-semibold text-[#0f0f0f]">{activeOffer.updateFrequency}</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white border border-[#c7c4c4] rounded-[11px] p-6 sm:p-7 space-y-4">
            <h2 className="text-[20px] font-semibold text-[#0f0f0f]">Offer Terms &amp; Access</h2>
            <p className="text-[15px] text-[#403939] leading-relaxed">
              Access is governed by IMDX Data Sharing Terms and {activeOffer.licence}. API
              credentials are provisioned automatically inside your hosted workspace upon
              subscription.
            </p>
            <div className="rounded-[8px] bg-[#f8fafc] border border-[#e2e8f0] p-3.5 text-[13px] font-['Roboto_Mono',monospace] text-[#0f0f0f] break-all">
              {activeOffer.endpointUrl}
            </div>
          </div>
        </div>

        {/* 3. Schema card */}
        <div className="bg-white border border-[#c7c4c4] rounded-[11px] p-6 sm:p-7">
          <h2 className="text-[20px] font-semibold text-[#0f0f0f] mb-4">Schema Fields</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[540px]">
              <thead>
                <tr className="bg-[rgba(187,209,226,0.39)] text-[15px] text-[#0f0f0f]">
                  <th className="py-3 px-4 font-normal">Field</th>
                  <th className="py-3 px-4 font-normal">Type</th>
                  <th className="py-3 px-4 font-normal">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f1f1] text-[15px] text-[#403939]">
                {activeOffer.fields.map((field) => (
                  <tr key={field.name}>
                    <td className="py-3.5 px-4 font-['Roboto_Mono',monospace] text-[13px] text-[#0f0f0f]">
                      {field.name}
                    </td>
                    <td className="py-3.5 px-4">{field.type}</td>
                    <td className="py-3.5 px-4">{field.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Title */}
      <div>
        <p className="text-[16px] sm:text-[18px] text-[#a9a9a9]">Workspace &gt; Catalog</p>
        <h1 className="mt-2 text-[28px] sm:text-[32px] font-bold text-black leading-tight">
          Catalog
        </h1>
        <p className="mt-1 text-[16px] sm:text-[18px] text-[#808080]">
          Browse datasets published by network participants
        </p>
      </div>

      {/* Filter pills + Search */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          {CATALOG_PROTOCOLS.map((protocol) => {
            const isActive = selectedProtocol === protocol;
            return (
              <button
                key={protocol}
                type="button"
                onClick={() => setSelectedProtocol(protocol)}
                className={`h-[32px] px-4 rounded-[45px] text-[16px] sm:text-[17px] transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#002456] text-white'
                    : 'bg-[#e8e7e7] text-[#0f0f0f] hover:bg-[#dcdcdc]'
                }`}
              >
                {protocol}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-[280px] h-[40px] flex items-center bg-white border border-[#e2e8f0] rounded-[8px] px-3 gap-2 focus-within:border-[#002456]">
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

      {/* 3-Column Card Grid matching Figma */}
      {filteredOffers.length === 0 ? (
        <div className="bg-white border border-[#c7c4c4] rounded-[11px] p-12 text-center text-[#808080] text-[18px]">
          No catalog offers match your current filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOffers.map((offer) => (
            <div
              key={offer.id}
              className="bg-white border border-[#c7c4c4] rounded-[11px] p-6 flex flex-col justify-between min-h-[256px]"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-[16px] font-bold text-[#0f0f0f] leading-snug">
                    {offer.title}
                  </h2>
                  <span className="shrink-0 inline-flex items-center justify-center rounded-[45px] bg-[#e8e7e7] px-3.5 h-[32px] text-[15px] text-[#0f0f0f]">
                    {offer.protocol}
                  </span>
                </div>

                <p className="mt-4 text-[16px] sm:text-[17px] leading-[24px] text-[#403939]">
                  {offer.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-[#d9d9d9] flex items-center justify-between gap-3">
                <span className="font-['Roboto_Mono',monospace] text-[12px] text-black truncate">
                  {offer.did}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveOffer(offer)}
                  className="shrink-0 text-[16px] sm:text-[17px] text-[#0f0f0f] underline underline-offset-4 hover:text-[#002456] cursor-pointer"
                >
                  View offer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
