import type { MyDatasetItem, WorkspaceNavKey } from '../../types/dashboard';

interface DashboardOverviewProps {
  datasets: MyDatasetItem[];
  subscriptionsCount: number;
  onRegisterDatasetClick: () => void;
  onNavigate: (nav: WorkspaceNavKey) => void;
}

export function DashboardOverview({
  datasets,
  subscriptionsCount,
  onRegisterDatasetClick,
  onNavigate,
}: DashboardOverviewProps) {
  const totalDatasets = datasets.length;
  const publishedCount = datasets.filter((d) => d.status === 'Published').length;
  const pendingCount = datasets.filter((d) => d.status === 'Awaiting Approval').length;

  const kpis = [
    {
      label: 'Total Datasets',
      value: String(totalDatasets).padStart(2, '0'),
      boxBg: 'bg-[#fff1e2]',
      dotColor: 'bg-[#f59e0b]',
    },
    {
      label: 'Published Dataset',
      value: String(publishedCount).padStart(2, '0'),
      boxBg: 'bg-[#e6ecff]',
      dotColor: 'bg-[#3553ab]',
    },
    {
      label: 'Active Subscriptions',
      value: String(subscriptionsCount).padStart(2, '0'),
      boxBg: 'bg-[#e9fffa] border border-[#f1f1f1]',
      dotColor: 'bg-[#32c4a6]',
    },
    {
      label: 'Pending Approvals',
      value: String(pendingCount).padStart(2, '0'),
      boxBg: 'bg-[#fffbe6]',
      dotColor: 'bg-[#eab308]',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Header */}
      <div>
        <p className="text-[16px] sm:text-[18px] text-[#a9a9a9]">Workspace &gt; Dashboard</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] sm:text-[32px] font-bold text-black leading-tight">
              Dashboard
            </h1>
            <p className="mt-1 text-[16px] sm:text-[18px] text-[#808080]">
              Your published data ecosystem at a glance.
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

      {/* 4 KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white border border-[#f1f1f1] rounded-[11px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.25)] px-3.5 py-3 flex items-center gap-3.5"
          >
            <div
              className={`h-[53px] w-[51px] rounded-[7px] shrink-0 flex items-center justify-center ${kpi.boxBg}`}
            >
              <span className={`size-3 rounded-full ${kpi.dotColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[15px] sm:text-[16px] text-[#808080] truncate">{kpi.label}</p>
              <p className="mt-0.5 text-[24px] font-semibold text-[#0f0f0f] leading-tight">
                {kpi.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Middle 2 summary cards matching Figma proportions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6 bg-white border border-[#f1f1f1] rounded-[11px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.25)] p-6 min-h-[329px] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-semibold text-[#0f0f0f]">
                Dataset Publication Health
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('datasets')}
                className="text-[14px] font-medium text-[#002456] hover:underline cursor-pointer"
              >
                View My Datasets
              </button>
            </div>
            <p className="mt-1 text-[14px] text-[#808080]">
              Quality score &amp; approval readiness across your registered datasets.
            </p>
          </div>

          <div className="space-y-4 my-5">
            {datasets.slice(0, 4).map((ds) => (
              <div key={ds.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-[14px]">
                  <span className="font-medium text-[#0f0f0f] truncate">{ds.name}</span>
                  <span className="text-[#565555] shrink-0">{ds.quality}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#eef2f6] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      ds.status === 'Published' ? 'bg-[#32c4a6]' : 'bg-[#f59e0b]'
                    }`}
                    style={{ width: ds.quality }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-5 text-[13px] text-[#808080]">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[#32c4a6]" /> Published
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[#f59e0b]" /> Awaiting Approval
            </span>
          </div>
        </div>

        <div className="lg:col-span-6 bg-white border border-[#f1f1f1] rounded-[11px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.25)] p-6 min-h-[329px] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-semibold text-[#0f0f0f]">
                Network Catalog Coverage
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('catalog')}
                className="text-[14px] font-medium text-[#002456] hover:underline cursor-pointer"
              >
                Browse Catalog
              </button>
            </div>
            <p className="mt-1 text-[14px] text-[#808080]">
              Active mobility exchange standards available in your IMDX workspace.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-5">
            {[
              { tag: 'GTFS', count: '14 offers' },
              { tag: 'GTFS-RT', count: '9 offers' },
              { tag: 'OCPI', count: '11 offers' },
              { tag: 'GBFS', count: '6 offers' },
              { tag: 'EV_CHARGING', count: '8 offers' },
              { tag: 'MDS', count: '5 offers' },
            ].map((item) => (
              <button
                key={item.tag}
                type="button"
                onClick={() => onNavigate('catalog')}
                className="rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] hover:border-[#32c4a6] p-3 text-left transition-colors cursor-pointer"
              >
                <p className="text-[13px] font-semibold text-[#002456]">{item.tag}</p>
                <p className="mt-1 text-[13px] text-[#808080]">{item.count}</p>
              </button>
            ))}
          </div>

          <p className="text-[13px] text-[#808080]">
            Hosted Workspace Endpoint: <span className="font-mono text-[#0f0f0f]">imdx-prod-in-01</span>
          </p>
        </div>
      </div>

      {/* Bottom full-width activity card */}
      <div className="bg-white border border-[#f1f1f1] rounded-[11px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.25)] p-6 min-h-[320px]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[18px] font-semibold text-[#0f0f0f]">Recent Datasets</h2>
          <button
            type="button"
            onClick={() => onNavigate('datasets')}
            className="text-[14px] font-medium text-[#002456] hover:underline cursor-pointer"
          >
            Manage all
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-[rgba(187,209,226,0.39)] text-[15px] text-[#0f0f0f]">
                <th className="py-3 px-4 font-normal rounded-l-md">Dataset</th>
                <th className="py-3 px-4 font-normal">Category</th>
                <th className="py-3 px-4 font-normal">Coverage</th>
                <th className="py-3 px-4 font-normal">Update frequency</th>
                <th className="py-3 px-4 font-normal">Quality</th>
                <th className="py-3 px-4 font-normal rounded-r-md">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f1f1] text-[15px] text-[#565555]">
              {datasets.map((ds) => (
                <tr key={ds.id} className="hover:bg-[#f8fafc]">
                  <td className="py-3.5 px-4 font-medium text-[#0f0f0f]">{ds.name}</td>
                  <td className="py-3.5 px-4">{ds.category}</td>
                  <td className="py-3.5 px-4">{ds.coverage}</td>
                  <td className="py-3.5 px-4">{ds.updateFrequency}</td>
                  <td className="py-3.5 px-4">{ds.quality}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-0.5 text-[13px] font-medium ${
                        ds.status === 'Published'
                          ? 'bg-[#dcffe5] text-[#059669]'
                          : 'bg-[#ffeedc] text-[#d97706]'
                      }`}
                    >
                      {ds.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
