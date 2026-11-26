import { useState } from 'react';
import { ModalPortal } from '../ModalPortal';
import type {
  AccessRequestItem,
  AccessRequestStatus,
  MyDatasetItem,
  WorkspaceNavKey,
} from '../../types/dashboard';

interface DashboardOverviewProps {
  datasets: MyDatasetItem[];
  subscriptionsCount: number;
  accessRequests: AccessRequestItem[];
  onUpdateAccessRequestStatus: (id: string, status: AccessRequestStatus, note?: string) => void;
  onRegisterDatasetClick: () => void;
  onNavigate: (nav: WorkspaceNavKey) => void;
}

const EXCHANGE_SERIES = {
  '6m': {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    points: [
      { label: 'Jan', incoming: 28, outgoing: 16 },
      { label: 'Feb', incoming: 41, outgoing: 26 },
      { label: 'Mar', incoming: 64, outgoing: 48 },
      { label: 'Apr', incoming: 54, outgoing: 36 },
      { label: 'May', incoming: 79, outgoing: 61 },
      { label: 'Jun', incoming: 92, outgoing: 68 },
    ],
    incoming: '0,68 48,58 76,65 112,35 142,27 195,43 240,22 288,12 360,12',
    outgoing: '0,82 48,72 76,79 112,50 142,41 195,56 240,34 288,24 316,30 338,24 360,36',
  },
  '12m': {
    labels: ['Jul', 'Sep', 'Nov', 'Jan', 'Mar', 'Jun'],
    points: [
      { label: 'Jul', incoming: 19, outgoing: 11 },
      { label: 'Sep', incoming: 34, outgoing: 22 },
      { label: 'Nov', incoming: 49, outgoing: 34 },
      { label: 'Jan', incoming: 61, outgoing: 45 },
      { label: 'Mar', incoming: 77, outgoing: 58 },
      { label: 'Jun', incoming: 96, outgoing: 74 },
    ],
    incoming: '0,75 48,66 96,52 144,44 192,38 240,28 288,18 360,10',
    outgoing: '0,86 48,79 96,68 144,58 192,49 240,41 288,31 360,24',
  },
};

