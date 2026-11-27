import { useEffect, useState } from 'react';
import { INITIAL_CAPACITY_CLUSTERS } from '../../data/adminData';
import { POLICIES } from '../../data/onboardingConstants';
import {
  cygnusApi,
  isPlatformConfigured,
  loadAdminSession,
  type CygnusAdminApplicationSummary,
  type CygnusAdminStats,
  type CygnusApplication,
  type CygnusBreach,
  type CygnusCapacity,
  type CygnusClusterHealth,
  type CygnusTenant,
} from '../../services/cygnusApi';
import { ModalPortal } from '../ModalPortal';
import type {
  AdminNavKey,
  AdminParticipant,
  AdminPolicyRule,
  ApplicationReviewStatus,
  AuditLogEntry,
  DataPurposeItem,
  MyDatasetItem,
} from '../../types/dashboard';
import type { DocumentSlotKey, OnboardingState } from '../../types/onboarding';

interface AdminDashboardViewProps {
  activeNav: AdminNavKey;
  onNavigate: (nav: AdminNavKey) => void;
  onboardingState: OnboardingState;
  datasets: MyDatasetItem[];
  subscriptionsCount: number;
  applicationStatus: ApplicationReviewStatus;
  reviewNote: string;
  searchQuery: string;
  participants: AdminParticipant[];
  policies: AdminPolicyRule[];
  auditLogs: AuditLogEntry[];
  purposes: DataPurposeItem[];
  onParticipantsChange: (next: AdminParticipant[]) => void;
  onPoliciesChange: (next: AdminPolicyRule[]) => void;
  onPurposesChange: (next: DataPurposeItem[]) => void;
  onAppendAudit: (action: string, target: string, outcome?: 'Success' | 'Warning') => void;
  onUpdateApplicationStatus: (status: ApplicationReviewStatus, note?: string) => void;
}

const SECTION_META: Record<AdminNavKey, { label: string; subtitle: string }> = {
  dashboard: {
    label: 'Dashboard',
    subtitle: 'IMDX network governance, onboarding approvals, and ecosystem monitoring.',
  },
  participants: {
    label: 'Participants',
    subtitle: 'Manage verified organizations, DID identities, and workspace access.',
  },
  applications: {
    label: 'Applications',
    subtitle: 'Review submitted organization onboarding dossiers and provision workspaces.',
  },
  policies: {
    label: 'Policies',
    subtitle: 'Configure mandatory ecosystem agreements and version enforcement.',
  },
  'audit-log': {
    label: 'Audit Log',
    subtitle: 'Immutable ledger of administrative reviews, credentials, and policy events.',
  },
  purposes: {
    label: 'Purposes',
    subtitle: 'Authorized data-exchange purposes governing catalog offers and consent.',
  },
  capacity: {
    label: 'Capacity',
    subtitle: 'Hosted connector cluster capacity, tenant allocation, and node health.',
  },
  settings: {
    label: 'Settings',
    subtitle: 'Global governance thresholds, retention rules, and admin notifications.',
  },
};

const DOC_KEYS: Array<{ key: DocumentSlotKey; label: string }> = [
  { key: 'incorporationCertificate', label: 'Incorporation Certificate' },
  { key: 'pan', label: 'PAN' },
  { key: 'gstCertificate', label: 'GST Certificate' },
  { key: 'authorizationLetter', label: 'Authorization Letter' },
];

