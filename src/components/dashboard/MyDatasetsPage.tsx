import { useEffect, useMemo, useState } from 'react';
import emptyDatasetsIcon from '../../assets/empty-datasets.svg';
import searchIcon from '../../assets/search-icon.svg';
import {
  cygnusApi,
  isAgentConfigured,
  loadUserSession,
  type CygnusOffer,
} from '../../services/cygnusApi';
import { ModalPortal } from '../ModalPortal';
import type { DatasetStatus, MyDatasetItem } from '../../types/dashboard';

interface MyDatasetsPageProps {
  datasets: MyDatasetItem[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onRegisterDatasetClick: () => void;
  onUpdateDatasetStatus: (id: string, status: DatasetStatus) => void;
  onDeleteDataset: (id: string) => void;
}

const PAGE_SIZE = 4;

function getDisplayStatus(status: DatasetStatus): string {
  if (status === 'Awaiting Approval') return 'Under Review';
  return status;
}

export function MyDatasetsPage({
  datasets,
  searchQuery,
  onSearchChange,
  onRegisterDatasetClick,
  onUpdateDatasetStatus,
  onDeleteDataset,
}: MyDatasetsPageProps) {
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'All' | DatasetStatus>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [coverageFilter, setCoverageFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDataset, setSelectedDataset] = useState<MyDatasetItem | null>(null);
  const [healthText, setHealthText] = useState<string | null>(null);
  const [offersState, setOffersState] = useState<{ datasetId: string; items: CygnusOffer[] }>({
    datasetId: '',
    items: [],
  });
  const [newOfferPrice, setNewOfferPrice] = useState('499');
  const [offerActionNote, setOfferActionNote] = useState('');

  const offers = useMemo(
    () => (selectedDataset && offersState.datasetId === selectedDataset.id ? offersState.items : []),
    [selectedDataset, offersState],
  );

  useEffect(() => {
    if (!selectedDataset || !isAgentConfigured() || !loadUserSession()?.token) return;
    let active = true;
    const dsId = selectedDataset.id;
    void cygnusApi
      .listDatasetOffers(dsId)
      .then((list) => {
        if (active) setOffersState({ datasetId: dsId, items: list });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [selectedDataset]);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(datasets.map((d) => d.category)))],
    [datasets],
  );

  const coverages = useMemo(
    () => ['All', ...Array.from(new Set(datasets.map((d) => d.coverage)))],
    [datasets],
  );

  const publishedCount = datasets.filter((d) => d.status === 'Published').length;
  const underReviewCount = datasets.filter((d) => d.status === 'Awaiting Approval').length;
  const draftCount = datasets.filter((d) => d.status === 'Draft').length;
  const actionRequiredCount = datasets.filter((d) => parseInt(d.quality, 10) < 85).length;

  const filtered = useMemo(() => {
    return datasets.filter((ds) => {
      if (categoryFilter !== 'All' && ds.category !== categoryFilter) return false;
      if (statusFilter !== 'All' && ds.status !== statusFilter) return false;
      if (coverageFilter !== 'All' && ds.coverage !== coverageFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          ds.name.toLowerCase().includes(q) ||
          ds.category.toLowerCase().includes(q) ||
          ds.coverage.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [datasets, categoryFilter, statusFilter, coverageFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  const kpiCards = [
    {
      label: 'Total Registered',
      value: String(datasets.length).padStart(2, '0'),
      sub: 'All managed datasets',
    },
    {
      label: 'Published Datasets',
      value: String(publishedCount).padStart(2, '0'),
      sub: 'Available in catalog',
    },
    {
      label: 'Under review',
      value: String(underReviewCount).padStart(2, '0'),
      sub: 'Validation in progress',
    },
    {
      label: 'Draft',
      value: String(draftCount).padStart(2, '0'),
      sub: 'Not yet submitted',
    },
    {
      label: 'Action required',
      value: String(actionRequiredCount).padStart(2, '0'),
      sub: 'Validation issue',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11.5px] font-medium text-[#64748b]">
            IMDX &gt; <span className="text-[#334155]">Dataset</span>
          </p>
          <h1 className="mt-0.5 text-[22px] sm:text-[24px] font-semibold text-[#002456] leading-tight">
            Dataset
          </h1>
          <p className="mt-0.5 text-[13px] text-[#64748b]">
            Get a complete overview of your organization&apos;s activity across the IMDX ecosystem.
          </p>
        </div>

        <button
          type="button"
          onClick={onRegisterDatasetClick}
          className="h-[34px] px-4 rounded-full bg-[#22b59b] hover:bg-[#1ca18a] text-white text-[12.5px] font-semibold cursor-pointer transition-colors shadow-xs shrink-0"
        >
          + Register data
        </button>
      </div>

      {/* 5 KPI Cards Row matching screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {kpiCards.map((kpi, idx) => (
          <div
            key={kpi.label}
            style={{ ['--stagger-i' as string]: idx }}
            className="imdx-stagger-card imdx-card-interactive rounded-[12px] p-3.5 flex flex-col justify-between gap-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11.5px] text-[#64748b]">{kpi.label}</p>
                <p className="mt-1 text-[21px] font-bold text-[#102529] leading-tight">
                  {kpi.value}
                </p>
              </div>
              <span className="size-7 rounded-[7px] bg-[#fff1e2] shrink-0" aria-hidden="true" />
            </div>
            <p className="text-[11px] text-[#64748b]">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Dataset Table Card */}
      <div className="imdx-card rounded-[12px] overflow-hidden">
        {/* Toolbar Filters */}
        <div className="px-4 py-3 flex flex-wrap items-center gap-2.5 border-b border-[#e2e8f0]/80">
          <div className="relative w-full sm:w-[205px] h-[34px] flex items-center bg-white border border-[#e2e8f0] rounded-[8px] px-3 gap-2 focus-within:border-[#008fa7]">
            <img src={searchIcon} alt="" width={14} height={14} className="shrink-0 opacity-70" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search dataset"
              className="w-full bg-transparent text-[12.5px] text-[#102529] placeholder:text-[#94a3b8] focus:outline-none"
            />
          </div>

          <select
            aria-label="Filter by category"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-[34px] rounded-[8px] border border-[#e2e8f0] bg-white px-3 text-[12.5px] font-medium text-[#102529] focus:outline-none focus:border-[#008fa7] cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All categories' : cat}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as 'All' | DatasetStatus);
              setCurrentPage(1);
            }}
            className="h-[34px] rounded-[8px] border border-[#e2e8f0] bg-white px-3 text-[12.5px] font-medium text-[#102529] focus:outline-none focus:border-[#008fa7] cursor-pointer"
          >
            <option value="All">All statuses</option>
            <option value="Published">Published</option>
            <option value="Awaiting Approval">Under Review</option>
            <option value="Draft">Draft</option>
          </select>

          <button
            type="button"
            onClick={() => setShowFilters((prev) => !prev)}
            className={`h-[34px] px-3.5 rounded-[8px] border text-[12.5px] font-medium cursor-pointer transition-colors ${
              showFilters
                ? 'border-[#008fa7] bg-[#e5faf6] text-[#002456]'
                : 'border-[#e2e8f0] bg-white text-[#102529] hover:bg-[#f8fafc]'
            }`}
          >
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="border-b border-[#b4d7de]/70 bg-gradient-to-r from-[#e7faf5]/85 via-[#ebf7fe]/85 to-[#eaf1ff]/85 px-4 py-2.5 flex flex-wrap items-center gap-2">
            <span className="text-[12px] text-[#64748b] mr-1">Coverage:</span>
            {coverages.map((cov) => (
              <button
                key={cov}
                type="button"
                onClick={() => {
                  setCoverageFilter(cov);
                  setCurrentPage(1);
                }}
                className={`px-3 py-0.5 rounded-full text-[11.5px] font-medium cursor-pointer transition-colors ${
                  coverageFilter === cov
                    ? 'bg-[#002456] text-white'
                    : 'bg-white border border-[#cbd5e1] text-[#334155]'
                }`}
              >
                {cov}
              </button>
            ))}
          </div>
        )}

        {pageItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <img src={emptyDatasetsIcon} alt="" width={32} height={36} className="shrink-0" />
            <p className="mt-3 text-[14px] text-[#64748b]">No Datasets Match Your Filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[660px]">
              <thead>
                <tr className="bg-[#eef6fb] border-b border-[#e2e8f0] h-[42px] text-[12.5px] text-[#102529]">
                  <th className="px-5 font-semibold">Dataset name</th>
                  <th className="px-4 font-semibold">Category</th>
                  <th className="px-4 font-semibold">Version</th>
                  <th className="px-4 font-semibold">Data quality</th>
                  <th className="px-4 font-semibold">Status</th>
                  <th className="px-5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9] text-[13.5px] text-[#475569]">
                {pageItems.map((ds, idx) => (
                  <tr
                    key={ds.id}
                    onClick={() => setSelectedDataset(ds)}
                    style={{ ['--stagger-i' as string]: idx }}
                    className="imdx-stagger-row hover:bg-[#f8fafc] cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-5 font-semibold text-[#102529]">{ds.name}</td>
                    <td className="py-3.5 px-4 text-[#64748b]">{ds.category}</td>
                    <td className="py-3.5 px-4 text-[#64748b]">{ds.version ?? 'v2.1'}</td>
                    <td className="py-3.5 px-4 text-[#64748b]">{ds.quality}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-0.5 text-[11.5px] font-semibold ${
                          ds.status === 'Published'
                            ? 'bg-[#dcfce7] text-[#15803d]'
                            : ds.status === 'Awaiting Approval'
                              ? 'bg-[#fef3c7] text-[#b45309]'
                              : 'bg-[#f1f5f9] text-[#475569]'
                        }`}
                      >
                        {getDisplayStatus(ds.status)}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDataset(ds);
                        }}
                        className="px-2 py-1 text-[#102529] font-semibold hover:text-[#008fa7] cursor-pointer"
                        aria-label={`Inspect ${ds.name}`}
                      >
                        &gt;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Pagination Row matching screenshot */}
        <div className="border-t border-[#f1f5f9] px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-[12px] text-[#64748b]">
          <span>
            Showing {filtered.length === 0 ? 0 : startIdx + 1}–
            {Math.min(startIdx + PAGE_SIZE, filtered.length)} of {filtered.length} datasets
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="size-7 rounded-[6px] flex items-center justify-center text-[#334155] hover:bg-[#f1f5f9] disabled:opacity-40 cursor-pointer disabled:cursor-default"
              aria-label="Previous page"
            >
              &lt;
            </button>
            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`size-7 rounded-[6px] flex items-center justify-center text-[12px] font-medium cursor-pointer transition-colors ${
                  page === safePage
                    ? 'bg-[#dcfce7] text-[#15803d] font-semibold'
                    : 'text-[#334155] hover:bg-[#f1f5f9]'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="size-7 rounded-[6px] flex items-center justify-center text-[#334155] hover:bg-[#f1f5f9] disabled:opacity-40 cursor-pointer disabled:cursor-default"
              aria-label="Next page"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Selected Dataset Inspect Modal */}
      {selectedDataset && (
        <ModalPortal>
          <div
            className="imdx-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-[#05080d]/55 backdrop-blur-xs p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dataset-detail-title"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setSelectedDataset(null);
            }}
          >
          <div className="imdx-modal-panel imdx-modal-surface w-full max-w-[440px] rounded-[14px] p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="imdx-kicker">IMDX / MANAGED DATASET</p>
                <h2 id="dataset-detail-title" className="mt-0.5 text-[18px] font-semibold text-[#102529]">
                  {selectedDataset.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDataset(null)}
                className="text-[#64748b] hover:text-[#102529] text-[20px] leading-none px-1.5 cursor-pointer"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <div className="imdx-subbox grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-[10px] p-3.5 text-[12.5px]">
              <div>
                <p className="text-[#64748b]">Category</p>
                <p className="font-semibold text-[#102529]">{selectedDataset.category}</p>
              </div>
              <div>
                <p className="text-[#64748b]">Version</p>
                <p className="font-semibold text-[#102529]">{selectedDataset.version ?? 'v2.1'}</p>
              </div>
              <div>
                <p className="text-[#64748b]">Coverage</p>
                <p className="font-semibold text-[#102529]">{selectedDataset.coverage}</p>
              </div>
              <div>
                <p className="text-[#64748b]">Update Frequency</p>
                <p className="font-semibold text-[#102529]">{selectedDataset.updateFrequency}</p>
              </div>
              <div>
                <p className="text-[#64748b]">Data Quality</p>
                <p className="font-semibold text-[#059669]">{selectedDataset.quality}</p>
              </div>
              <div>
                <p className="text-[#64748b]">Status</p>
                <p className="font-semibold text-[#102529]">
                  {getDisplayStatus(selectedDataset.status)}
                </p>
              </div>
            </div>

            <div className="imdx-subbox rounded-[10px] p-3 text-[12px] space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-[#102529]">Source Health &amp; Pricing Offers</span>
                <button
                  type="button"
                  onClick={() => {
                    if (!isAgentConfigured() || !loadUserSession()?.token) {
                      setHealthText('Source reachable (200 OK · Preview check)');
                      return;
                    }
                    setHealthText('Checking…');
                    void cygnusApi
                      .getDatasetHealth(selectedDataset.id)
                      .then((h) => setHealthText(`${h.ok ? 'Healthy' : 'Degraded'}: ${h.message}`))
                      .catch((e) => setHealthText(e instanceof Error ? e.message : 'Health check failed'));
                  }}
                  className="text-[11.5px] font-semibold text-[#008fa7] hover:underline cursor-pointer"
                >
                  Check Health
                </button>
              </div>
              {healthText && <p className="text-[11.5px] text-[#059669]">{healthText}</p>}

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={newOfferPrice}
                  onChange={(e) => setNewOfferPrice(e.target.value)}
                  aria-label="New offer price INR"
                  className="w-[96px] h-[30px] rounded-[7px] border border-[#cbd5e1] bg-white px-2 text-[12px]"
                />
                <button
                  type="button"
                  onClick={() => {
                    const price = Number(newOfferPrice) || 499;
                    const dsId = selectedDataset.id;
                    if (!isAgentConfigured() || !loadUserSession()?.token) {
                      setOffersState((prev) => ({
                        datasetId: dsId,
                        items: [
                          ...(prev.datasetId === dsId ? prev.items : []),
                          {
                            id: `offer-${Date.now()}`,
                            modelType: 'SUBSCRIPTION',
                            recurringPrice: price,
                            currency: 'INR',
                            status: 'ENABLED',
                          },
                        ],
                      }));
                      setOfferActionNote(`Added ₹${price} Subscription offer.`);
                      return;
                    }
                    void cygnusApi
                      .createDatasetOffer(dsId, {
                        modelType: 'SUBSCRIPTION',
                        recurringPrice: price,
                        billingPeriodDays: 30,
                        currency: 'INR',
                      })
                      .then((created) => {
                        setOffersState((prev) => ({
                          datasetId: dsId,
                          items: [...(prev.datasetId === dsId ? prev.items : []), created],
                        }));
                        setOfferActionNote('Pricing offer published.');
                      })
                      .catch((e) =>
                        setOfferActionNote(e instanceof Error ? e.message : 'Offer creation failed'),
                      );
                  }}
                  className="h-[30px] px-3 rounded-[7px] bg-[#002456] text-white text-[11.5px] font-semibold cursor-pointer"
                >
                  + Add Offer
                </button>
                {offerActionNote && <span className="text-[11px] text-[#008fa7]">{offerActionNote}</span>}
              </div>

              {offers.length > 0 && (
                <div className="space-y-1">
                  {offers.map((of) => (
                    <div
                      key={of.id}
                      className="flex items-center justify-between gap-2 rounded bg-white/80 px-2.5 py-1 border border-[#cbd5e1]"
                    >
                      <span className="font-mono text-[11px]">
                        {of.modelType} · ₹{of.recurringPrice ?? of.unitPrice ?? of.basePrice ?? 0} {of.currency}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const dsId = selectedDataset.id;
                          if (isAgentConfigured() && loadUserSession()?.token) {
                            void cygnusApi.disableDatasetOffer(dsId, of.id);
                          }
                          setOffersState((prev) => ({
                            datasetId: dsId,
                            items: (prev.datasetId === dsId ? prev.items : []).filter(
                              (x) => x.id !== of.id,
                            ),
                          }));
                        }}
                        className="text-[11px] text-[#dc2626] hover:underline cursor-pointer"
                      >
                        Disable
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onDeleteDataset(selectedDataset.id);
                  setSelectedDataset(null);
                }}
                className="h-[34px] px-3.5 rounded-full border border-[#dc2626]/30 text-[12px] font-semibold text-[#dc2626] hover:bg-[#fef2f2] cursor-pointer"
              >
                Remove
              </button>
              <div className="flex items-center gap-2">
                {selectedDataset.status !== 'Published' && (
                  <button
                    type="button"
                    onClick={() => {
                      const nextStatus: DatasetStatus =
                        selectedDataset.status === 'Draft' ? 'Awaiting Approval' : 'Published';
                      onUpdateDatasetStatus(selectedDataset.id, nextStatus);
                      setSelectedDataset({ ...selectedDataset, status: nextStatus });
                    }}
                    className="h-[34px] px-4 rounded-full bg-[#22b59b] hover:bg-[#1ca18a] text-white text-[12px] font-semibold cursor-pointer"
                  >
                    {selectedDataset.status === 'Draft' ? 'Submit for Review' : 'Publish to Catalog'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedDataset(null)}
                  className="h-[34px] px-4 rounded-full bg-[#002456] text-white text-[12px] font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
