import { useState } from 'react';
import { ENTITY_TYPES } from '../../data/onboardingConstants';
import type { OrganizationData } from '../../types/onboarding';
import { SelectField, TextField } from '../FormField';
import { StepActions } from '../StepActions';

interface OnboardStep01Props {
  data: OrganizationData;
  onChange: (data: OrganizationData) => void;
  onNext: () => void;
}

export function OnboardStep01({ data, onChange, onNext }: OnboardStep01Props) {
  const [errors, setErrors] = useState<Partial<Record<keyof OrganizationData, string>>>({});

  const updateField = (key: keyof OrganizationData, value: string) => {
    onChange({ ...data, [key]: value });
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Partial<Record<keyof OrganizationData, string>> = {};

    if (!data.legalName.trim()) nextErrors.legalName = 'Legal Name is required.';
    if (!data.entityType.trim()) nextErrors.entityType = 'Please select an Entity Type.';
    if (!data.pan.trim()) nextErrors.pan = 'PAN is required.';
    if (!data.country.trim()) nextErrors.country = 'Country is required.';
    if (!data.registeredAddress.trim())
      nextErrors.registeredAddress = 'Registered address is required.';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="mb-4">
        <p className="imdx-kicker">IMDX / STEP 01</p>
        <h2 className="mt-0.5 text-[19px] sm:text-[21px] text-[#102529] leading-tight">
          Onboard Organization form
        </h2>
        <p className="mt-1 text-[13px] sm:text-[14px] text-[#59666d]">
          Provide your organization details to complete your IMDX onboarding and set up your
          organization profile.
        </p>
      </div>

      <div className="imdx-card rounded-[14px] p-5 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <TextField
            id="org-legal-name"
            label="Legal Name"
            required
            value={data.legalName}
            onChange={(val) => updateField('legalName', val)}
            placeholder="e.g. ABC Mobility Technologies Pvt. Ltd."
            error={errors.legalName}
          />

          <SelectField
            id="org-entity-type"
            label="Entity Type"
            required
            value={data.entityType}
            onChange={(val) => updateField('entityType', val)}
            options={ENTITY_TYPES}
            placeholder="Select entity type"
            error={errors.entityType}
          />

          <TextField
            id="org-pan"
            label="PAN"
            required
            value={data.pan}
            onChange={(val) => updateField('pan', val.toUpperCase())}
            placeholder="e.g. ABCDE1234G"
            error={errors.pan}
          />

          <TextField
            id="org-gstin"
            label="GSTIN ( if applicable )"
            value={data.gstin}
            onChange={(val) => updateField('gstin', val.toUpperCase())}
            placeholder="e.g. 29ABCDE1234F1Z5"
          />

          <TextField
            id="org-cin"
            label="CIN ( optional )"
            value={data.cin}
            onChange={(val) => updateField('cin', val.toUpperCase())}
            placeholder="Corporate Identification Number"
          />

          <TextField
            id="org-website"
            label="Website ( optional )"
            type="url"
            value={data.website}
            onChange={(val) => updateField('website', val)}
            placeholder="https://example.com"
          />

          <TextField
            id="org-country"
            label="Country"
            required
            value={data.country}
            onChange={(val) => updateField('country', val)}
            placeholder="e.g. India"
            error={errors.country}
          />

          <TextField
            id="org-sector"
            label="Sector ( optional )"
            value={data.sector}
            onChange={(val) => updateField('sector', val)}
            placeholder="e.g. Urban Mobility / EV / Transit"
          />

          <TextField
            id="org-address"
            label="Registered address"
            required
            value={data.registeredAddress}
            onChange={(val) => updateField('registeredAddress', val)}
            placeholder="Enter complete registered address"
            error={errors.registeredAddress}
            className="md:col-span-2"
          />
        </div>
      </div>

      <StepActions compactNext />
    </form>
  );
}