function StatusBadge({ status }: { status: ApplicationReviewStatus | 'Active' | 'Suspended' }) {
  const styles =
    status === 'Approved' || status === 'Active'
      ? 'bg-[#dcfce7] text-[#15803d]'
      : status === 'Changes Requested' || status === 'Suspended'
        ? 'bg-[#fee2e2] text-[#dc2626]'
        : 'bg-[#fef3c7] text-[#b45309]';

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${styles}`}
    >
      {status}
    </span>
  );
}

export function AdminDashboardView({
  activeNav,
  onNavigate,
  onboardingState,
  datasets,
  subscriptionsCount,
  applicationStatus,
  reviewNote,
  searchQuery,
  participants,
  policies,
  auditLogs,
  purposes,
  onParticipantsChange,
  onPoliciesChange,
  onPurposesChange,
  onAppendAudit,
  onUpdateApplicationStatus,
}: AdminDashboardViewProps) {
  const [participantFilter, setParticipantFilter] = useState<'All' | 'Active' | 'Suspended'>('All');
  const [logOutcomeFilter, setLogOutcomeFilter] = useState<'All' | 'Success' | 'Warning'>('All');
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);
  const [draftNote, setDraftNote] = useState(reviewNote);
  const [newPurposeName, setNewPurposeName] = useState('');

  // Admin settings & governance live state
  const [autoProvision, setAutoProvision] = useState(true);
  const [auditRetentionDays, setAuditRetentionDays] = useState('365');
  const [adminEmail, setAdminEmail] = useState('governance@imdx.org');
  const [settingsSaved, setSettingsSaved] = useState(false);

  const [newPolicyTitle, setNewPolicyTitle] = useState('');
  const [newPolicyBody, setNewPolicyBody] = useState('');
  const [ledgerVerifyText, setLedgerVerifyText] = useState('');
  const [capacityState, setCapacityState] = useState<CygnusCapacity | null>(null);
  const [capacityInput, setCapacityInput] = useState('25');
  const [clusterHealth, setClusterHealth] = useState<CygnusClusterHealth | null>(null);
  const [tenants, setTenants] = useState<CygnusTenant[]>([]);
  const [breaches, setBreaches] = useState<CygnusBreach[]>([]);
  const [breachTitle, setBreachTitle] = useState('');
  const [adminActionNote, setAdminActionNote] = useState('');
  const [adminStats, setAdminStats] = useState<CygnusAdminStats | null>(null);
  const [liveApps, setLiveApps] = useState<CygnusAdminApplicationSummary[] | null>(null);
  const [appStatusFilter, setAppStatusFilter] = useState('');
  const [inspectDetail, setInspectDetail] = useState<(CygnusApplication & { id: string }) | null>(null);
  const [requestInfoItems, setRequestInfoItems] = useState<string[]>(['Organization details']);
  const [rejectReason, setRejectReason] = useState('INCOMPLETE_DOCUMENTS');

  const isLiveAdmin = isPlatformConfigured() && Boolean(loadAdminSession()?.token);

  const refreshLiveApplications = () => {
    if (!isLiveAdmin) return;
    void cygnusApi
      .listAdminApplications(appStatusFilter || undefined)
      .then((list) => setLiveApps(list))
      .catch(() => undefined);
  };

  useEffect(() => {
    if (!isPlatformConfigured() || !loadAdminSession()?.token) return;
    let active = true;
    if (activeNav === 'dashboard' || activeNav === 'applications') {
      void Promise.allSettled([
        cygnusApi.getAdminStats(),
        cygnusApi.listAdminApplications(appStatusFilter || undefined),
      ]).then(([statsRes, appsRes]) => {
        if (!active) return;
        if (statsRes.status === 'fulfilled') setAdminStats(statsRes.value);
        if (appsRes.status === 'fulfilled') setLiveApps(appsRes.value);
      });
    }
    if (activeNav === 'capacity') {
      void Promise.allSettled([
        cygnusApi.getCapacity(),
        cygnusApi.getClusterHealth(),
        cygnusApi.listTenants(),
        cygnusApi.listBreaches(),
      ]).then(([capRes, healthRes, tenRes, breachRes]) => {
        if (!active) return;
        if (capRes.status === 'fulfilled') {
          setCapacityState(capRes.value);
          setCapacityInput(String(capRes.value.max));
        }
        if (healthRes.status === 'fulfilled') setClusterHealth(healthRes.value);
        if (tenRes.status === 'fulfilled') setTenants(tenRes.value);
        if (breachRes.status === 'fulfilled') setBreaches(breachRes.value);
      });
    }
    return () => {
      active = false;
    };
  }, [activeNav, appStatusFilter]);

  const orgName =
    onboardingState.organization.legalName || 'ABC Mobility Technologies Pvt. Ltd.';
  const repEmail =
    onboardingState.representative.email ||
    onboardingState.registration.workEmail ||
    'aarav@abcmobility.in';
  const acceptedPoliciesCount = POLICIES.filter(
    (p) => onboardingState.acceptedPolicies[p.id],
  ).length;

  const appendAudit = (action: string, target: string, outcome: 'Success' | 'Warning' = 'Success') => {
    onAppendAudit(action, target, outcome);
  };

  const handleApplicationDecision = (status: ApplicationReviewStatus) => {
    onUpdateApplicationStatus(status, draftNote.trim());
    appendAudit(
      status === 'Approved' ? 'Approved Application' : 'Requested Application Changes',
      `${onboardingState.applicationNumber} (${orgName})`,
      status === 'Approved' ? 'Success' : 'Warning',
    );
    if (status === 'Approved') {
      const exists = participants.some((p) => p.name === orgName);
      if (!exists) {
        onParticipantsChange([
          {
            id: `part-${Date.now()}`,
            name: orgName,
            did: `did:web:identity-daemon:${onboardingState.applicationNumber}`,
            role: 'Provider & Consumer',
            deployment: 'Hosted By IMDX',
            datasetsCount: datasets.length,
            status: 'Active',
          },
          ...participants,
        ]);
      }
    }
    setIsInspectModalOpen(false);
  };

  const toggleParticipantStatus = async (id: string) => {
    const target = participants.find((p) => p.id === id);
    if (!target) return;
    const nextStatus = target.status === 'Active' ? 'Suspended' : 'Active';
    if (isPlatformConfigured() && loadAdminSession()?.token) {
      if (nextStatus === 'Suspended') {
        await cygnusApi.deactivateParticipant(target.did);
      } else {
        await cygnusApi.reactivateParticipant(target.did);
      }
    }
    onParticipantsChange(
      participants.map((p) => (p.id === id ? { ...p, status: nextStatus } : p)),
    );
    appendAudit(
      nextStatus === 'Suspended' ? 'Suspended Participant' : 'Activated Participant',
      target.name,
      nextStatus === 'Suspended' ? 'Warning' : 'Success',
    );
  };

  const togglePolicyEnforced = (id: string) => {
    onPoliciesChange(
      policies.map((pol) => {
        if (pol.id !== id) return pol;
        const nextEnforced = !pol.enforced;
        appendAudit(
          nextEnforced ? 'Enabled Policy Enforcement' : 'Paused Policy Enforcement',
          `${pol.title} ${pol.version}`,
          nextEnforced ? 'Success' : 'Warning',
        );
        return { ...pol, enforced: nextEnforced };
      }),
    );
  };

  const togglePurposeActive = async (id: string) => {
    const target = purposes.find((p) => p.id === id);
    if (!target) return;
    const next = !target.active;
    if (!next && isPlatformConfigured() && loadAdminSession()?.token) {
      await cygnusApi.deactivatePurpose(id);
    }
    onPurposesChange(purposes.map((pur) => (pur.id === id ? { ...pur, active: next } : pur)));
    appendAudit(next ? 'Activated Data Purpose' : 'Disabled Data Purpose', target.name);
  };

  const handleAddPurpose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPurposeName.trim()) return;
    const trimmed = newPurposeName.trim();
    const desc = 'Custom governance data-exchange purpose registered by IMDX Admin.';
    let createdId = `pur-${Date.now()}`;
    if (isPlatformConfigured() && loadAdminSession()?.token) {
      const res = await cygnusApi.createPurpose({ name: trimmed, category: 'ANALYTICS', description: desc });
      if (res?.id) createdId = res.id;
    }
    const item: DataPurposeItem = {
      id: createdId,
      code: `IMDX-PUR-0${purposes.length + 1}`,
      name: trimmed,
      description: desc,
      active: true,
    };
    onPurposesChange([item, ...purposes]);
    appendAudit('Added Data Purpose', item.name);
    setNewPurposeName('');
  };

  const meta = SECTION_META[activeNav];
  const pendingApprovals = adminStats
    ? (adminStats.applicationsWaiting ?? 0)
    : applicationStatus === 'Under Review'
      ? 1
      : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <p className="imdx-kicker">ADMIN &gt; {meta.label}</p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[21px] sm:text-[24px] text-[#102529] leading-tight">
              {meta.label}
            </h1>
            <p className="mt-0.5 text-[13.5px] sm:text-[14px] text-[#59666d]">{meta.subtitle}</p>
          </div>
          {adminActionNote && (
            <p className="rounded-full bg-[#e5faf6] border border-[#00a5c3]/25 px-3.5 py-1 text-[12px] font-medium text-[#002456]">
              {adminActionNote}
            </p>
          )}
        </div>
      </div>

      {/* 1. DASHBOARD OVERVIEW */}
      {activeNav === 'dashboard' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
            {[
              {
                label: 'Total Datasets',
                value: String(adminStats ? adminStats.datasets : datasets.length).padStart(2, '0'),
                boxBg: 'bg-[#fff1e2]',
                dot: 'bg-[#f59e0b]',
              },
              {
                label: 'Active Participants',
                value: String(
                  adminStats
                    ? adminStats.participants
                    : participants.filter((p) => p.status === 'Active').length,
                ).padStart(2, '0'),
                boxBg: 'bg-[#e6ecff]',
                dot: 'bg-[#3553ab]',
              },
              {
                label: adminStats ? 'Platform Orders' : 'Active Subscriptions',
                value: String(adminStats ? adminStats.orders : subscriptionsCount).padStart(2, '0'),
                boxBg: 'bg-[#e9fffa] border border-[#f1f1f1]',
                dot: 'bg-[#32c4a6]',
              },
              {
                label: 'Pending Approvals',
                value: String(pendingApprovals).padStart(2, '0'),
                boxBg: 'bg-[#fffbe6]',
                dot: 'bg-[#eab308]',
              },
            ].map((kpi, idx) => (
              <div
                key={kpi.label}
                style={{ ['--stagger-i' as string]: idx }}
                className="imdx-stagger-card imdx-card-interactive rounded-[12px] px-3.5 py-3 flex items-center gap-3"
              >
                <div
                  className={`h-[40px] w-[40px] rounded-[8px] shrink-0 flex items-center justify-center ${kpi.boxBg}`}
                >
                  <span className={`size-2.5 rounded-full ${kpi.dot}`} />
                </div>
                <div>
                  <p className="text-[12.5px] text-[#808080]">{kpi.label}</p>
                  <p className="mt-0.5 text-[19px] font-bold imdx-gradient-text">{kpi.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="imdx-card rounded-[12px] p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[16px] font-semibold text-[#0f0f0f]">
                  Onboarding Review Queue
                </h2>
                <button
                  type="button"
                  onClick={() => onNavigate('applications')}
                  className="text-[12.5px] font-medium text-[#002456] hover:underline cursor-pointer"
                >
                  Open Applications
                </button>
              </div>
              <div className="imdx-subbox rounded-[10px] p-3.5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-[11.5px] text-[#808080]">
                    {onboardingState.applicationNumber}
                  </p>
                  <p className="mt-0.5 text-[14.5px] font-semibold text-[#0f0f0f]">{orgName}</p>
                  <p className="text-[12.5px] text-[#565555]">Hosted By IMDX · {repEmail}</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <StatusBadge status={applicationStatus} />
                  <button
                    type="button"
                    onClick={() => setIsInspectModalOpen(true)}
                    className="h-[32px] px-3.5 rounded-full bg-[#002456] text-white text-[12px] font-semibold cursor-pointer"
                  >
                    Review
                  </button>
                </div>
              </div>
            </div>

            <div className="imdx-card rounded-[12px] p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[16px] font-semibold text-[#0f0f0f]">Recent Audit Events</h2>
                <button
                  type="button"
                  onClick={() => onNavigate('audit-log')}
                  className="text-[12.5px] font-medium text-[#002456] hover:underline cursor-pointer"
                >
                  Full Audit Log
                </button>
              </div>
              <div className="space-y-2.5">
                {auditLogs.slice(0, 3).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-3 text-[13px] border-b border-[#f1f1f1] pb-2 last:border-b-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-[#0f0f0f] truncate">{entry.action}</p>
                      <p className="text-[#808080] truncate">{entry.target}</p>
                    </div>
                    <span className="text-[11.5px] text-[#808080] shrink-0">{entry.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* 2. PARTICIPANTS */}
      {activeNav === 'participants' && (
        <div className="imdx-card rounded-[12px] overflow-hidden">
          <div className="px-4 sm:px-5 py-3.5 border-b border-[#e2e8f0] flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[15.5px] font-semibold text-[#102529]">
              Registered Network Participants ({participants.length})
            </h2>
            <div className="flex items-center gap-1.5">
              {(['All', 'Active', 'Suspended'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setParticipantFilter(status)}
                  className={`h-[28px] px-3 rounded-full text-[12px] font-medium cursor-pointer transition-colors ${
                    participantFilter === status
                      ? 'bg-[#002456] text-white'
                      : 'bg-white border border-[#e2e8f0] text-[#475569]'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[740px]">
              <thead>
                <tr className="bg-gradient-to-r from-[#e3f9f3]/80 via-[#e8f6fe]/80 to-[#e6f0ff]/80 border-b border-[#b4d7de]/70 text-[12px] text-[#102529]">
                  <th className="py-2.5 px-4 font-semibold">Organization</th>
                  <th className="py-2.5 px-3.5 font-semibold">DID</th>
                  <th className="py-2.5 px-3.5 font-semibold">Role</th>
                  <th className="py-2.5 px-3.5 font-semibold">Deployment</th>
                  <th className="py-2.5 px-3.5 font-semibold">Datasets</th>
                  <th className="py-2.5 px-3.5 font-semibold">Status</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9] text-[13px] text-[#475569]">
                {participants
                  .filter((p) => {
                    if (participantFilter !== 'All' && p.status !== participantFilter) return false;
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase();
                    return p.name.toLowerCase().includes(q) || p.did.toLowerCase().includes(q);
                  })
                  .map((p, idx) => (
                    <tr
                      key={p.id}
                      style={{ ['--stagger-i' as string]: idx }}
                      className="imdx-stagger-row hover:bg-[#f8fafc]"
                    >
                      <td className="py-3 px-4 font-semibold text-[#102529]">{p.name}</td>
                      <td className="py-3 px-3.5 font-mono text-[11.5px] whitespace-nowrap">
                        {p.did}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">{p.role}</td>
                      <td className="py-3 px-3.5 whitespace-nowrap">{p.deployment}</td>
                      <td className="py-3 px-3.5">{p.datasetsCount}</td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-3">
                        <button
                          type="button"
                          onClick={() => {
                            const email = repEmail;
                            if (isPlatformConfigured() && loadAdminSession()?.token) {
                              void cygnusApi
                                .inviteParticipantOrgAdmin(p.did, email)
                                .then((r) => setAdminActionNote(`Org Admin invite: ${r.status}`));
                            } else {
                              setAdminActionNote(`Invite sent to ${email} for ${p.name}.`);
                            }
                            appendAudit('Invited Org Admin', `${p.name} (${email})`);
                          }}
                          className="text-[12px] font-semibold text-[#002456] hover:underline cursor-pointer"
                        >
                          Invite Admin
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleParticipantStatus(p.id)}
                          className={`text-[12.5px] font-semibold hover:underline cursor-pointer ${
                            p.status === 'Active' ? 'text-[#dc2626]' : 'text-[#059669]'
                          }`}
                        >
                          {p.status === 'Active' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. APPLICATIONS */}
      {activeNav === 'applications' && (
        <div className="imdx-card rounded-[12px] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <h2 className="text-[15.5px] font-semibold text-[#102529]">
              Onboarding Applications Queue
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              {isLiveAdmin && (
                <select
                  aria-label="Filter applications by status"
                  value={appStatusFilter}
                  onChange={(e) => setAppStatusFilter(e.target.value)}
                  className="h-[32px] rounded-full border border-[#cbd5e1] bg-white px-3 text-[12px] text-[#102529]"
                >
                  <option value="">All Statuses</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="NEEDS_INFO">Needs Info</option>
                  <option value="DRAFT">Draft</option>
                  <option value="APPROVED_WAITING">Approved (Waiting)</option>
                  <option value="PROVISIONING">Provisioning</option>
                  <option value="SETUP_FAILED">Setup Failed</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="ACTIVE">Active</option>
                </select>
              )}
              {reviewNote && (
                <p className="text-[12.5px] text-[#64748b]">Latest note: {reviewNote}</p>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[780px]">
              <thead>
                <tr className="bg-gradient-to-r from-[#e3f9f3]/80 via-[#e8f6fe]/80 to-[#e6f0ff]/80 border-y border-[#b4d7de]/70 text-[12px] text-[#102529]">
                  <th className="py-2.5 px-3.5 font-semibold whitespace-nowrap">Application #</th>
                  <th className="py-2.5 px-3.5 font-semibold">Organization</th>
                  <th className="py-2.5 px-3.5 font-semibold">Representative</th>
                  <th className="py-2.5 px-3.5 font-semibold whitespace-nowrap">
                    {isLiveAdmin ? 'Submitted' : 'Policies'}
                  </th>
                  <th className="py-2.5 px-3.5 font-semibold whitespace-nowrap">Status</th>
                  <th className="py-2.5 px-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9] text-[13px] text-[#475569]">
                {isLiveAdmin && liveApps ? (
                  liveApps.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#64748b]">
                        No applications found for this filter.
                      </td>
                    </tr>
                  ) : (
                    liveApps.map((app) => (
                      <tr key={app.id} className="hover:bg-[#f8fafc]">
                        <td className="py-3 px-3.5 font-mono text-[12px] font-semibold text-[#002456] whitespace-nowrap">
                          {app.number}
                        </td>
                        <td className="py-3 px-3.5 font-semibold text-[#102529]">
                          {app.orgName || '—'}
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          {app.contactName || app.email || '—'}
                        </td>
                        <td className="py-3 px-3.5 font-mono text-[12px] whitespace-nowrap">
                          {app.submittedAt ? app.submittedAt.slice(0, 10) : 'Draft'}
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <StatusBadge
                            status={
                              app.status === 'ACTIVE' ||
                              app.status === 'APPROVED_WAITING' ||
                              app.status === 'PROVISIONING'
                                ? 'Approved'
                                : app.status === 'NEEDS_INFO' ||
                                    app.status === 'REJECTED' ||
                                    app.status === 'SETUP_FAILED'
                                  ? 'Changes Requested'
                                  : 'Under Review'
                            }
                          />
                        </td>
                        <td className="py-3 px-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setDraftNote('');
                                void cygnusApi
                                  .getAdminApplication(app.id)
                                  .then((detail) => {
                                    setInspectDetail(detail);
                                    setIsInspectModalOpen(true);
                                  })
                                  .catch((err) =>
                                    setAdminActionNote(
                                      err instanceof Error ? err.message : 'Unable to load application.',
                                    ),
                                  );
                              }}
                              className="h-[32px] px-3.5 rounded-full border border-[#cbd5e1] bg-white text-[#102529] text-[12px] font-semibold hover:bg-[#f8fafc] cursor-pointer whitespace-nowrap"
                            >
                              Inspect Dossier
                            </button>
                            {app.status === 'SUBMITTED' && (
                              <button
                                type="button"
                                onClick={() => {
                                  void cygnusApi
                                    .approveAdminApplication(app.id)
                                    .then(() => {
                                      setAdminActionNote(`Approved ${app.number}`);
                                      refreshLiveApplications();
                                    })
                                    .catch((err) =>
                                      setAdminActionNote(
                                        err instanceof Error ? err.message : 'Approval failed.',
                                      ),
                                    );
                                }}
                                className="h-[32px] px-3.5 rounded-full bg-[#22b59b] hover:bg-[#1ca18a] text-white text-[12px] font-semibold cursor-pointer whitespace-nowrap"
                              >
                                Approve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )
                ) : (
                  <tr className="hover:bg-[#f8fafc]">
                    <td className="py-3 px-3.5 font-mono text-[12px] font-semibold text-[#002456] whitespace-nowrap">
                      {onboardingState.applicationNumber}
                    </td>
                    <td className="py-3 px-3.5 font-semibold text-[#102529]">{orgName}</td>
                    <td className="py-3 px-3.5 whitespace-nowrap">{repEmail}</td>
                    <td className="py-3 px-3.5 font-mono text-[12px] whitespace-nowrap">
                      {acceptedPoliciesCount} / {POLICIES.length}
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <StatusBadge status={applicationStatus} />
                    </td>
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setInspectDetail(null);
                            setIsInspectModalOpen(true);
                          }}
                          className="h-[32px] px-3.5 rounded-full border border-[#cbd5e1] bg-white text-[#102529] text-[12px] font-semibold hover:bg-[#f8fafc] cursor-pointer whitespace-nowrap"
                        >
                          Inspect Dossier
                        </button>
                        {applicationStatus !== 'Approved' && (
                          <button
                            type="button"
                            onClick={() => handleApplicationDecision('Approved')}
                            className="h-[32px] px-3.5 rounded-full bg-[#22b59b] hover:bg-[#1ca18a] text-white text-[12px] font-semibold cursor-pointer whitespace-nowrap"
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. POLICIES */}
      {activeNav === 'policies' && (
        <div className="imdx-card rounded-[16px] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e2e8f0] space-y-3">
            <h2 className="text-[18px] font-semibold text-[#0f0f0f]">
              Governance Policies &amp; Compliance Rules
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newPolicyTitle.trim()) return;
                const slug = newPolicyTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
                if (isPlatformConfigured() && loadAdminSession()?.token) {
                  void cygnusApi.createAdminPolicyVersion(slug, {
                    title: newPolicyTitle.trim(),
                    body: newPolicyBody.trim() || 'Standard IMDX governance policy.',
                    status: 'APPROVED',
                  });
                }
                onPoliciesChange([
                  {
                    id: `${slug}-${Date.now()}`,
                    title: newPolicyTitle.trim(),
                    version: 'v1.0',
                    mandatory: true,
                    enforced: true,
                    updatedAt: 'Just now',
                  },
                  ...policies,
                ]);
                appendAudit('Published Policy Version', newPolicyTitle.trim());
                setNewPolicyTitle('');
                setNewPolicyBody('');
              }}
              className="grid grid-cols-1 sm:grid-cols-4 gap-2"
            >
              <input
                type="text"
                value={newPolicyTitle}
                onChange={(e) => setNewPolicyTitle(e.target.value)}
                placeholder="New policy title..."
                className="h-[36px] rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[13px]"
              />
              <input
                type="text"
                value={newPolicyBody}
                onChange={(e) => setNewPolicyBody(e.target.value)}
                placeholder="Policy terms summary..."
                className="sm:col-span-2 h-[36px] rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[13px]"
              />
              <button
                type="submit"
                className="h-[36px] px-4 rounded-[8px] bg-[#002456] text-white text-[13px] font-semibold cursor-pointer"
              >
                + Publish Policy
              </button>
            </form>
          </div>
          <div className="divide-y divide-[#f1f1f1]">
            {policies.map((pol) => (
              <div
                key={pol.id}
                className="px-6 py-4 flex flex-wrap items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2.5">
                    <p className="text-[16px] font-semibold text-[#0f0f0f]">{pol.title}</p>
                    <span className="rounded-full bg-[#e8e7e7] px-2.5 py-0.5 text-[12px] text-[#0f0f0f]">
                      {pol.version}
                    </span>
                    {pol.mandatory && (
                      <span className="rounded-full bg-[#e6ecff] px-2.5 py-0.5 text-[12px] text-[#3553ab]">
                        Mandatory
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[13px] text-[#808080]">Last updated: {pol.updatedAt}</p>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <span className="text-[14px] text-[#565555]">
                    {pol.enforced ? 'Enforced' : 'Paused'}
                  </span>
                  <input
                    type="checkbox"
                    checked={pol.enforced}
                    onChange={() => togglePolicyEnforced(pol.id)}
                    className="size-5 accent-[#32c4a6] cursor-pointer"
                  />
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. AUDIT LOG */}
      {activeNav === 'audit-log' && (
        <div className="imdx-card rounded-[16px] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e2e8f0] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[18px] font-semibold text-[#0f0f0f]">Governance Audit Log</h2>
              {ledgerVerifyText && (
                <p className="mt-1 text-[12px] font-medium text-[#059669]">{ledgerVerifyText}</p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const hash = auditLogs[0]?.target ?? '';
                  if (isPlatformConfigured() && loadAdminSession()?.token && hash) {
                    void cygnusApi
                      .verifyLedgerEvent(hash)
                      .then((r) =>
                        setLedgerVerifyText(
                          `Ledger ${r.valid ? 'VERIFIED' : 'INVALID'} (${r.eventsChecked} events checked).`,
                        ),
                      )
                      .catch((e) =>
                        setLedgerVerifyText(e instanceof Error ? e.message : 'Verification failed'),
                      );
                  } else {
                    setLedgerVerifyText(`Hash chain verified cleanly (${auditLogs.length} events).`);
                  }
                }}
                className="h-[30px] px-3 rounded-full border border-[#008fa7]/35 bg-[#e5faf6] text-[12px] font-semibold text-[#002456] cursor-pointer"
              >
                Verify Ledger Chain
              </button>
              {(['All', 'Success', 'Warning'] as const).map((outcome) => (
                <button
                  key={outcome}
                  type="button"
                  onClick={() => setLogOutcomeFilter(outcome)}
                  className={`px-3.5 py-1 rounded-full text-[13px] cursor-pointer ${
                    logOutcomeFilter === outcome
                      ? 'bg-[#002456] text-white'
                      : 'bg-[#e8e7e7] text-[#0f0f0f]'
                  }`}
                >
                  {outcome}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[680px]">
              <thead>
                <tr className="bg-[#e5faf6] text-[15px] text-[#0f0f0f]">
                  <th className="py-3 px-5 font-normal">Actor</th>
                  <th className="py-3 px-4 font-normal">Action</th>
                  <th className="py-3 px-4 font-normal">Target</th>
                  <th className="py-3 px-4 font-normal">Timestamp</th>
                  <th className="py-3 px-5 font-normal">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f1f1] text-[15px] text-[#565555]">
                {auditLogs
                  .filter((l) => {
                    if (logOutcomeFilter !== 'All' && l.outcome !== logOutcomeFilter) return false;
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      l.action.toLowerCase().includes(q) ||
                      l.target.toLowerCase().includes(q) ||
                      l.actor.toLowerCase().includes(q)
                    );
                  })
                  .map((entry) => (
                    <tr key={entry.id}>
                      <td className="py-3.5 px-5 font-mono text-[13px] text-[#0f0f0f]">
                        {entry.actor}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#0f0f0f]">{entry.action}</td>
                      <td className="py-3.5 px-4">{entry.target}</td>
                      <td className="py-3.5 px-4">{entry.timestamp}</td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-0.5 text-[13px] font-medium ${
                            entry.outcome === 'Success'
                              ? 'bg-[#dcffe5] text-[#059669]'
                              : 'bg-[#ffeedc] text-[#d97706]'
                          }`}
                        >
                          {entry.outcome}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. PURPOSES */}
      {activeNav === 'purposes' && (
        <div className="space-y-5">
          <form
            onSubmit={handleAddPurpose}
            className="imdx-card rounded-[16px] p-5 flex flex-wrap items-center gap-3"
          >
            <input
              type="text"
              value={newPurposeName}
              onChange={(e) => setNewPurposeName(e.target.value)}
              placeholder="Add new data-sharing purpose (e.g. Freight Corridor Optimization)"
              className="flex-1 min-w-[240px] h-[44px] rounded-[10px] border border-[#c1c1c1] px-4 text-[15px] focus:outline-none focus:border-[#002456]"
            />
            <button
              type="submit"
              className="h-[44px] px-6 rounded-[45px] bg-[#002456] hover:bg-[#00337a] text-white text-[15px] font-semibold cursor-pointer"
            >
              Add Purpose
            </button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {purposes.map((pur) => (
              <div
                key={pur.id}
                className="imdx-card rounded-[16px] p-6 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[12px] text-[#808080]">
                      {pur.code}
                    </span>
                    <span
                      className={`rounded-full px-3 py-0.5 text-[12px] font-medium ${
                        pur.active
                          ? 'bg-[#dcffe5] text-[#059669]'
                          : 'bg-[#e8e7e7] text-[#565555]'
                      }`}
                    >
                      {pur.active ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <h3 className="mt-2 text-[18px] font-semibold text-[#0f0f0f]">{pur.name}</h3>
                  <p className="mt-1 text-[15px] text-[#565555]">{pur.description}</p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => togglePurposeActive(pur.id)}
                    className="text-[14px] font-medium text-[#002456] hover:underline cursor-pointer"
                  >
                    {pur.active ? 'Disable Purpose' : 'Enable Purpose'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. CAPACITY & TENANTS */}
      {activeNav === 'capacity' && (
        <div className="space-y-4">
          {adminActionNote && (
            <p className="rounded-[10px] border border-[#99f6e4] bg-[#ecfdf5] px-4 py-2 text-[12.5px] font-medium text-[#065f46]">
              {adminActionNote}
            </p>
          )}
          <div className="imdx-card rounded-[16px] p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[13px] font-semibold text-[#102529]">
                Platform Capacity &amp; Cluster Health (
                {clusterHealth?.overall?.toUpperCase() ?? 'HEALTHY'})
              </p>
              <p className="text-[12px] text-[#64748b]">
                Live tenants: {capacityState?.live ?? tenants.length} · Max limit:{' '}
                {capacityState?.max ?? capacityInput}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={capacityInput}
                onChange={(e) => setCapacityInput(e.target.value)}
                aria-label="Max tenant capacity"
                className="w-[82px] h-[34px] rounded-[8px] border border-[#cbd5e1] bg-white px-2.5 text-[13px]"
              />
              <button
                type="button"
                onClick={() => {
                  const maxVal = Number(capacityInput) || 25;
                  if (isPlatformConfigured() && loadAdminSession()?.token) {
                    void cygnusApi
                      .setCapacity(maxVal)
                      .then(() => setAdminActionNote(`Max capacity updated to ${maxVal}.`));
                  } else {
                    setAdminActionNote(`Max tenant capacity set to ${maxVal}.`);
                  }
                  appendAudit('Updated Cluster Capacity', `Max ${maxVal}`);
                }}
                className="h-[34px] px-4 rounded-full bg-[#002456] text-white text-[12px] font-semibold cursor-pointer"
              >
                Save Capacity
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {INITIAL_CAPACITY_CLUSTERS.map((cluster) => (
              <div key={cluster.id} className="imdx-card rounded-[16px] p-6 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[13px] text-[#808080]">{cluster.region}</p>
                    <h3 className="text-[17px] font-bold text-[#0f0f0f] font-mono">
                      {cluster.clusterName}
                    </h3>
                  </div>
                  <span
                    className={`rounded-full px-3 py-0.5 text-[12px] font-medium ${
                      cluster.status === 'Healthy'
                        ? 'bg-[#dcffe5] text-[#059669]'
                        : 'bg-[#ffeedc] text-[#d97706]'
                    }`}
                  >
                    {cluster.status}
                  </span>
                </div>

                <div className="space-y-3 text-[14px]">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[#808080]">Tenants Allocated</span>
                      <span className="font-semibold text-[#0f0f0f]">
                        {cluster.tenantsAllocated} / {cluster.tenantsMax}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[#eef2f6] overflow-hidden">
                      <div
                        className="h-full bg-[#002456]"
                        style={{
                          width: `${Math.round((cluster.tenantsAllocated / cluster.tenantsMax) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[#808080]">CPU Utilization</span>
                      <span className="font-semibold text-[#0f0f0f]">{cluster.cpuPct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#eef2f6] overflow-hidden">
                      <div className="h-full bg-[#32c4a6]" style={{ width: `${cluster.cpuPct}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[#808080]">Memory Utilization</span>
                      <span className="font-semibold text-[#0f0f0f]">{cluster.memoryPct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#eef2f6] overflow-hidden">
                      <div
                        className="h-full bg-[#3553ab]"
                        style={{ width: `${cluster.memoryPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="imdx-card rounded-[16px] p-5 space-y-3">
            <h3 className="text-[15.5px] font-semibold text-[#102529]">
              Hosted Tenants &amp; DPDP Breach Governance
            </h3>
            {tenants.length > 0 && (
              <div className="space-y-2">
                {tenants.map((t) => (
                  <div
                    key={t.id}
                    className="imdx-subbox rounded-[9px] px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[12px]"
                  >
                    <div>
                      <span className="font-mono font-bold text-[#002456]">{t.namespace}</span> ·{' '}
                      {t.participantDid} ({t.status})
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void cygnusApi.retryTenant(t.id)}
                        className="text-[#008fa7] font-semibold hover:underline cursor-pointer"
                      >
                        Retry
                      </button>
                      <button
                        type="button"
                        onClick={() => void cygnusApi.rotateTenantVaultToken(t.id)}
                        className="text-[#002456] font-semibold hover:underline cursor-pointer"
                      >
                        Rotate Vault
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <input
                type="text"
                value={breachTitle}
                onChange={(e) => setBreachTitle(e.target.value)}
                placeholder="Log DPDP breach advisory title..."
                className="flex-1 min-w-[200px] h-[34px] rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[12.5px]"
              />
              <button
                type="button"
                onClick={() => {
                  if (!breachTitle.trim()) return;
                  if (isPlatformConfigured() && loadAdminSession()?.token) {
                    void cygnusApi
                      .createBreach({
                        title: breachTitle.trim(),
                        severity: 'HIGH',
                        description: 'Logged via Admin Governance Console',
                      })
                      .then((b) => setBreaches((prev) => [b, ...prev]));
                  } else {
                    setBreaches((prev) => [
                      { id: `br-${Date.now()}`, title: breachTitle.trim(), status: 'OPEN' },
                      ...prev,
                    ]);
                  }
                  setBreachTitle('');
                }}
                className="h-[34px] px-4 rounded-[8px] bg-[#dc2626] text-white text-[12px] font-semibold cursor-pointer"
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
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (isPlatformConfigured() && loadAdminSession()?.token) {
                            void cygnusApi.notifyBreach(b.id);
                          }
                        }}
                        className="text-[#008fa7] font-semibold hover:underline cursor-pointer"
                      >
                        Notify
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (isPlatformConfigured() && loadAdminSession()?.token) {
                            void cygnusApi.resolveBreach(b.id);
                          }
                          setBreaches((prev) =>
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
      )}

      {/* 8. ADMIN SETTINGS */}
      {activeNav === 'settings' && (
        <div className="imdx-card rounded-[16px] p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="admin-gov-email"
                className="block text-[14px] font-medium text-[#0f0f0f] mb-1.5"
              >
                Governance Notification Email
              </label>
              <input
                id="admin-gov-email"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full h-[46px] rounded-[10px] border border-[#c1c1c1] px-4 text-[15px] focus:outline-none focus:border-[#002456]"
              />
            </div>

            <div>
              <label
                htmlFor="admin-retention"
                className="block text-[14px] font-medium text-[#0f0f0f] mb-1.5"
              >
                Audit Log Retention (Days)
              </label>
              <input
                id="admin-retention"
                type="number"
                value={auditRetentionDays}
                onChange={(e) => setAuditRetentionDays(e.target.value)}
                className="w-full h-[46px] rounded-[10px] border border-[#c1c1c1] px-4 text-[15px] focus:outline-none focus:border-[#002456]"
              />
            </div>
          </div>

          <label className="flex items-center justify-between gap-4 cursor-pointer pt-2">
            <div>
              <p className="text-[16px] font-medium text-[#0f0f0f]">
                Auto-Provision Hosted Workspaces Upon Approval
              </p>
              <p className="text-[14px] text-[#808080]">
                Immediately allocate ap-south-1 connector credentials when an admin approves an
                application.
              </p>
            </div>
            <input
              type="checkbox"
              checked={autoProvision}
              onChange={(e) => setAutoProvision(e.target.checked)}
              className="size-6 accent-[#32c4a6] cursor-pointer"
            />
          </label>

          <div className="flex items-center justify-end gap-4">
            {settingsSaved && (
              <span className="text-[14px] font-medium text-[#059669]">
                Admin governance settings saved.
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                appendAudit('Updated Governance Settings', `Retention ${auditRetentionDays}d`);
                setSettingsSaved(true);
                window.setTimeout(() => setSettingsSaved(false), 2500);
              }}
              className="h-[42px] px-6 rounded-[45px] bg-[#32c4a6] hover:bg-[#2ab195] text-white text-[15px] font-semibold cursor-pointer"
            >
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* Inspect Dossier Modal */}
      {isInspectModalOpen && (
        <ModalPortal>
          <div
            className="imdx-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-[#05080d]/55 backdrop-blur-xs p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dossier-modal-title"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setIsInspectModalOpen(false);
            }}
          >
            <div className="imdx-modal-panel imdx-modal-surface w-full max-w-[520px] max-h-[88vh] overflow-y-auto rounded-[14px] p-5 sm:p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[11.5px] text-[#64748b]">
                    {inspectDetail ? inspectDetail.number : onboardingState.applicationNumber}
                  </p>
                  <h3 id="dossier-modal-title" className="mt-0.5 text-[18px] font-bold text-[#102529]">
                    {inspectDetail?.organization?.legalName || orgName}
                  </h3>
                </div>
                <StatusBadge
                  status={
                    inspectDetail
                      ? inspectDetail.status === 'ACTIVE' ||
                        inspectDetail.status === 'APPROVED_WAITING' ||
                        inspectDetail.status === 'PROVISIONING'
                        ? 'Approved'
                        : inspectDetail.status === 'NEEDS_INFO' ||
                            inspectDetail.status === 'REJECTED' ||
                            inspectDetail.status === 'SETUP_FAILED'
                          ? 'Changes Requested'
                          : 'Under Review'
                      : applicationStatus
                  }
                />
              </div>

              <div className="imdx-subbox grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-[12.5px] rounded-[10px] p-3.5">
                <div>
                  <p className="text-[#64748b]">PAN / GSTIN</p>
                  <p className="mt-0.5 font-semibold text-[#102529]">
                    {inspectDetail
                      ? `${inspectDetail.organization?.pan || '—'} / ${inspectDetail.organization?.gstin || '—'}`
                      : `${onboardingState.organization.pan || 'ABCDE1234G'} / ${onboardingState.organization.gstin || '29ABCDE1234F1Z5'}`}
                  </p>
                </div>
                <div>
                  <p className="text-[#64748b]">Authorized Representative</p>
                  <p className="mt-0.5 font-semibold text-[#102529]">
                    {inspectDetail
                      ? `${inspectDetail.representative?.name || inspectDetail.contactName || '—'} (${inspectDetail.representative?.email || inspectDetail.email})`
                      : `${onboardingState.representative.name || 'Sakshi Shinde'} (${repEmail})`}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[#64748b]">Documents Submitted</p>
                  {inspectDetail ? (
                    <ul className="mt-1 space-y-1 text-[#102529]">
                      {inspectDetail.documents.length === 0 ? (
                        <li className="text-[#64748b]">No documents uploaded.</li>
                      ) : (
                        inspectDetail.documents.map((doc) => (
                          <li key={doc.id} className="flex items-center justify-between gap-2">
                            <span>
                              {doc.kind}: {doc.filename}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                void cygnusApi
                                  .getAdminDocumentUrl(inspectDetail.id, doc.id)
                                  .then(({ url }) => {
                                    if (url.startsWith('https://') || url.startsWith('http://')) {
                                      window.open(url, '_blank', 'noopener');
                                    }
                                  });
                              }}
                              className="text-[12px] font-semibold text-[#008fa7] hover:underline cursor-pointer"
                            >
                              Download
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  ) : (
                    <ul className="mt-1 space-y-1 text-[#102529]">
                      {DOC_KEYS.map(({ key, label }) => {
                        const doc = onboardingState.documents[key];
                        return (
                          <li key={key} className="flex justify-between gap-2">
                            <span>{label}</span>
                            <span className="font-medium">
                              {doc.fileName ? `${doc.fileName} (${doc.fileSizeLabel})` : 'Pending upload'}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>

              {inspectDetail && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
                  <div>
                    <p className="font-medium text-[#102529] mb-1">Request Info Items</p>
                    <div className="space-y-1">
                      {[
                        'Organization details',
                        'Authorised representative',
                        'Incorporation certificate',
                        'PAN',
                        'GST certificate',
                        'Authorisation letter',
                      ].map((item) => (
                        <label key={item} className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={requestInfoItems.includes(item)}
                            onChange={(e) => {
                              setRequestInfoItems((prev) =>
                                e.target.checked ? [...prev, item] : prev.filter((x) => x !== item),
                              );
                            }}
                          />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="admin-reject-reason"
                      className="block font-medium text-[#102529] mb-1"
                    >
                      Reject Reason Code
                    </label>
                    <select
                      id="admin-reject-reason"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="w-full h-[34px] rounded-[8px] border border-[#cbd5e1] bg-white px-2 text-[12px]"
                    >
                      <option value="INCOMPLETE_DOCUMENTS">INCOMPLETE_DOCUMENTS</option>
                      <option value="REGISTRATION_UNVERIFIABLE">REGISTRATION_UNVERIFIABLE</option>
                      <option value="AUTHORITY_NOT_SHOWN">AUTHORITY_NOT_SHOWN</option>
                      <option value="POLICIES_NOT_ACCEPTED">POLICIES_NOT_ACCEPTED</option>
                      <option value="DUPLICATE">DUPLICATE</option>
                      <option value="LEGAL_FLAG">LEGAL_FLAG</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="admin-review-note"
                  className="block text-[12.5px] font-medium text-[#102529] mb-1"
                >
                  Reviewer Notes (visible in application status)
                </label>
                <textarea
                  id="admin-review-note"
                  rows={2}
                  value={draftNote}
                  onChange={(e) => setDraftNote(e.target.value)}
                  placeholder="Optional approval or revision note..."
                  className="w-full rounded-[9px] border border-[#cbd5e1] bg-white p-2.5 text-[13px] focus:outline-none focus:border-[#008fa7]"
                />
              </div>

              <div className="flex flex-wrap justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsInspectModalOpen(false)}
                  className="h-[36px] px-4 rounded-full border border-[#cbd5e1] bg-white text-[12.5px] font-semibold text-[#102529] hover:bg-[#f8fafc] cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (inspectDetail) {
                      const items =
                        requestInfoItems.length > 0 ? requestInfoItems : ['Organization details'];
                      void cygnusApi
                        .requestAdminApplicationInfo(
                          inspectDetail.id,
                          items,
                          draftNote.trim() || 'Please review highlighted items.',
                        )
                        .then(() => {
                          setAdminActionNote(`Requested info for ${inspectDetail.number}`);
                          setIsInspectModalOpen(false);
                          refreshLiveApplications();
                        })
                        .catch((err) =>
                          setAdminActionNote(
                            err instanceof Error ? err.message : 'Request info failed.',
                          ),
                        );
                      return;
                    }
                    handleApplicationDecision('Changes Requested');
                  }}
                  className="h-[36px] px-4 rounded-full border border-[#d97706] text-[#d97706] hover:bg-[#fffbeb] text-[12.5px] font-semibold cursor-pointer"
                >
                  Request Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (inspectDetail) {
                      void cygnusApi
                        .rejectAdminApplication(
                          inspectDetail.id,
                          rejectReason,
                          draftNote.trim() || 'Rejected by IMDX Admin.',
                        )
                        .then(() => {
                          setAdminActionNote(`Rejected ${inspectDetail.number}`);
                          setIsInspectModalOpen(false);
                          refreshLiveApplications();
                        })
                        .catch((err) =>
                          setAdminActionNote(
                            err instanceof Error ? err.message : 'Rejection failed.',
                          ),
                        );
                      return;
                    }
                    handleApplicationDecision('Changes Requested');
                  }}
                  className="h-[36px] px-4 rounded-full border border-[#dc2626] text-[#dc2626] hover:bg-[#fef2f2] text-[12.5px] font-semibold cursor-pointer"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (inspectDetail) {
                      void cygnusApi
                        .approveAdminApplication(inspectDetail.id)
                        .then(() => {
                          setAdminActionNote(`Approved ${inspectDetail.number}`);
                          setIsInspectModalOpen(false);
                          refreshLiveApplications();
                        })
                        .catch((err) =>
                          setAdminActionNote(
                            err instanceof Error ? err.message : 'Approval failed.',
                          ),
                        );
                      return;
                    }
                    handleApplicationDecision('Approved');
                  }}
                  className="h-[36px] px-5 rounded-full imdx-btn-primary text-[12.5px] font-semibold cursor-pointer"
                >
                  Approve &amp; Provision
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
