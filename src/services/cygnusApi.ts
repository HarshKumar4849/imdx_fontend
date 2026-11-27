/**
 * Cygnus Platform & Participant Agent API Client
 * Matches the real endpoints, auth headers, and DTO contracts of Tecmotiv-Solutions/cygnus (main branch).
 */

export const PLATFORM_BASE = (
  (import.meta.env.VITE_PLATFORM_BASE as string | undefined)?.trim() ||
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
  ''
).replace(/\/+$/, '');

export const AGENT_BASE = (
  (import.meta.env.VITE_AGENT_BASE as string | undefined)?.trim() ||
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
  ''
).replace(/\/+$/, '');

export const TURNSTILE_SITE_KEY =
  (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined)?.trim() || '';

export const SESSION_KEYS = {
  user: 'cygnus.session.v1',
  admin: 'cygnus.admin-session.v1',
  applicationToken: 'cygnus.application-token.v1',
} as const;

export class ApiError extends Error {
  readonly status: number;
  readonly body?: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export interface PersistedUserSession {
  token: string;
  expiresIn: number;
  expiresAt: number;
  did: string;
  bpn: string;
  role: 'PROV' | 'CONS' | 'ADMN';
  orgRole: 'ORG_ADMIN' | 'MANAGER';
  email: string;
  designation: string;
  signatoryVerified: boolean;
}

export interface PersistedAdminSession {
  token: string;
  expiresIn: number;
  issuedAt: number;
  role: 'ADMN';
  email: string;
}

export interface CygnusUnifiedLoginResponse {
  kind: string;
  token?: string;
  expiresIn?: number;
  role?: string;
  redirectUrl?: string | null;
  noWorkspace?: boolean;
}

export type CygnusDocumentKind = 'INCORPORATION' | 'PAN' | 'GST' | 'AUTHORISATION' | 'OTHER';

export interface CygnusApplicationOrg {
  legalName: string;
  entityType: string;
  country: string;
  address: string;
  pan: string;
  gstin?: string | null;
  cin?: string | null;
  website?: string | null;
  sector?: string | null;
}

export interface CygnusApplicationRep {
  name: string;
  designation: string;
  email: string;
  mobile: string;
  isOfficer: boolean;
}

export interface CygnusApplicationDocument {
  id: string;
  kind: CygnusDocumentKind;
  filename: string;
  sizeBytes: number;
  contentType?: string;
  createdAt?: string;
}

export interface CygnusApplication {
  number: string;
  status:
    | 'DRAFT'
    | 'SUBMITTED'
    | 'NEEDS_INFO'
    | 'REJECTED'
    | 'APPROVED_WAITING'
    | 'PROVISIONING'
    | 'SETUP_FAILED'
    | 'ACTIVE';
  email: string;
  mobile?: string | null;
  contactName?: string | null;
  emailVerified?: boolean;
  organization: CygnusApplicationOrg | null;
  representative: CygnusApplicationRep | null;
  documents: CygnusApplicationDocument[];
  acceptances: Array<{ slug: string; version: number; acceptedAt?: string }>;
  missing: string[];
  needsInfo?: { items: string[]; note?: string | null } | null;
  rejectReason?: string | null;
  rejectNote?: string | null;
  submittedAt?: string | null;
}

export interface CygnusPolicyDoc {
  slug: string;
  title: string;
  version: number;
  status: 'DRAFT' | 'APPROVED';
  required?: boolean;
  sha256: string;
  createdAt?: string;
  body?: string;
  acceptances?: number;
}

export interface CygnusAdminApplicationSummary {
  id: string;
  number: string;
  orgName?: string | null;
  contactName?: string | null;
  email?: string;
  submittedAt?: string | null;
  createdAt?: string;
  status: CygnusApplication['status'];
}

export interface CygnusAdminParticipant {
  did: string;
  bpn: string;
  name: string;
  role: 'PROV' | 'CONS';
  contactEmail?: string | null;
  active: boolean;
  createdAt?: string;
}

export interface CygnusPurpose {
  id: string;
  name: string;
  description?: string;
  category?: string;
  requiresExplicitConsent?: boolean;
  active?: boolean;
}

export interface CygnusAuditEvent {
  id: number;
  previousHash: string;
  eventHash: string;
  eventType: string;
  participantDid?: string;
  payload: string;
  createdAt: string;
}

export interface CygnusCapacity {
  max: number;
  live: number;
  waiting: Array<{ number: string; orgName?: string | null; since: string }>;
  failed: number;
}

export interface CygnusDataset {
  id: string;
  name: string;
  description?: string;
  category?: string;
  deliveryType?: 'STATIC' | 'REALTIME' | null;
  status: 'draft' | 'active' | 'unpublished' | 'error';
  dataSource?: {
    connectorType?: 'HTTP' | 'DB_QUERY';
    baseUrl?: string;
  };
  metadata?: Record<string, unknown>;
  createdAt?: string;
}

export interface CygnusOffer {
  id: string;
  datasetId?: string;
  providerDid?: string;
  modelType: 'PAY_PER_USE' | 'SUBSCRIPTION' | 'HYBRID' | 'ONE_TIME';
  unit?: string | null;
  unitPrice?: number | null;
  billingPeriodDays?: number | null;
  recurringPrice?: number | null;
  basePrice?: number | null;
  includedUsage?: number | null;
  overagePrice?: number | null;
  currency: string;
  status: 'ENABLED' | 'DISABLED';
}

export interface CygnusCatalogDataset {
  id: string;
  name: string;
  description?: string;
  category?: string;
  providerDid: string;
  providerBpn?: string;
  deliveryType?: 'STATIC' | 'REALTIME' | null;
  classification?: string;
  price?: number;
  currency?: string;
  billingPeriodDays?: number;
  maxCallsPerPeriod?: number | null;
  allowedPurposes?: string | string[];
  termsVersion?: number;
  terms?: string | { liability?: string; governingLaw?: string; deliveryNotes?: string } | null;
  sla?: string | { uptimePercent?: number; responseTimeMs?: number; penaltyNotes?: string } | null;
  offers?: CygnusOffer[];
}

export async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function canonicalContractObject(catalog: CygnusCatalogDataset): Record<string, unknown> {
  const allowed =
    typeof catalog.allowedPurposes === 'string'
      ? (JSON.parse(catalog.allowedPurposes) as unknown)
      : catalog.allowedPurposes;
  const terms =
    typeof catalog.terms === 'string'
      ? (JSON.parse(catalog.terms) as {
          liability?: string;
          governingLaw?: string;
          deliveryNotes?: string;
        })
      : catalog.terms;
  const sla =
    typeof catalog.sla === 'string'
      ? (JSON.parse(catalog.sla) as {
          uptimePercent?: number;
          responseTimeMs?: number;
          penaltyNotes?: string;
        })
      : catalog.sla;
  return {
    termsVersion: catalog.termsVersion ?? 1,
    price: (catalog.price ?? 0).toFixed(2),
    currency: catalog.currency ?? 'INR',
    billingPeriodDays: catalog.billingPeriodDays ?? 30,
    maxCallsPerPeriod: catalog.maxCallsPerPeriod ?? null,
    allowedPurposes: Array.isArray(allowed) ? allowed : [],
    classification: catalog.classification ?? 'PUBLIC',
    terms: {
      liability: terms?.liability ?? '',
      governingLaw: terms?.governingLaw ?? '',
      deliveryNotes: terms?.deliveryNotes ?? '',
    },
    sla: {
      uptimePercent: sla?.uptimePercent ?? 0,
      responseTimeMs: sla?.responseTimeMs ?? 0,
      penaltyNotes: sla?.penaltyNotes ?? '',
    },
  };
}

export interface CygnusSubscription {
  id: string;
  datasetId: string;
  datasetName?: string;
  providerDid: string;
  consumerDid?: string;
  status:
    | 'REQUESTED'
    | 'APPROVED'
    | 'NEGOTIATING'
    | 'ACTIVE'
    | 'REVOKED'
    | 'REJECTED'
    | 'TERMINATED';
  purpose?: string;
  offerId?: string | null;
  offerModel?: string | null;
  apiKey?: string;
  agreedAt?: string;
  createdAt?: string;
}

export interface CygnusTransfer {
  id: string;
  transferProcessId?: string;
  transferType: 'HttpData-PUSH' | 'HttpData-PULL';
  status: 'INITIATED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  errorMessage?: string;
  assetId?: string;
  createdAt?: string;
  completedAt?: string;
}

export interface CygnusConsentRecord {
  id: string;
  consumerDid: string;
  datasetId: string;
  purposeId?: string;
  status: 'REQUESTED' | 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  requestedAt?: string;
  expiresAt?: string;
}

export interface CygnusOrder {
  id: string;
  consumerDid: string;
  datasetId: string;
  amount?: number;
  currency?: string;
  status: 'PENDING' | 'PAID' | 'FAILED';
  createdAt?: string;
}

export interface CygnusClusterHealth {
  generatedAt: string;
  overall: 'ok' | 'degraded' | 'down';
  monitoring: 'ok' | 'unavailable';
  liveChecks: Array<{ name: string; status: string; detail: string }>;
  components: Array<{ group: string; name: string; status: string; detail: string }>;
  nodes: Array<{ name: string; zone: string; ready: boolean; cpuRequestedPercent: number | null }>;
  findings: Array<{ severity: 'critical' | 'warn'; text: string }>;
}

export interface CygnusTenant {
  id: string;
  participantDid: string;
  mode: string;
  namespace: string;
  status: string;
  lastError?: string | null;
  slug?: string | null;
  uiUrl?: string | null;
}

export interface CygnusAdminStats {
  participants: number;
  purposes: number;
  orders: number;
  datasets: number;
  applicationsWaiting?: number;
}

export interface CygnusDashboardStats {
  totalDatasets: number;
  activeSubscriptions: number;
  totalTransfers: number;
  transfersThisMonth: number;
  revenue?: number;
  pendingSubscriptions: number;
}

export interface CygnusOrgUser {
  id: string;
  email: string;
  name: string;
  designation: string;
  role: string;
  status: string;
  signatoryVerified: boolean;
}

export interface CygnusContractExecution {
  subscriptionId: string;
  termsVersion: number;
  status: 'DRAFT' | 'PENDING_PROVIDER' | 'EXECUTED' | 'VOID';
  docHash: string;
  executedAt?: string;
}

export interface CygnusComputeJob {
  id: string;
  datasetId: string;
  consumerDid: string;
  providerDid: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  wasmModule?: string;
  result?: string;
  errorMessage?: string;
  createdAt?: string;
}

export interface CygnusFederatedJob {
  id: string;
  datasetId: string;
  modelType: string;
  coordinatorDid: string;
  weightDimension: number;
  totalRounds: number;
  currentRound: number;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
}

export interface CygnusMandate {
  mandateRef: string;
  status: string;
  amount: number;
  billingPeriodDays: number;
  activeUntil?: string | null;
}

export interface CygnusBreach {
  id: string;
  title?: string;
  severity?: string;
  status: string;
  description?: string;
  createdAt?: string;
}

export interface CygnusInvoice {
  id: string;
  orderId?: string;
  participantDid: string;
  datasetId?: string;
  amount?: number;
  currency?: string;
  taxAmount?: number;
  total?: number;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  modelType?: string | null;
  createdAt?: string;
}

export function loadUserSession(): PersistedUserSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEYS.user);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedUserSession;
    if (!parsed?.token || (parsed.expiresAt && parsed.expiresAt <= Date.now())) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveUserSession(session: PersistedUserSession | null): void {
  if (typeof window === 'undefined') return;
  if (!session) {
    window.localStorage.removeItem(SESSION_KEYS.user);
    return;
  }
  window.localStorage.setItem(SESSION_KEYS.user, JSON.stringify(session));
}

