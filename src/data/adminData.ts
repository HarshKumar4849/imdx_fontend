import type {
  AdminParticipant,
  AdminPolicyRule,
  AuditLogEntry,
  CapacityClusterItem,
  DataPurposeItem,
} from '../types/dashboard';

export const INITIAL_ADMIN_PARTICIPANTS: AdminParticipant[] = [
  {
    id: 'part-1',
    name: 'Pune Mobility Authority',
    did: 'did:web:identity-daemon:IMDX001',
    role: 'Provider',
    deployment: 'Hosted By IMDX',
    datasetsCount: 4,
    status: 'Active',
  },
  {
    id: 'part-2',
    name: 'PMPML Transit Authority',
    did: 'did:web:identity-daemon:IMDX002',
    role: 'Provider & Consumer',
    deployment: 'Hosted By IMDX',
    datasetsCount: 3,
    status: 'Active',
  },
  {
    id: 'part-3',
    name: 'MahaEV Grid Operator',
    did: 'did:web:identity-daemon:IMDX003',
    role: 'Provider',
    deployment: 'Hosted By IMDX',
    datasetsCount: 2,
    status: 'Active',
  },
  {
    id: 'part-4',
    name: 'UrbanRide Micromobility',
    did: 'did:web:identity-daemon:IMDX004',
    role: 'Consumer',
    deployment: 'Hosted By IMDX',
    datasetsCount: 1,
    status: 'Active',
  },
];

export const INITIAL_ADMIN_POLICIES: AdminPolicyRule[] = [
  {
    id: 'pol-1',
    title: 'Acceptable Use Policy',
    version: 'v2.1',
    mandatory: true,
    enforced: true,
    updatedAt: '2026-10-12',
  },
  {
    id: 'pol-2',
    title: 'Data Processing Addendum',
    version: 'v1.4',
    mandatory: true,
    enforced: true,
    updatedAt: '2026-09-28',
  },
  {
    id: 'pol-3',
    title: 'Data Sharing Terms',
    version: 'v2.0',
    mandatory: true,
    enforced: true,
    updatedAt: '2026-11-01',
  },
  {
    id: 'pol-4',
    title: 'Hosted Service Level Terms',
    version: 'v1.2',
    mandatory: true,
    enforced: true,
    updatedAt: '2026-08-19',
  },
  {
    id: 'pol-5',
    title: 'Security and Incident Policy',
    version: 'v3.0',
    mandatory: true,
    enforced: true,
    updatedAt: '2026-11-10',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-1',
    actor: 'system@imdx.org',
    action: 'Application Submitted',
    target: 'ZW4C-9CDM-UC84',
    timestamp: 'Today, 22:10 IST',
    outcome: 'Success',
  },
  {
    id: 'log-2',
    actor: 'admin@imdx.org',
    action: 'Published Catalog Offer',
    target: 'Pune Urban Traffic Data (GTFS)',
    timestamp: 'Today, 19:45 IST',
    outcome: 'Success',
  },
  {
    id: 'log-3',
    actor: 'compliance@imdx.org',
    action: 'Policy Version Enforced',
    target: 'Security and Incident Policy v3.0',
    timestamp: 'Yesterday, 16:20 IST',
    outcome: 'Success',
  },
  {
    id: 'log-4',
    actor: 'identity-daemon',
    action: 'DID Credential Renewed',
    target: 'did:web:identity-daemon:IMDX002',
    timestamp: '2026-11-23, 11:05 IST',
    outcome: 'Warning',
  },
];

export const INITIAL_DATA_PURPOSES: DataPurposeItem[] = [
  {
    id: 'pur-1',
    code: 'IMDX-PUR-01',
    name: 'Urban Traffic Analytics',
    description: 'Corridor speed, congestion heatmaps, and arterial capacity planning.',
    active: true,
  },
  {
    id: 'pur-2',
    code: 'IMDX-PUR-02',
    name: 'Multimodal Route Planning',
    description: 'Real-time transit, metro feeder, and shared micromobility journey planning.',
    active: true,
  },
  {
    id: 'pur-3',
    code: 'IMDX-PUR-03',
    name: 'EV Charging Load Balancing',
    description: 'Public charger availability discovery and grid demand forecasting.',
    active: true,
  },
  {
    id: 'pur-4',
    code: 'IMDX-PUR-04',
    name: 'Transit Compliance Reporting',
    description: 'Municipal SLA verification and anonymized fleet audit reporting.',
    active: false,
  },
];

export const INITIAL_CAPACITY_CLUSTERS: CapacityClusterItem[] = [
  {
    id: 'cap-1',
    region: 'ap-south-1 (Mumbai)',
    clusterName: 'imdx-hosted-prod-01',
    tenantsAllocated: 18,
    tenantsMax: 25,
    cpuPct: 54,
    memoryPct: 62,
    status: 'Healthy',
  },
  {
    id: 'cap-2',
    region: 'ap-south-2 (Hyderabad)',
    clusterName: 'imdx-hosted-prod-02',
    tenantsAllocated: 11,
    tenantsMax: 25,
    cpuPct: 38,
    memoryPct: 44,
    status: 'Healthy',
  },
  {
    id: 'cap-3',
    region: 'ap-south-1 (Mumbai)',
    clusterName: 'imdx-telemetry-stream',
    tenantsAllocated: 22,
    tenantsMax: 25,
    cpuPct: 79,
    memoryPct: 81,
    status: 'High Load',
  },
];