export function DashboardOverview({
  datasets,
  subscriptionsCount,
  accessRequests,
  onUpdateAccessRequestStatus,
  onRegisterDatasetClick,
  onNavigate,
}: DashboardOverviewProps) {
  const [timeframe, setTimeframe] = useState<'6m' | '12m'>('6m');
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<AccessRequestItem | null>(null);
  const [requestNote, setRequestNote] = useState('');

  const totalOwned = datasets.length;
  const totalCombined = totalOwned + subscriptionsCount;
  const publishedCount = datasets.filter((d) => d.status === 'Published').length;
  const pendingApprovalCount = accessRequests.filter(
    (r) => r.status === 'Pending Review' || r.status === 'Information Required',
  ).length;

  const series = EXCHANGE_SERIES[timeframe];
  const hoveredPoint = hoveredMonthIdx !== null ? series.points[hoveredMonthIdx] : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <p className="text-[11.5px] font-medium text-[#64748b]">
          IMDX &gt; <span className="text-[#334155]">Dashboard</span>
        </p>
        <h1 className="mt-0.5 text-[22px] sm:text-[24px] font-semibold text-[#002456] leading-tight">
          Dashboard
        </h1>
        <p className="mt-0.5 text-[13px] text-[#64748b]">
          Get a complete overview of your organization&apos;s activity across the IMDX ecosystem.
        </p>
      </div>

      {/* 4 KPI cards matching screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        <button
          type="button"
          onClick={() => onNavigate('datasets')}
          style={{ ['--stagger-i' as string]: 0 }}
          className="imdx-stagger-card imdx-card-interactive text-left rounded-[12px] p-4 flex flex-col justify-between gap-2.5 cursor-pointer"
        >
          <div className="flex items-start justify-between gap-2 w-full">
            <div>
              <p className="text-[12px] text-[#64748b]">Total Datasets</p>
              <p className="mt-0.5 text-[24px] font-bold text-[#102529] leading-tight">
                {String(totalCombined).padStart(2, '0')}
              </p>
            </div>
            <span className="flex items-center justify-center size-9 rounded-[9px] bg-[#e9faf5] text-[#059669] shrink-0">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <ellipse cx="12" cy="5" rx="8" ry="3" />
                <path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
                <path d="M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
              </svg>
            </span>
          </div>
          <p className="text-[11.5px] text-[#64748b]">
            {totalOwned} owned · {subscriptionsCount} subscribed
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('datasets')}
          style={{ ['--stagger-i' as string]: 1 }}
          className="imdx-stagger-card imdx-card-interactive text-left rounded-[12px] p-4 border-2 border-[#0284c7]/75 flex flex-col justify-between gap-2.5 cursor-pointer"
        >
          <div className="flex items-start justify-between gap-2 w-full">
            <div>
              <p className="text-[12px] text-[#64748b]">Published Dataset</p>
              <p className="mt-0.5 text-[24px] font-bold text-[#102529] leading-tight">
                {String(publishedCount).padStart(2, '0')}
              </p>
            </div>
            <span className="flex items-center justify-center size-9 rounded-[9px] bg-[#e9faf5] text-[#059669] shrink-0">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="9" />
                <polyline points="9 12 11.5 14.5 15.5 9.5" />
              </svg>
            </span>
          </div>
          <p className="text-[11.5px] text-[#64748b]">Available across IMDX catalog</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('subscriptions')}
          style={{ ['--stagger-i' as string]: 2 }}
          className="imdx-stagger-card imdx-card-interactive text-left rounded-[12px] p-4 flex flex-col justify-between gap-2.5 cursor-pointer"
        >
          <div className="flex items-start justify-between gap-2 w-full">
            <div>
              <p className="text-[12px] text-[#64748b]">Active Subscription</p>
              <p className="mt-0.5 text-[24px] font-bold text-[#102529] leading-tight">
                {String(subscriptionsCount).padStart(2, '0')}
              </p>
            </div>
            <span className="flex items-center justify-center size-9 rounded-[9px] bg-[#e9faf5] text-[#059669] shrink-0">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M5 2h14M5 22h14M6 2v4c0 3 6 4 6 6s-6 3-6 6v4M18 2v4c0 3-6 4-6 6s6 3 6 6v4" />
              </svg>
            </span>
          </div>
          <p className="text-[11.5px] text-[#64748b]">
            {subscriptionsCount} active contracts
          </p>
        </button>

        <div
          style={{ ['--stagger-i' as string]: 3 }}
          className="imdx-stagger-card imdx-card-interactive rounded-[12px] p-4 flex flex-col justify-between gap-2.5"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[12px] text-[#64748b]">Pending Approval</p>
              <p className="mt-0.5 text-[24px] font-bold text-[#102529] leading-tight">
                {String(pendingApprovalCount).padStart(2, '0')}
              </p>
            </div>
            <span className="flex items-center justify-center size-9 rounded-[9px] bg-[#e9faf5] text-[#059669] shrink-0">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 16h5v5" />
              </svg>
            </span>
          </div>
          <p className="text-[11.5px] text-[#64748b]">
            {String(pendingApprovalCount).padStart(2, '0')} consent requests awaiting
          </p>
        </div>
      </div>

      {/* CTA Banner Card matching screenshot */}
      <div
        style={{ ['--stagger-i' as string]: 4 }}
        className="imdx-stagger-card rounded-[12px] border border-[#bfdbfe] bg-[#eff6ff]/92 backdrop-blur-xs px-4 sm:px-5 py-3.5 flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="flex items-center justify-center size-11 rounded-[10px] bg-[#002456] text-white shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <ellipse cx="12" cy="5" rx="8" ry="3" />
              <path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
              <path d="M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-[#102529]">
              Share your data with the IMDX ecosystem
            </p>
            <p className="mt-0.5 text-[12px] text-[#475569]">
              Register and publish your mobility datasets to enable secure discovery and exchange
              across participating organizations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('catalog')}
            className="h-[34px] px-4 rounded-[8px] border border-[#cbd5e1] bg-white hover:bg-[#f8fafc] text-[12.5px] font-semibold text-[#102529] cursor-pointer transition-colors"
          >
            Explore catalog
          </button>
          <button
            type="button"
            onClick={onRegisterDatasetClick}
            className="h-[34px] px-4 rounded-full bg-[#22b59b] hover:bg-[#1ca18a] text-white text-[12.5px] font-semibold cursor-pointer transition-colors shadow-xs"
          >
            + Register data
          </button>
        </div>
      </div>

      {/* Middle 2 Cards: Data Exchange Activity Chart & Dataset Quality */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 imdx-card rounded-[12px] p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-[15.5px] font-semibold text-[#102529]">
                Data exchange activity
              </h2>
              <p className="text-[12px] text-[#64748b]">
                {hoveredPoint
                  ? `${hoveredPoint.label}: ${hoveredPoint.incoming}k incoming · ${hoveredPoint.outgoing}k outgoing`
                  : `Transfers across the last ${timeframe === '6m' ? '6' : '12'} months`}
              </p>
            </div>

            <div className="flex flex-col items-end gap-1.5">
              <select
                aria-label="Exchange chart timeframe"
                value={timeframe}
                onChange={(e) => {
                  setTimeframe(e.target.value as '6m' | '12m');
                  setHoveredMonthIdx(null);
                }}
                className="h-[28px] rounded-[6px] border border-[#cbd5e1] bg-white px-2.5 text-[11.5px] text-[#334155] focus:outline-none cursor-pointer"
              >
                <option value="6m">Last 6 months</option>
                <option value="12m">Last 12 months</option>
              </select>
              <div className="flex items-center gap-3 text-[11px] text-[#475569]">
                <span className="flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-[#16b89a]" /> Incoming
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-[#002456]" /> Outgoing
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3">
            <svg viewBox="0 0 390 112" className="w-full h-[126px] overflow-visible">
              {[
                { y: 14, label: '1.0' },
                { y: 50, label: '0.5' },
                { y: 86, label: '0.0' },
              ].map((tick) => (
                <g key={tick.label}>
                  <text x="0" y={tick.y + 3} fontSize="9.5" fill="#94a3b8">
                    {tick.label}
                  </text>
                  <line
                    x1="24"
                    y1={tick.y}
                    x2="384"
                    y2={tick.y}
                    stroke="#e2e8f0"
                    strokeDasharray="3 3"
                  />
                </g>
              ))}

              <g key={timeframe} transform="translate(24, 0)">
                <polyline
                  className="imdx-chart-line"
                  fill="none"
                  stroke="#16b89a"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={series.incoming}
                />
                <polyline
                  className="imdx-chart-line"
                  fill="none"
                  stroke="#002456"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={series.outgoing}
                />
              </g>

              {series.labels.map((label, idx) => (
                <g
                  key={label}
                  onMouseEnter={() => setHoveredMonthIdx(idx)}
                  onMouseLeave={() => setHoveredMonthIdx(null)}
                  className="cursor-pointer"
                >
                  <rect x={idx * 66} y={8} width={60} height={102} fill="transparent" />
                  <text
                    x={28 + idx * 66}
                    y="105"
                    fontSize="9.5"
                    fontWeight={hoveredMonthIdx === idx ? '700' : '400'}
                    fill={hoveredMonthIdx === idx ? '#002456' : '#94a3b8'}
                    textAnchor="middle"
                  >
                    {label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        <div className="lg:col-span-5 imdx-card rounded-[12px] p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-[15.5px] font-semibold text-[#102529]">Dataset quality</h2>
              <p className="text-[12px] text-[#64748b]">Illustrative validation summary</p>
            </div>
            <span className="text-[#334155]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 14l4-4" />
                <path d="M3.34 19a10 10 0 1 1 17.32 0" />
              </svg>
            </span>
          </div>

          <div className="space-y-3 my-3">
            {[
              { label: 'Completeness', pct: '95%' },
              { label: 'Freshness', pct: '91%' },
              { label: 'Schema validity', pct: '87%' },
              { label: 'Consistency', pct: '83%' },
            ].map((row) => (
              <div key={row.label} className="space-y-1">
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="text-[#334155]">{row.label}</span>
                  <span className="font-semibold text-[#102529]">{row.pct}</span>
                </div>
                <div className="h-[5px] w-full rounded-full bg-[#e2e8f0] overflow-hidden">
                  <div
                    className="imdx-bar-animate h-full rounded-full bg-[#22b59b]"
                    style={{ width: row.pct }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Table: Recent Access Requests */}
      <div className="imdx-card rounded-[12px] p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-[15.5px] font-semibold text-[#102529]">Recent access requests</h2>
            <p className="text-[12px] text-[#64748b]">
              Requests from verified consumer organizations (click a row to review)
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('subscriptions')}
            className="text-[12px] font-semibold text-[#002456] underline underline-offset-4 hover:text-[#008fa7] cursor-pointer"
          >
            View all
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-gradient-to-r from-[#e3f9f3]/80 via-[#e8f6fe]/80 to-[#e6f0ff]/80 border-y border-[#b4d7de]/70 text-[12px] text-[#102529]">
                <th className="py-2.5 px-3 font-semibold">Consumer organization</th>
                <th className="py-2.5 px-3 font-semibold">Dataset</th>
                <th className="py-2.5 px-3 font-semibold">Purpose</th>
                <th className="py-2.5 px-3 font-semibold">Submitted</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-2 text-right font-semibold" aria-label="Details" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9] text-[13px] text-[#475569]">
              {accessRequests.map((req, idx) => (
                <tr
                  key={req.id}
                  onClick={() => {
                    setSelectedRequest(req);
                    setRequestNote(req.note ?? '');
                  }}
                  style={{ ['--stagger-i' as string]: idx }}
                  className="imdx-stagger-row hover:bg-[#f8fafc] cursor-pointer transition-colors"
                >
                  <td className="py-2.5 px-3">
                    <p className="font-semibold text-[#102529]">{req.org}</p>
                    <p className="text-[11px] text-[#64748b]">{req.badge}</p>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-[#334155]">{req.dataset}</td>
                  <td className="py-2.5 px-3">{req.purpose}</td>
                  <td className="py-2.5 px-3">{req.submitted}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        req.status === 'Approved'
                          ? 'bg-[#dcfce7] text-[#15803d]'
                          : req.status === 'Rejected'
                            ? 'bg-[#fee2e2] text-[#dc2626]'
                            : req.status === 'Information Required'
                              ? 'bg-[#fef3c7] text-[#b45309]'
                              : 'bg-[#dbeafe] text-[#1d4ed8]'
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-right text-[#64748b] font-semibold">&gt;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Access Request Modal */}
      {selectedRequest && (
        <ModalPortal>
          <div
            className="imdx-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-[#05080d]/55 backdrop-blur-xs p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="access-request-modal-title"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setSelectedRequest(null);
            }}
          >
          <div className="imdx-modal-panel imdx-modal-surface w-full max-w-[460px] rounded-[14px] p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="imdx-kicker">IMDX / CONSENT DECISION</p>
                <h2
                  id="access-request-modal-title"
                  className="mt-0.5 text-[18px] font-semibold text-[#102529]"
                >
                  {selectedRequest.org} → {selectedRequest.dataset}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="text-[#64748b] hover:text-[#102529] text-[20px] leading-none px-1.5 cursor-pointer"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <div className="imdx-subbox grid grid-cols-2 gap-3 rounded-[10px] p-3.5 text-[12.5px]">
              <div>
                <p className="text-[#64748b]">Purpose</p>
                <p className="font-semibold text-[#102529]">{selectedRequest.purpose}</p>
              </div>
              <div>
                <p className="text-[#64748b]">Access Scope</p>
                <p className="font-semibold text-[#102529]">{selectedRequest.scope}</p>
              </div>
              <div>
                <p className="text-[#64748b]">Duration</p>
                <p className="font-semibold text-[#102529]">{selectedRequest.duration}</p>
              </div>
              <div>
                <p className="text-[#64748b]">Current Status</p>
                <p className="font-semibold text-[#002456]">{selectedRequest.status}</p>
              </div>
            </div>

            <div>
              <label
                htmlFor="access-review-note"
                className="block text-[12px] font-medium text-[#334155] mb-1"
              >
                Governance Note (optional)
              </label>
              <input
                id="access-review-note"
                type="text"
                value={requestNote}
                onChange={(e) => setRequestNote(e.target.value)}
                placeholder="Add terms condition or clarification request..."
                className="w-full h-[36px] rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[12.5px] focus:outline-none focus:border-[#008fa7]"
              />
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onUpdateAccessRequestStatus(selectedRequest.id, 'Rejected', requestNote);
                  setSelectedRequest(null);
                }}
                className="h-[34px] px-3.5 rounded-full border border-[#dc2626]/30 text-[12px] font-semibold text-[#dc2626] hover:bg-[#fef2f2] cursor-pointer"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateAccessRequestStatus(
                    selectedRequest.id,
                    'Information Required',
                    requestNote,
                  );
                  setSelectedRequest(null);
                }}
                className="h-[34px] px-3.5 rounded-full border border-[#d97706]/35 text-[12px] font-semibold text-[#b45309] hover:bg-[#fffbeb] cursor-pointer"
              >
                Request Info
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateAccessRequestStatus(selectedRequest.id, 'Approved', requestNote);
                  setSelectedRequest(null);
                }}
                className="h-[34px] px-4 rounded-full bg-[#22b59b] hover:bg-[#1ca18a] text-white text-[12px] font-semibold cursor-pointer"
              >
                Approve Access
              </button>
            </div>
          </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
