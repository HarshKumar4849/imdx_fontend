import {
  INITIAL_ADMIN_PARTICIPANTS,
  INITIAL_ADMIN_POLICIES,
  INITIAL_AUDIT_LOGS,
  INITIAL_DATA_PURPOSES,
} from '../data/adminData';
import {
  CATALOG_OFFERS,
  INITIAL_ACCESS_REQUESTS,
  INITIAL_BILLING_TRANSACTIONS,
  INITIAL_CONSENT_REQUESTS,
  INITIAL_MY_DATASETS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_TRANSFERS,
  INITIAL_WORKSPACE_PREFERENCES,
} from '../data/dashboardData';
import { INITIAL_ONBOARDING_STATE } from '../data/onboardingConstants';
import type {
  AccessRequestItem,
  AccessRequestStatus,
  AdminParticipant,
  AdminPolicyRule,
  ApplicationReviewStatus,
  AuditLogEntry,
  BillingTransaction,
  CatalogOffer,
  CatalogProtocol,
  ConsentRequestRecord,
  DataPurposeItem,
  DatasetStatus,
  ImdxAppStore,
  MyDatasetItem,
  PlanOptionId,
  SubscriptionRecord,
  TransferItem,
} from '../types/dashboard';
import type { DocumentSlotKey, OnboardingState } from '../types/onboarding';
import {
  AGENT_BASE,
  ApiError,
  canonicalContractObject,
  cygnusApi,
  isAgentConfigured,
  isPlatformConfigured,
  loadAdminSession,
  loadApplicationToken,
  loadUserSession,
  PLATFORM_BASE,
  saveAdminSession,
  saveApplicationToken,
  saveUserSession,
  sha256Hex,
  type CygnusApplication,
  type CygnusCatalogDataset,
  type CygnusConsentRecord,
  type CygnusDataset,
  type CygnusDocumentKind,
  type CygnusInvoice,
  type CygnusOrder,
  type CygnusSubscription,
  type CygnusTransfer,
} from './cygnusApi';

const STORAGE_KEY = 'imdx_portal_store_v1';

export {
  AGENT_BASE,
  ApiError,
  cygnusApi,
  isAgentConfigured,
  isPlatformConfigured,
  loadAdminSession,
  loadApplicationToken,
  loadUserSession,
  PLATFORM_BASE,
  saveAdminSession,
  saveApplicationToken,
  saveUserSession,
};

export const API_BASE_URL = AGENT_BASE || PLATFORM_BASE;

export function isBackendConfigured(): boolean {
  return isPlatformConfigured() || isAgentConfigured();
}

export function createInitialStore(): ImdxAppStore {
  return structuredClone({
    onboarding: INITIAL_ONBOARDING_STATE,
    datasets: INITIAL_MY_DATASETS,
    subscriptions: INITIAL_SUBSCRIPTIONS,
    consentRequests: INITIAL_CONSENT_REQUESTS,
    accessRequests: INITIAL_ACCESS_REQUESTS,
    transfers: INITIAL_TRANSFERS,
    billingTransactions: INITIAL_BILLING_TRANSACTIONS,
    notifications: INITIAL_NOTIFICATIONS,
    preferences: INITIAL_WORKSPACE_PREFERENCES,
    applicationStatus: 'Under Review' as const,
    reviewNote: '',
    participants: INITIAL_ADMIN_PARTICIPANTS,
    policies: INITIAL_ADMIN_POLICIES,
    auditLogs: INITIAL_AUDIT_LOGS,
    purposes: INITIAL_DATA_PURPOSES,
  });
}

export function loadLocalStore(): ImdxAppStore {
  const defaults = createInitialStore();
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<ImdxAppStore>;
    return {
      ...defaults,
      ...parsed,
      onboarding: {
        ...defaults.onboarding,
        ...(parsed.onboarding ?? {}),
      },
      preferences: {
        ...defaults.preferences,
        ...(parsed.preferences ?? {}),
      },
    };
  } catch {
    return defaults;
  }
}

export function persistLocalStore(store: ImdxAppStore): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Ignore storage quota errors in restricted browsing modes
  }
}

