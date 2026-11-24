import type {
  DocumentSlotKey,
  DocumentSlotState,
  OnboardingState,
  PolicyItem,
} from '../types/onboarding';

export const APPLICATION_NUMBER = 'ZW4C-9CDM-UC84';

export const COUNTRY_CODES = [
  { label: 'IN +91', value: '+91' },
  { label: 'US +1', value: '+1' },
  { label: 'UK +44', value: '+44' },
  { label: 'SG +65', value: '+65' },
  { label: 'AE +971', value: '+971' },
];

export const ENTITY_TYPES = [
  'Private Limited Company',
  'Public Limited Company',
  'Limited Liability Partnership (LLP)',
  'Partnership Firm',
  'Sole Proprietorship',
  'Government / Public Sector Undertaking',
  'Non-Profit / Trust / Society',
];

export const DESIGNATIONS = [
  'Director',
  'Managing Director',
  'Chief Executive Officer (CEO)',
  'Chief Technology Officer (CTO)',
  'Authorized Signatory',
  'Designer',
  'Operations Manager',
  'Legal Counsel',
];

export const STEPPER_STEPS = [
  { step: 1 as const, label: 'Step 1', titleLines: ['Organization', 'Onboarding'] },
  { step: 2 as const, label: 'Step 2', titleLines: ['Authorized', 'Representative'] },
  { step: 3 as const, label: 'Step 3', titleLines: ['Deployment'] },
  { step: 4 as const, label: 'Step 4', titleLines: ['Document Upload'] },
  { step: 5 as const, label: 'Step 5', titleLines: ['Policies'] },
  { step: 6 as const, label: 'Step 6', titleLines: ['Review & Submit'] },
];

export const INITIAL_DOCUMENTS: Record<DocumentSlotKey, DocumentSlotState> = {
  incorporationCertificate: {
    key: 'incorporationCertificate',
    title: 'Incorporation Certificate',
    description: "Company's valid Certificate for verification.",
    required: true,
    progress: 0,
    status: 'empty',
  },
  pan: {
    key: 'pan',
    title: 'PAN',
    description: "Company's valid Certificate for verification.",
    required: true,
    progress: 0,
    status: 'empty',
  },
  gstCertificate: {
    key: 'gstCertificate',
    title: 'GST Certificate',
    description: "Company's valid Certificate for verification.",
    required: true,
    progress: 0,
    status: 'empty',
  },
  authorizationLetter: {
    key: 'authorizationLetter',
    title: 'Authorization Letter',
    description: "Company's valid Certificate for verification.",
    required: true,
    progress: 0,
    status: 'empty',
  },
};

export const POLICIES: PolicyItem[] = [
  {
    id: 'acceptable-use',
    title: 'Acceptable Use Policy',
    summary:
      'Defines permitted and prohibited uses of the IMDX mobility data exchange network, APIs, and hosted workspaces.',
  },
  {
    id: 'code-of-conduct',
    title: 'Code Of Conduct',
    summary:
      'Establishes ethical, fair-dealing, and cooperative standards for all participating organizations and representatives.',
  },
  {
    id: 'data-processing-addendum',
    title: 'Data Processing Addendum',
    summary:
      'Sets out data protection responsibilities, processing instructions, and compliance obligations between IMDX and your organization.',
  },
  {
    id: 'data-sharing-terms',
    title: 'Data Sharing Terms',
    summary:
      'Governs dataset publishing, consumption licenses, attribution, and usage boundaries across ecosystem participants.',
  },
  {
    id: 'fees-billing',
    title: 'Fees and Billing Terms',
    summary:
      'Outlines subscription tiers, usage metering, invoicing cycles, taxes, and payment settlement rules.',
  },
  {
    id: 'hosted-sla',
    title: 'Hosted Service Level Terms',
    summary:
      'Specifies availability targets, scheduled maintenance windows, incident response times, and service credits for IMDX-hosted deployments.',
  },
  {
    id: 'participation-agreement',
    title: 'Participation Agreement',
    summary:
      'Forms the primary legal framework for your organization to join and transact within the IMDX ecosystem.',
  },
  {
    id: 'privacy-policy',
    title: 'Privacy Policy',
    summary:
      'Explains how IMDX collects, stores, uses, and safeguards organizational and representative contact information.',
  },
  {
    id: 'security-incident',
    title: 'Security and Incident Policy',
    summary:
      'Details security controls, credential management, vulnerability disclosure, and mandatory breach notification timelines.',
  },
];

export const INITIAL_ONBOARDING_STATE: OnboardingState = {
  applicationNumber: APPLICATION_NUMBER,
  stage: 'register',
  registration: {
    fullName: '',
    workEmail: '',
    countryCode: '+91',
    phoneNumber: '',
  },
  organization: {
    legalName: '',
    entityType: '',
    pan: '',
    gstin: '',
    cin: '',
    website: '',
    country: '',
    sector: '',
    registeredAddress: '',
  },
  representative: {
    name: '',
    designation: '',
    email: '',
    countryCode: '+91',
    phoneNumber: '',
    isDirectorOrOfficer: false,
    isAuthorizedToBind: false,
  },
  deployment: 'hosted',
  documents: INITIAL_DOCUMENTS,
  acceptedPolicies: Object.fromEntries(POLICIES.map((p) => [p.id, false])),
};