export function loadAdminSession(): PersistedAdminSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEYS.admin);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedAdminSession;
    if (!parsed?.token) return null;
    const maxAgeMs = (parsed.expiresIn || 3600) * 1000;
    if (parsed.issuedAt && Date.now() - parsed.issuedAt >= maxAgeMs) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveAdminSession(session: PersistedAdminSession | null): void {
  if (typeof window === 'undefined') return;
  if (!session) {
    window.localStorage.removeItem(SESSION_KEYS.admin);
    return;
  }
  window.localStorage.setItem(SESSION_KEYS.admin, JSON.stringify(session));
}

export function loadApplicationToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return (
      window.sessionStorage.getItem(SESSION_KEYS.applicationToken) ||
      window.localStorage.getItem(SESSION_KEYS.applicationToken)
    );
  } catch {
    return null;
  }
}

export function saveApplicationToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (!token) {
      window.sessionStorage.removeItem(SESSION_KEYS.applicationToken);
      window.localStorage.removeItem(SESSION_KEYS.applicationToken);
      return;
    }
    window.sessionStorage.setItem(SESSION_KEYS.applicationToken, token);
    window.localStorage.setItem(SESSION_KEYS.applicationToken, token);
  } catch {
    // Ignore storage restriction errors
  }
}