export function clearLocalStore(): ImdxAppStore {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  return createInitialStore();
}

const SLOT_TO_CYGNUS_KIND: Record<DocumentSlotKey, CygnusDocumentKind> = {
  incorporationCertificate: 'INCORPORATION',
  pan: 'PAN',
  gstCertificate: 'GST',
  authorizationLetter: 'AUTHORISATION',
};

const CYGNUS_KIND_TO_SLOT: Partial<Record<CygnusDocumentKind, DocumentSlotKey>> = {
  INCORPORATION: 'incorporationCertificate',
  PAN: 'pan',
  GST: 'gstCertificate',
  AUTHORISATION: 'authorizationLetter',
};

function mapDatasetStatus(status: CygnusDataset['status']): DatasetStatus {
  if (status === 'active') return 'Published';
  if (status === 'draft') return 'Draft';
  return 'Awaiting Approval';
}

function mapAppStatus(status: CygnusApplication['status']): ApplicationReviewStatus {
  if (status === 'ACTIVE' || status === 'APPROVED_WAITING' || status === 'PROVISIONING') {
    return 'Approved';
  }
  if (status === 'NEEDS_INFO' || status === 'REJECTED' || status === 'SETUP_FAILED') {
    return 'Changes Requested';
  }
  return 'Under Review';
}

function mapCygnusDataset(ds: CygnusDataset): MyDatasetItem {
  const meta = ds.metadata ?? {};
  return {
    id: ds.id,
    name: ds.name,
    category: ds.category || 'Mobility',
    version: typeof meta.version === 'string' ? meta.version : 'v1.0',
    coverage: typeof meta.coverage === 'string' ? meta.coverage : 'India',
    updateFrequency:
      ds.deliveryType === 'REALTIME'
        ? 'Real-time'
        : typeof meta.updateFrequency === 'string'
          ? meta.updateFrequency
          : 'Daily',
    quality: typeof meta.quality === 'string' ? meta.quality : '94%',
    status: mapDatasetStatus(ds.status),
  };
}

function mapCygnusOfferModel(model?: string | null): PlanOptionId {
  const upper = (model ?? '').toUpperCase();
  if (upper === 'PAY_PER_USE') return 'pay-per-use';
  if (upper === 'HYBRID') return 'hybrid';
  if (upper === 'ONE_TIME') return 'one-time';
  return 'subscription';
}

function mapCygnusSubscription(sub: CygnusSubscription): SubscriptionRecord {
  return {
    offerId: sub.id,
    planId: mapCygnusOfferModel(sub.offerModel),
    purpose: sub.purpose || 'ANALYTICS',
    subscribedAt: sub.agreedAt || sub.createdAt || 'Active',
    status: sub.status === 'ACTIVE' || sub.status === 'APPROVED' ? 'Active' : 'Paused',
  };
}

function mapCygnusTransfer(tx: CygnusTransfer): TransferItem {
  return {
    id: tx.id,
    dataset: tx.assetId || tx.transferProcessId || tx.id,
    protocol: tx.transferType || 'HttpData-PULL',
    direction: tx.transferType === 'HttpData-PUSH' ? 'Outbound' : 'Inbound',
    volume: tx.status,
    status: tx.status === 'COMPLETED' ? 'Completed' : 'Streaming',
    timestamp: tx.completedAt || tx.createdAt || 'Recent',
  };
}

function mapCygnusConsentRequest(rec: CygnusConsentRecord): ConsentRequestRecord {
  return {
    offerId: rec.datasetId,
    purpose: rec.purposeId || 'ANALYTICS',
    scope: 'Contracted records',
    duration: rec.expiresAt ? `Until ${rec.expiresAt.slice(0, 10)}` : '1 Month',
    status: rec.status === 'ACTIVE' ? 'Granted' : 'Pending Review',
    requestedAt: rec.requestedAt || 'Recent',
  };
}

