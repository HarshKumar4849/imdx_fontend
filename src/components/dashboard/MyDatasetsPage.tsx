import { useMemo, useState } from 'react';
import emptyDatasetsIcon from '../../assets/empty-datasets.svg';
import filtersIcon from '../../assets/filters-icon.svg';
import searchIcon from '../../assets/search-icon.svg';
import type { MyDatasetItem } from '../../types/dashboard';

interface MyDatasetsPageProps {
  datasets: MyDatasetItem[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onRegisterDatasetClick: () => void;
  onDeleteDataset: (id: string) => void;
}

type DatasetTab = 'all' | 'published' | 'awaiting';

export function MyDatasetsPage({
  datasets,
  searchQuery,
  onSearchChange,
  onRegisterDatasetClick,
  onDeleteDataset,
}: MyDatasetsPageProps) {
  const [activeTab, setActiveTab] = useState<DatasetTab>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(datasets.map((d) => d.category)))],
    [datasets],
  );

  const publishedCount = datasets.filter((d) => d.status === 'Published').length;
  const awaitingCount = datasets.filter((d) => d.status === 'Awaiting Approval').length;

  const filtered = useMemo(() => {
    return datasets.filter((ds) => {
      if (activeTab === 'published' && ds.status !== 'Published') return false;
      if (activeTab === 'awaiting' && ds.status !== 'Awaiting Approval') return false;
      if (categoryFilter !== 'All' && ds.category !== categoryFilter) return false;
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
  }, [datasets, activeTab, categoryFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Header */}
      <div>
        <p className="text-[16px] sm:text-[18px] text-[#a9a9a9]">Workspace &gt; My Datasets</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] sm:text-[32px] font-bold text-black leading-tight">
              My Datasets
            </h1>
            <p className="mt-1 text-[16px] sm:text-[18px] text-[#808080]">
              Datasets you publish to the IMDX Catalog
            </p>
          </div>
          <button
            type="button"
            onClick={onRegisterDatasetClick}
            className="h-[40px] px-5 rounded-[45px] bg-[#002456] hover:bg-[#00337a] text-white text-[16px] sm:text-[18px] font-semibold transition-colors cursor-pointer"
          >
            Register Dataset
          </button>
        </div>
      </div>

      {/* Tabs matching Figma */}
      <div className="border-b-[3px] border-[#d9d9d9] flex flex-wrap items-center gap-6 sm:gap-10">
        {[
          { key: 'all' as const, label: 'All Datasets', count: datasets.length },
          { key: 'published' as const, label: 'Published Datasets', count: publishedCount },
          { key: 'awaiting' as const, label: 'Awaiting Approvals', count: awaitingCount },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`relative pb-3 flex items-center gap-2.5 text-[16px] sm:text-[18px] text-[#0f0f0f] cursor-pointer ${
                isActive ? 'font-medium' : 'font-normal'
              }`}
            >
              <span>{tab.label}</span>
              <span className="inline-flex items-center justify-center rounded-[45px] bg-[#e8e7e7] px-3 h-[26px] text-[15px] sm:text-[16px] text-[#808080]">
                {tab.count}
              </span>
              {isActive && (
                <span className="absolute left-0 right-0 -bottom-[3px] h-[3px] rounded-[45px] bg-[#32c4a6]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Table or Empty State */}
      {datasets.length === 0 ? (
        <div className="bg-white border border-[#f1f1f1] rounded-[11px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.25)] p-7 min-h-[379px] flex flex-col">
          <p className="text-[18px] text-[#0f0f0f]">Data registry</p>
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <img src={emptyDatasetsIcon} alt="" width={38} height={42} className="shrink-0" />
            <p className="mt-4 text-[18px] text-[#808080]">No Datasets Yet</p>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[#f1f1f1] rounded-[11px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.25)] overflow-hidden min-h-[420px]">
          {/* Toolbar */}
          <div className="border-b border-[#d6d6d6] px-5 py-3 flex flex-wrap items-center justify-end gap-3">
            <div className="relative w-full sm:w-[340px] md:w-[417px] h-[40px] flex items-center bg-white border border-[#e2e8f0] rounded-[8px] px-3 gap-2 focus-within:border-[#002456]">
              <img src={searchIcon} alt="" width={17} height={17} className="shrink-0" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search dataset"
                className="w-full bg-transparent text-[14px] text-[#0f0f0f] placeholder:text-[#94a3b8] focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              className={`h-[40px] px-3.5 rounded-[8px] border flex items-center gap-2 text-[16px] text-[#464545] cursor-pointer ${
                showFilters ? 'border-[#002456] bg-[#f8fafc]' : 'border-[#e2e8f0] bg-white'
              }`}
            >
              <img src={filtersIcon} alt="" width={24} height={24} className="shrink-0" />
              <span>Filters</span>
            </button>
          </div>

          {showFilters && (
            <div className="border-b border-[#e2e8f0] bg-[#f8fafc] px-5 py-3 flex flex-wrap items-center gap-2">
              <span className="text-[14px] text-[#808080] mr-2">Category:</span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-full text-[13px] cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-[#002456] text-white'
                      : 'bg-white border border-[#e2e8f0] text-[#464545]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Table */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <img src={emptyDatasetsIcon} alt="" width={38} height={42} className="shrink-0" />
              <p className="mt-4 text-[18px] text-[#808080]">No Datasets Match Your Filter</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[780px]">
                <thead>
                  <tr className="bg-[rgba(187,209,226,0.39)] h-[53px] text-[16px] text-[#0f0f0f]">
                    <th className="px-6 font-normal">Dataset</th>
                    <th className="px-4 font-normal">Category</th>
                    <th className="px-4 font-normal">Coverage</th>
                    <th className="px-4 font-normal">Update frequency</th>
                    <th className="px-4 font-normal">Quality</th>
                    <th className="px-4 font-normal">Status</th>
                    <th className="px-6 font-normal text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f1f1] text-[16px] text-[#565555]">
                  {filtered.map((ds) => (
                    <tr key={ds.id} className="hover:bg-[#f8fafc]">
                      <td className="py-4 px-6 font-medium text-[#0f0f0f]">{ds.name}</td>
                      <td className="py-4 px-4">{ds.category}</td>
                      <td className="py-4 px-4">{ds.coverage}</td>
                      <td className="py-4 px-4">{ds.updateFrequency}</td>
                      <td className="py-4 px-4">{ds.quality}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-0.5 text-[13px] font-medium ${
                            ds.status === 'Published'
                              ? 'bg-[#dcffe5] text-[#059669]'
                              : ds.status === 'Awaiting Approval'
                                ? 'bg-[#ffeedc] text-[#d97706]'
                                : 'bg-[#e8e7e7] text-[#565555]'
                          }`}
                        >
                          {ds.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => onDeleteDataset(ds.id)}
                          className="text-[14px] text-[#dc2626] hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
