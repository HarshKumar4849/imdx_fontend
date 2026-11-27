import { useEffect, useState } from 'react';
import { POLICIES } from '../../data/onboardingConstants';
import {
  cygnusApi,
  isPlatformConfigured,
  loadAdminSession,
  type CygnusAdminApplicationSummary,
  type CygnusAdminParticipant,
  type CygnusAdminStats,
  type CygnusApplication,
  type CygnusAuditEvent,
  type CygnusBreach,
  type CygnusCapacity,
  type CygnusClusterHealth,
  type CygnusPolicyDoc,
  type CygnusPurpose,
  type CygnusTenant,
} from '../../services/cygnusApi';
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
import { ModalPortal } from '../ModalPortal';
import { AdminClusterAndVerifySection } from './admin/AdminClusterAndVerifySection';
import {
  AdminKpiCard,
  StatusBadge,
  type VerificationRecord,
} from './admin/AdminShared';
import { downloadCsv } from '../../utils/adminCsv';

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

const SECTION_META: Record<AdminNavKey, { label: string; title: string; subtitle: string }> = {
  dashboard: {
    label: 'Dashboard',
    title: 'Platform Overview',
    subtitle: 'Monitor platform activity, participant onboarding and infrastructure performance.',
  },
  participants: {
    label: 'Participants',
    title: 'Participants',
    subtitle: 'Manage registered organizations and monitor their platform workspaces.',
  },
  applications: {
    label: 'Applications',
    title: 'Applications',
    subtitle: 'Review, process and manage organization onboarding applications.',
  },
  policies: {
    label: 'Policies',
    title: 'Policies',
    subtitle: 'Manage platform policies, versions and participant acceptance records.',
  },
  'audit-log': {
    label: 'Audit Logs',
    title: 'Audit Logs',
    subtitle: 'Track administrative actions and platform events through searchable audit records.',
  },
  'verify-audit': {
    label: 'Verify Audit',
    title: 'Verify Audit Chain',
    subtitle: 'Verify the integrity and authenticity of the audit hash chain.',
  },
  purposes: {
    label: 'Purposes',
    title: 'Purposes',
    subtitle: 'Manage and monitor approved purposes for data access and exchange.',
  },
  'cluster-health': {
    label: 'Cluster Health',
    title: 'Cluster Health',
    subtitle: 'Monitor the availability, health and performance of IMDX platform infrastructure.',
  },
  capacity: {
    label: 'Capacity',
    title: 'Capacity',
    subtitle: 'Monitor current workspace utilization, available capacity and planned platform expansion.',
  },
  settings: {
    label: 'Settings',
    title: 'Settings',
    subtitle: 'Manage administrator access, security preferences and platform configuration.',
  },
};

const DOC_KEYS: Array<{ key: DocumentSlotKey; label: string }> = [
  { key: 'incorporationCertificate', label: 'Incorporation Certificate' },
  { key: 'pan', label: 'PAN' },
  { key: 'gstCertificate', label: 'GST Certificate' },
  { key: 'authorizationLetter', label: 'Authorization Letter' },
];