function mapCygnusInboundConsent(rec: CygnusConsentRecord): AccessRequestItem {
  const status: AccessRequestStatus =
    rec.status === 'ACTIVE'
      ? 'Approved'
      : rec.status === 'REVOKED' || rec.status === 'EXPIRED'
        ? 'Rejected'
        : 'Pending Review';
  return {
    id: rec.id,
    org: rec.consumerDid,
    badge: 'DID Verified',
    dataset: rec.datasetId,
    purpose: rec.purposeId || 'ANALYTICS',
    scope: 'Policy-scoped',
    duration: rec.expiresAt ? rec.expiresAt.slice(0, 10) : '1 Month',
    submitted: rec.requestedAt ? rec.requestedAt.slice(0, 16).replace('T', ' ') : 'Recent',
    status,
  };
}

function mapCygnusOrderAndInvoices(orders: CygnusOrder[], invoices: CygnusInvoice[]): BillingTransaction[] {
  const txFromOrders: BillingTransaction[] = orders.map((order) => {
    const amountInr = Math.round(order.amount ?? 0);
    return {
      id: order.id,
      dataset: order.datasetId,
      counterparty: order.consumerDid,
      type: 'Order',
      period: (order.createdAt ?? '').slice(0, 7) || 'Current',
      amountInr,
      amount: `₹${amountInr.toLocaleString('en-IN')}`,
      date: (order.createdAt ?? '').slice(0, 10) || 'Recent',
      status: order.status === 'PAID' ? 'Paid' : 'Pending',
      kind: 'spending',
    };
  });
  const txFromInvoices: BillingTransaction[] = invoices.map((inv) => {
    const amountInr = Math.round(inv.total ?? inv.amount ?? 0);
    return {
      id: inv.id,
      dataset: inv.datasetId || 'IMDX Settlement',
      counterparty: inv.participantDid,
      type: inv.modelType || 'Invoice',
      period: inv.billingPeriodStart ? `${inv.billingPeriodStart.slice(0, 10)}` : 'Current',
      amountInr,
      amount: `₹${amountInr.toLocaleString('en-IN')}`,
      date: (inv.createdAt ?? '').slice(0, 10) || 'Recent',
      status: 'Paid',
      kind: 'earning',
    };
  });
  return [...txFromOrders, ...txFromInvoices];
}

export function mapCygnusCatalogToOffers(items: CygnusCatalogDataset[]): CatalogOffer[] {
  return items.map((item) => {
    const fallbackProtocol: CatalogProtocol =
      item.category?.toUpperCase().includes('EV') ? 'EV_CHARGING' : 'GTFS';
    return {
      id: item.id,
      datasetId: item.id,
      category: item.category || 'Mobility',
      version: `v${item.termsVersion ?? 1}.0`,
      tags: Array.isArray(item.allowedPurposes)
        ? item.allowedPurposes.join(', ')
        : item.allowedPurposes || 'Mobility, Real-time',
      qualityScore: 95,
      title: item.name,
      protocol: fallbackProtocol,
      description: item.description || 'Catalog dataset hosted on Cygnus EDC.',
      did: item.providerDid,
      publisher: item.providerBpn || item.providerDid,
      licence:
        typeof item.terms === 'object' && item.terms?.governingLaw
          ? `${item.terms.governingLaw} · ODRL`
          : 'IMDX Standard Contract',
      coverage: 'India',
      updateFrequency: item.deliveryType === 'REALTIME' ? 'Real-time' : 'Batch',
      endpointUrl: `${PLATFORM_BASE || ''}/api/v1/catalog/datasets/${item.id}`,
      fields: [],
    };
  });
}

