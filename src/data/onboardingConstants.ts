import type {
  DocumentSlotKey,
  DocumentSlotState,
  OnboardingState,
  PolicyItem,
} from '../types/onboarding';

export const APPLICATION_NUMBER = '';

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
    docCode: 'IMDX-POL-01.pdf',
    version: 'v2.1',
    effectiveDate: '01 Apr 2026',
    title: 'Acceptable Use Policy',
    summary:
      'Defines permitted and prohibited uses of the IMDX mobility data exchange network, APIs, and hosted workspaces.',
    sections: [
      {
        heading: '1. Permitted Ecosystem Usage',
        body: 'Participants may access IMDX connectors, catalogues, and APIs solely for lawful mobility, EV energy, compliance, and analytics workflows covered under executed data contracts.',
      },
      {
        heading: '2. Prohibited Activities',
        body: 'Participants must not probe, bypass, or disrupt connector endpoints, attempt unauthorized re-identification of anonymized datasets, redistribute raw datasets outside contracted terms, or deploy automated scraping against member catalogues.',
      },
      {
        heading: '3. Credentials & Suspension',
        body: 'All DIDs, BPNs, and connector certificates are non-transferable. Suspected misuse may result in immediate connector suspension pending governance review.',
      },
    ],
  },
  {
    id: 'code-of-conduct',
    docCode: 'IMDX-POL-02.pdf',
    version: 'v2.0',
    effectiveDate: '01 Apr 2026',
    title: 'Code Of Conduct',
    summary:
      'Establishes ethical, fair-dealing, and cooperative standards for all participating organizations and representatives.',
    sections: [
      {
        heading: '1. Integrity & Transparency',
        body: 'Organizations must represent dataset provenance, quality SLAs, and pricing honestly within the IMDX catalogue and refrain from deceptive or anti-competitive practices.',
      },
      {
        heading: '2. Mutual Respect & Governance Participation',
        body: 'Authorized representatives must uphold professional conduct across governance consultations, dispute mediation, and operational support channels.',
      },
      {
        heading: '3. Conflict of Interest Disclosure',
        body: 'Participants serving on technical or policy advisory groups must disclose commercial conflicts prior to standards voting.',
      },
    ],
  },
  {
    id: 'data-processing-addendum',
    docCode: 'IMDX-POL-03.pdf',
    version: 'v2.4',
    effectiveDate: '01 Apr 2026',
    title: 'Data Processing Addendum',
    summary:
      'Sets out data protection responsibilities, processing instructions, and compliance obligations between IMDX and your organization.',
    sections: [
      {
        heading: '1. Roles & DPDP Act 2023 Alignment',
        body: 'Where data includes personal or telematics identifiers, participants act in compliance with India’s Digital Personal Data Protection (DPDP) Act 2023, applying purpose limitation and data minimization.',
      },
      {
        heading: '2. Peer-to-Peer Control Plane Only',
        body: 'Tecmotiv Solutions operates the identity, contract negotiation, and audit ledger layers; payload data transfers directly between provider and consumer Eclipse EDC data planes unless explicitly configured for managed compute.',
      },
      {
        heading: '3. Sub-Processors & Erasure',
        body: 'Revocation or expiry of consent triggers automated policy enforcement and mandatory deletion cascades across downstream cached artifacts.',
      },
    ],
  },
  {
    id: 'data-sharing-terms',
    docCode: 'IMDX-POL-04.pdf',
    version: 'v2.2',
    effectiveDate: '01 Apr 2026',
    title: 'Data Sharing Terms',
    summary:
      'Governs dataset publishing, consumption licenses, attribution, and usage boundaries across ecosystem participants.',
    sections: [
      {
        heading: '1. Machine-Readable ODRL Contracts',
        body: 'Every dataset exchange is governed by a canonical ODRL policy specifying permitted purposes, geographic scope, retention period, derived-work rights, and transfer limits.',
      },
      {
        heading: '2. Intellectual Property Ownership',
        body: 'Participation in IMDX transfers no underlying intellectual property ownership; consumers receive only the limited, revocable license set out in the signed contract hash.',
      },
      {
        heading: '3. Auditability & Dispute Evidence',
        body: 'Contract negotiation hashes and transfer receipts are recorded in the append-only audit ledger as verifiable legal evidence.',
      },
    ],
  },
  {
    id: 'fees-billing',
    docCode: 'IMDX-POL-05.pdf',
    version: 'v1.9',
    effectiveDate: '01 Apr 2026',
    title: 'Fees and Billing Terms',
    summary:
      'Outlines subscription tiers, usage metering, invoicing cycles, taxes, and payment settlement rules.',
    sections: [
      {
        heading: '1. Platform & Transaction Fees',
        body: 'Membership tiers, hosted connector charges, and per-transfer marketplace settlements are billed in INR plus applicable GST according to the published IMDX rate schedule.',
      },
      {
        heading: '2. Metering & Receipts',
        body: 'Pay-per-use and subscription data contracts require valid settlement authorization before Eclipse EDC transfer tokens are issued.',
      },
      {
        heading: '3. Invoicing & Overdue Accounts',
        body: 'Tax invoices are issued monthly on the 1st business day with a 15-day settlement window. Delinquent accounts may have new contract execution paused.',
      },
    ],
  },
  {
    id: 'hosted-sla',
    docCode: 'IMDX-POL-06.pdf',
    version: 'v2.0',
    effectiveDate: '01 Apr 2026',
    title: 'Hosted Service Level Terms',
    summary:
      'Specifies availability targets, scheduled maintenance windows, incident response times, and service credits for IMDX-hosted deployments.',
    sections: [
      {
        heading: '1. Availability Target',
        body: 'Tecmotiv targets 99.9% monthly uptime for IMDX-hosted control planes, managed EDC connectors, and identity clearinghouse endpoints.',
      },
      {
        heading: '2. Maintenance & Incident Response',
        body: 'Planned upgrades are scheduled during off-peak IST windows with 72-hour advance notice; Severity-1 connector incidents receive response within 30 minutes.',
      },
      {
        heading: '3. Self-Hosted Scope Exclusion',
        body: 'For self-hosted deployments, participants retain responsibility for underlying cloud compute, TLS termination, and local firewall availability.',
      },
    ],
  },
  {
    id: 'participation-agreement',
    docCode: 'IMDX-POL-07.pdf',
    version: 'v3.0',
    effectiveDate: '01 Apr 2026',
    title: 'Participation Agreement',
    summary:
      'Forms the primary legal framework for your organization to join and transact within the IMDX ecosystem.',
    sections: [
      {
        heading: '1. Admission & KYB Verification',
        body: 'Admission is conditional on successful verification of PAN, GSTIN, CIN, and authorized signatory credentials conducted by the IMDX Governance Desk.',
      },
      {
        heading: '2. Binding Authority',
        body: 'The authorized representative affirms legal capacity to bind the participating entity to Dataspace Protocol (DSP) contracts executed via IMDX.',
      },
      {
        heading: '3. Term, Withdrawal & Governing Law',
        body: 'Membership remains active until terminated upon 30 days written notice or governance revocation and is governed by the laws of India with jurisdiction in Pune, Maharashtra.',
      },
    ],
  },
  {
    id: 'privacy-policy',
    docCode: 'IMDX-POL-08.pdf',
    version: 'v2.3',
    effectiveDate: '01 Apr 2026',
    title: 'Privacy Policy',
    summary:
      'Explains how IMDX collects, stores, uses, and safeguards organizational and representative contact information.',
    sections: [
      {
        heading: '1. Onboarding Information Collected',
        body: 'IMDX collects organizational registration records, authorized representative business contact details, and verification certificates strictly for KYB onboarding, audit logging, and operational notices.',
      },
      {
        heading: '2. Retention & Access Controls',
        body: 'Onboarding documents are encrypted at rest inside Indian sovereign cloud regions with role-restricted governance access and periodic retention audits.',
      },
      {
        heading: '3. Data Principal Rights',
        body: 'Authorized representatives may request correction or updates to business contact records through the Workspace Settings or IMDX Privacy Desk.',
      },
    ],
  },
  {
    id: 'security-incident',
    docCode: 'IMDX-POL-09.pdf',
    version: 'v2.1',
    effectiveDate: '01 Apr 2026',
    title: 'Security and Incident Policy',
    summary:
      'Details security controls, credential management, vulnerability disclosure, and mandatory breach notification timelines.',
    sections: [
      {
        heading: '1. Technical Safeguards',
        body: 'All IMDX connectors must enforce mutual TLS 1.3, short-lived signed OAuth/VC tokens, least-privilege IAM, and regular dependency patching.',
      },
      {
        heading: '2. Mandatory Breach Notification',
        body: 'Participants must notify the IMDX Security Operations team within 6 hours of confirming any credential compromise or unauthorized dataset exposure affecting exchange peers.',
      },
      {
        heading: '3. Audit Cooperation',
        body: 'Organizations agree to preserve relevant connector logs for 180 days and cooperate in root-cause verification during cross-participant security incidents.',
      },
    ],
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
