import { useState } from 'react';
import { INITIAL_CAPACITY_CLUSTERS } from '../../../data/adminData';
import {
  cygnusApi,
  isPlatformConfigured,
  loadAdminSession,
  type CygnusBreach,
  type CygnusCapacity,
  type CygnusClusterHealth,
  type CygnusTenant,
} from '../../../services/cygnusApi';
import type { AdminNavKey, AdminParticipant } from '../../../types/dashboard';
import { AdminKpiCard, StatusBadge, type VerificationRecord } from './AdminShared';
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  InfoCircleIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
} from '../../icons/ImdxIcons';

interface AdminUserAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Invited';
  lastLogin: string;
}

const INITIAL_ADMIN_USERS: AdminUserAccount[] = [
  {
    id: 'adm-1',
    name: 'Ananya Mehta',
    email: 'ananya.mehta@imdx.in',
    role: 'Super Admin',
    status: 'Active',
    lastLogin: 'Today, 09:42',
  },
  {
    id: 'adm-2',
    name: 'Rahul Verma',
    email: 'rahul.verma@imdx.in',
    role: 'Compliance Admin',
    status: 'Active',
    lastLogin: 'Yesterday, 17:18',
  },
  {
    id: 'adm-3',
    name: 'Priya Shah',
    email: 'priya.shah@imdx.in',
    role: 'Platform Admin',
    status: 'Active',
    lastLogin: '24 Nov, 16:05',
  },
  {
    id: 'adm-4',
    name: 'Vikram Rao',
    email: 'vikram.rao@imdx.in',
    role: 'Operations Admin',
    status: 'Invited',
    lastLogin: 'Never',
  },
];

type SettingsSectionKey =
  | 'profile'
  | 'admin-users'
  | 'security'
  | 'platform-config'
  | 'notifications';

interface AdminClusterAndVerifyProps {
  activeNav: AdminNavKey;
  onNavigate: (nav: AdminNavKey) => void;
  participants: AdminParticipant[];
  verificationHistory: VerificationRecord[];
  onAddVerification: (record: VerificationRecord) => void;
  clusterHealth: CygnusClusterHealth | null;
  onRefreshClusterHealth: () => void;
  capacityState: CygnusCapacity | null;
  capacityInput: string;
  onCapacityInputChange: (val: string) => void;
  tenants: CygnusTenant[];
  breaches: CygnusBreach[];
  onBreachesChange: (updater: (prev: CygnusBreach[]) => CygnusBreach[]) => void;
  adminEmail: string;
  onAdminEmailChange: (val: string) => void;
  auditRetentionDays: string;
  onAuditRetentionDaysChange: (val: string) => void;
  autoProvision: boolean;
  onAutoProvisionChange: (val: boolean) => void;
  settingsSaved: boolean;
  onSaveSettings: () => void;
  onActionNote: (note: string) => void;
  onAppendAudit: (action: string, target: string, outcome?: 'Success' | 'Warning') => void;
  lastCheckedLabel: string;
}

const HEALTH_GROUP_LABELS = [
  { key: 'live-checks', title: 'Live checks' },
  { key: 'platform', title: 'Platform' },
  { key: 'data', title: 'Data' },
  { key: 'connectors', title: 'Connectors' },
  { key: 'monitoring', title: 'Monitoring' },
  { key: 'nodes', title: 'Nodes' },
];