function toCygnusPurposeEnum(input: string, allowedList?: string | string[]): string {
  const upper = input.trim().toUpperCase();
  const valid = ['INDUSTRY_CORE', 'ANALYTICS', 'RESEARCH', 'SUSTAINABILITY', 'OPERATIONS'] as const;
  let candidate: string = valid.find((v) => v === upper) ?? 'ANALYTICS';
  if (upper.includes('ROUT') || upper.includes('TRAFFIC') || upper.includes('OPERAT')) {
    candidate = 'OPERATIONS';
  } else if (upper.includes('EV') || upper.includes('SUSTAIN')) {
    candidate = 'SUSTAINABILITY';
  } else if (upper.includes('RESEARCH') || upper.includes('MODEL')) {
    candidate = 'RESEARCH';
  } else if (upper.includes('CORE')) {
    candidate = 'INDUSTRY_CORE';
  }

  let parsedAllowed: string[] = [];
  if (Array.isArray(allowedList)) {
    parsedAllowed = allowedList;
  } else if (typeof allowedList === 'string' && allowedList.trim()) {
    try {
      const parsed = JSON.parse(allowedList) as unknown;
      if (Array.isArray(parsed)) parsedAllowed = parsed.map(String);
    } catch {
      parsedAllowed = [];
    }
  }
  if (parsedAllowed.length > 0 && !parsedAllowed.includes(candidate)) {
    return parsedAllowed[0];
  }
  return candidate;
}

const PLAN_ID_TO_MODEL: Record<PlanOptionId, 'PAY_PER_USE' | 'SUBSCRIPTION' | 'HYBRID' | 'ONE_TIME'> = {
  'pay-per-use': 'PAY_PER_USE',
  subscription: 'SUBSCRIPTION',
  hybrid: 'HYBRID',
  'one-time': 'ONE_TIME',
};

