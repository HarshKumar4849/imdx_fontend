import {
  INITIAL_ADMIN_PARTICIPANTS,
  INITIAL_ADMIN_POLICIES,
  INITIAL_AUDIT_LOGS,
  INITIAL_DATA_PURPOSES,
} from '../data/adminData';
import {
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
  AccessRequestStatus,
  ApplicationReviewStatus,
  BillingTransaction,
  ConsentRequestRecord,
  DatasetStatus,
  ImdxAppStore,
  MyDatasetItem,
  SubscriptionRecord,
  TransferItem,
  WorkspacePreferences,
} from '../types/dashboard';
import type { DocumentSlotKey, OnboardingState } from '../types/onboarding';

const STORAGE_KEY = 'imdx_portal_store_v1';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || '';

export function isBackendConfigured(): boolean {
  return Boolean(API_BASE_URL);
}

export function createInitialStore(): ImdxAppStore {
  return {
    onboarding: INITIAL_ONBOARDING_STATE,
    datasets: INITIAL_MY_DATASETS,
    subscriptions: INITIAL_SUBSCRIPTIONS,
    consentRequests: INITIAL_CONSENT_REQUESTS,
    accessRequests: INITIAL_ACCESS_REQUESTS,
    transfers: INITIAL_TRANSFERS,
    billingTransactions: INITIAL_BILLING_TRANSACTIONS,
    notifications: INITIAL_NOTIFICATIONS,
    preferences: INITIAL_WORKSPACE_PREFERENCES,
    applicationStatus: 'Under Review',
    reviewNote: '',
    participants: INITIAL_ADMIN_PARTICIPANTS,
    policies: INITIAL_ADMIN_POLICIES,
    auditLogs: INITIAL_AUDIT_LOGS,
    purposes: INITIAL_DATA_PURPOSES,
  };
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

async function sendBackendRequest<T>(path: string, init?: RequestInit): Promise<T | null> {
  if (!API_BASE_URL) return null;
  const base = API_BASE_URL.replace(/\/+$/, '');
  const response = await fetch(`${base}${path}`, {
    headers: {
      ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  if (!response.ok) {
    throw new Error(`IMDX API error ${response.status} on ${path}`);
  }
  if (response.status === 204) return null;
  return (await response.json()) as T;
}

export const imdxApi = {
  async bootstrap(): Promise<ImdxAppStore> {
    const local = loadLocalStore();
    if (!API_BASE_URL) return local;
    try {
      const remote = await sendBackendRequest<Partial<ImdxAppStore>>('/api/workspace/bootstrap');
      if (!remote) return local;
      const merged = { ...local, ...remote };
      persistLocalStore(merged);
      return merged;
    } catch {
      return local;
    }
  },

  async submitApplication(state: OnboardingState): Promise<void> {
    try {
      await sendBackendRequest('/api/onboarding/applications', {
        method: 'POST',
        body: JSON.stringify(state),
      });
    } catch {
      // Handled optimistically in local store when backend is offline
    }
  },

  async uploadDocument(
    applicationNumber: string,
    slotKey: DocumentSlotKey,
    file: File,
  ): Promise<void> {
    if (!API_BASE_URL) return;
    const body = new FormData();
    body.append('slotKey', slotKey);
    body.append('file', file);
    try {
      await sendBackendRequest(`/api/onboarding/applications/${applicationNumber}/documents`, {
        method: 'POST',
        body,
      });
    } catch {
      // Handled optimistically in local state
    }
  },

  async createDataset(dataset: MyDatasetItem): Promise<void> {
    try {
      await sendBackendRequest('/api/datasets', {
        method: 'POST',
        body: JSON.stringify(dataset),
      });
    } catch {
      // Local store remains updated
    }
  },

  async updateDatasetStatus(id: string, status: DatasetStatus): Promise<void> {
    try {
      await sendBackendRequest(`/api/datasets/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    } catch {
      // Local store remains updated
    }
  },

  async deleteDataset(id: string): Promise<void> {
    try {
      await sendBackendRequest(`/api/datasets/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch {
      // Local store remains updated
    }
  },

  async requestConsent(record: ConsentRequestRecord): Promise<void> {
    try {
      await sendBackendRequest('/api/catalog/consent-requests', {
        method: 'POST',
        body: JSON.stringify(record),
      });
    } catch {
      // Local store remains updated
    }
  },

  async createSubscription(
    subscription: SubscriptionRecord,
    transaction: BillingTransaction,
  ): Promise<void> {
    try {
      await sendBackendRequest('/api/subscriptions', {
        method: 'POST',
        body: JSON.stringify({ subscription, transaction }),
      });
    } catch {
      // Local store remains updated
    }
  },

  async deleteSubscription(offerId: string): Promise<void> {
    try {
      await sendBackendRequest(`/api/subscriptions/${encodeURIComponent(offerId)}`, {
        method: 'DELETE',
      });
    } catch {
      // Local store remains updated
    }
  },

  async triggerTransfer(transfer: TransferItem): Promise<void> {
    try {
      await sendBackendRequest('/api/transfers', {
        method: 'POST',
        body: JSON.stringify(transfer),
      });
    } catch {
      // Local store remains updated
    }
  },

  async updateAccessRequest(
    id: string,
    status: AccessRequestStatus,
    note?: string,
  ): Promise<void> {
    try {
      await sendBackendRequest(`/api/access-requests/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, note }),
      });
    } catch {
      // Local store remains updated
    }
  },

  async payTransaction(txId: string): Promise<void> {
    try {
      await sendBackendRequest(`/api/billing/transactions/${encodeURIComponent(txId)}/pay`, {
        method: 'POST',
      });
    } catch {
      // Local store remains updated
    }
  },

  async savePreferences(preferences: WorkspacePreferences): Promise<void> {
    try {
      await sendBackendRequest('/api/workspace/settings', {
        method: 'PUT',
        body: JSON.stringify(preferences),
      });
    } catch {
      // Local store remains updated
    }
  },

  async updateApplicationDecision(
    applicationNumber: string,
    status: ApplicationReviewStatus,
    note?: string,
  ): Promise<void> {
    try {
      await sendBackendRequest(
        `/api/admin/applications/${encodeURIComponent(applicationNumber)}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status, note }),
        },
      );
    } catch {
      // Local store remains updated
    }
  },
};
