export type OnboardingStage = 'register' | 1 | 2 | 3 | 4 | 5 | 6 | 'submitted';

export interface RegistrationData {
  fullName: string;
  workEmail: string;
  countryCode: string;
  phoneNumber: string;
}

export interface OrganizationData {
  legalName: string;
  entityType: string;
  pan: string;
  gstin: string;
  cin: string;
  website: string;
  country: string;
  sector: string;
  registeredAddress: string;
}

export interface RepresentativeData {
  name: string;
  designation: string;
  email: string;
  countryCode: string;
  phoneNumber: string;
  isDirectorOrOfficer: boolean;
  isAuthorizedToBind: boolean;
}

export type DeploymentOption = 'hosted' | 'self-hosted';

export type DocumentSlotKey =
  | 'incorporationCertificate'
  | 'pan'
  | 'gstCertificate'
  | 'authorizationLetter';

export type DocumentUploadStatus = 'empty' | 'uploading' | 'uploaded' | 'failed';

export interface DocumentSlotState {
  key: DocumentSlotKey;
  title: string;
  description: string;
  required: boolean;
  fileName?: string;
  fileSizeLabel?: string;
  progress: number;
  status: DocumentUploadStatus;
  errorMessage?: string;
}

export interface PolicySection {
  heading: string;
  body: string;
}

export interface PolicyItem {
  id: string;
  docCode: string;
  version: string;
  effectiveDate: string;
  title: string;
  summary: string;
  sections: PolicySection[];
}

export interface OnboardingState {
  applicationNumber: string;
  stage: OnboardingStage;
  registration: RegistrationData;
  organization: OrganizationData;
  representative: RepresentativeData;
  deployment: DeploymentOption;
  documents: Record<DocumentSlotKey, DocumentSlotState>;
  acceptedPolicies: Record<string, boolean>;
}