export const imdxApi = {
  // ── Onboarding sync & mutations ───────────────────────────────
  async fetchPublicApplication(token: string, base: OnboardingState): Promise<{
    onboarding: OnboardingState;
    applicationStatus: ApplicationReviewStatus;
    reviewNote: string;
  }> {
    const app = await cygnusApi.getMyApplication(token);
    const docs = { ...base.documents };
    for (const d of app.documents ?? []) {
      const slot = CYGNUS_KIND_TO_SLOT[d.kind];
      if (!slot) continue;
      docs[slot] = {
        ...docs[slot],
        documentId: d.id,
        fileName: d.filename,
        fileSizeLabel: `${Math.max(1, Math.round(d.sizeBytes / 1024))} KB`,
        progress: 100,
        status: 'uploaded',
      };
    }

    const acceptedPolicies = { ...base.acceptedPolicies };
    for (const acc of app.acceptances ?? []) {
      acceptedPolicies[acc.slug] = true;
    }

    const stage: OnboardingState['stage'] =
      app.status === 'SUBMITTED' ||
      app.status === 'ACTIVE' ||
      app.status === 'PROVISIONING' ||
      app.status === 'APPROVED_WAITING'
        ? 'submitted'
        : !app.organization
          ? 1
          : !app.representative
            ? 2
            : 4;

    return {
      onboarding: {
        ...base,
        applicationNumber: app.number || base.applicationNumber,
        stage,
        registration: {
          ...base.registration,
          fullName: app.contactName || base.registration.fullName,
          workEmail: app.email || base.registration.workEmail,
          phoneNumber: app.mobile || base.registration.phoneNumber,
        },
        organization: app.organization
          ? {
              legalName: app.organization.legalName,
              entityType: app.organization.entityType,
              pan: app.organization.pan,
              gstin: app.organization.gstin ?? '',
              cin: app.organization.cin ?? '',
              website: app.organization.website ?? '',
              country: app.organization.country,
              sector: app.organization.sector ?? '',
              registeredAddress: app.organization.address,
            }
          : base.organization,
        representative: app.representative
          ? {
              ...base.representative,
              name: app.representative.name,
              designation: app.representative.designation,
              email: app.representative.email,
              phoneNumber: app.representative.mobile,
              isDirectorOrOfficer: app.representative.isOfficer,
            }
          : base.representative,
        documents: docs,
        acceptedPolicies,
      },
      applicationStatus: mapAppStatus(app.status),
      reviewNote: app.needsInfo?.note || app.rejectNote || '',
    };
  },

  async startApplication(data: { fullName: string; workEmail: string; countryCode: string; phoneNumber: string }): Promise<void> {
    if (!isPlatformConfigured()) return;
    const digits = data.phoneNumber.replace(/\D/g, '');
    const mobile = digits ? `${data.countryCode}${digits}` : '';
    await cygnusApi.startApplication({
      name: data.fullName.trim(),
      email: data.workEmail.trim(),
      mobile,
    });
  },

  async saveOrganizationStep(org: OnboardingState['organization']): Promise<void> {
    const token = loadApplicationToken();
    if (!isPlatformConfigured() || !token) return;
    await cygnusApi.saveOrganization(
      {
        legalName: org.legalName,
        entityType: org.entityType,
        country: org.country,
        address: org.registeredAddress,
        pan: org.pan,
        gstin: org.gstin || null,
        cin: org.cin || null,
        website: org.website || null,
        sector: org.sector || null,
      },
      token,
    );
  },

  async saveRepresentativeStep(rep: OnboardingState['representative']): Promise<void> {
    const token = loadApplicationToken();
    if (!isPlatformConfigured() || !token) return;
    const digits = rep.phoneNumber.replace(/\D/g, '');
    await cygnusApi.saveRepresentative(
      {
        name: rep.name,
        designation: rep.designation,
        email: rep.email,
        mobile: digits ? `${rep.countryCode}${digits}` : '',
        isOfficer: rep.isDirectorOrOfficer,
      },
      token,
    );
  },

  async uploadDocument(slotKey: DocumentSlotKey, file: File): Promise<string | undefined> {
    const token = loadApplicationToken();
    if (!isPlatformConfigured() || !token) return undefined;
    const uploaded = await cygnusApi.uploadDocument(SLOT_TO_CYGNUS_KIND[slotKey], file, token);
    return uploaded?.id;
  },

  async removeDocument(docId?: string): Promise<void> {
    const token = loadApplicationToken();
    if (!isPlatformConfigured() || !token || !docId) return;
    await cygnusApi.removeDocument(docId, token);
  },

  async resubmitApplication(): Promise<void> {
    const token = loadApplicationToken();
    if (!isPlatformConfigured() || !token) return;
    await cygnusApi.resubmitApplication(token);
  },

  async submitApplication(state: OnboardingState): Promise<void> {
    const token = loadApplicationToken();
    if (!isPlatformConfigured() || !token) return;
    const livePolicies = await cygnusApi.listPublicPolicies().catch(() => []);
    const versionBySlug = new Map(livePolicies.map((p) => [p.slug, p.version]));
    for (const [slug, accepted] of Object.entries(state.acceptedPolicies)) {
      if (accepted) {
        const version = versionBySlug.get(slug) ?? 1;
        await cygnusApi.acceptPolicy(slug, version, token).catch(() => undefined);
      }
    }
    await cygnusApi.submitApplication(token);
  },

  // ── Live Workspace Sync (Cygnus Agent) ────────────────────────
  async syncWorkspace(): Promise<Partial<ImdxAppStore> & { liveCatalog?: CatalogOffer[] }> {
    const session = loadUserSession();
    if (!isAgentConfigured() || !session?.token) return {};

    const [datasetsRes, catalogRes, subsRes, transfersRes, consentsRes, inboundRes, ordersRes, invoicesRes] =
      await Promise.allSettled([
        cygnusApi.listDatasets(),
        cygnusApi.searchCatalog(),
        cygnusApi.listSubscriptions(),
        cygnusApi.listTransfers(),
        cygnusApi.listConsentRequests(session.did),
        cygnusApi.listInboundConsents(),
        cygnusApi.listOrders(),
        cygnusApi.listInvoices(session.did),
      ]);

    const patch: Partial<ImdxAppStore> & { liveCatalog?: CatalogOffer[] } = {};
    if (datasetsRes.status === 'fulfilled') patch.datasets = datasetsRes.value.map(mapCygnusDataset);
    if (subsRes.status === 'fulfilled') patch.subscriptions = subsRes.value.map(mapCygnusSubscription);
    if (transfersRes.status === 'fulfilled') patch.transfers = transfersRes.value.map(mapCygnusTransfer);
    if (consentsRes.status === 'fulfilled') {
      patch.consentRequests = consentsRes.value.map(mapCygnusConsentRequest);
    }
    if (inboundRes.status === 'fulfilled') {
      patch.accessRequests = inboundRes.value.map(mapCygnusInboundConsent);
    }
    if (ordersRes.status === 'fulfilled' || invoicesRes.status === 'fulfilled') {
      patch.billingTransactions = mapCygnusOrderAndInvoices(
        ordersRes.status === 'fulfilled' ? ordersRes.value : [],
        invoicesRes.status === 'fulfilled' ? invoicesRes.value : [],
      );
    }
    if (catalogRes.status === 'fulfilled' && catalogRes.value.length > 0) {
      patch.liveCatalog = mapCygnusCatalogToOffers(catalogRes.value);
    }
    return patch;
  },

  // ── Live Admin Sync (Cygnus Platform) ─────────────────────────
  async syncAdmin(): Promise<Partial<ImdxAppStore>> {
    const admin = loadAdminSession();
    if (!isPlatformConfigured() || !admin?.token) return {};

    const [participantsRes, policiesRes, auditRes, purposesRes] = await Promise.allSettled([
      cygnusApi.listParticipants(),
      cygnusApi.listAdminPolicies(),
      cygnusApi.listAuditEvents(50),
      cygnusApi.listAdminPurposes(true),
    ]);

    const patch: Partial<ImdxAppStore> = {};
    if (participantsRes.status === 'fulfilled') {
      patch.participants = participantsRes.value.map<AdminParticipant>((p) => ({
        id: p.did,
        name: p.name,
        did: p.did,
        role: p.role === 'PROV' ? 'Provider' : 'Consumer',
        deployment: 'Hosted By IMDX',
        datasetsCount: 0,
        status: p.active ? 'Active' : 'Suspended',
      }));
    }
    if (policiesRes.status === 'fulfilled') {
      patch.policies = policiesRes.value.map<AdminPolicyRule>((p) => ({
        id: `${p.slug}-v${p.version}`,
        title: p.title,
        version: `v${p.version}`,
        mandatory: Boolean(p.required),
        enforced: p.status === 'APPROVED',
        updatedAt: (p.createdAt ?? '').slice(0, 10) || 'Active',
      }));
    }
    if (auditRes.status === 'fulfilled') {
      patch.auditLogs = auditRes.value.map<AuditLogEntry>((evt) => ({
        id: String(evt.id),
        actor: evt.participantDid || 'platform-ledger',
        action: evt.eventType,
        target: evt.eventHash.slice(0, 14),
        timestamp: evt.createdAt.slice(0, 19).replace('T', ' '),
        outcome: 'Success',
      }));
    }
    if (purposesRes.status === 'fulfilled') {
      patch.purposes = purposesRes.value.map<DataPurposeItem>((p) => ({
        id: p.id,
        code: p.category || p.name.toUpperCase().replace(/\s+/g, '_'),
        name: p.name,
        description: p.description || '',
        active: p.active ?? true,
      }));
    }
    return patch;
  },

  // ── Mutations (fail loudly when Cygnus backend is active) ─────
  async createDataset(
    dataset: MyDatasetItem,
    endpointUrl?: string,
  ): Promise<MyDatasetItem> {
    if (!isAgentConfigured() || !loadUserSession()?.token) return dataset;
    const created = await cygnusApi.createDataset({
      name: dataset.name,
      category: dataset.category,
      deliveryType: dataset.updateFrequency.includes('min') ? 'REALTIME' : 'STATIC',
      status: dataset.status === 'Published' ? 'active' : 'draft',
      dataSource: {
        connectorType: 'HTTP',
        baseUrl: endpointUrl?.trim() || 'https://api.imdx.org/feeds/sample',
      },
      metadata: {
        coverage: dataset.coverage,
        updateFrequency: dataset.updateFrequency,
        version: dataset.version ?? 'v1.0',
      },
    });
    return mapCygnusDataset(created);
  },

  async updateDatasetStatus(id: string, status: DatasetStatus): Promise<void> {
    if (!isAgentConfigured() || !loadUserSession()?.token) return;
    if (status === 'Published') {
      await cygnusApi.publishDataset(id);
    } else {
      await cygnusApi.unpublishDataset(id);
    }
  },

  async deleteDataset(id: string): Promise<void> {
    if (!isAgentConfigured() || !loadUserSession()?.token) return;
    await cygnusApi.deleteDataset(id);
  },

  async requestConsent(record: ConsentRequestRecord): Promise<void> {
    if (!isAgentConfigured() || !loadUserSession()?.token) return;
    let resolvedPurposeId = record.purpose;
    const purposes = await cygnusApi.listAgentPurposes().catch(() => []);
    if (purposes.length > 0) {
      const q = record.purpose.toLowerCase();
      const matched =
        purposes.find(
          (p) =>
            p.id === record.purpose ||
            p.name.toLowerCase() === q ||
            (p.category ?? '').toLowerCase() === q ||
            q.includes(p.name.toLowerCase()),
        ) ?? purposes[0];
      if (matched) resolvedPurposeId = matched.id;
    }
    await cygnusApi.requestConsent(record.offerId, resolvedPurposeId);
  },

  async createSubscription(
    offer: CatalogOffer,
    planId: PlanOptionId,
    purpose: string,
  ): Promise<SubscriptionRecord | null> {
    if (!isAgentConfigured() || !loadUserSession()?.token) return null;
    const targetOffer = CATALOG_OFFERS.find((o) => o.id === offer.id);
    const datasetId = offer.datasetId || targetOffer?.datasetId || offer.id;
    const detail = await cygnusApi.getCatalogDataset(datasetId);
    const canonical = JSON.stringify(canonicalContractObject(detail));
    const termsHash = await sha256Hex(canonical);
    const desiredModel = PLAN_ID_TO_MODEL[planId];
    const matchedOffer =
      (detail.offers ?? []).find((o) => o.modelType === desiredModel) ?? detail.offers?.[0];
    if (!matchedOffer) {
      throw new ApiError(422, 'No enabled pricing offer found for this dataset.');
    }
    const res = await cygnusApi.createSubscription({
      datasetId,
      providerDid: detail.providerDid || offer.did,
      purpose: toCygnusPurposeEnum(purpose, detail.allowedPurposes),
      agreedTermsVersion: detail.termsVersion ?? 1,
      termsHash,
      offerId: matchedOffer.id,
    });
    return mapCygnusSubscription(res.subscription);
  },

  async revokeSubscription(subscriptionId: string): Promise<void> {
    if (!isAgentConfigured() || !loadUserSession()?.token) return;
    await cygnusApi.revokeSubscription(subscriptionId);
  },

  async triggerTransfer(subscriptionId: string): Promise<TransferItem | null> {
    if (!isAgentConfigured() || !loadUserSession()?.token) return null;
    const tx = await cygnusApi.initiateTransfer(subscriptionId, 'HttpData-PULL');
    await cygnusApi.pullTransferData(tx.id).catch(() => undefined);
    return mapCygnusTransfer(tx);
  },

  async updateAccessRequest(id: string, status: AccessRequestStatus): Promise<void> {
    if (!isAgentConfigured() || !loadUserSession()?.token) return;
    if (status === 'Approved') {
      await cygnusApi.grantConsent(id);
    }
  },

  async payTransaction(orderId: string): Promise<void> {
    if (!isAgentConfigured() || !loadUserSession()?.token) return;
    await cygnusApi.payOrder(orderId);
  },

  async updateApplicationDecision(
    applicationNumber: string,
    status: ApplicationReviewStatus,
    note?: string,
  ): Promise<void> {
    if (!isPlatformConfigured() || !loadAdminSession()?.token) return;
    const apps = await cygnusApi.listAdminApplications();
    const target = apps.find((a) => a.number === applicationNumber) ?? apps[0];
    if (!target) return;
    if (status === 'Approved') {
      await cygnusApi.approveAdminApplication(target.id);
    } else if (status === 'Changes Requested') {
      await cygnusApi.requestAdminApplicationInfo(
        target.id,
        ['Organization details'],
        note || 'Please review highlighted fields.',
      );
    }
  },
};