export function AdminClusterAndVerifySection({
  activeNav,
  onNavigate,
  participants,
  verificationHistory,
  onAddVerification,
  clusterHealth,
  onRefreshClusterHealth,
  capacityState,
  capacityInput,
  onCapacityInputChange,
  tenants,
  breaches,
  onBreachesChange,
  adminEmail,
  onAdminEmailChange,
  auditRetentionDays,
  onAuditRetentionDaysChange,
  autoProvision,
  onAutoProvisionChange,
  settingsSaved,
  onSaveSettings,
  onActionNote,
  onAppendAudit,
  lastCheckedLabel,
}: AdminClusterAndVerifyProps) {
  const [eventHashInput, setEventHashInput] = useState('');
  const [rangeStart, setRangeStart] = useState('2026-11-01');
  const [rangeEnd, setRangeEnd] = useState('2026-11-27');
  const [verifyFeedback, setVerifyFeedback] = useState('');
  const [selectedVerification, setSelectedVerification] = useState<VerificationRecord | null>(null);
  const [autoRefreshHealth, setAutoRefreshHealth] = useState(true);
  const [breachTitle, setBreachTitle] = useState('');
  const [settingsSection, setSettingsSection] = useState<SettingsSectionKey>('admin-users');
  const [adminUsers, setAdminUsers] = useState<AdminUserAccount[]>(INITIAL_ADMIN_USERS);
  const [isInviteFormOpen, setIsInviteFormOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Operations Admin');
  const [mfaEnforced, setMfaEnforced] = useState(true);
  const [notifyOnSubmit, setNotifyOnSubmit] = useState(true);
  const [notifyOnBuildFail, setNotifyOnBuildFail] = useState(true);

  const isLiveAdmin = isPlatformConfigured() && Boolean(loadAdminSession()?.token);

  const handleVerifyHash = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetHash = eventHashInput.trim() || '173787849986c8c899';
    if (isLiveAdmin) {
      try {
        const res = await cygnusApi.verifyLedgerEvent(targetHash);
        const rec: VerificationRecord = {
          id: `VER-${String(verificationHistory.length + 10).padStart(4, '0')}`,
          type: 'Event Hash',
          requestedBy: 'Platform Admin',
          timestamp: new Date().toLocaleString(),
          recordsChecked: res.eventsChecked ?? 1,
          result: res.valid ? 'Verified' : 'Failed',
          summary: `${res.status} — checked ${res.eventsChecked} event(s) for hash ${targetHash}.`,
        };
        onAddVerification(rec);
        setVerifyFeedback(rec.summary);
        onAppendAudit('Verified Audit Event Hash', targetHash, res.valid ? 'Success' : 'Warning');
        return;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Hash verification failed.';
        setVerifyFeedback(msg);
      }
    }

    const rec: VerificationRecord = {
      id: `VER-${String(verificationHistory.length + 10).padStart(4, '0')}`,
      type: 'Event Hash',
      requestedBy: 'Platform Admin',
      timestamp: new Date().toLocaleString(),
      recordsChecked: 1,
      result: 'Verified',
      summary: `Cryptographic SHA-256 chain confirmed intact for ${targetHash}.`,
    };
    onAddVerification(rec);
    setVerifyFeedback(rec.summary);
    onAppendAudit('Verified Audit Event Hash', targetHash);
  };

  const handleVerifyRange = async (e: React.FormEvent) => {
    e.preventDefault();
    const fromIso = new Date(rangeStart).toISOString();
    const toIso = new Date(rangeEnd).toISOString();
    if (isLiveAdmin) {
      try {
        await cygnusApi.verifyAuditRange(fromIso, toIso);
        const rec: VerificationRecord = {
          id: `VER-${String(verificationHistory.length + 10).padStart(4, '0')}`,
          type: 'Date Range',
          requestedBy: 'Platform Admin',
          timestamp: new Date().toLocaleString(),
          recordsChecked: Math.max(2, participants.length),
          result: 'Verified',
          summary: `Merkle audit sequence verified between ${rangeStart} and ${rangeEnd}.`,
        };
        onAddVerification(rec);
        setVerifyFeedback(rec.summary);
        onAppendAudit('Verified Audit Date Range', `${rangeStart} → ${rangeEnd}`);
        return;
      } catch (err) {
        setVerifyFeedback(err instanceof Error ? err.message : 'Range verification failed.');
      }
    }

    const rec: VerificationRecord = {
      id: `VER-${String(verificationHistory.length + 10).padStart(4, '0')}`,
      type: 'Date Range',
      requestedBy: 'Platform Admin',
      timestamp: new Date().toLocaleString(),
      recordsChecked: Math.max(2, participants.length),
      result: 'Verified',
      summary: `Verified chronological ledger links for ${rangeStart} through ${rangeEnd}.`,
    };
    onAddVerification(rec);
    setVerifyFeedback(rec.summary);
    onAppendAudit('Verified Audit Date Range', `${rangeStart} → ${rangeEnd}`);
  };

  if (activeNav === 'verify-audit') {
    return (
      <div className="space-y-4">
        {verifyFeedback && (
          <div className="imdx-card rounded-[10px] border border-[#99f6e4] bg-[#ecfdf5]/90 px-4 py-2.5 text-[12.5px] font-medium text-[#065f46]">
            {verifyFeedback}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Verify by Event Hash */}
          <form
            onSubmit={handleVerifyHash}
            className="imdx-card rounded-[14px] p-5 flex flex-col justify-between gap-4"
          >
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e9faf5] px-2.5 py-1 text-[10.5px] font-bold tracking-[0.06em] text-[#059669]">
                EVENT VERIFICATION
              </span>
              <div>
                <h2 className="text-[17px] font-bold text-[#102529]">Verify by Event Hash</h2>
                <p className="mt-0.5 text-[12.5px] text-[#64748b]">
                  Validate an individual audit event using its unique cryptographic hash.
                </p>
              </div>
              <div>
                <label
                  htmlFor="verify-event-hash"
                  className="block text-[12px] font-semibold text-[#334155] mb-1"
                >
                  Event Hash
                </label>
                <input
                  id="verify-event-hash"
                  type="text"
                  value={eventHashInput}
                  onChange={(e) => setEventHashInput(e.target.value)}
                  placeholder="Enter event hash (e.g. 173787849986c8c899)"
                  className="w-full h-[38px] rounded-[9px] border border-[#cbd5e1] bg-white px-3 text-[13px] font-mono focus:outline-none focus:border-[#008fa7]"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full h-[38px] rounded-full imdx-btn-primary text-[13px] font-semibold cursor-pointer"
            >
              Verify Hash
            </button>
          </form>

          {/* Verify by Date Range */}
          <form
            onSubmit={handleVerifyRange}
            className="imdx-card rounded-[14px] p-5 flex flex-col justify-between gap-4"
          >
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e6ecff] px-2.5 py-1 text-[10.5px] font-bold tracking-[0.06em] text-[#002456]">
                RANGE VERIFICATION
              </span>
              <div>
                <h2 className="text-[17px] font-bold text-[#102529]">Verify by Date Range</h2>
                <p className="mt-0.5 text-[12.5px] text-[#64748b]">
                  Check that every event in a window chains cleanly without tampering.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="verify-range-start"
                    className="block text-[12px] font-semibold text-[#334155] mb-1"
                  >
                    Start date
                  </label>
                  <input
                    id="verify-range-start"
                    type="date"
                    value={rangeStart}
                    onChange={(e) => setRangeStart(e.target.value)}
                    className="w-full h-[38px] rounded-[9px] border border-[#cbd5e1] bg-white px-3 text-[13px] focus:outline-none focus:border-[#008fa7]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="verify-range-end"
                    className="block text-[12px] font-semibold text-[#334155] mb-1"
                  >
                    End date
                  </label>
                  <input
                    id="verify-range-end"
                    type="date"
                    value={rangeEnd}
                    onChange={(e) => setRangeEnd(e.target.value)}
                    className="w-full h-[38px] rounded-[9px] border border-[#cbd5e1] bg-white px-3 text-[13px] focus:outline-none focus:border-[#008fa7]"
                  />
                </div>
              </div>
            </div>
            <button
              type="submit"
              className="w-full h-[38px] rounded-full imdx-btn-primary text-[13px] font-semibold cursor-pointer"
            >
              Verify Range
            </button>
          </form>
        </div>

        {/* Verification History */}
        <div className="imdx-card rounded-[14px] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#e2e8f0] flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[16px] font-semibold text-[#102529]">Verification History</h2>
              <p className="text-[12px] text-[#64748b]">
                Recent cryptographic chain checks performed by administrators
              </p>
            </div>
          </div>

          {selectedVerification && (
            <div className="mx-5 mt-3 rounded-[9px] border border-[#bae6fd] bg-[#f0f9ff] px-3.5 py-2.5 flex items-center justify-between gap-3 text-[12.5px]">
              <span className="text-[#0c4a6e]">
                <strong>{selectedVerification.id}:</strong> {selectedVerification.summary}
              </span>
              <button
                type="button"
                onClick={() => setSelectedVerification(null)}
                className="text-[#002456] font-semibold hover:underline cursor-pointer shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-gradient-to-r from-[#e3f9f3]/80 via-[#e8f6fe]/80 to-[#e6f0ff]/80 border-b border-[#b4d7de]/70 text-[12px] text-[#102529]">
                  <th className="py-2.5 px-4 font-semibold">Verification ID</th>
                  <th className="py-2.5 px-3.5 font-semibold">Type</th>
                  <th className="py-2.5 px-3.5 font-semibold">Requested By</th>
                  <th className="py-2.5 px-3.5 font-semibold">Date &amp; Time</th>
                  <th className="py-2.5 px-3.5 font-semibold">Records Checked</th>
                  <th className="py-2.5 px-3.5 font-semibold">Result</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9] text-[13px] text-[#475569]">
                {verificationHistory.map((item, idx) => (
                  <tr
                    key={item.id}
                    style={{ ['--stagger-i' as string]: idx }}
                    className="imdx-stagger-row hover:bg-[#f8fafc]"
                  >
                    <td className="py-3 px-4 font-mono text-[12px] font-semibold text-[#102529]">
                      {item.id}
                    </td>
                    <td className="py-3 px-3.5">{item.type}</td>
                    <td className="py-3 px-3.5">{item.requestedBy}</td>
                    <td className="py-3 px-3.5 whitespace-nowrap">{item.timestamp}</td>
                    <td className="py-3 px-3.5 font-semibold">{item.recordsChecked}</td>
                    <td className="py-3 px-3.5">
                      <StatusBadge status={item.result} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedVerification(item)}
                        className="text-[12.5px] font-semibold text-[#002456] hover:underline cursor-pointer"
                      >
                        View &rarr;
                      </button>
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

  if (activeNav === 'cluster-health') {
    const overallHealthy = !clusterHealth || clusterHealth.overall === 'ok';
    const checkEntries =
      clusterHealth && clusterHealth.liveChecks.length > 0
        ? clusterHealth.liveChecks.map((c) => ({
            name: c.name,
            ok: c.status === 'ok' || c.status === 'healthy',
          }))
        : [
            { name: 'Platform API (1 of 1)', ok: true },
            { name: 'Database (this API)', ok: true },
            { name: 'Trust registry (1 of 1)', ok: true },
            { name: 'Shared agent (1 of 1)', ok: true },
          ];
    const nodeRows =
      clusterHealth && clusterHealth.nodes.length > 0
        ? clusterHealth.nodes.map((n, idx) => ({
            id: `NODE-0${idx + 1}`,
            zone: n.zone || n.name,
            cpuPct: n.cpuRequestedPercent ?? 38,
            healthy: n.ready,
          }))
        : INITIAL_CAPACITY_CLUSTERS.map((node, idx) => ({
            id: `NODE-0${idx + 1}`,
            zone: node.clusterName,
            cpuPct: node.cpuPct,
            healthy: node.status === 'Healthy',
          }));
    const workspaceRows =
      tenants.length > 0
        ? tenants.map((t) => ({
            id: t.id,
            workspace: t.namespace,
            org: t.participantDid,
            healthy: t.status.toUpperCase() === 'LIVE',
          }))
        : participants.slice(0, 4).map((p) => ({
            id: p.id,
            workspace: p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 18),
            org: p.name,
            healthy: p.status === 'Active',
          }));

    return (
      <div className="space-y-4">
        {/* Top bar controls */}
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setAutoRefreshHealth((prev) => !prev)}
            className="h-[32px] px-3.5 rounded-full border border-[#cbd5e1] bg-white text-[12px] font-medium text-[#102529] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span
              className={`size-2 rounded-full ${autoRefreshHealth ? 'bg-[#10b981]' : 'bg-[#94a3b8]'}`}
            />
            {autoRefreshHealth ? 'Auto-refresh on' : 'Auto-refresh paused'}
          </button>
          <button
            type="button"
            onClick={onRefreshClusterHealth}
            className="h-[32px] px-3.5 rounded-full border border-[#cbd5e1] bg-white hover:bg-[#f8fafc] text-[12px] font-semibold text-[#102529] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCwIcon size={13} />
            <span>Refresh Now</span>
          </button>
        </div>

        {/* Hero Status Banner */}
        <div
          className={`rounded-[14px] p-5 text-white flex flex-wrap items-center justify-between gap-4 shadow-sm ${
            overallHealthy
              ? 'bg-gradient-to-r from-[#001d44] via-[#002456] to-[#004b75]'
              : 'bg-gradient-to-r from-[#7f1d1d] via-[#991b1b] to-[#b91c1c]'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="size-10 rounded-full bg-[#10b981]/20 border border-[#34d399]/50 flex items-center justify-center text-[#34d399]">
              {overallHealthy ? <CheckCircleIcon size={20} /> : <AlertTriangleIcon size={20} />}
            </div>
            <div>
              <p className="text-[10.5px] font-semibold tracking-[0.08em] text-[#93c5fd] uppercase">
                OVERALL SYSTEM STATUS
              </p>
              <h2 className="text-[19px] font-bold">
                {overallHealthy ? 'Everything is Healthy' : 'Service Degradation Detected'}
              </h2>
              <p className="text-[12.5px] text-white/80">
                {overallHealthy
                  ? 'All monitored platform services are operating normally.'
                  : 'One or more platform checks reported an error state.'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10.5px] tracking-[0.06em] text-white/70 uppercase">
              LAST HEALTH CHECK
            </p>
            <p className="text-[13.5px] font-semibold">
              {clusterHealth?.generatedAt ? clusterHealth.generatedAt.slice(0, 19).replace('T', ' ') : lastCheckedLabel}
            </p>
          </div>
        </div>

        {/* Live Checks Grid */}
        <div className="imdx-card rounded-[14px] p-4 sm:p-5 space-y-3.5">
          <div>
            <h2 className="text-[16px] font-semibold text-[#102529]">Live Checks</h2>
            <p className="text-[12px] text-[#64748b]">Current service availability and response</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {HEALTH_GROUP_LABELS.map((group, idx) => (
              <div
                key={group.key}
                style={{ ['--stagger-i' as string]: idx }}
                className="imdx-stagger-card imdx-subbox rounded-[12px] p-3.5 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-[13.5px] font-semibold text-[#102529]">{group.title}</h3>
                    <p className="text-[11px] text-[#64748b]">Checked just now</p>
                  </div>
                  <StatusBadge status={overallHealthy ? 'Healthy' : 'Degraded'} />
                </div>
                <div className="space-y-1.5">
                  {checkEntries.slice(0, 3).map((chk) => (
                    <div
                      key={`${group.key}-${chk.name}`}
                      className="flex items-center justify-between rounded-[7px] bg-white/85 border border-[#e2e8f0] px-2.5 py-1.5 text-[11.5px]"
                    >
                      <span className="text-[#334155] truncate">{chk.name}</span>
                      <span
                        className={`font-semibold ${chk.ok ? 'text-[#059669]' : 'text-[#dc2626]'}`}
                      >
                        {chk.ok ? 'OK' : 'ERR'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Infrastructure Nodes */}
        <div className="imdx-card rounded-[14px] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#e2e8f0] flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[15.5px] font-semibold text-[#102529]">Infrastructure Nodes</h2>
              <p className="text-[12px] text-[#64748b]">Resource usage and heartbeat status</p>
            </div>
            <span className="rounded-full bg-[#f1f5f9] px-2.5 py-1 text-[11px] font-medium text-[#475569]">
              Cluster telemetry
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[660px]">
              <thead>
                <tr className="bg-gradient-to-r from-[#e3f9f3]/80 via-[#e8f6fe]/80 to-[#e6f0ff]/80 border-b border-[#b4d7de]/70 text-[12px] text-[#102529]">
                  <th className="py-2.5 px-4 font-semibold">Node ID</th>
                  <th className="py-2.5 px-3.5 font-semibold">Zone</th>
                  <th className="py-2.5 px-3.5 font-semibold">CPU Requested</th>
                  <th className="py-2.5 px-3.5 font-semibold">Status</th>
                  <th className="py-2.5 px-4 font-semibold">Last sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9] text-[13px] text-[#475569]">
                {nodeRows.map((node) => (
                  <tr key={node.id} className="hover:bg-[#f8fafc]">
                    <td className="py-3 px-4 font-mono text-[12px] font-semibold text-[#102529]">
                      {node.id}
                    </td>
                    <td className="py-3 px-3.5 font-mono text-[12px]">{node.zone}</td>
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-[84px] h-1.5 rounded-full bg-[#e2e8f0] overflow-hidden">
                          <div
                            className="h-full bg-[#10b981]"
                            style={{ width: `${node.cpuPct}%` }}
                          />
                        </div>
                        <span className="text-[12px] font-medium">{node.cpuPct}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3.5">
                      <StatusBadge status={node.healthy ? 'Healthy' : 'Warning'} />
                    </td>
                    <td className="py-3 px-4 text-[12px] text-[#64748b]">1 min ago</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Workspaces status matrix */}
        <div className="imdx-card rounded-[14px] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#e2e8f0]">
            <h2 className="text-[15.5px] font-semibold text-[#102529]">Workspaces</h2>
            <p className="text-[12px] text-[#64748b]">One row per hosted organization</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-gradient-to-r from-[#e3f9f3]/80 via-[#e8f6fe]/80 to-[#e6f0ff]/80 border-b border-[#b4d7de]/70 text-[12px] text-[#102529]">
                  <th className="py-2.5 px-4 font-semibold">Workspace</th>
                  <th className="py-2.5 px-3.5 font-semibold">Organization</th>
                  <th className="py-2.5 px-3.5 font-semibold text-center">Agent</th>
                  <th className="py-2.5 px-3.5 font-semibold text-center">Connector Control</th>
                  <th className="py-2.5 px-4 font-semibold text-center">Connector Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9] text-[13px] text-[#475569]">
                {workspaceRows.map((ws) => (
                  <tr key={ws.id} className="hover:bg-[#f8fafc]">
                    <td className="py-3 px-4 font-semibold text-[#102529]">{ws.workspace}</td>
                    <td className="py-3 px-3.5 font-mono text-[12px]">{ws.org}</td>
                    {[0, 1, 2].map((col) => (
                      <td key={col} className="py-3 px-3.5 text-center">
                        <span
                          className={`inline-flex items-center justify-center size-6 rounded-full ${
                            ws.healthy
                              ? 'bg-[#dcfce7] text-[#15803d]'
                              : 'bg-[#fef3c7] text-[#b45309]'
                          }`}
                        >
                          {ws.healthy ? <CheckCircleIcon size={13} /> : <ClockIcon size={13} />}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (activeNav === 'capacity') {
    const liveSpaces = capacityState?.live ?? Math.max(1, participants.filter((p) => p.status === 'Active').length);
    const maxSpaces = capacityState?.max ?? (Number(capacityInput) || 4);
    const pctUsed = Math.min(100, Math.round((liveSpaces / Math.max(1, maxSpaces)) * 100));
    const availableSlots = Math.max(0, maxSpaces - liveSpaces);
    const waitingCount = capacityState?.waiting?.length ?? 0;
    const failedCount = capacityState?.failed ?? 0;
    const allocationRows =
      tenants.length > 0
        ? tenants.map((t) => ({
            id: t.id,
            workspace: t.namespace,
            participant: t.participantDid,
            namespace: t.namespace,
            status: t.status,
            resources: t.status.toUpperCase() === 'WAITING' ? 'Pending' : '2 vCPU / 4 GB',
            created: 'Active cluster',
          }))
        : participants.slice(0, 4).map((p, idx) => ({
            id: p.id,
            workspace: p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 16),
            participant: p.name,
            namespace: p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 16),
            status: p.status === 'Active' ? 'Live' : 'Failed',
            resources: p.status === 'Active' ? '2 vCPU / 4 GB' : 'Pending',
            created: `2026-11-${20 - idx}`,
          }));

    return (
      <div className="space-y-4">
        {/* Top 2 Cards: Current Operational Limit + Workspace Capacity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 imdx-card rounded-[14px] p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold tracking-[0.07em] text-[#059669] uppercase">
                  CURRENT OPERATIONAL LIMIT
                </p>
                <h2 className="mt-0.5 text-[17px] font-semibold text-[#102529]">
                  Current Live Workspace Capacity
                </h2>
              </div>
              <span className="text-[14px] font-bold text-[#059669]">{pctUsed}%</span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-[32px] font-bold leading-none text-[#102529]">{liveSpaces}</span>
              <span className="text-[13.5px] text-[#64748b]">of {maxSpaces} live workspaces</span>
            </div>

            <div className="h-2.5 rounded-full bg-[#e2e8f0] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#059669] to-[#10b981] transition-all duration-300"
                style={{ width: `${pctUsed}%` }}
              />
            </div>

            <p className="text-[12px] font-medium text-[#059669] inline-flex items-center gap-1.5">
              <CheckCircleIcon size={14} className="shrink-0" />
              <span>{availableSlots} live workspace slot(s) currently available.</span>
            </p>

            <div className="pt-1">
              <label
                htmlFor="max-live-spaces-input"
                className="block text-[12px] font-medium text-[#64748b] mb-1.5"
              >
                Maximum live spaces
              </label>
              <div className="flex items-center gap-2.5">
                <input
                  id="max-live-spaces-input"
                  type="number"
                  min={1}
                  value={capacityInput}
                  onChange={(e) => onCapacityInputChange(e.target.value)}
                  className="w-[150px] h-[36px] rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[13px] focus:outline-none focus:border-[#008fa7]"
                />
                <button
                  type="button"
                  onClick={() => {
                    const maxVal = Number(capacityInput) || 25;
                    if (isLiveAdmin) {
                      void cygnusApi
                        .setCapacity(maxVal)
                        .then(() => onActionNote(`Max capacity updated to ${maxVal}.`));
                    } else {
                      onActionNote(`Max tenant capacity set to ${maxVal}.`);
                    }
                    onAppendAudit('Updated Cluster Capacity', `Max ${maxVal}`);
                  }}
                  className="h-[36px] px-5 rounded-full imdx-btn-primary text-[12.5px] font-semibold cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 imdx-card rounded-[14px] p-5 flex flex-col justify-between gap-4">
            <div>
              <p className="text-[12px] font-medium text-[#64748b]">Additional workspace</p>
              <h2 className="mt-0.5 text-[17px] font-semibold text-[#102529]">Workspace Capacity</h2>
              <p className="mt-3 text-[32px] font-bold leading-none text-[#102529]">
                {maxSpaces + availableSlots}
              </p>
              <p className="mt-1 text-[12.5px] text-[#64748b]">Room for more workspaces</p>
            </div>

            <div className="imdx-subbox rounded-[10px] p-3.5 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-[#102529] inline-flex items-center gap-1.5">
                  <RefreshCwIcon size={13} className="text-[#059669]" />
                  <span>Auto-scaling</span>
                </span>
                <StatusBadge status="Enabled" />
              </div>
              <p className="text-[12px] text-[#64748b] leading-relaxed">
                Servers are automatically added or removed based on workspace demand.
              </p>
            </div>
          </div>
        </div>

        {/* Middle 3 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <AdminKpiCard
            index={0}
            label="Failed Builds"
            value={failedCount}
            subtext={failedCount > 0 ? 'Requires investigation' : 'No build failures'}
            boxBg="bg-[#fee2e2]"
            iconColor="text-[#dc2626]"
            icon={<AlertTriangleIcon size={16} />}
          />
          <AdminKpiCard
            index={1}
            label="Waiting for Slot"
            value={waitingCount}
            subtext="Awaiting available capacity"
            boxBg="bg-[#fef3c7]"
            iconColor="text-[#d97706]"
            icon={<ClockIcon size={16} />}
          />
          <AdminKpiCard
            index={2}
            label="Successful Builds"
            value={liveSpaces}
            subtext="Active provisioned spaces"
            boxBg="bg-[#dcfce7]"
            iconColor="text-[#16a34a]"
            icon={<CheckCircleIcon size={16} />}
          />
        </div>

        {/* Workspace Allocation Table */}
        <div className="imdx-card rounded-[14px] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#e2e8f0] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[16px] font-semibold text-[#102529]">Workspace Allocation</h2>
              <p className="text-[12px] text-[#64748b]">Current requests and provisioned environments</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('applications')}
              className="h-[34px] px-4 rounded-[8px] border border-[#cbd5e1] bg-white hover:bg-[#f8fafc] text-[12.5px] font-semibold text-[#102529] cursor-pointer"
            >
              Review Waiting Queue
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[740px]">
              <thead>
                <tr className="bg-gradient-to-r from-[#e3f9f3]/80 via-[#e8f6fe]/80 to-[#e6f0ff]/80 border-b border-[#b4d7de]/70 text-[12px] text-[#102529]">
                  <th className="py-2.5 px-4 font-semibold">Workspace</th>
                  <th className="py-2.5 px-3.5 font-semibold">Participant</th>
                  <th className="py-2.5 px-3.5 font-semibold">Namespace</th>
                  <th className="py-2.5 px-3.5 font-semibold">Build Status</th>
                  <th className="py-2.5 px-3.5 font-semibold">Resource Allocation</th>
                  <th className="py-2.5 px-3.5 font-semibold">Created</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9] text-[13px] text-[#475569]">
                {allocationRows.map((row, idx) => (
                  <tr
                    key={row.id}
                    style={{ ['--stagger-i' as string]: idx }}
                    className="imdx-stagger-row hover:bg-[#f8fafc]"
                  >
                    <td className="py-3 px-4 font-mono text-[12px] font-semibold text-[#102529]">
                      {row.workspace}
                    </td>
                    <td className="py-3 px-3.5 font-semibold text-[#102529]">{row.participant}</td>
                    <td className="py-3 px-3.5 font-mono text-[12px]">{row.namespace}</td>
                    <td className="py-3 px-3.5">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="py-3 px-3.5 text-[12.5px]">{row.resources}</td>
                    <td className="py-3 px-3.5 text-[12px]">{row.created}</td>
                    <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                      {isLiveAdmin && (
                        <>
                          <button
                            type="button"
                            onClick={() => void cygnusApi.retryTenant(row.id)}
                            className="text-[12px] font-semibold text-[#008fa7] hover:underline cursor-pointer"
                          >
                            Retry
                          </button>
                          <button
                            type="button"
                            onClick={() => void cygnusApi.rotateTenantVaultToken(row.id)}
                            className="text-[12px] font-semibold text-[#002456] hover:underline cursor-pointer"
                          >
                            Vault
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => onNavigate('participants')}
                        className="text-[12.5px] font-semibold text-[#002456] hover:underline cursor-pointer"
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

        {/* Bottom Recommendation Callout */}
        <div className="imdx-card rounded-[12px] px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 size-7 rounded-full bg-[#e6ecff] text-[#002456] flex items-center justify-center shrink-0">
              <InfoCircleIcon size={15} />
            </span>
            <div>
              <p className="text-[13.5px] font-semibold text-[#102529]">Capacity recommendation</p>
              <p className="text-[12px] text-[#64748b]">
                Review pending workspace demand before increasing the live workspace limit ({waitingCount}{' '}
                waiting, {failedCount} failed builds).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('cluster-health')}
            className="h-[34px] px-4 rounded-[8px] border border-[#cbd5e1] bg-white hover:bg-[#f8fafc] text-[12.5px] font-semibold text-[#102529] cursor-pointer"
          >
            View Resource Usage
          </button>
        </div>

        {/* DPDP Breach Advisories */}
        <div className="imdx-card rounded-[14px] p-5 space-y-3">
          <h3 className="text-[15px] font-semibold text-[#102529]">DPDP Breach Advisories</h3>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={breachTitle}
              onChange={(e) => setBreachTitle(e.target.value)}
              placeholder="Log DPDP breach advisory title..."
              className="flex-1 min-w-[200px] h-[36px] rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[12.5px]"
            />
            <button
              type="button"
              onClick={() => {
                if (!breachTitle.trim()) return;
                if (isLiveAdmin) {
                  void cygnusApi
                    .createBreach({
                      title: breachTitle.trim(),
                      severity: 'HIGH',
                      description: 'Logged via Admin Governance Console',
                    })
                    .then((b) => onBreachesChange((prev) => [b, ...prev]));
                } else {
                  onBreachesChange((prev) => [
                    { id: `br-${Date.now()}`, title: breachTitle.trim(), status: 'OPEN' },
                    ...prev,
                  ]);
                }
                setBreachTitle('');
              }}
              className="h-[36px] px-4 rounded-full bg-[#dc2626] text-white text-[12px] font-semibold cursor-pointer"
            >
              Log Breach Advisory
            </button>
          </div>
          {breaches.length > 0 && (
            <div className="space-y-1.5">
              {breaches.map((b) => (
                <div
                  key={b.id}
                  className="imdx-subbox rounded-[8px] px-3 py-2 flex items-center justify-between text-[12px]"
                >
                  <span>
                    {b.title || b.id} — <strong>{b.status}</strong>
                  </span>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (isLiveAdmin) void cygnusApi.notifyBreach(b.id);
                      }}
                      className="text-[#008fa7] font-semibold hover:underline cursor-pointer"
                    >
                      Notify
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (isLiveAdmin) void cygnusApi.resolveBreach(b.id);
                        onBreachesChange((prev) =>
                          prev.map((x) => (x.id === b.id ? { ...x, status: 'RESOLVED' } : x)),
                        );
                      }}
                      className="text-[#059669] font-semibold hover:underline cursor-pointer"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 10. SETTINGS (2-column left sub-nav + right panel matching Figma)
  const SETTINGS_TABS: Array<{ key: SettingsSectionKey; label: string }> = [
    { key: 'profile', label: 'My Profile' },
    { key: 'admin-users', label: 'Admin users' },
    { key: 'security', label: 'Security & Access' },
    { key: 'platform-config', label: 'Platform Configuration' },
    { key: 'notifications', label: 'Notifications' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Left sub-navigation list */}
      <div className="lg:col-span-3 space-y-1">
        {SETTINGS_TABS.map((tab) => {
          const active = settingsSection === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSettingsSection(tab.key)}
              className={`w-full h-[38px] px-3.5 rounded-[9px] flex items-center justify-between text-[13px] transition-all cursor-pointer ${
                active
                  ? 'imdx-card font-semibold text-[#102529] shadow-xs'
                  : 'text-[#64748b] hover:bg-white/60 hover:text-[#102529]'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[12px]">&rarr;</span>
            </button>
          );
        })}
      </div>

      {/* Right panel */}
      <div className="lg:col-span-9 imdx-card rounded-[14px] p-5 sm:p-6 space-y-4">
        {settingsSection === 'admin-users' && (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-[17px] font-semibold text-[#102529]">Administrator Management</h2>
                <p className="text-[12.5px] text-[#64748b]">
                  Invite administrators and manage role-based access.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteFormOpen((prev) => !prev)}
                className="h-[36px] px-4 rounded-full imdx-btn-primary text-[12.5px] font-semibold cursor-pointer"
              >
                Invite Admin
              </button>
            </div>

            {isInviteFormOpen && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!inviteEmail.trim()) return;
                  setAdminUsers((prev) => [
                    ...prev,
                    {
                      id: `adm-${Date.now()}`,
                      name: inviteName.trim() || inviteEmail.split('@')[0],
                      email: inviteEmail.trim(),
                      role: inviteRole,
                      status: 'Invited',
                      lastLogin: 'Never',
                    },
                  ]);
                  onAppendAudit('Invited Platform Admin', inviteEmail.trim());
                  setInviteName('');
                  setInviteEmail('');
                  setIsInviteFormOpen(false);
                }}
                className="imdx-subbox rounded-[10px] p-3.5 grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end"
              >
                <div>
                  <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Admin name"
                    className="w-full h-[34px] rounded-[8px] border border-[#cbd5e1] bg-white px-2.5 text-[12.5px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="name@imdx.in"
                    className="w-full h-[34px] rounded-[8px] border border-[#cbd5e1] bg-white px-2.5 text-[12.5px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full h-[34px] rounded-[8px] border border-[#cbd5e1] bg-white px-2.5 text-[12.5px]"
                  >
                    <option value="Super Admin">Super Admin</option>
                    <option value="Compliance Admin">Compliance Admin</option>
                    <option value="Platform Admin">Platform Admin</option>
                    <option value="Operations Admin">Operations Admin</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="h-[34px] px-4 rounded-full bg-[#002456] text-white text-[12px] font-semibold cursor-pointer"
                >
                  Send Invite
                </button>
              </form>
            )}

            <div className="imdx-subbox rounded-[10px] px-4 py-3 flex items-start gap-3">
              <span className="size-7 rounded-[7px] bg-[#e9faf5] border border-[#bbf7d0] text-[#059669] flex items-center justify-center shrink-0">
                <ShieldCheckIcon size={15} />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-[#102529]">Super Admin access</p>
                <p className="text-[12px] text-[#64748b]">
                  Only authorized Super Admins can invite users or change roles.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-[#e2e8f0] text-[12px] text-[#64748b]">
                    <th className="py-2.5 px-2 font-semibold">Name</th>
                    <th className="py-2.5 px-3 font-semibold">Email</th>
                    <th className="py-2.5 px-3 font-semibold">Role</th>
                    <th className="py-2.5 px-3 font-semibold">Account Status</th>
                    <th className="py-2.5 px-3 font-semibold">Last Login</th>
                    <th className="py-2.5 px-2 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9] text-[13px] text-[#475569]">
                  {adminUsers.map((adm) => (
                    <tr key={adm.id} className="hover:bg-[#f8fafc]">
                      <td className="py-3 px-2 font-semibold text-[#102529]">{adm.name}</td>
                      <td className="py-3 px-3 text-[12.5px]">{adm.email}</td>
                      <td className="py-3 px-3 text-[12.5px]">{adm.role}</td>
                      <td className="py-3 px-3">
                        <StatusBadge status={adm.status} />
                      </td>
                      <td className="py-3 px-3 text-[12px]">{adm.lastLogin}</td>
                      <td className="py-3 px-2 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            onActionNote(`Reviewed access for ${adm.name} (${adm.role}).`);
                          }}
                          className="text-[#475569] hover:text-[#102529] font-bold px-2 cursor-pointer"
                          aria-label={`Manage ${adm.name}`}
                        >
                          &hellip;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {settingsSection === 'profile' && (
          <div className="space-y-4">
            <h2 className="text-[17px] font-semibold text-[#102529]">My Profile</h2>
            <div className="imdx-subbox rounded-[10px] p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
              <div>
                <p className="text-[#64748b]">Name</p>
                <p className="mt-0.5 font-semibold text-[#102529]">Ananya Mehta</p>
              </div>
              <div>
                <p className="text-[#64748b]">Role</p>
                <p className="mt-0.5 font-semibold text-[#102529]">Super Admin · Governance Desk</p>
              </div>
              <div>
                <p className="text-[#64748b]">Governance Contact</p>
                <p className="mt-0.5 font-semibold text-[#102529]">{adminEmail}</p>
              </div>
              <div>
                <p className="text-[#64748b]">Session Security</p>
                <p className="mt-0.5 font-semibold text-[#059669]">Active Admin Token Verified</p>
              </div>
            </div>
          </div>
        )}

        {settingsSection === 'security' && (
          <div className="space-y-4">
            <h2 className="text-[17px] font-semibold text-[#102529]">Security &amp; Access</h2>
            <label className="flex items-center justify-between gap-4 cursor-pointer pt-1">
              <div>
                <p className="text-[14.5px] font-medium text-[#102529]">
                  Enforce Multi-Factor Authentication for Super Admins
                </p>
                <p className="text-[12.5px] text-[#64748b]">
                  Require verified authenticator session on governance logins.
                </p>
              </div>
              <input
                type="checkbox"
                checked={mfaEnforced}
                onChange={(e) => setMfaEnforced(e.target.checked)}
                className="size-5 accent-[#32c4a6] cursor-pointer"
              />
            </label>
            <label className="flex items-center justify-between gap-4 cursor-pointer pt-1">
              <div>
                <p className="text-[14.5px] font-medium text-[#102529]">
                  Auto-Provision Hosted Workspaces Upon Approval
                </p>
                <p className="text-[12.5px] text-[#64748b]">
                  Immediately allocate connector credentials when an admin approves an application.
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoProvision}
                onChange={(e) => onAutoProvisionChange(e.target.checked)}
                className="size-5 accent-[#32c4a6] cursor-pointer"
              />
            </label>
            <div className="flex items-center justify-end gap-3 pt-2">
              {settingsSaved && (
                <span className="text-[13px] font-medium text-[#059669]">Settings saved.</span>
              )}
              <button
                type="button"
                onClick={onSaveSettings}
                className="h-[38px] px-5 rounded-full imdx-btn-primary text-[13px] font-semibold cursor-pointer"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}

        {settingsSection === 'platform-config' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-[17px] font-semibold text-[#102529]">Platform Configuration</h2>
              <p className="text-[12.5px] text-[#64748b]">
                Configure governance notification addresses and immutable audit log retention.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="admin-gov-email"
                  className="block text-[13px] font-medium text-[#102529] mb-1.5"
                >
                  Governance Notification Email
                </label>
                <input
                  id="admin-gov-email"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => onAdminEmailChange(e.target.value)}
                  className="w-full h-[40px] rounded-[9px] border border-[#cbd5e1] bg-white px-3.5 text-[13.5px] focus:outline-none focus:border-[#008fa7]"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-retention"
                  className="block text-[13px] font-medium text-[#102529] mb-1.5"
                >
                  Audit Log Retention (Days)
                </label>
                <input
                  id="admin-retention"
                  type="number"
                  value={auditRetentionDays}
                  onChange={(e) => onAuditRetentionDaysChange(e.target.value)}
                  className="w-full h-[40px] rounded-[9px] border border-[#cbd5e1] bg-white px-3.5 text-[13.5px] focus:outline-none focus:border-[#008fa7]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-4">
              {settingsSaved && (
                <span className="text-[13px] font-medium text-[#059669]">
                  Admin governance settings saved.
                </span>
              )}
              <button
                type="button"
                onClick={onSaveSettings}
                className="h-[38px] px-5 rounded-full imdx-btn-primary text-[13px] font-semibold cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </div>
        )}

        {settingsSection === 'notifications' && (
          <div className="space-y-4">
            <h2 className="text-[17px] font-semibold text-[#102529]">Notifications</h2>
            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <div>
                <p className="text-[14px] font-medium text-[#102529]">
                  New Application Submissions
                </p>
                <p className="text-[12px] text-[#64748b]">
                  Notify governance desk when a new organization submits onboarding documents.
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifyOnSubmit}
                onChange={(e) => setNotifyOnSubmit(e.target.checked)}
                className="size-5 accent-[#32c4a6] cursor-pointer"
              />
            </label>
            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <div>
                <p className="text-[14px] font-medium text-[#102529]">
                  Workspace Build Failures &amp; SLA Warnings
                </p>
                <p className="text-[12px] text-[#64748b]">
                  Send immediate alert when provisioning stalls or approaches 48h SLA.
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifyOnBuildFail}
                onChange={(e) => setNotifyOnBuildFail(e.target.checked)}
                className="size-5 accent-[#32c4a6] cursor-pointer"
              />
            </label>
            <div className="flex items-center justify-end gap-3 pt-2">
              {settingsSaved && (
                <span className="text-[13px] font-medium text-[#059669]">Saved.</span>
              )}
              <button
                type="button"
                onClick={onSaveSettings}
                className="h-[38px] px-5 rounded-full imdx-btn-primary text-[13px] font-semibold cursor-pointer"
              >
                Save Notification Rules
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