const INITIAL_VERIFICATIONS: VerificationRecord[] = [
  {
    id: 'VER-0012',
    type: 'Event Hash',
    requestedBy: 'Ananya Mehta',
    timestamp: '25 Nov 2026, 11:45',
    recordsChecked: 1,
    result: 'Verified',
    summary: 'Hash chain validated for event node #12.',
  },
  {
    id: 'VER-0011',
    type: 'Date Range',
    requestedBy: 'Rahul Verma',
    timestamp: '24 Nov 2026, 16:12',
    recordsChecked: 2,
    result: 'Verified',
    summary: 'All 2 ledger entries within selected window verified cleanly.',
  },
  {
    id: 'VER-0010',
    type: 'Event Hash',
    requestedBy: 'Priya Shah',
    timestamp: '23 Nov 2026, 09:30',
    recordsChecked: 1,
    result: 'Failed',
    summary: 'Test mismatch recorded during sandbox tamper drill.',
  },
];

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
  const [timeframe, setTimeframe] = useState('7d');
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState('Updated just now');
  const [adminActionNote, setAdminActionNote] = useState('');

  // Filters & pagination
  const [partSearch, setPartSearch] = useState('');
  const [participantFilter, setParticipantFilter] = useState<'All' | 'Active' | 'Suspended'>('All');
  const [partRoleFilter, setPartRoleFilter] = useState('All');
  const [partPage, setPartPage] = useState(1);

  const [appSearch, setAppSearch] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState('');
  const [appSort, setAppSort] = useState<'newest' | 'oldest'>('newest');

  const [auditDidFilter, setAuditDidFilter] = useState('');
  const [auditTypeFilter, setAuditTypeFilter] = useState('');
  const [auditDateFilter, setAuditDateFilter] = useState('');
  const [auditLimit, setAuditLimit] = useState(25);
  const [auditPage, setAuditPage] = useState(1);

  const [purposeSearch, setPurposeSearch] = useState('');
  const [purposeCategoryFilter, setPurposeCategoryFilter] = useState('All');
  const [purposeStatusFilter, setPurposeStatusFilter] = useState('All');

  // Modals & drafts
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);
  const [inspectDetail, setInspectDetail] = useState<(CygnusApplication & { id: string }) | null>(null);
  const [draftNote, setDraftNote] = useState(reviewNote);
  const [requestInfoItems, setRequestInfoItems] = useState<string[]>(['Organization details']);
  const [rejectReason, setRejectReason] = useState('INCOMPLETE_DOCUMENTS');

  const [isAddPartOpen, setIsAddPartOpen] = useState(false);
  const [newPartName, setNewPartName] = useState('');
  const [newPartEmail, setNewPartEmail] = useState('');
  const [newPartRole, setNewPartRole] = useState<'PROV' | 'CONS'>('PROV');

  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [editingPolicySlug, setEditingPolicySlug] = useState<string | null>(null);
  const [newPolicyTitle, setNewPolicyTitle] = useState('');
  const [newPolicyBody, setNewPolicyBody] = useState('');
  const [policyStatusDraft, setPolicyStatusDraft] = useState<'APPROVED' | 'DRAFT'>('APPROVED');
  const [selectedPolicyDetail, setSelectedPolicyDetail] = useState<AdminPolicyRule | null>(null);

  const [isPurposeModalOpen, setIsPurposeModalOpen] = useState(false);
  const [editingPurposeId, setEditingPurposeId] = useState<string | null>(null);
  const [newPurposeName, setNewPurposeName] = useState('');
  const [newPurposeCategory, setNewPurposeCategory] = useState('Mobility Analytics');
  const [newPurposeDesc, setNewPurposeDesc] = useState('');

  // Admin settings & governance live state
  const [autoProvision, setAutoProvision] = useState(true);
  const [auditRetentionDays, setAuditRetentionDays] = useState('365');
  const [adminEmail, setAdminEmail] = useState('governance@imdx.org');
  const [settingsSaved, setSettingsSaved] = useState(false);

  const [capacityState, setCapacityState] = useState<CygnusCapacity | null>(null);
  const [capacityInput, setCapacityInput] = useState('25');
  const [clusterHealth, setClusterHealth] = useState<CygnusClusterHealth | null>(null);
  const [tenants, setTenants] = useState<CygnusTenant[]>([]);
  const [breaches, setBreaches] = useState<CygnusBreach[]>([]);
  const [adminStats, setAdminStats] = useState<CygnusAdminStats | null>(null);
  const [liveApps, setLiveApps] = useState<CygnusAdminApplicationSummary[] | null>(null);
  const [liveParticipants, setLiveParticipants] = useState<CygnusAdminParticipant[] | null>(null);
  const [livePolicies, setLivePolicies] = useState<CygnusPolicyDoc[] | null>(null);
  const [livePurposes, setLivePurposes] = useState<CygnusPurpose[] | null>(null);
  const [liveAuditEvents, setLiveAuditEvents] = useState<CygnusAuditEvent[] | null>(null);
  const [verificationHistory, setVerificationHistory] =
    useState<VerificationRecord[]>(INITIAL_VERIFICATIONS);

  const isLiveAdmin = isPlatformConfigured() && Boolean(loadAdminSession()?.token);

  const fetchLiveDashboardData = () => {
    if (!isLiveAdmin) {
      setLastUpdatedLabel(`Refreshed at ${new Date().toLocaleTimeString()}`);
      return;
    }
    void Promise.allSettled([
      cygnusApi.getAdminStats(),
      cygnusApi.listAdminApplications(appStatusFilter || undefined),
      cygnusApi.getClusterHealth(),
      cygnusApi.listTenants(),
      cygnusApi.listAuditEvents(auditLimit),
    ]).then(([statsRes, appsRes, healthRes, tenRes, auditRes]) => {
      if (statsRes.status === 'fulfilled') setAdminStats(statsRes.value);
      if (appsRes.status === 'fulfilled') setLiveApps(appsRes.value);
      if (healthRes.status === 'fulfilled') setClusterHealth(healthRes.value);
      if (tenRes.status === 'fulfilled') setTenants(tenRes.value);
      if (auditRes.status === 'fulfilled') setLiveAuditEvents(auditRes.value);
      setLastUpdatedLabel(`Updated at ${new Date().toLocaleTimeString()}`);
    });
  };

  useEffect(() => {
    if (!isLiveAdmin) return;
    let active = true;

    if (activeNav === 'dashboard' || activeNav === 'applications') {
      void Promise.allSettled([
        cygnusApi.getAdminStats(),
        cygnusApi.listAdminApplications(appStatusFilter || undefined),
        cygnusApi.getClusterHealth(),
        cygnusApi.listTenants(),
        cygnusApi.listAuditEvents(20),
      ]).then(([statsRes, appsRes, healthRes, tenRes, auditRes]) => {
        if (!active) return;
        if (statsRes.status === 'fulfilled') setAdminStats(statsRes.value);
        if (appsRes.status === 'fulfilled') setLiveApps(appsRes.value);
        if (healthRes.status === 'fulfilled') setClusterHealth(healthRes.value);
        if (tenRes.status === 'fulfilled') setTenants(tenRes.value);
        if (auditRes.status === 'fulfilled') setLiveAuditEvents(auditRes.value);
      });
    }

    if (activeNav === 'participants') {
      void Promise.allSettled([cygnusApi.listParticipants(), cygnusApi.listTenants()]).then(
        ([partRes, tenRes]) => {
          if (!active) return;
          if (partRes.status === 'fulfilled') setLiveParticipants(partRes.value);
          if (tenRes.status === 'fulfilled') setTenants(tenRes.value);
        },
      );
    }

    if (activeNav === 'policies') {
      void cygnusApi
        .listAdminPolicies()
        .then((docs) => {
          if (active) setLivePolicies(docs);
        })
        .catch(() => undefined);
    }

    if (activeNav === 'purposes') {
      void Promise.allSettled([cygnusApi.listAdminPurposes(true), cygnusApi.listAdminPurposes(false)]).then(
        ([actRes, inactRes]) => {
          if (!active) return;
          const combined = [
            ...(actRes.status === 'fulfilled' ? actRes.value : []),
            ...(inactRes.status === 'fulfilled' ? inactRes.value : []),
          ];
          if (combined.length > 0) setLivePurposes(combined);
        },
      );
    }

    if (activeNav === 'audit-log') {
      void cygnusApi
        .listAuditEvents(auditLimit)
        .then((ev) => {
          if (active) setLiveAuditEvents(ev);
        })
        .catch(() => undefined);
    }

    if (activeNav === 'cluster-health' || activeNav === 'capacity') {
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
  }, [activeNav, appStatusFilter, auditLimit, isLiveAdmin]);

  const orgName = onboardingState.organization.legalName || 'ABC Mobility Technologies Pvt. Ltd.';
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

  const refreshLiveApplications = () => {
    if (!isLiveAdmin) return;
    void cygnusApi
      .listAdminApplications(appStatusFilter || undefined)
      .then((list) => setLiveApps(list))
      .catch(() => undefined);
  };

  const handleApplicationDecision = (status: ApplicationReviewStatus) => {
    onUpdateApplicationStatus(status, draftNote.trim());
    appendAudit(
      status === 'Approved' ? 'Approved Application' : 'Requested Application Changes',
      `${onboardingState.applicationNumber} (${orgName})`,
      status === 'Approved' ? 'Success' : 'Warning',
    );
    if (status === 'Approved' && !participants.some((p) => p.name === orgName)) {
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
    setIsInspectModalOpen(false);
  };

  const toggleParticipantStatus = async (didOrId: string) => {
    const target = participants.find((p) => p.id === didOrId || p.did === didOrId);
    const liveTarget = liveParticipants?.find((p) => p.did === didOrId);
    const currentActive = liveTarget ? liveTarget.active : target?.status === 'Active';
    const nextActive = !currentActive;
    const did = liveTarget?.did ?? target?.did ?? didOrId;
    const displayName = liveTarget?.name ?? target?.name ?? did;

    if (isLiveAdmin) {
      if (!nextActive) {
        await cygnusApi.deactivateParticipant(did);
      } else {
        await cygnusApi.reactivateParticipant(did);
      }
      setLiveParticipants((prev) =>
        prev ? prev.map((p) => (p.did === did ? { ...p, active: nextActive } : p)) : prev,
      );
    }

    if (target) {
      onParticipantsChange(
        participants.map((p) =>
          p.id === target.id ? { ...p, status: nextActive ? 'Active' : 'Suspended' } : p,
        ),
      );
    }
    appendAudit(
      nextActive ? 'Activated Participant' : 'Suspended Participant',
      displayName,
      nextActive ? 'Success' : 'Warning',
    );
  };

  const handleCreateParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartName.trim()) return;
    const cleanName = newPartName.trim();
    const roleLabel = newPartRole === 'PROV' ? 'Provider' : 'Consumer';

    if (isLiveAdmin) {
      try {
        await cygnusApi.onboardInit({
          name: cleanName,
          role: newPartRole,
          contactEmail: newPartEmail.trim() || undefined,
        });
        const refreshed = await cygnusApi.listParticipants();
        setLiveParticipants(refreshed);
        setAdminActionNote(`Onboarded participant ${cleanName}.`);
      } catch (err) {
        setAdminActionNote(err instanceof Error ? err.message : 'Unable to add participant.');
      }
    } else {
      onParticipantsChange([
        {
          id: `part-${Date.now()}`,
          name: cleanName,
          did: `did:web:identity-daemon:IMDX00${participants.length + 1}`,
          role: roleLabel,
          deployment: 'Hosted By IMDX',
          datasetsCount: 0,
          status: 'Active',
        },
        ...participants,
      ]);
      setAdminActionNote(`Added participant ${cleanName}.`);
    }
    appendAudit('Onboarded Participant', cleanName);
    setNewPartName('');
    setNewPartEmail('');
    setIsAddPartOpen(false);
  };

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPolicyTitle.trim()) return;
    const slug =
      editingPolicySlug ||
      newPolicyTitle
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-');

    if (isLiveAdmin) {
      await cygnusApi.createAdminPolicyVersion(slug, {
        title: newPolicyTitle.trim(),
        body: newPolicyBody.trim() || 'Standard IMDX governance compliance terms.',
        status: policyStatusDraft,
      });
      const docs = await cygnusApi.listAdminPolicies().catch(() => null);
      if (docs) setLivePolicies(docs);
    }

    const existing = policies.find((p) => p.id === slug || p.title === newPolicyTitle.trim());
    if (existing) {
      const nextNum = Number(existing.version.replace(/[^0-9.]/g, '')) + 0.1;
      onPoliciesChange(
        policies.map((p) =>
          p.id === existing.id
            ? {
                ...p,
                version: `v${nextNum.toFixed(1)}`,
                enforced: policyStatusDraft === 'APPROVED',
                updatedAt: new Date().toISOString().slice(0, 10),
              }
            : p,
        ),
      );
    } else {
      onPoliciesChange([
        {
          id: `${slug}-${Date.now()}`,
          title: newPolicyTitle.trim(),
          version: 'v1.0',
          mandatory: true,
          enforced: policyStatusDraft === 'APPROVED',
          updatedAt: new Date().toISOString().slice(0, 10),
        },
        ...policies,
      ]);
    }
    appendAudit('Published Policy Version', newPolicyTitle.trim());
    setIsPolicyModalOpen(false);
    setEditingPolicySlug(null);
    setNewPolicyTitle('');
    setNewPolicyBody('');
  };

  const handleSavePurpose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPurposeName.trim()) return;
    const trimmedName = newPurposeName.trim();
    const desc =
      newPurposeDesc.trim() || 'Authorized mobility data-sharing purpose under IMDX governance.';

    if (editingPurposeId) {
      if (isLiveAdmin) {
        await cygnusApi.updatePurpose(editingPurposeId, {
          name: trimmedName,
          category: newPurposeCategory,
          description: desc,
        });
      }
      if (livePurposes) {
        setLivePurposes((prev) =>
          prev
            ? prev.map((p) =>
                p.id === editingPurposeId
                  ? { ...p, name: trimmedName, category: newPurposeCategory, description: desc }
                  : p,
              )
            : prev,
        );
      }
      onPurposesChange(
        purposes.map((p) =>
          p.id === editingPurposeId ? { ...p, name: trimmedName, description: desc } : p,
        ),
      );
      appendAudit('Updated Data Purpose', trimmedName);
    } else {
      let createdId = `pur-${Date.now()}`;
      if (isLiveAdmin) {
        const res = await cygnusApi.createPurpose({
          name: trimmedName,
          category: newPurposeCategory,
          description: desc,
        });
        if (res?.id) createdId = res.id;
        if (livePurposes) {
          setLivePurposes((prev) => (prev ? [res, ...prev] : [res]));
        }
      }
      onPurposesChange([
        {
          id: createdId,
          code: newPurposeCategory,
          name: trimmedName,
          description: desc,
          active: true,
        },
        ...purposes,
      ]);
      appendAudit('Created Data Purpose', trimmedName);
    }

    setIsPurposeModalOpen(false);
    setEditingPurposeId(null);
    setNewPurposeName('');
    setNewPurposeDesc('');
  };

  const togglePurposeActive = async (id: string) => {
    const liveItem = livePurposes?.find((p) => p.id === id);
    const localItem = purposes.find((p) => p.id === id);
    const isActiveNow = liveItem ? liveItem.active !== false : Boolean(localItem?.active);
    const nextActive = !isActiveNow;
    const name = liveItem?.name ?? localItem?.name ?? id;

    if (isLiveAdmin) {
      if (!nextActive) {
        await cygnusApi.deactivatePurpose(id);
      } else {
        await cygnusApi.updatePurpose(id, { active: true });
      }
      setLivePurposes((prev) =>
        prev ? prev.map((p) => (p.id === id ? { ...p, active: nextActive } : p)) : prev,
      );
    }

    if (localItem) {
      onPurposesChange(purposes.map((p) => (p.id === id ? { ...p, active: nextActive } : p)));
    }
    appendAudit(nextActive ? 'Activated Purpose' : 'Deactivated Purpose', name);
  };

  // Derived collections unifying Live API and Offline/Local fallback
  const mergedParticipants = liveParticipants
    ? liveParticipants.map((p) => ({
        id: p.did,
        did: p.did,
        bpn: p.bpn,
        name: p.name,
        role: p.role === 'PROV' ? 'Provider' : 'Consumer',
        status: p.active ? ('Active' as const) : ('Suspended' as const),
        created: p.createdAt ? p.createdAt.slice(0, 10) : '2026-11-15',
      }))
    : participants.map((p, idx) => ({
        id: p.id,
        did: p.did,
        bpn: `BPNL0000000${idx + 1}`,
        name: p.name,
        role: p.role,
        status: p.status,
        created: `2026-11-${String(20 - idx).padStart(2, '0')}`,
      }));

  const mergedPolicies = livePolicies
    ? livePolicies.map((doc, idx) => ({
        id: `${doc.slug}-v${doc.version}`,
        slug: doc.slug,
        title: doc.title,
        version: `v${doc.version}.0`,
        status: doc.status === 'APPROVED' ? 'Published' : 'Draft',
        enforced: doc.status === 'APPROVED',
        mandatory: doc.required ?? true,
        updatedAt: doc.createdAt ? doc.createdAt.slice(0, 10) : '2026-11-12',
        acceptedCount: doc.acceptances ?? Math.max(1, mergedParticipants.length),
        totalCount: Math.max(mergedParticipants.length, doc.acceptances ?? 1),
        hash: doc.sha256?.slice(0, 12) || `h${idx}a9f8c2b10`,
        body: doc.body || 'Mandatory governance compliance policy across IMDX participants.',
      }))
    : policies.map((pol, idx) => ({
        id: pol.id,
        slug: pol.id,
        title: pol.title,
        version: pol.version,
        status: pol.enforced ? 'Published' : 'Draft',
        enforced: pol.enforced,
        mandatory: pol.mandatory,
        updatedAt: pol.updatedAt,
        acceptedCount: pol.enforced ? Math.max(1, participants.length) : Math.max(0, participants.length - 1),
        totalCount: Math.max(1, participants.length),
        hash: `46637${idx}f9c897`,
        body: 'Standard IMDX participation governance agreement and SLA obligations.',
      }));

  const mergedPurposes = livePurposes
    ? livePurposes.map((pur) => ({
        id: pur.id,
        name: pur.name,
        category: pur.category || 'Mobility Analytics',
        description: pur.description || '',
        explicitConsent: pur.requiresExplicitConsent !== false ? 'Yes' : 'No',
        active: pur.active !== false,
      }))
    : purposes.map((pur) => ({
        id: pur.id,
        name: pur.name,
        category: pur.code.startsWith('IMDX-PUR') ? 'Mobility Analytics' : pur.code,
        description: pur.description,
        explicitConsent: 'Yes',
        active: pur.active,
      }));

  const mergedAudits = liveAuditEvents
    ? liveAuditEvents.map((ev) => ({
        id: String(ev.id),
        timestamp: ev.createdAt ? ev.createdAt.replace('T', ' ').slice(0, 16) : 'Recent',
        eventType: ev.eventType,
        participantDid: ev.participantDid || 'system',
        eventHash: ev.eventHash,
        payload: ev.payload,
        outcome: ev.eventType.toLowerCase().includes('fail') || ev.eventType.toLowerCase().includes('reject')
          ? ('Warning' as const)
          : ('Success' as const),
      }))
    : auditLogs.map((l, idx) => ({
        id: l.id,
        timestamp: l.timestamp,
        eventType: l.action,
        participantDid: l.actor,
        eventHash: `17378784${idx}986c8c899`,
        payload: `${l.target} (${l.outcome})`,
        outcome: l.outcome,
      }));

  const pendingApprovalsCount = adminStats
    ? (adminStats.applicationsWaiting ?? 0)
    : applicationStatus === 'Under Review'
      ? 1
      : 0;

  const meta = SECTION_META[activeNav];

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="imdx-kicker">ADMIN &gt; {meta.label}</p>
          <h1 className="mt-1 text-[22px] sm:text-[25px] font-bold text-[#102529] leading-tight">
            {meta.title}
          </h1>
          <p className="mt-0.5 text-[13px] sm:text-[13.5px] text-[#59666d]">{meta.subtitle}</p>
        </div>

        {/* Context-sensitive header controls matching screenshots */}
        <div className="flex flex-wrap items-center gap-2">
          {adminActionNote && (
            <span className="rounded-full bg-[#e5faf6] border border-[#00a5c3]/25 px-3 py-1 text-[12px] font-medium text-[#002456]">
              {adminActionNote}
            </span>
          )}

          {activeNav === 'dashboard' && (
            <>
              <select
                aria-label="Dashboard timeframe"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="h-[34px] rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[12.5px] text-[#102529]"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <span className="hidden sm:inline text-[11.5px] text-[#64748b] px-1">
                {lastUpdatedLabel}
              </span>
              <button
                type="button"
                onClick={fetchLiveDashboardData}
                className="h-[34px] px-3.5 rounded-[8px] border border-[#cbd5e1] bg-white hover:bg-[#f8fafc] text-[12.5px] font-semibold text-[#102529] cursor-pointer"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={() => {
                  downloadCsv(
                    'imdx-platform-overview.csv',
                    ['Metric', 'Value'],
                    [
                      ['Total Participants', adminStats?.participants ?? mergedParticipants.length],
                      ['Total Orders', adminStats?.orders ?? subscriptionsCount],
                      ['Total Datasets', adminStats?.datasets ?? datasets.length],
                      ['Applications Waiting', pendingApprovalsCount],
                      ['Total Purposes', mergedPurposes.length],
                    ],
                  );
                  setAdminActionNote('Platform report exported as CSV.');
                }}
                className="h-[34px] px-4 rounded-full imdx-btn-primary text-[12.5px] font-semibold cursor-pointer"
              >
                Export Report
              </button>
            </>
          )}

          {activeNav === 'participants' && (
            <>
              <button
                type="button"
                onClick={() => {
                  downloadCsv(
                    'imdx-participants-registry.csv',
                    ['DID', 'BPN', 'Name', 'Role', 'Status', 'Created'],
                    mergedParticipants.map((p) => [p.did, p.bpn, p.name, p.role, p.status, p.created]),
                  );
                  setAdminActionNote('Participant registry exported.');
                }}
                className="h-[34px] px-3.5 rounded-full border border-[#cbd5e1] bg-white hover:bg-[#f8fafc] text-[12.5px] font-semibold text-[#102529] cursor-pointer"
              >
                Export Registry
              </button>
              <button
                type="button"
                onClick={() => setIsAddPartOpen(true)}
                className="h-[34px] px-4 rounded-full imdx-btn-primary text-[12.5px] font-semibold cursor-pointer"
              >
                + Add Participant
              </button>
            </>
          )}

          {activeNav === 'applications' && (
            <button
              type="button"
              onClick={refreshLiveApplications}
              className="h-[34px] px-4 rounded-full imdx-btn-primary text-[12.5px] font-semibold cursor-pointer"
            >
              Refresh Queue
            </button>
          )}

          {activeNav === 'policies' && (
            <button
              type="button"
              onClick={() => {
                setEditingPolicySlug(null);
                setNewPolicyTitle('');
                setNewPolicyBody('');
                setPolicyStatusDraft('APPROVED');
                setIsPolicyModalOpen(true);
              }}
              className="h-[34px] px-4 rounded-full imdx-btn-primary text-[12.5px] font-semibold cursor-pointer"
            >
              + Create Policy
            </button>
          )}

          {activeNav === 'audit-log' && (
            <button
              type="button"
              onClick={() => {
                downloadCsv(
                  'imdx-audit-logs.csv',
                  ['Timestamp', 'Event Type', 'Participant DID', 'Event Hash', 'Payload'],
                  mergedAudits.map((a) => [
                    a.timestamp,
                    a.eventType,
                    a.participantDid,
                    a.eventHash,
                    a.payload,
                  ]),
                );
                setAdminActionNote('Audit logs exported as CSV.');
              }}
              className="h-[34px] px-3.5 rounded-full border border-[#cbd5e1] bg-white hover:bg-[#f8fafc] text-[12.5px] font-semibold text-[#102529] cursor-pointer"
            >
              Export Logs
            </button>
          )}

          {activeNav === 'purposes' && (
            <button
              type="button"
              onClick={() => {
                setEditingPurposeId(null);
                setNewPurposeName('');
                setNewPurposeCategory('Mobility Analytics');
                setNewPurposeDesc('');
                setIsPurposeModalOpen(true);
              }}
              className="h-[34px] px-4 rounded-full imdx-btn-primary text-[12.5px] font-semibold cursor-pointer"
            >
              + New Purpose
            </button>
          )}
        </div>
      </div>

      {/* 1. PLATFORM OVERVIEW (DASHBOARD) */}
      {activeNav === 'dashboard' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
            <AdminKpiCard
              index={0}
              label="Total Participants"
              value={adminStats ? adminStats.participants : mergedParticipants.length}
              subtext={`${mergedParticipants.filter((p) => p.status === 'Active').length} active organizations`}
              boxBg="bg-[#e9fffa]"
              dotColor="bg-[#10b981]"
            />
            <AdminKpiCard
              index={1}
              label="Total Orders"
              value={adminStats ? adminStats.orders : subscriptionsCount}
              subtext="Platform exchange orders"
              boxBg="bg-[#e6ecff]"
              dotColor="bg-[#3553ab]"
            />
            <AdminKpiCard
              index={2}
              label="Total Datasets"
              value={adminStats ? adminStats.datasets : datasets.length}
              subtext="Registered catalog offers"
              boxBg="bg-[#ecfdf5]"
              dotColor="bg-[#059669]"
            />
            <AdminKpiCard
              index={3}
              label="Applications Waiting"
              value={pendingApprovalsCount}
              subtext="Awaiting governance review"
              boxBg="bg-[#fef3c7]"
              dotColor="bg-[#d97706]"
            />
            <AdminKpiCard
              index={4}
              label="Total Purposes"
              value={adminStats ? adminStats.purposes : mergedPurposes.length}
              subtext={`${mergedPurposes.filter((p) => p.active).length} active, ${mergedPurposes.filter((p) => !p.active).length} inactive`}
              boxBg="bg-[#f0f9ff]"
              dotColor="bg-[#008fa7]"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Needs Attention */}
            <div className="lg:col-span-7 imdx-card rounded-[14px] p-4 sm:p-5 space-y-3">
              <div>
                <h2 className="text-[16px] font-semibold text-[#102529]">Needs Attention</h2>
                <p className="text-[12px] text-[#64748b]">Items requiring administrative action</p>
              </div>
              <div className="space-y-2.5">
                {[
                  {
                    id: 'att-apps',
                    title: `${pendingApprovalsCount} application(s) awaiting review`,
                    time: 'Queue SLA 48h',
                    severity: pendingApprovalsCount > 0 ? 'High' : 'Normal',
                    target: 'applications' as AdminNavKey,
                  },
                  {
                    id: 'att-tenants',
                    title: `${tenants.filter((t) => t.status.toUpperCase() === 'FAILED').length} failed workspace builds`,
                    time: 'Provisioning monitor',
                    severity: tenants.some((t) => t.status.toUpperCase() === 'FAILED')
                      ? 'Critical'
                      : 'Normal',
                    target: 'participants' as AdminNavKey,
                  },
                  {
                    id: 'att-health',
                    title:
                      clusterHealth && clusterHealth.overall !== 'ok'
                        ? 'Cluster health reports degraded service'
                        : 'Infrastructure nodes & connectors operating normally',
                    time: 'Cluster telemetry',
                    severity:
                      clusterHealth && clusterHealth.overall !== 'ok' ? 'Critical' : 'Medium',
                    target: 'cluster-health' as AdminNavKey,
                  },
                ].map((item) => (
                  <div
                    key={item.id}
                    className="imdx-subbox rounded-[10px] px-3.5 py-2.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-semibold text-[#102529] truncate">
                        {item.title}
                      </p>
                      <p className="text-[11.5px] text-[#64748b]">{item.time}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          item.severity === 'Critical'
                            ? 'bg-[#fee2e2] text-[#dc2626]'
                            : item.severity === 'High'
                              ? 'bg-[#fef3c7] text-[#b45309]'
                              : 'bg-[#f1f5f9] text-[#475569]'
                        }`}
                      >
                        {item.severity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onNavigate(item.target)}
                        className="text-[12.5px] font-semibold text-[#002456] hover:underline cursor-pointer"
                      >
                        Open &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* System Health Snapshot */}
            <div className="lg:col-span-5 imdx-card rounded-[14px] p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-[16px] font-semibold text-[#102529]">System Health</h2>
                  <p className="text-[12px] text-[#64748b]">Live platform snapshot</p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('cluster-health')}
                  className="text-[12.5px] font-semibold text-[#059669] hover:underline cursor-pointer"
                >
                  View details
                </button>
              </div>

              <div className="rounded-[10px] bg-[#ecfdf5] border border-[#bbf7d0] px-3.5 py-2.5 flex items-center gap-2.5">
                <span className="size-6 rounded-full bg-[#dcfce7] text-[#15803d] flex items-center justify-center text-[12px] font-bold">
                  ✓
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-[#14532d]">
                    All core systems operational
                  </p>
                  <p className="text-[11px] text-[#15803d]">{lastUpdatedLabel}</p>
                </div>
              </div>

              <div className="divide-y divide-[#f1f5f9] text-[13px]">
                {[
                  { label: 'Platform', status: 'Operational' },
                  { label: 'Data Services', status: 'Healthy' },
                  { label: 'Connectors', status: 'Healthy' },
                  {
                    label: 'Nodes',
                    status: !clusterHealth || clusterHealth.overall === 'ok' ? 'Healthy' : 'Degraded',
                  },
                  {
                    label: 'Workspaces',
                    status: `${tenants.length || mergedParticipants.length} Live`,
                  },
                ].map((row) => (
                  <div key={row.label} className="py-2 flex items-center justify-between">
                    <span className="text-[#475569]">{row.label}</span>
                    <StatusBadge status={row.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Recent Applications */}
            <div className="lg:col-span-7 imdx-card rounded-[14px] overflow-hidden">
              <div className="px-4 sm:px-5 py-3.5 border-b border-[#e2e8f0] flex items-center justify-between">
                <h2 className="text-[15.5px] font-semibold text-[#102529]">Recent Applications</h2>
                <button
                  type="button"
                  onClick={() => onNavigate('applications')}
                  className="text-[12.5px] font-semibold text-[#059669] hover:underline cursor-pointer"
                >
                  View all applications
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#e3f9f3]/80 via-[#e8f6fe]/80 to-[#e6f0ff]/80 border-b border-[#b4d7de]/70 text-[12px] text-[#102529]">
                      <th className="py-2.5 px-4 font-semibold">Organization</th>
                      <th className="py-2.5 px-3 font-semibold">Application ID</th>
                      <th className="py-2.5 px-3 font-semibold">Submitted</th>
                      <th className="py-2.5 px-3 font-semibold">Status</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9] text-[12.5px] text-[#475569]">
                    {isLiveAdmin && liveApps && liveApps.length > 0 ? (
                      liveApps.slice(0, 4).map((app) => (
                        <tr key={app.id} className="hover:bg-[#f8fafc]">
                          <td className="py-2.5 px-4 font-semibold text-[#102529]">
                            {app.orgName || '—'}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11.5px] text-[#002456]">
                            {app.number}
                          </td>
                          <td className="py-2.5 px-3">
                            {app.submittedAt ? app.submittedAt.slice(0, 10) : 'Draft'}
                          </td>
                          <td className="py-2.5 px-3">
                            <StatusBadge status={app.status === 'ACTIVE' ? 'Approved' : app.status === 'SUBMITTED' ? 'Under Review' : app.status} />
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => onNavigate('applications')}
                              className="font-semibold text-[#002456] hover:underline cursor-pointer"
                            >
                              View &rarr;
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr className="hover:bg-[#f8fafc]">
                        <td className="py-2.5 px-4 font-semibold text-[#102529]">{orgName}</td>
                        <td className="py-2.5 px-3 font-mono text-[11.5px] text-[#002456]">
                          {onboardingState.applicationNumber}
                        </td>
                        <td className="py-2.5 px-3">Today</td>
                        <td className="py-2.5 px-3">
                          <StatusBadge status={applicationStatus} />
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setIsInspectModalOpen(true)}
                            className="font-semibold text-[#002456] hover:underline cursor-pointer"
                          >
                            Review &rarr;
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="lg:col-span-5 imdx-card rounded-[14px] p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[15.5px] font-semibold text-[#102529]">Recent Activity</h2>
                <button
                  type="button"
                  onClick={() => onNavigate('audit-log')}
                  className="text-[12.5px] font-semibold text-[#059669] hover:underline cursor-pointer"
                >
                  View audit logs
                </button>
              </div>
              <div className="space-y-2.5">
                {mergedAudits.slice(0, 4).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start justify-between gap-3 text-[12.5px] border-b border-[#f1f5f9] pb-2 last:border-b-0 last:pb-0"
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <span
                        className={`mt-1.5 size-2 rounded-full shrink-0 ${
                          entry.outcome === 'Success' ? 'bg-[#10b981]' : 'bg-[#f59e0b]'
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-[#102529] truncate">{entry.eventType}</p>
                        <p className="text-[#64748b] truncate">
                          {entry.participantDid} · {entry.payload}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] text-[#94a3b8] shrink-0">{entry.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. PARTICIPANTS */}
      {activeNav === 'participants' && (() => {
        const effectiveQuery = (partSearch || searchQuery).trim().toLowerCase();
        const filtered = mergedParticipants.filter((p) => {
          if (participantFilter !== 'All' && p.status !== participantFilter) return false;
          if (partRoleFilter !== 'All' && !p.role.includes(partRoleFilter)) return false;
          if (!effectiveQuery) return true;
          return (
            p.name.toLowerCase().includes(effectiveQuery) ||
            p.did.toLowerCase().includes(effectiveQuery) ||
            p.bpn.toLowerCase().includes(effectiveQuery)
          );
        });
        const pageSize = 5;
        const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
        const safePage = Math.min(partPage, totalPages);
        const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <AdminKpiCard
                index={0}
                label="Total Participants"
                value={mergedParticipants.length}
                subtext="Registered organizations"
                boxBg="bg-[#e9fffa]"
                dotColor="bg-[#10b981]"
              />
              <AdminKpiCard
                index={1}
                label="Active"
                value={mergedParticipants.filter((p) => p.status === 'Active').length}
                subtext="Live workspace credentials"
                boxBg="bg-[#dcfce7]"
                dotColor="bg-[#16a34a]"
              />
              <AdminKpiCard
                index={2}
                label="Pending"
                value={pendingApprovalsCount}
                subtext="Awaiting verification"
                boxBg="bg-[#fef3c7]"
                dotColor="bg-[#d97706]"
              />
              <AdminKpiCard
                index={3}
                label="Suspended"
                value={mergedParticipants.filter((p) => p.status === 'Suspended').length}
                subtext="Restricted access"
                boxBg="bg-[#fee2e2]"
                dotColor="bg-[#dc2626]"
              />
            </div>

            {/* Participants Registry */}
            <div className="imdx-card rounded-[14px] overflow-hidden">
              <div className="px-4 sm:px-5 py-3.5 border-b border-[#e2e8f0] space-y-3">
                <div>
                  <h2 className="text-[16px] font-semibold text-[#102529]">Participants Registry</h2>
                  <p className="text-[12px] text-[#64748b]">
                    Providers and consumers registered on the platform
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <input
                    type="search"
                    value={partSearch}
                    onChange={(e) => {
                      setPartSearch(e.target.value);
                      setPartPage(1);
                    }}
                    placeholder="Search by name, DID or BPN..."
                    className="flex-1 min-w-[210px] h-[36px] rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[13px] focus:outline-none focus:border-[#008fa7]"
                  />
                  <select
                    aria-label="Filter participants by status"
                    value={participantFilter}
                    onChange={(e) => {
                      setParticipantFilter(e.target.value as 'All' | 'Active' | 'Suspended');
                      setPartPage(1);
                    }}
                    className="h-[36px] rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[12.5px] text-[#102529]"
                  >
                    <option value="All">All statuses</option>
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                  <select
                    aria-label="Filter participants by role"
                    value={partRoleFilter}
                    onChange={(e) => {
                      setPartRoleFilter(e.target.value);
                      setPartPage(1);
                    }}
                    className="h-[36px] rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[12.5px] text-[#102529]"
                  >
                    <option value="All">All roles</option>
                    <option value="Provider">Provider</option>
                    <option value="Consumer">Consumer</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[780px]">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#e3f9f3]/80 via-[#e8f6fe]/80 to-[#e6f0ff]/80 border-b border-[#b4d7de]/70 text-[12px] text-[#102529]">
                      <th className="py-2.5 px-4 font-semibold">DID</th>
                      <th className="py-2.5 px-3.5 font-semibold">BPN</th>
                      <th className="py-2.5 px-3.5 font-semibold">Name</th>
                      <th className="py-2.5 px-3.5 font-semibold">Role</th>
                      <th className="py-2.5 px-3.5 font-semibold">Status</th>
                      <th className="py-2.5 px-3.5 font-semibold">Created</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9] text-[13px] text-[#475569]">
                    {pageRows.map((p, idx) => (
                      <tr
                        key={p.id}
                        style={{ ['--stagger-i' as string]: idx }}
                        className="imdx-stagger-row hover:bg-[#f8fafc]"
                      >
                        <td className="py-3 px-4 font-mono text-[11.5px] whitespace-nowrap">
                          {p.did}
                        </td>
                        <td className="py-3 px-3.5 font-mono text-[11.5px] whitespace-nowrap">
                          {p.bpn}
                        </td>
                        <td className="py-3 px-3.5 font-semibold text-[#102529]">{p.name}</td>
                        <td className="py-3 px-3.5 whitespace-nowrap">{p.role}</td>
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <StatusBadge status={p.status} />
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap text-[12px]">{p.created}</td>
                        <td className="py-3 px-4 text-right whitespace-nowrap space-x-3">
                          <button
                            type="button"
                            onClick={() => {
                              const email = repEmail;
                              if (isLiveAdmin) {
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
                            className={`text-[12px] font-semibold hover:underline cursor-pointer ${
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

              <div className="px-4 py-3 border-t border-[#e2e8f0] flex flex-wrap items-center justify-between gap-2 text-[12px] text-[#64748b]">
                <span>
                  Showing {pageRows.length} of {filtered.length} results
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => setPartPage((p) => Math.max(1, p - 1))}
                    className="h-[28px] px-2.5 rounded-[6px] border border-[#cbd5e1] bg-white disabled:opacity-45 cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="h-[28px] min-w-[28px] px-2 inline-flex items-center justify-center rounded-[6px] bg-[#002456] text-white font-semibold">
                    {safePage}
                  </span>
                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() => setPartPage((p) => Math.min(totalPages, p + 1))}
                    className="h-[28px] px-2.5 rounded-[6px] border border-[#cbd5e1] bg-white disabled:opacity-45 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

            {/* Workspaces Table */}
            <div className="imdx-card rounded-[14px] overflow-hidden">
              <div className="px-4 sm:px-5 py-3.5 border-b border-[#e2e8f0]">
                <h2 className="text-[16px] font-semibold text-[#102529]">Workspaces</h2>
                <p className="text-[12px] text-[#64748b]">
                  Monitor workspace environments associated with registered participants.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[680px]">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#e3f9f3]/80 via-[#e8f6fe]/80 to-[#e6f0ff]/80 border-b border-[#b4d7de]/70 text-[12px] text-[#102529]">
                      <th className="py-2.5 px-4 font-semibold">Participant</th>
                      <th className="py-2.5 px-3.5 font-semibold">Namespace</th>
                      <th className="py-2.5 px-3.5 font-semibold">Mode</th>
                      <th className="py-2.5 px-3.5 font-semibold">Status</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9] text-[13px] text-[#475569]">
                    {(tenants.length > 0
                      ? tenants.map((t) => ({
                          id: t.id,
                          participant: t.participantDid,
                          namespace: t.namespace,
                          mode: 'Hosted',
                          status: t.status,
                        }))
                      : mergedParticipants.slice(0, 5).map((p) => ({
                          id: `ws-${p.id}`,
                          participant: p.name,
                          namespace: p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 18),
                          mode: 'Hosted',
                          status: p.status === 'Active' ? 'Live' : 'Failed',
                        }))
                    ).map((ws) => (
                      <tr key={ws.id} className="hover:bg-[#f8fafc]">
                        <td className="py-3 px-4 font-semibold text-[#102529]">{ws.participant}</td>
                        <td className="py-3 px-3.5 font-mono text-[12px]">{ws.namespace}</td>
                        <td className="py-3 px-3.5">{ws.mode}</td>
                        <td className="py-3 px-3.5">
                          <StatusBadge status={ws.status} />
                        </td>
                        <td className="py-3 px-4 text-right space-x-3 whitespace-nowrap">
                          {isLiveAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                void cygnusApi
                                  .retryTenant(ws.id)
                                  .then(() => setAdminActionNote(`Retried ${ws.namespace}`));
                              }}
                              className="text-[12px] font-semibold text-[#008fa7] hover:underline cursor-pointer"
                            >
                              Retry
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (isLiveAdmin) {
                                void cygnusApi
                                  .deleteTenant(ws.id, ws.namespace)
                                  .then(() => {
                                    setTenants((prev) => prev.filter((x) => x.id !== ws.id));
                                    setAdminActionNote(`Deleted workspace ${ws.namespace}`);
                                  })
                                  .catch(() =>
                                    setAdminActionNote(`Unable to delete ${ws.namespace}.`),
                                  );
                              } else {
                                setAdminActionNote(
                                  `Workspace delete requested for ${ws.namespace} (demo mode).`,
                                );
                              }
                            }}
                            className="text-[12px] font-semibold text-[#475569] hover:text-[#dc2626] cursor-pointer"
                          >
                            Delete Workspace
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
      })()}

      {/* 3. APPLICATIONS */}
      {activeNav === 'applications' && (() => {
        const appRows =
          isLiveAdmin && liveApps
            ? liveApps.filter((app) => {
                if (!appSearch.trim()) return true;
                const q = appSearch.toLowerCase();
                return (
                  app.number.toLowerCase().includes(q) ||
                  (app.orgName || '').toLowerCase().includes(q)
                );
              })
            : null;
        const sortedLive = appRows
          ? [...appRows].sort((a, b) => {
              const ta = new Date(a.submittedAt || a.createdAt || 0).getTime();
              const tb = new Date(b.submittedAt || b.createdAt || 0).getTime();
              return appSort === 'newest' ? tb - ta : ta - tb;
            })
          : null;

        const totalAppsCount = sortedLive ? sortedLive.length : 1;
        const submittedCount = sortedLive
          ? sortedLive.filter((a) => a.status === 'SUBMITTED').length
          : applicationStatus === 'Under Review'
            ? 1
            : 0;
        const needsInfoCount = sortedLive
          ? sortedLive.filter((a) => a.status === 'NEEDS_INFO').length
          : applicationStatus === 'Changes Requested'
            ? 1
            : 0;
        const approvedCount = sortedLive
          ? sortedLive.filter((a) => a.status === 'ACTIVE' || a.status === 'APPROVED_WAITING').length
          : applicationStatus === 'Approved'
            ? 1
            : 0;
        const rejectedCount = sortedLive ? sortedLive.filter((a) => a.status === 'REJECTED').length : 0;

        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
              <AdminKpiCard
                index={0}
                label="Total Applications"
                value={totalAppsCount}
                subtext="All time"
                boxBg="bg-[#e9fffa]"
                dotColor="bg-[#10b981]"
              />
              <AdminKpiCard
                index={1}
                label="Pending Review"
                value={submittedCount}
                subtext="Awaiting initial review"
                boxBg="bg-[#fef3c7]"
                dotColor="bg-[#d97706]"
              />
              <AdminKpiCard
                index={2}
                label="Changes Requested"
                value={needsInfoCount}
                subtext="Info clarification sent"
                boxBg="bg-[#fff7ed]"
                dotColor="bg-[#f97316]"
              />
              <AdminKpiCard
                index={3}
                label="Approved"
                value={approvedCount}
                subtext={`${Math.round((approvedCount / Math.max(1, totalAppsCount)) * 100)}% approval rate`}
                boxBg="bg-[#dcfce7]"
                dotColor="bg-[#16a34a]"
              />
              <AdminKpiCard
                index={4}
                label="Rejected"
                value={rejectedCount}
                subtext="Closed dossiers"
                boxBg="bg-[#fee2e2]"
                dotColor="bg-[#dc2626]"
              />
            </div>

            <div className="imdx-card rounded-[14px] overflow-hidden">
              <div className="px-4 sm:px-5 py-3.5 border-b border-[#e2e8f0] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-[16px] font-semibold text-[#102529]">Applications queue</h2>
                    <p className="text-[12px] text-[#64748b]">
                      48-hour review SLA applies from submission
                    </p>
                  </div>
                  {reviewNote && (
                    <span className="text-[12px] text-[#64748b]">Latest note: {reviewNote}</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <input
                    type="search"
                    value={appSearch}
                    onChange={(e) => setAppSearch(e.target.value)}
                    placeholder="Search organization or application ID..."
                    className="flex-1 min-w-[210px] h-[36px] rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[13px] focus:outline-none focus:border-[#008fa7]"
                  />
                  {isLiveAdmin && (
                    <select
                      aria-label="Filter applications by status"
                      value={appStatusFilter}
                      onChange={(e) => setAppStatusFilter(e.target.value)}
                      className="h-[36px] rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[12.5px] text-[#102529]"
                    >
                      <option value="">All statuses</option>
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
                  <select
                    aria-label="Sort applications"
                    value={appSort}
                    onChange={(e) => setAppSort(e.target.value as 'newest' | 'oldest')}
                    className="h-[36px] rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[12.5px] text-[#102529]"
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[780px]">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#e3f9f3]/80 via-[#e8f6fe]/80 to-[#e6f0ff]/80 border-b border-[#b4d7de]/70 text-[12px] text-[#102529]">
                      <th className="py-2.5 px-4 font-semibold">Application ID</th>
                      <th className="py-2.5 px-3.5 font-semibold">Organization</th>
                      <th className="py-2.5 px-3.5 font-semibold">Submitted</th>
                      <th className="py-2.5 px-3.5 font-semibold">Policies / Contact</th>
                      <th className="py-2.5 px-3.5 font-semibold">Review Deadline</th>
                      <th className="py-2.5 px-3.5 font-semibold">Status</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9] text-[13px] text-[#475569]">
                    {sortedLive ? (
                      sortedLive.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-[#64748b]">
                            No applications found for this filter.
                          </td>
                        </tr>
                      ) : (
                        sortedLive.map((app) => (
                          <tr key={app.id} className="hover:bg-[#f8fafc]">
                            <td className="py-3 px-4 font-mono text-[12px] font-semibold text-[#002456] whitespace-nowrap">
                              {app.number}
                            </td>
                            <td className="py-3 px-3.5 font-semibold text-[#102529]">
                              {app.orgName || '—'}
                            </td>
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              {app.submittedAt ? app.submittedAt.slice(0, 10) : 'Draft'}
                            </td>
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              {app.contactName || app.email || '—'}
                            </td>
                            <td className="py-3 px-3.5 whitespace-nowrap text-[12px] font-medium text-[#059669]">
                              {app.status === 'ACTIVE' ? 'Within SLA' : '48h window'}
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
                            <td className="py-3 px-4 text-right whitespace-nowrap space-x-3">
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
                                        err instanceof Error
                                          ? err.message
                                          : 'Unable to load application.',
                                      ),
                                    );
                                }}
                                className="text-[12.5px] font-semibold text-[#002456] hover:underline cursor-pointer"
                              >
                                View &rarr;
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
                                      });
                                  }}
                                  className="text-[12px] font-semibold text-[#059669] hover:underline cursor-pointer"
                                >
                                  Approve
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )
                    ) : (
                      <tr className="hover:bg-[#f8fafc]">
                        <td className="py-3 px-4 font-mono text-[12px] font-semibold text-[#002456] whitespace-nowrap">
                          {onboardingState.applicationNumber}
                        </td>
                        <td className="py-3 px-3.5 font-semibold text-[#102529]">{orgName}</td>
                        <td className="py-3 px-3.5 whitespace-nowrap">Today</td>
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          {acceptedPoliciesCount}/{POLICIES.length} · {repEmail}
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap text-[12px] font-medium text-[#059669]">
                          Within SLA
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <StatusBadge status={applicationStatus} />
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap space-x-3">
                          <button
                            type="button"
                            onClick={() => {
                              setInspectDetail(null);
                              setIsInspectModalOpen(true);
                            }}
                            className="text-[12.5px] font-semibold text-[#002456] hover:underline cursor-pointer"
                          >
                            View &rarr;
                          </button>
                          {applicationStatus !== 'Approved' && (
                            <button
                              type="button"
                              onClick={() => handleApplicationDecision('Approved')}
                              className="text-[12px] font-semibold text-[#059669] hover:underline cursor-pointer"
                            >
                              Approve
                            </button>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 4. POLICIES */}
      {activeNav === 'policies' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {mergedPolicies.map((pol, idx) => {
            const pct = Math.min(100, Math.round((pol.acceptedCount / Math.max(1, pol.totalCount)) * 100));
            return (
              <div
                key={pol.id}
                style={{ ['--stagger-i' as string]: idx }}
                className="imdx-stagger-card imdx-card imdx-card-interactive rounded-[14px] p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="size-8 rounded-[8px] bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center text-[#002456] text-[14px]">
                      🛡
                    </span>
                    <StatusBadge status={pol.status} />
                  </div>

                  <div>
                    <h3 className="text-[15.5px] font-bold text-[#102529]">{pol.title}</h3>
                    <div className="mt-1 flex items-center justify-between text-[12px]">
                      <span className="font-semibold text-[#008fa7]">{pol.version}</span>
                      <span className="text-[#64748b]">Published {pol.updatedAt}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-[#64748b]">Participant acceptance</span>
                      <span className="font-semibold text-[#102529]">{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#e2e8f0] overflow-hidden">
                      <div className="h-full bg-[#059669]" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#94a3b8]">
                      <span>
                        {pol.acceptedCount} / {pol.totalCount} accepted
                      </span>
                      <span className="font-mono">Hash {pol.hash}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedPolicyDetail({
                        id: pol.id,
                        title: pol.title,
                        version: pol.version,
                        mandatory: pol.mandatory,
                        enforced: pol.enforced,
                        updatedAt: pol.updatedAt,
                      })
                    }
                    className="h-[34px] rounded-[8px] border border-[#cbd5e1] bg-white hover:bg-[#f8fafc] text-[12px] font-semibold text-[#102529] cursor-pointer"
                  >
                    View Details
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPolicySlug(pol.slug);
                      setNewPolicyTitle(pol.title);
                      setNewPolicyBody(pol.body);
                      setPolicyStatusDraft('APPROVED');
                      setIsPolicyModalOpen(true);
                    }}
                    className="h-[34px] rounded-[8px] border border-[#cbd5e1] bg-white hover:bg-[#f8fafc] text-[12px] font-semibold text-[#102529] cursor-pointer"
                  >
                    New Version
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. AUDIT LOGS */}
      {activeNav === 'audit-log' && (() => {
        const filteredAudits = mergedAudits.filter((item) => {
          if (auditDidFilter.trim() && !item.participantDid.toLowerCase().includes(auditDidFilter.toLowerCase())) {
            return false;
          }
          if (auditTypeFilter.trim() && !item.eventType.toLowerCase().includes(auditTypeFilter.toLowerCase())) {
            return false;
          }
          if (auditDateFilter.trim() && !item.timestamp.includes(auditDateFilter)) {
            return false;
          }
          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            return (
              item.eventType.toLowerCase().includes(q) ||
              item.participantDid.toLowerCase().includes(q) ||
              item.payload.toLowerCase().includes(q)
            );
          }
          return true;
        });
        const totalAuditPages = Math.max(1, Math.ceil(filteredAudits.length / auditLimit));
        const safeAuditPage = Math.min(auditPage, totalAuditPages);
        const auditRows = filteredAudits.slice(
          (safeAuditPage - 1) * auditLimit,
          safeAuditPage * auditLimit,
        );

        return (
          <div className="space-y-4">
            {/* Filter card */}
            <div className="imdx-card rounded-[14px] p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-3">
                <label className="block text-[11.5px] font-semibold text-[#475569] mb-1">
                  Participant DID
                </label>
                <input
                  type="text"
                  value={auditDidFilter}
                  onChange={(e) => {
                    setAuditDidFilter(e.target.value);
                    setAuditPage(1);
                  }}
                  placeholder="Enter participant DID"
                  className="w-full h-[36px] rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[12.5px]"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-[11.5px] font-semibold text-[#475569] mb-1">
                  Event Type
                </label>
                <input
                  type="text"
                  value={auditTypeFilter}
                  onChange={(e) => {
                    setAuditTypeFilter(e.target.value);
                    setAuditPage(1);
                  }}
                  placeholder="Search event type"
                  className="w-full h-[36px] rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[12.5px]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[11.5px] font-semibold text-[#475569] mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={auditDateFilter}
                  onChange={(e) => {
                    setAuditDateFilter(e.target.value);
                    setAuditPage(1);
                  }}
                  className="w-full h-[36px] rounded-[8px] border border-[#cbd5e1] bg-white px-2.5 text-[12.5px]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[11.5px] font-semibold text-[#475569] mb-1">
                  Limit
                </label>
                <select
                  aria-label="Audit record limit"
                  value={auditLimit}
                  onChange={(e) => {
                    setAuditLimit(Number(e.target.value));
                    setAuditPage(1);
                  }}
                  className="w-full h-[36px] rounded-[8px] border border-[#cbd5e1] bg-white px-2.5 text-[12.5px]"
                >
                  <option value={25}>25 records</option>
                  <option value={50}>50 records</option>
                  <option value={100}>100 records</option>
                </select>
              </div>
              <div className="md:col-span-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuditDidFilter('');
                    setAuditTypeFilter('');
                    setAuditDateFilter('');
                    setAuditPage(1);
                  }}
                  className="h-[36px] px-3 rounded-[8px] border border-[#cbd5e1] bg-white text-[12.5px] font-medium text-[#475569] cursor-pointer"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('verify-audit')}
                  className="h-[36px] px-3 rounded-full imdx-btn-primary text-[12px] font-semibold cursor-pointer whitespace-nowrap"
                >
                  Verify Chain
                </button>
              </div>
            </div>

            {/* Records Table */}
            <div className="imdx-card rounded-[14px] overflow-hidden">
              <div className="px-4 sm:px-5 py-3.5 border-b border-[#e2e8f0] flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-[16px] font-semibold text-[#102529]">Audit Log Records</h2>
                  <p className="text-[12px] text-[#64748b]">
                    Immutable and tamper-evident platform events
                  </p>
                </div>
                <span className="text-[12px] text-[#64748b]">
                  Showing {auditRows.length} of {filteredAudits.length} records
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[740px]">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#e3f9f3]/80 via-[#e8f6fe]/80 to-[#e6f0ff]/80 border-b border-[#b4d7de]/70 text-[12px] text-[#102529]">
                      <th className="py-2.5 px-4 font-semibold">Timestamp</th>
                      <th className="py-2.5 px-3.5 font-semibold">Event Type</th>
                      <th className="py-2.5 px-3.5 font-semibold">Participant DID</th>
                      <th className="py-2.5 px-3.5 font-semibold">Event Hash</th>
                      <th className="py-2.5 px-4 font-semibold">Payload</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9] text-[13px] text-[#475569]">
                    {auditRows.map((entry, idx) => (
                      <tr
                        key={entry.id}
                        style={{ ['--stagger-i' as string]: idx }}
                        className="imdx-stagger-row hover:bg-[#f8fafc]"
                      >
                        <td className="py-3 px-4 whitespace-nowrap text-[12px]">{entry.timestamp}</td>
                        <td className="py-3 px-3.5 font-medium text-[#102529]">{entry.eventType}</td>
                        <td className="py-3 px-3.5 font-mono text-[11.5px]">{entry.participantDid}</td>
                        <td className="py-3 px-3.5 font-mono text-[11.5px] text-[#008fa7]">
                          {entry.eventHash}
                        </td>
                        <td className="py-3 px-4 text-[12.5px] max-w-[280px] truncate">
                          {entry.payload}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 6. PURPOSES */}
      {activeNav === 'purposes' && (() => {
        const categories = Array.from(new Set(mergedPurposes.map((p) => p.category)));
        const filteredPurposes = mergedPurposes.filter((pur) => {
          if (purposeCategoryFilter !== 'All' && pur.category !== purposeCategoryFilter) return false;
          if (purposeStatusFilter === 'Active' && !pur.active) return false;
          if (purposeStatusFilter === 'Inactive' && pur.active) return false;
          if (purposeSearch.trim()) {
            return pur.name.toLowerCase().includes(purposeSearch.trim().toLowerCase());
          }
          return true;
        });

        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <AdminKpiCard
                index={0}
                label="Total Purposes"
                value={mergedPurposes.length}
                subtext={`Across ${categories.length} categories`}
                boxBg="bg-[#e9fffa]"
                dotColor="bg-[#10b981]"
              />
              <AdminKpiCard
                index={1}
                label="Active"
                value={mergedPurposes.filter((p) => p.active).length}
                subtext="Available for consent"
                boxBg="bg-[#dcfce7]"
                dotColor="bg-[#16a34a]"
              />
              <AdminKpiCard
                index={2}
                label="Inactive"
                value={mergedPurposes.filter((p) => !p.active).length}
                subtext="Paused for new contracts"
                boxBg="bg-[#f1f5f9]"
                dotColor="bg-[#64748b]"
              />
              <AdminKpiCard
                index={3}
                label="Explicit Consent"
                value={mergedPurposes.filter((p) => p.explicitConsent === 'Yes').length}
                subtext="DPDP enforced"
                boxBg="bg-[#e6ecff]"
                dotColor="bg-[#3553ab]"
              />
            </div>

            <div className="imdx-card rounded-[14px] overflow-hidden">
              <div className="px-4 sm:px-5 py-3.5 border-b border-[#e2e8f0] space-y-3">
                <div>
                  <h2 className="text-[16px] font-semibold text-[#102529]">Purpose Registry</h2>
                  <p className="text-[12px] text-[#64748b]">
                    Consent purposes available for data-sharing agreements.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <input
                    type="search"
                    value={purposeSearch}
                    onChange={(e) => setPurposeSearch(e.target.value)}
                    placeholder="Search purpose..."
                    className="flex-1 min-w-[200px] h-[36px] rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[13px] focus:outline-none focus:border-[#008fa7]"
                  />
                  <select
                    aria-label="Filter purposes by category"
                    value={purposeCategoryFilter}
                    onChange={(e) => setPurposeCategoryFilter(e.target.value)}
                    className="h-[36px] rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[12.5px]"
                  >
                    <option value="All">All categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Filter purposes by status"
                    value={purposeStatusFilter}
                    onChange={(e) => setPurposeStatusFilter(e.target.value)}
                    className="h-[36px] rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[12.5px]"
                  >
                    <option value="All">All statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#e3f9f3]/80 via-[#e8f6fe]/80 to-[#e6f0ff]/80 border-b border-[#b4d7de]/70 text-[12px] text-[#102529]">
                      <th className="py-2.5 px-4 font-semibold">Name</th>
                      <th className="py-2.5 px-3.5 font-semibold">Category</th>
                      <th className="py-2.5 px-3.5 font-semibold text-center">Explicit Consent</th>
                      <th className="py-2.5 px-3.5 font-semibold">Status</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9] text-[13px] text-[#475569]">
                    {filteredPurposes.map((pur, idx) => (
                      <tr
                        key={pur.id}
                        style={{ ['--stagger-i' as string]: idx }}
                        className="imdx-stagger-row hover:bg-[#f8fafc]"
                      >
                        <td className="py-3 px-4 font-semibold text-[#102529]">{pur.name}</td>
                        <td className="py-3 px-3.5">{pur.category}</td>
                        <td className="py-3 px-3.5 text-center">{pur.explicitConsent}</td>
                        <td className="py-3 px-3.5">
                          <StatusBadge status={pur.active ? 'Active' : 'Inactive'} />
                        </td>
                        <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPurposeId(pur.id);
                              setNewPurposeName(pur.name);
                              setNewPurposeCategory(pur.category);
                              setNewPurposeDesc(pur.description);
                              setIsPurposeModalOpen(true);
                            }}
                            className="h-[28px] px-3 rounded-full border border-[#cbd5e1] bg-white hover:bg-[#f8fafc] text-[11.5px] font-semibold text-[#102529] cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => togglePurposeActive(pur.id)}
                            className={`h-[28px] px-3 rounded-full border text-[11.5px] font-semibold cursor-pointer ${
                              pur.active
                                ? 'border-[#fca5a5] bg-[#fef2f2] text-[#dc2626]'
                                : 'border-[#86efac] bg-[#f0fdf4] text-[#15803d]'
                            }`}
                          >
                            {pur.active ? 'Deactivate' : 'Activate'}
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
      })()}

      {/* 7-10. VERIFY AUDIT, CLUSTER HEALTH, CAPACITY, SETTINGS */}
      {(activeNav === 'verify-audit' ||
        activeNav === 'cluster-health' ||
        activeNav === 'capacity' ||
        activeNav === 'settings') && (
        <AdminClusterAndVerifySection
          activeNav={activeNav}
          onNavigate={onNavigate}
          participants={participants}
          verificationHistory={verificationHistory}
          onAddVerification={(rec) => setVerificationHistory((prev) => [rec, ...prev])}
          clusterHealth={clusterHealth}
          onRefreshClusterHealth={fetchLiveDashboardData}
          capacityState={capacityState}
          capacityInput={capacityInput}
          onCapacityInputChange={setCapacityInput}
          tenants={tenants}
          breaches={breaches}
          onBreachesChange={setBreaches}
          adminEmail={adminEmail}
          onAdminEmailChange={setAdminEmail}
          auditRetentionDays={auditRetentionDays}
          onAuditRetentionDaysChange={setAuditRetentionDays}
          autoProvision={autoProvision}
          onAutoProvisionChange={setAutoProvision}
          settingsSaved={settingsSaved}
          onSaveSettings={() => {
            appendAudit('Updated Governance Settings', `Retention ${auditRetentionDays}d`);
            setSettingsSaved(true);
            window.setTimeout(() => setSettingsSaved(false), 2500);
          }}
          onActionNote={setAdminActionNote}
          onAppendAudit={appendAudit}
          lastCheckedLabel={lastUpdatedLabel}
        />
      )}

      {/* Modal: Add Participant */}
      {isAddPartOpen && (
        <ModalPortal>
          <div
            className="imdx-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-[#05080d]/55 backdrop-blur-xs p-4"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setIsAddPartOpen(false);
            }}
          >
            <form
              onSubmit={handleCreateParticipant}
              className="imdx-modal-panel imdx-modal-surface w-full max-w-[440px] rounded-[14px] p-5 sm:p-6 space-y-4"
            >
              <h3 className="text-[18px] font-bold text-[#102529]">Add Participant</h3>
              <div>
                <label className="block text-[12.5px] font-semibold text-[#334155] mb-1">
                  Organization Name
                </label>
                <input
                  type="text"
                  required
                  value={newPartName}
                  onChange={(e) => setNewPartName(e.target.value)}
                  placeholder="e.g. Metro Mobility Systems"
                  className="w-full h-[38px] rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[12.5px] font-semibold text-[#334155] mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={newPartEmail}
                  onChange={(e) => setNewPartEmail(e.target.value)}
                  placeholder="admin@organization.in"
                  className="w-full h-[38px] rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[12.5px] font-semibold text-[#334155] mb-1">
                  Role
                </label>
                <select
                  value={newPartRole}
                  onChange={(e) => setNewPartRole(e.target.value as 'PROV' | 'CONS')}
                  className="w-full h-[38px] rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[13px]"
                >
                  <option value="PROV">Provider (PROV)</option>
                  <option value="CONS">Consumer (CONS)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddPartOpen(false)}
                  className="h-[36px] px-4 rounded-full border border-[#cbd5e1] bg-white text-[12.5px] font-semibold text-[#102529] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-[36px] px-5 rounded-full imdx-btn-primary text-[12.5px] font-semibold cursor-pointer"
                >
                  Create Participant
                </button>
              </div>
            </form>
          </div>
        </ModalPortal>
      )}

      {/* Modal: Create / New Policy Version */}
      {isPolicyModalOpen && (
        <ModalPortal>
          <div
            className="imdx-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-[#05080d]/55 backdrop-blur-xs p-4"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setIsPolicyModalOpen(false);
            }}
          >
            <form
              onSubmit={handleSavePolicy}
              className="imdx-modal-panel imdx-modal-surface w-full max-w-[480px] rounded-[14px] p-5 sm:p-6 space-y-4"
            >
              <h3 className="text-[18px] font-bold text-[#102529]">
                {editingPolicySlug ? 'Publish New Policy Version' : 'Create Governance Policy'}
              </h3>
              <div>
                <label className="block text-[12.5px] font-semibold text-[#334155] mb-1">
                  Policy Title
                </label>
                <input
                  type="text"
                  required
                  value={newPolicyTitle}
                  onChange={(e) => setNewPolicyTitle(e.target.value)}
                  placeholder="Data Privacy Policy"
                  className="w-full h-[38px] rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[12.5px] font-semibold text-[#334155] mb-1">
                  Policy Body / Summary
                </label>
                <textarea
                  rows={3}
                  value={newPolicyBody}
                  onChange={(e) => setNewPolicyBody(e.target.value)}
                  placeholder="Full compliance clauses..."
                  className="w-full rounded-[8px] border border-[#cbd5e1] bg-white p-3 text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[12.5px] font-semibold text-[#334155] mb-1">
                  Status
                </label>
                <select
                  value={policyStatusDraft}
                  onChange={(e) => setPolicyStatusDraft(e.target.value as 'APPROVED' | 'DRAFT')}
                  className="w-full h-[38px] rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[13px]"
                >
                  <option value="APPROVED">Published (Approved)</option>
                  <option value="DRAFT">Draft</option>
                </select>
              </div>
              <div className="flex justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsPolicyModalOpen(false)}
                  className="h-[36px] px-4 rounded-full border border-[#cbd5e1] bg-white text-[12.5px] font-semibold text-[#102529] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-[36px] px-5 rounded-full imdx-btn-primary text-[12.5px] font-semibold cursor-pointer"
                >
                  Publish Policy
                </button>
              </div>
            </form>
          </div>
        </ModalPortal>
      )}

      {/* Modal: View Policy Details */}
      {selectedPolicyDetail && (
        <ModalPortal>
          <div
            className="imdx-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-[#05080d]/55 backdrop-blur-xs p-4"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setSelectedPolicyDetail(null);
            }}
          >
            <div className="imdx-modal-panel imdx-modal-surface w-full max-w-[460px] rounded-[14px] p-5 sm:p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[12px] font-semibold text-[#008fa7]">
                    {selectedPolicyDetail.version}
                  </p>
                  <h3 className="text-[18px] font-bold text-[#102529]">
                    {selectedPolicyDetail.title}
                  </h3>
                </div>
                <StatusBadge status={selectedPolicyDetail.enforced ? 'Published' : 'Draft'} />
              </div>
              <p className="text-[13px] text-[#475569]">
                Updated on {selectedPolicyDetail.updatedAt}. Mandatory participation compliance is{' '}
                {selectedPolicyDetail.mandatory ? 'enforced across onboarding.' : 'optional.'}
              </p>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedPolicyDetail(null)}
                  className="h-[36px] px-5 rounded-full bg-[#002456] text-white text-[12.5px] font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modal: Create / Edit Purpose */}
      {isPurposeModalOpen && (
        <ModalPortal>
          <div
            className="imdx-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-[#05080d]/55 backdrop-blur-xs p-4"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setIsPurposeModalOpen(false);
            }}
          >
            <form
              onSubmit={handleSavePurpose}
              className="imdx-modal-panel imdx-modal-surface w-full max-w-[460px] rounded-[14px] p-5 sm:p-6 space-y-4"
            >
              <h3 className="text-[18px] font-bold text-[#102529]">
                {editingPurposeId ? 'Edit Data Purpose' : 'Create Data Purpose'}
              </h3>
              <div>
                <label className="block text-[12.5px] font-semibold text-[#334155] mb-1">
                  Purpose Name
                </label>
                <input
                  type="text"
                  required
                  value={newPurposeName}
                  onChange={(e) => setNewPurposeName(e.target.value)}
                  placeholder="Traffic Flow Analysis"
                  className="w-full h-[38px] rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[12.5px] font-semibold text-[#334155] mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={newPurposeCategory}
                  onChange={(e) => setNewPurposeCategory(e.target.value)}
                  placeholder="Mobility Analytics"
                  className="w-full h-[38px] rounded-[8px] border border-[#cbd5e1] bg-white px-3 text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[12.5px] font-semibold text-[#334155] mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newPurposeDesc}
                  onChange={(e) => setNewPurposeDesc(e.target.value)}
                  placeholder="Allowed scope of usage..."
                  className="w-full rounded-[8px] border border-[#cbd5e1] bg-white p-3 text-[13px]"
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsPurposeModalOpen(false)}
                  className="h-[36px] px-4 rounded-full border border-[#cbd5e1] bg-white text-[12.5px] font-semibold text-[#102529] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-[36px] px-5 rounded-full imdx-btn-primary text-[12.5px] font-semibold cursor-pointer"
                >
                  Save Purpose
                </button>
              </div>
            </form>
          </div>
        </ModalPortal>
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
                        });
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
                        });
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
                      void cygnusApi.approveAdminApplication(inspectDetail.id).then(() => {
                        setAdminActionNote(`Approved ${inspectDetail.number}`);
                        setIsInspectModalOpen(false);
                        refreshLiveApplications();
                      });
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
