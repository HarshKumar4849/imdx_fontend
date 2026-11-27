import type { OnboardingState } from './onboarding';

export type WorkspaceNavKey =
  | 'dashboard'
  | 'datasets'
  | 'catalog'
  | 'subscriptions'
  | 'transfers'
  | 'compute'
  | 'billing'
  | 'settings';

export type AdminNavKey =
  | 'dashboard'
  | 'participants'
  | 'applications'
  | 'policies'
  | 'audit-log'
  | 'verify-audit'
  | 'purposes'
  | 'cluster-health'
  | 'capacity'
  | 'settings';

export type DatasetStatus = 'Published' | 'Awaiting Approval' | 'Draft';

export interface MyDatasetItem {
  id: string;
  name: string;
  category: string;
  version?: string;
  coverage: string;
  updateFrequency: string;
  quality: string;
  status: DatasetStatus;
}

export type CatalogProtocol = 'GTFS' | 'GTFS-RT' | 'OCPI' | 'GBFS' | 'EV_CHARGING' | 'MDS';

export interface CatalogOffer {
  id: string;
  datasetId: string;
  category: string;
  version: string;
  tags: string;
  qualityScore?: number;
  title: string;
  protocol: CatalogProtocol;
  description: string;
  did: string;
  publisher: string;
  licence: string;
  coverage: string;
  updateFrequency: string;
  endpointUrl: string;
  fields: Array<{ name: string; type: string; description: string }>;
}

export type PlanOptionId = 'pay-per-use' | 'subscription' | 'hybrid' | 'one-time';

export interface SubscriptionRecord {
  offerId: string;
  datasetId?: string;
  datasetName?: string;
  providerDid?: string;
  backendStatus?: string;
  planId: PlanOptionId;
  purpose: string;
  subscribedAt: string;
  status: 'Active' | 'Paused';
}

export interface ConsentRequestRecord {
  offerId: string;
  purpose: string;
  scope: string;
  duration: string;
  status: 'Pending Review' | 'Granted';
  requestedAt: string;
}

export type AccessRequestStatus =
  | 'Pending Review'
  | 'Information Required'
  | 'Approved'
  | 'Rejected';

export interface AccessRequestItem {
  id: string;
  org: string;
  badge: string;
  dataset: string;
  purpose: string;
  scope: string;
  duration: string;
  submitted: string;
  status: AccessRequestStatus;
  note?: string;
}

export interface TransferItem {
  id: string;
  dataset: string;
  protocol: string;
  direction: 'Inbound' | 'Outbound';
  volume: string;
  status: 'Completed' | 'Streaming';
  timestamp: string;
}

export interface BillingTransaction {
  id: string;
  dataset: string;
  counterparty: string;
  type: string;
  period: string;
  amountInr: number;
  amount: string;
  date: string;
  status: 'Paid' | 'Pending';
  kind: 'earning' | 'spending';
}

export interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  read: boolean;
  targetNav?: WorkspaceNavKey;
}

export interface WorkspacePreferences {
  consentAutoApprove: boolean;
  emailAlerts: boolean;
  invoiceEmail: string;
  payoutMethod: string;
  billingCycle: string;
}

export type ApplicationReviewStatus = 'Under Review' | 'Approved' | 'Changes Requested';

export interface AdminParticipant {
  id: string;
  name: string;
  did: string;
  role: 'Provider' | 'Consumer' | 'Provider & Consumer';
  deployment: 'Hosted By IMDX' | 'Self-Hosted';
  datasetsCount: number;
  status: 'Active' | 'Suspended';
}

export interface AdminPolicyRule {
  id: string;
  title: string;
  version: string;
  mandatory: boolean;
  enforced: boolean;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
  outcome: 'Success' | 'Warning';
}

export interface DataPurposeItem {
  id: string;
  code: string;
  name: string;
  description: string;
  active: boolean;
}

export interface CapacityClusterItem {
  id: string;
  region: string;
  clusterName: string;
  tenantsAllocated: number;
  tenantsMax: number;
  cpuPct: number;
  memoryPct: number;
  status: 'Healthy' | 'High Load';
}

export interface ImdxAppStore {
  onboarding: OnboardingState;
  datasets: MyDatasetItem[];
  subscriptions: SubscriptionRecord[];
  consentRequests: ConsentRequestRecord[];
  accessRequests: AccessRequestItem[];
  transfers: TransferItem[];
  billingTransactions: BillingTransaction[];
  notifications: NotificationItem[];
  preferences: WorkspacePreferences;
  applicationStatus: ApplicationReviewStatus;
  reviewNote: string;
  participants: AdminParticipant[];
  policies: AdminPolicyRule[];
  auditLogs: AuditLogEntry[];
  purposes: DataPurposeItem[];
}