export function isAgentHost(): boolean {
  if (import.meta.env.VITE_APP_MODE === 'agent') return true;
  if (typeof window === 'undefined' || !PLATFORM_BASE) return false;
  try {
    return new URL(PLATFORM_BASE, window.location.origin).origin !== window.location.origin;
  } catch {
    return false;
  }
}

export function isPlatformConfigured(): boolean {
  return Boolean(PLATFORM_BASE || AGENT_BASE || import.meta.env.MODE !== 'test');
}

export function isAgentConfigured(): boolean {
  return Boolean(AGENT_BASE || (import.meta.env.MODE !== 'test' && isAgentHost()));
}

async function parseError(res: Response): Promise<ApiError> {
  let message = res.statusText || `HTTP ${res.status}`;
  let body: unknown;
  try {
    const raw = await res.json();
    body = raw;
    if (raw && typeof raw === 'object') {
      const obj = raw as { message?: string; error?: string; detail?: string; field?: string };
      message = obj.message || obj.detail || obj.error || message;
    }
  } catch {
    // keep statusText
  }
  return new ApiError(res.status, String(message), body);
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  authMode?: 'none' | 'user' | 'admin' | 'application' | 'apiKey';
  token?: string | null;
  blob?: boolean;
}

async function refreshCurrentUserToken(): Promise<string | null> {
  const session = loadUserSession();
  if (!session?.token || !PLATFORM_BASE) return null;
  try {
    const res = await fetch(`${PLATFORM_BASE}/api/v1/auth/user/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Cygnus-Token': session.token,
      },
    });
    if (!res.ok) return null;
    const payload = (await res.json()) as Omit<PersistedUserSession, 'expiresAt'>;
    const next: PersistedUserSession = {
      ...payload,
      expiresAt: Date.now() + payload.expiresIn * 1000,
    };
    saveUserSession(next);
    return next.token;
  } catch {
    return null;
  }
}

async function cygnusRequest<T>(
  baseUrl: string,
  path: string,
  options: RequestOptions = {},
  allowRefresh = true,
): Promise<T> {
  const headers: Record<string, string> = {};
  const isForm = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (options.body !== undefined && !isForm) {
    headers['Content-Type'] = 'application/json';
  }

  const mode = options.authMode ?? 'none';
  if (mode === 'user') {
    const tok = options.token ?? loadUserSession()?.token;
    if (tok) headers['X-Cygnus-Token'] = tok;
  } else if (mode === 'admin') {
    const tok = options.token ?? loadAdminSession()?.token;
    if (tok) headers['X-Admin-Token'] = tok;
  } else if (mode === 'application') {
    const tok = options.token ?? loadApplicationToken();
    if (tok) headers['X-Application-Token'] = tok;
  } else if (mode === 'apiKey' && options.token) {
    headers['X-API-Key'] = options.token;
  }

  const url = `${baseUrl}/api/v1${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      body:
        options.body === undefined
          ? undefined
          : isForm
            ? (options.body as FormData)
            : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError(0, 'Unable to reach IMDX backend server.');
  }

  if (mode === 'user' && allowRefresh && res.status === 401) {
    const nextTok = await refreshCurrentUserToken();
    if (nextTok) {
      return cygnusRequest<T>(baseUrl, path, { ...options, token: nextTok }, false);
    }
  }

  if (mode === 'user' && allowRefresh && res.status === 403) {
    const clone = (await res.clone().json().catch(() => null)) as { error?: string } | null;
    if (clone?.error === 'signatory_not_verified') {
      const nextTok = await refreshCurrentUserToken();
      if (nextTok) {
        return cygnusRequest<T>(baseUrl, path, { ...options, token: nextTok }, false);
      }
    }
  }

  if (!res.ok) {
    throw await parseError(res);
  }
  if (res.status === 204) return undefined as T;
  if (options.blob) return (await res.blob()) as T;
  return (await res.json()) as T;
}

export const cygnusApi = {
  // ── Auth (Platform) ───────────────────────────────────────────
  loginUnified(email: string, password: string): Promise<CygnusUnifiedLoginResponse> {
    return cygnusRequest<CygnusUnifiedLoginResponse>(PLATFORM_BASE, '/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  },
  loginUser(email: string, password: string): Promise<Omit<PersistedUserSession, 'expiresAt'>> {
    return cygnusRequest(PLATFORM_BASE, '/auth/user/login', {
      method: 'POST',
      body: { email, password },
    });
  },
  ssoExchange(code: string): Promise<Omit<PersistedUserSession, 'expiresAt'>> {
    return cygnusRequest(PLATFORM_BASE, '/auth/sso/exchange', {
      method: 'POST',
      body: { code },
    });
  },
  forgotPassword(email: string): Promise<void> {
    return cygnusRequest(PLATFORM_BASE, '/auth/user/forgot-password', {
      method: 'POST',
      body: { email },
    });
  },
  loginAdmin(email: string, password: string): Promise<PersistedAdminSession> {
    return cygnusRequest(PLATFORM_BASE, '/auth/admin/login', {
      method: 'POST',
      body: { email, password },
    });
  },
  acceptInviteSetPassword(token: string, password: string): Promise<void> {
    return cygnusRequest(PLATFORM_BASE, '/auth/user/invite-accept', {
      method: 'POST',
      body: { token, password },
    });
  },
  createSsoCode(): Promise<{ code: string }> {
    return cygnusRequest(PLATFORM_BASE, '/org/sso/code', {
      method: 'POST',
      authMode: 'user',
    });
  },
  getOrgUserMe(): Promise<CygnusOrgUser> {
    return cygnusRequest(PLATFORM_BASE, '/org/users/me', { authMode: 'user' });
  },
  listOrgUsers(): Promise<CygnusOrgUser[]> {
    return cygnusRequest(PLATFORM_BASE, '/org/users', { authMode: 'user' });
  },
  inviteOrgUser(input: {
    name: string;
    email: string;
    designation: string;
  }): Promise<{ status: string; inviteUrl: string }> {
    return cygnusRequest(PLATFORM_BASE, '/org/users', {
      method: 'POST',
      body: input,
      authMode: 'user',
    });
  },
  approveOrgSignatory(userId: string): Promise<{ status: string }> {
    return cygnusRequest(PLATFORM_BASE, `/org/users/${encodeURIComponent(userId)}/signatory-approve`, {
      method: 'POST',
      authMode: 'user',
    });
  },
  disableOrgUser(userId: string): Promise<{ status: string }> {
    return cygnusRequest(PLATFORM_BASE, `/org/users/${encodeURIComponent(userId)}/disable`, {
      method: 'POST',
      authMode: 'user',
    });
  },
  resetOrgApiKey(): Promise<{ apiKey: string }> {
    return cygnusRequest(PLATFORM_BASE, '/org/api-key/reset', {
      method: 'POST',
      authMode: 'user',
    });
  },
  logoutUser(token: string): Promise<void> {
    return cygnusRequest(PLATFORM_BASE, '/auth/user/logout', {
      method: 'POST',
      body: { token },
    });
  },
  logoutAdmin(token: string): Promise<void> {
    return cygnusRequest(PLATFORM_BASE, '/auth/admin/logout', {
      method: 'POST',
      body: { token },
    });
  },

  // ── Public Onboarding (Platform, X-Application-Token) ─────────
  startApplication(input: { name: string; email: string; mobile: string; captchaToken?: string }) {
    return cygnusRequest<unknown>(PLATFORM_BASE, '/public/applications', {
      method: 'POST',
      body: { ...input, captchaToken: input.captchaToken ?? 'dev' },
    });
  },
  trackApplication(input: { number: string; email: string; captchaToken?: string }) {
    return cygnusRequest<unknown>(PLATFORM_BASE, '/public/applications/track', {
      method: 'POST',
      body: { ...input, captchaToken: input.captchaToken ?? 'dev' },
    });
  },
  getMyApplication(token?: string): Promise<CygnusApplication> {
    return cygnusRequest<CygnusApplication>(PLATFORM_BASE, '/public/applications/me', {
      authMode: 'application',
      token,
    });
  },
  saveOrganization(org: CygnusApplicationOrg, token?: string): Promise<unknown> {
    return cygnusRequest(PLATFORM_BASE, '/public/applications/me/organization', {
      method: 'PUT',
      body: org,
      authMode: 'application',
      token,
    });
  },
  saveRepresentative(rep: CygnusApplicationRep, token?: string): Promise<unknown> {
    return cygnusRequest(PLATFORM_BASE, '/public/applications/me/representative', {
      method: 'PUT',
      body: rep,
      authMode: 'application',
      token,
    });
  },
  uploadDocument(
    kind: CygnusDocumentKind,
    file: File,
    token?: string,
  ): Promise<CygnusApplicationDocument> {
    const form = new FormData();
    form.append('kind', kind);
    form.append('file', file);
    return cygnusRequest<CygnusApplicationDocument>(
      PLATFORM_BASE,
      '/public/applications/me/documents',
      {
        method: 'POST',
        body: form,
        authMode: 'application',
        token,
      },
    );
  },
  removeDocument(docId: string, token?: string): Promise<void> {
    return cygnusRequest(
      PLATFORM_BASE,
      `/public/applications/me/documents/${encodeURIComponent(docId)}`,
      {
        method: 'DELETE',
        authMode: 'application',
        token,
      },
    );
  },
  acceptPolicy(slug: string, version: number, token?: string): Promise<unknown> {
    return cygnusRequest(PLATFORM_BASE, '/public/applications/me/acceptances', {
      method: 'POST',
      body: { slug, version },
      authMode: 'application',
      token,
    });
  },
  submitApplication(token?: string): Promise<unknown> {
    return cygnusRequest(PLATFORM_BASE, '/public/applications/me/submit', {
      method: 'POST',
      authMode: 'application',
      token,
    });
  },
  resubmitApplication(token?: string): Promise<unknown> {
    return cygnusRequest(PLATFORM_BASE, '/public/applications/me/resubmit', {
      method: 'POST',
      authMode: 'application',
      token,
    });
  },
  listPublicPolicies(): Promise<CygnusPolicyDoc[]> {
    return cygnusRequest<CygnusPolicyDoc[]>(PLATFORM_BASE, '/public/policies');
  },
  getPublicPolicy(slug: string): Promise<CygnusPolicyDoc> {
    return cygnusRequest<CygnusPolicyDoc>(PLATFORM_BASE, `/public/policies/${encodeURIComponent(slug)}`);
  },

  // ── Admin Console (Platform, X-Admin-Token) ───────────────────
  listAdminApplications(status?: string): Promise<CygnusAdminApplicationSummary[]> {
    const suffix = status ? `?status=${encodeURIComponent(status)}` : '';
    return cygnusRequest(PLATFORM_BASE, `/admin/applications${suffix}`, { authMode: 'admin' });
  },
  getAdminApplication(id: string): Promise<CygnusApplication & { id: string }> {
    return cygnusRequest(PLATFORM_BASE, `/admin/applications/${encodeURIComponent(id)}`, {
      authMode: 'admin',
    });
  },
  approveAdminApplication(id: string): Promise<unknown> {
    return cygnusRequest(PLATFORM_BASE, `/admin/applications/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
      authMode: 'admin',
    });
  },
  requestAdminApplicationInfo(id: string, items: string[], note: string): Promise<unknown> {
    return cygnusRequest(
      PLATFORM_BASE,
      `/admin/applications/${encodeURIComponent(id)}/request-info`,
      {
        method: 'POST',
        body: { items, note },
        authMode: 'admin',
      },
    );
  },
  rejectAdminApplication(id: string, reason: string, note: string): Promise<unknown> {
    return cygnusRequest(PLATFORM_BASE, `/admin/applications/${encodeURIComponent(id)}/reject`, {
      method: 'POST',
      body: { reason, note },
      authMode: 'admin',
    });
  },
  listParticipants(): Promise<CygnusAdminParticipant[]> {
    return cygnusRequest(PLATFORM_BASE, '/participants', { authMode: 'admin' });
  },
  deactivateParticipant(did: string): Promise<{ status: string; tenantState: string }> {
    return cygnusRequest(PLATFORM_BASE, `/participants/${encodeURIComponent(did)}`, {
      method: 'DELETE',
      authMode: 'admin',
    });
  },
  reactivateParticipant(did: string): Promise<CygnusAdminParticipant> {
    return cygnusRequest(PLATFORM_BASE, `/participants/${encodeURIComponent(did)}/reactivate`, {
      method: 'POST',
      authMode: 'admin',
    });
  },
  listAdminPolicies(): Promise<CygnusPolicyDoc[]> {
    return cygnusRequest(PLATFORM_BASE, '/admin/policies', { authMode: 'admin' });
  },
  listAdminPurposes(active = true): Promise<CygnusPurpose[]> {
    return cygnusRequest(PLATFORM_BASE, `/purposes?active=${active}`, { authMode: 'admin' });
  },
  createPurpose(input: { name: string; description?: string; category?: string }): Promise<CygnusPurpose> {
    return cygnusRequest(PLATFORM_BASE, '/purposes', {
      method: 'POST',
      body: input,
      authMode: 'admin',
    });
  },
  deactivatePurpose(id: string): Promise<void> {
    return cygnusRequest(PLATFORM_BASE, `/purposes/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      authMode: 'admin',
    });
  },
  listAuditEvents(limit = 50): Promise<CygnusAuditEvent[]> {
    return cygnusRequest(PLATFORM_BASE, `/audit/events?limit=${limit}&offset=0`, {
      authMode: 'admin',
    });
  },
  verifyLedgerEvent(eventHash: string): Promise<{
    valid: boolean;
    eventId: number;
    status: string;
    eventsChecked: number;
    brokenAtEventId?: number | null;
  }> {
    return cygnusRequest(PLATFORM_BASE, `/ledger/verify?eventHash=${encodeURIComponent(eventHash)}`, {
      authMode: 'admin',
    });
  },
  getAdminStats(): Promise<CygnusAdminStats> {
    return cygnusRequest(PLATFORM_BASE, '/admin/stats', { authMode: 'admin' });
  },
  getClusterHealth(): Promise<CygnusClusterHealth> {
    return cygnusRequest(PLATFORM_BASE, '/admin/cluster-health', { authMode: 'admin' });
  },
  getCapacity(): Promise<CygnusCapacity> {
    return cygnusRequest(PLATFORM_BASE, '/admin/capacity', { authMode: 'admin' });
  },
  setCapacity(max: number): Promise<void> {
    return cygnusRequest(PLATFORM_BASE, '/admin/capacity', {
      method: 'PUT',
      body: { max },
      authMode: 'admin',
    });
  },
  listTenants(): Promise<CygnusTenant[]> {
    return cygnusRequest(PLATFORM_BASE, '/admin/tenants', { authMode: 'admin' });
  },
  createTenant(participantDid: string): Promise<{ id: string; status: string; namespace: string }> {
    return cygnusRequest(PLATFORM_BASE, '/admin/tenants', {
      method: 'POST',
      body: { participantDid },
      authMode: 'admin',
    });
  },
  retryTenant(id: string): Promise<void> {
    return cygnusRequest(PLATFORM_BASE, `/admin/tenants/${encodeURIComponent(id)}/retry`, {
      method: 'POST',
      authMode: 'admin',
    });
  },
  rotateTenantVaultToken(id: string): Promise<unknown> {
    return cygnusRequest(
      PLATFORM_BASE,
      `/admin/tenants/${encodeURIComponent(id)}/rotate-vault-token`,
      { method: 'POST', authMode: 'admin' },
    );
  },
  deleteTenant(id: string, confirm: string): Promise<{ status: string }> {
    return cygnusRequest(
      PLATFORM_BASE,
      `/admin/tenants/${encodeURIComponent(id)}?confirm=${encodeURIComponent(confirm)}`,
      { method: 'DELETE', authMode: 'admin' },
    );
  },
  getAdminDocumentUrl(appId: string, docId: string): Promise<{ url: string }> {
    return cygnusRequest(
      PLATFORM_BASE,
      `/admin/applications/${encodeURIComponent(appId)}/documents/${encodeURIComponent(docId)}/url`,
      { authMode: 'admin' },
    );
  },
  createAdminPolicyVersion(
    slug: string,
    input: { title: string; body: string; status: 'DRAFT' | 'APPROVED' },
  ): Promise<unknown> {
    return cygnusRequest(PLATFORM_BASE, '/admin/policies', {
      method: 'POST',
      body: { slug, ...input },
      authMode: 'admin',
    });
  },
  updatePurpose(
    id: string,
    input: { name?: string; description?: string; category?: string; active?: boolean },
  ): Promise<CygnusPurpose> {
    return cygnusRequest(PLATFORM_BASE, `/purposes/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: input,
      authMode: 'admin',
    });
  },
  inviteParticipantOrgAdmin(did: string, email: string): Promise<{ status: string; inviteUrl?: string }> {
    return cygnusRequest(PLATFORM_BASE, `/admin/participants/${encodeURIComponent(did)}/org-admin`, {
      method: 'POST',
      body: { email },
      authMode: 'admin',
    });
  },
  updateConnectorTrust(body: Record<string, unknown>): Promise<unknown> {
    return cygnusRequest(PLATFORM_BASE, '/admin/connector-trust', {
      method: 'POST',
      body,
      authMode: 'admin',
    });
  },
  listBreaches(): Promise<CygnusBreach[]> {
    return cygnusRequest(PLATFORM_BASE, '/admin/breaches', { authMode: 'admin' });
  },
  createBreach(input: { title: string; severity: string; description: string }): Promise<CygnusBreach> {
    return cygnusRequest(PLATFORM_BASE, '/admin/breaches', {
      method: 'POST',
      body: input,
      authMode: 'admin',
    });
  },
  notifyBreach(id: string): Promise<unknown> {
    return cygnusRequest(PLATFORM_BASE, `/admin/breaches/${encodeURIComponent(id)}/notify`, {
      method: 'POST',
      authMode: 'admin',
    });
  },
  resolveBreach(id: string): Promise<unknown> {
    return cygnusRequest(PLATFORM_BASE, `/admin/breaches/${encodeURIComponent(id)}/resolve`, {
      method: 'POST',
      authMode: 'admin',
    });
  },

  // ── Compute & Federated Learning (Platform, X-API-Key) ────────
  listComputeJobs(apiKey: string): Promise<CygnusComputeJob[]> {
    return cygnusRequest(PLATFORM_BASE, '/compute/jobs', { authMode: 'apiKey', token: apiKey });
  },
  createComputeJob(
    apiKey: string,
    input: { datasetId: string; consumerDid: string; providerDid: string; wasmModule: string },
  ): Promise<CygnusComputeJob> {
    return cygnusRequest(PLATFORM_BASE, '/compute/jobs', {
      method: 'POST',
      body: input,
      authMode: 'apiKey',
      token: apiKey,
    });
  },
  getComputeJob(apiKey: string, id: string): Promise<CygnusComputeJob> {
    return cygnusRequest(PLATFORM_BASE, `/compute/jobs/${encodeURIComponent(id)}`, {
      authMode: 'apiKey',
      token: apiKey,
    });
  },
  listFederatedJobs(apiKey: string): Promise<CygnusFederatedJob[]> {
    return cygnusRequest(PLATFORM_BASE, '/compute/federated-jobs', {
      authMode: 'apiKey',
      token: apiKey,
    });
  },
  createFederatedJob(
    apiKey: string,
    input: {
      datasetId: string;
      modelType?: string;
      weightDimension: number;
      totalRounds: number;
      participantDids: string[];
      wasmModule: string;
    },
  ): Promise<CygnusFederatedJob> {
    return cygnusRequest(PLATFORM_BASE, '/compute/federated-jobs', {
      method: 'POST',
      body: input,
      authMode: 'apiKey',
      token: apiKey,
    });
  },
  runFederatedRound(apiKey: string, id: string): Promise<unknown> {
    return cygnusRequest(
      PLATFORM_BASE,
      `/compute/federated-jobs/${encodeURIComponent(id)}/rounds`,
      {
        method: 'POST',
        authMode: 'apiKey',
        token: apiKey,
      },
    );
  },

  // ── Participant Agent Workspace (AGENT_BASE, X-Cygnus-Token) ──
  getDashboardStats(): Promise<CygnusDashboardStats> {
    return cygnusRequest(AGENT_BASE, '/dashboard/stats', { authMode: 'user' });
  },
  listDatasets(): Promise<CygnusDataset[]> {
    return cygnusRequest(AGENT_BASE, '/datasets', { authMode: 'user' });
  },
  getDataset(id: string): Promise<CygnusDataset> {
    return cygnusRequest(AGENT_BASE, `/datasets/${encodeURIComponent(id)}`, { authMode: 'user' });
  },
  updateDataset(id: string, body: Record<string, unknown>): Promise<CygnusDataset> {
    return cygnusRequest(AGENT_BASE, `/datasets/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body,
      authMode: 'user',
    });
  },
  getDatasetHealth(id: string): Promise<{ ok: boolean; message: string; status?: number; elapsedMs?: number }> {
    return cygnusRequest(AGENT_BASE, `/datasets/${encodeURIComponent(id)}/health`, {
      authMode: 'user',
    });
  },
  listDatasetOffers(datasetId: string): Promise<CygnusOffer[]> {
    return cygnusRequest(AGENT_BASE, `/datasets/${encodeURIComponent(datasetId)}/offers`, {
      authMode: 'user',
    });
  },
  createDatasetOffer(datasetId: string, body: Record<string, unknown>): Promise<CygnusOffer> {
    return cygnusRequest(AGENT_BASE, `/datasets/${encodeURIComponent(datasetId)}/offers`, {
      method: 'POST',
      body,
      authMode: 'user',
    });
  },
  disableDatasetOffer(datasetId: string, offerId: string): Promise<void> {
    return cygnusRequest(
      AGENT_BASE,
      `/datasets/${encodeURIComponent(datasetId)}/offers/${encodeURIComponent(offerId)}`,
      { method: 'DELETE', authMode: 'user' },
    );
  },
  createDataset(input: {
    name: string;
    description?: string;
    category?: string;
    deliveryType?: 'STATIC' | 'REALTIME';
    status?: 'draft' | 'active';
    dataSource: { connectorType: 'HTTP'; baseUrl: string };
    metadata?: Record<string, unknown>;
  }): Promise<CygnusDataset> {
    return cygnusRequest(AGENT_BASE, '/datasets', {
      method: 'POST',
      body: input,
      authMode: 'user',
    });
  },
  testDataSourceConnection(baseUrl: string): Promise<{ ok: boolean; message: string; status?: number }> {
    return cygnusRequest(AGENT_BASE, '/datasets/test-connection', {
      method: 'POST',
      body: { baseUrl },
      authMode: 'user',
    });
  },
  publishDataset(id: string): Promise<CygnusDataset> {
    return cygnusRequest(AGENT_BASE, `/datasets/${encodeURIComponent(id)}/publish`, {
      method: 'POST',
      authMode: 'user',
    });
  },
  unpublishDataset(id: string): Promise<CygnusDataset> {
    return cygnusRequest(AGENT_BASE, `/datasets/${encodeURIComponent(id)}/unpublish`, {
      method: 'POST',
      authMode: 'user',
    });
  },
  deleteDataset(id: string): Promise<void> {
    return cygnusRequest(AGENT_BASE, `/datasets/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      authMode: 'user',
    });
  },
  searchCatalog(q = ''): Promise<CygnusCatalogDataset[]> {
    const suffix = q ? `?q=${encodeURIComponent(q)}&limit=50` : '?limit=50';
    return cygnusRequest(AGENT_BASE, `/catalog/search${suffix}`, { authMode: 'user' });
  },
  getCatalogDataset(id: string): Promise<CygnusCatalogDataset> {
    return cygnusRequest(AGENT_BASE, `/catalog/datasets/${encodeURIComponent(id)}`, {
      authMode: 'user',
    });
  },
  listAgentPurposes(): Promise<CygnusPurpose[]> {
    return cygnusRequest(AGENT_BASE, '/purposes', { authMode: 'user' });
  },
  listConsentRequests(consumerDid: string): Promise<CygnusConsentRecord[]> {
    return cygnusRequest(
      AGENT_BASE,
      `/consent/requests?consumerDid=${encodeURIComponent(consumerDid)}`,
      { authMode: 'user' },
    );
  },
  requestConsent(datasetId: string, purposeId: string): Promise<CygnusConsentRecord> {
    return cygnusRequest(AGENT_BASE, '/consent/requests', {
      method: 'POST',
      body: { datasetId, purposeId },
      authMode: 'user',
    });
  },
  listInboundConsents(): Promise<CygnusConsentRecord[]> {
    return cygnusRequest(AGENT_BASE, '/consent/inbound', { authMode: 'user' });
  },
  grantConsent(consentId: string): Promise<CygnusConsentRecord> {
    return cygnusRequest(AGENT_BASE, `/consent/requests/${encodeURIComponent(consentId)}/grant`, {
      method: 'POST',
      authMode: 'user',
    });
  },
  listSubscriptions(): Promise<CygnusSubscription[]> {
    return cygnusRequest(AGENT_BASE, '/subscriptions', { authMode: 'user' });
  },
  createSubscription(input: {
    datasetId: string;
    providerDid?: string;
    purpose: string;
    agreedTermsVersion: number;
    termsHash: string;
    offerId: string;
  }): Promise<{ subscription: CygnusSubscription }> {
    return cygnusRequest(AGENT_BASE, '/subscriptions', {
      method: 'POST',
      body: input,
      authMode: 'user',
    });
  },
  approveSubscription(id: string): Promise<CygnusSubscription> {
    return cygnusRequest(AGENT_BASE, `/subscriptions/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
      authMode: 'user',
    });
  },
  revokeSubscription(id: string): Promise<CygnusSubscription> {
    return cygnusRequest(AGENT_BASE, `/subscriptions/${encodeURIComponent(id)}/revoke`, {
      method: 'POST',
      authMode: 'user',
    });
  },
  rejectSubscription(id: string): Promise<CygnusSubscription> {
    return cygnusRequest(AGENT_BASE, `/subscriptions/${encodeURIComponent(id)}/reject`, {
      method: 'POST',
      authMode: 'user',
    });
  },
  sendContractOtp(subscriptionId: string): Promise<{ status: string; mode: string }> {
    return cygnusRequest(AGENT_BASE, `/contracts/${encodeURIComponent(subscriptionId)}/otp`, {
      method: 'POST',
      authMode: 'user',
    });
  },
  signContract(subscriptionId: string, otp: string): Promise<{ status: string }> {
    return cygnusRequest(AGENT_BASE, `/subscriptions/${encodeURIComponent(subscriptionId)}/sign`, {
      method: 'POST',
      body: { otp },
      authMode: 'user',
    });
  },
  countersignContract(subscriptionId: string, otp: string): Promise<{ status: string }> {
    return cygnusRequest(
      AGENT_BASE,
      `/subscriptions/${encodeURIComponent(subscriptionId)}/countersign`,
      { method: 'POST', body: { otp }, authMode: 'user' },
    );
  },
  getContractStatus(subscriptionId: string): Promise<CygnusContractExecution> {
    return cygnusRequest(AGENT_BASE, `/contracts/${encodeURIComponent(subscriptionId)}`, {
      authMode: 'user',
    });
  },
  getContractDocumentBlob(subscriptionId: string): Promise<Blob> {
    return cygnusRequest<Blob>(
      AGENT_BASE,
      `/contracts/${encodeURIComponent(subscriptionId)}/document`,
      { authMode: 'user', blob: true },
    );
  },
  listTransfers(subscriptionId?: string): Promise<CygnusTransfer[]> {
    const qs = subscriptionId ? `?subscriptionId=${encodeURIComponent(subscriptionId)}` : '';
    return cygnusRequest(AGENT_BASE, `/transfers${qs}`, { authMode: 'user' });
  },
  getTransferStatus(id: string): Promise<CygnusTransfer> {
    return cygnusRequest(AGENT_BASE, `/transfers/${encodeURIComponent(id)}`, { authMode: 'user' });
  },
  initiateTransfer(
    subscriptionId: string,
    transferType: 'HttpData-PULL' | 'HttpData-PUSH' = 'HttpData-PULL',
  ): Promise<CygnusTransfer> {
    return cygnusRequest(AGENT_BASE, '/transfers', {
      method: 'POST',
      body: { subscriptionId, transferType },
      authMode: 'user',
    });
  },
  pullTransferData(transferId: string): Promise<unknown> {
    return cygnusRequest(AGENT_BASE, `/transfers/${encodeURIComponent(transferId)}/pull`, {
      method: 'POST',
      authMode: 'user',
    });
  },
  getTransferDataBlob(transferId: string): Promise<Blob> {
    return cygnusRequest<Blob>(AGENT_BASE, `/transfers/${encodeURIComponent(transferId)}/data`, {
      authMode: 'user',
      blob: true,
    });
  },
  getPaymentConfig(): Promise<{ cashfreeEnabled: boolean; cashfreeMode: 'sandbox' | 'production' }> {
    return cygnusRequest(AGENT_BASE, '/payment/config', { authMode: 'user' });
  },
  createOrder(input: { datasetId: string; subscriptionId?: string }): Promise<CygnusOrder> {
    return cygnusRequest(AGENT_BASE, '/orders', {
      method: 'POST',
      body: input,
      authMode: 'user',
    });
  },
  listOrders(): Promise<CygnusOrder[]> {
    return cygnusRequest(AGENT_BASE, '/orders', { authMode: 'user' });
  },
  listPendingOrders(): Promise<CygnusOrder[]> {
    return cygnusRequest(AGENT_BASE, '/orders/pending', { authMode: 'user' });
  },
  payOrder(orderId: string): Promise<unknown> {
    return cygnusRequest(AGENT_BASE, `/orders/${encodeURIComponent(orderId)}/pay`, {
      method: 'POST',
      authMode: 'user',
    });
  },
  createCashfreeOrder(orderId: string): Promise<{
    paymentSessionId: string;
    amount: number;
    currency: string;
    mode: 'sandbox' | 'production';
  }> {
    return cygnusRequest(AGENT_BASE, `/orders/${encodeURIComponent(orderId)}/cashfree-order`, {
      method: 'POST',
      authMode: 'user',
    });
  },
  confirmCashfreePayment(orderId: string): Promise<unknown> {
    return cygnusRequest(AGENT_BASE, `/orders/${encodeURIComponent(orderId)}/cashfree-confirm`, {
      method: 'POST',
      authMode: 'user',
    });
  },
  createMandate(
    datasetId: string,
    amount: number,
    billingPeriodDays: number,
  ): Promise<CygnusMandate> {
    return cygnusRequest(AGENT_BASE, '/mandates', {
      method: 'POST',
      body: { datasetId, amount, billingPeriodDays },
      authMode: 'user',
    });
  },
  activateMandate(mandateRef: string): Promise<CygnusMandate> {
    return cygnusRequest(AGENT_BASE, `/mandates/${encodeURIComponent(mandateRef)}/activate`, {
      method: 'POST',
      authMode: 'user',
    });
  },
  createCashfreeSubscription(mandateRef: string, returnUrl: string): Promise<{
    mandateRef: string;
    subscriptionSessionId: string;
    amount: number;
    mode: 'sandbox' | 'production';
  }> {
    return cygnusRequest(
      AGENT_BASE,
      `/mandates/${encodeURIComponent(mandateRef)}/cashfree-subscription`,
      { method: 'POST', body: { returnUrl }, authMode: 'user' },
    );
  },
  confirmCashfreeSubscription(mandateRef: string): Promise<{
    mandateRef: string;
    status: string;
    cashfreeStatus: string;
    activeUntil?: string | null;
  }> {
    return cygnusRequest(
      AGENT_BASE,
      `/mandates/${encodeURIComponent(mandateRef)}/cashfree-confirm`,
      { method: 'POST', authMode: 'user' },
    );
  },
  getActiveMandate(datasetId: string): Promise<{ active: boolean; mandate?: CygnusMandate | null }> {
    return cygnusRequest(
      AGENT_BASE,
      `/mandates/active?datasetId=${encodeURIComponent(datasetId)}`,
      { authMode: 'user' },
    );
  },
  listInvoices(participantDid: string): Promise<CygnusInvoice[]> {
    return cygnusRequest(AGENT_BASE, `/invoices/${encodeURIComponent(participantDid)}`, {
      authMode: 'user',
    });
  },

  // ── Complete Remaining Non-Internal Platform & Agent Routes ─
  getParticipantMe(): Promise<CygnusAdminParticipant> {
    return cygnusRequest(PLATFORM_BASE, '/participants/me', { authMode: 'user' });
  },
  getParticipant(did: string): Promise<CygnusAdminParticipant> {
    return cygnusRequest(PLATFORM_BASE, `/participants/${encodeURIComponent(did)}`, {
      authMode: 'admin',
    });
  },
  updateParticipant(did: string, body: Record<string, unknown>): Promise<CygnusAdminParticipant> {
    return cygnusRequest(PLATFORM_BASE, `/participants/${encodeURIComponent(did)}`, {
      method: 'PATCH',
      body,
      authMode: 'admin',
    });
  },
  getParticipantBpnByRole(role: 'PROV' | 'CONS'): Promise<{ did: string; bpn: string }> {
    return cygnusRequest(PLATFORM_BASE, `/participants/by-role/${encodeURIComponent(role)}/bpn`, {
      authMode: 'admin',
    });
  },
  onboardInit(body: { name: string; role: 'PROV' | 'CONS'; contactEmail?: string }): Promise<unknown> {
    return cygnusRequest(PLATFORM_BASE, '/onboarding/init', {
      method: 'POST',
      body,
      authMode: 'admin',
    });
  },
  onboardComplete(body: {
    participantId: string;
    mode?: 'hosted' | 'self-hosted';
    connectorDspUrl?: string;
  }): Promise<unknown> {
    return cygnusRequest(PLATFORM_BASE, '/onboarding/complete', {
      method: 'POST',
      body,
      authMode: 'admin',
    });
  },
  getDatasetReliability(datasetId: string): Promise<unknown> {
    return cygnusRequest(
      PLATFORM_BASE,
      `/catalog/${encodeURIComponent(datasetId)}/reliability`,
      { authMode: 'user' },
    );
  },
  searchPlatformCatalog(q = ''): Promise<CygnusCatalogDataset[]> {
    const suffix = q ? `?q=${encodeURIComponent(q)}&limit=50` : '?limit=50';
    return cygnusRequest(PLATFORM_BASE, `/catalog/datasets/search${suffix}`, { authMode: 'user' });
  },
  createCatalogDataset(body: Record<string, unknown>): Promise<unknown> {
    return cygnusRequest(AGENT_BASE, '/catalog', {
      method: 'POST',
      body,
      authMode: 'user',
    });
  },
  deletePlatformCatalogDataset(id: string): Promise<void> {
    return cygnusRequest(PLATFORM_BASE, `/catalog/datasets/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      authMode: 'admin',
    });
  },
  getAasSubmodel(assetId: string): Promise<unknown> {
    return cygnusRequest(PLATFORM_BASE, `/aas/${encodeURIComponent(assetId)}`, {
      authMode: 'user',
    });
  },
  getConsentStatus(
    consumerDid: string,
    datasetId: string,
    purposeId?: string,
  ): Promise<CygnusConsentRecord> {
    const q = new URLSearchParams({ consumerDid, datasetId });
    if (purposeId) q.set('purposeId', purposeId);
    return cygnusRequest(PLATFORM_BASE, `/consent/status?${q.toString()}`, { authMode: 'user' });
  },
  revokeConsent(consentId: string): Promise<CygnusConsentRecord> {
    return cygnusRequest(
      PLATFORM_BASE,
      `/consent/requests/${encodeURIComponent(consentId)}/revoke`,
      { method: 'POST', authMode: 'user' },
    );
  },
  eraseConsentRecordsByDid(did: string): Promise<void> {
    return cygnusRequest(PLATFORM_BASE, `/consent/records/${encodeURIComponent(did)}`, {
      method: 'DELETE',
      authMode: 'admin',
    });
  },
  getOrder(orderId: string): Promise<CygnusOrder> {
    return cygnusRequest(PLATFORM_BASE, `/orders/${encodeURIComponent(orderId)}`, {
      authMode: 'user',
    });
  },
  refundOrder(orderId: string): Promise<unknown> {
    return cygnusRequest(PLATFORM_BASE, `/orders/${encodeURIComponent(orderId)}/refund`, {
      method: 'POST',
      authMode: 'admin',
    });
  },
  listMandates(): Promise<CygnusMandate[]> {
    return cygnusRequest(PLATFORM_BASE, '/mandates', { authMode: 'user' });
  },
  getEntitlements(): Promise<unknown> {
    return cygnusRequest(PLATFORM_BASE, '/entitlements', { authMode: 'user' });
  },
  getOrgManagersEmails(): Promise<string[]> {
    return cygnusRequest(PLATFORM_BASE, '/org/managers-emails', { authMode: 'user' });
  },
  verifyAuditRange(fromISO: string, toISO: string): Promise<unknown> {
    return cygnusRequest(
      PLATFORM_BASE,
      `/ledger/verify?from=${encodeURIComponent(fromISO)}&to=${encodeURIComponent(toISO)}`,
      { authMode: 'admin' },
    );
  },
  getSubscription(id: string): Promise<CygnusSubscription> {
    return cygnusRequest(AGENT_BASE, `/subscriptions/${encodeURIComponent(id)}`, {
      authMode: 'user',
    });
  },
  recordContractAudit(body: Record<string, unknown>): Promise<unknown> {
    return cygnusRequest(PLATFORM_BASE, '/contracts', {
      method: 'POST',
      body,
      authMode: 'user',
    });
  },
};
