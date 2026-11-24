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
  | 'purposes'
  | 'capacity'
  | 'settings';

export type DatasetStatus = 'Published' | 'Awaiting Approval' | 'Draft';

export interface MyDatasetItem {
  id: string;
  name: string;
  category: string;
  coverage: string;
  updateFrequency: string;
  quality: string;
  status: DatasetStatus;
}

export type CatalogProtocol = 'GTFS' | 'GTFS-RT' | 'OCPI' | 'GBFS' | 'EV_CHARGING' | 'MDS';

export interface CatalogOffer {
  id: string;
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
