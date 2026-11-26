import { useState } from 'react';
import { DESIGNATIONS } from '../../data/onboardingConstants';
import type { RepresentativeData } from '../../types/onboarding';
import { FieldLabel, SelectField, TextField } from '../FormField';
import { PhoneInput } from '../PhoneInput';
import { StepActions } from '../StepActions';

interface OnboardStep02Props {
  data: RepresentativeData;
  onChange: (data: RepresentativeData) => void;
  onBack: () => void;
  onNext: () => void;
}

export function OnboardStep02({ data, onChange, onBack, onNext }: OnboardStep02Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = <K extends keyof RepresentativeData>(
    key: K,
    value: RepresentativeData[K],
  ) => {
    onChange({ ...data, [key]: value });
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (!data.name.trim()) nextErrors.name = 'Name is required.';
    if (!data.designation.trim()) nextErrors.designation = 'Please select a Designation.';
    if (!data.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
      nextErrors.email = 'Please enter a valid email address.';
    }
    if (!data.phoneNumber.trim()) {
      nextErrors.phoneNumber = 'Phone Number is required.';
    }
    if (!data.isDirectorOrOfficer || !data.isAuthorizedToBind) {
      nextErrors.declarations = 'Please confirm both authorization declarations to proceed.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="mb-4">
        <p className="imdx-kicker">IMDX / STEP 02</p>
        <h2 className="mt-0.5 text-[19px] sm:text-[21px] text-[#102529] leading-tight">
          Authorized Representative Details
        </h2>
        <p className="mt-1 text-[13px] sm:text-[14px] text-[#59666d]">
          Provide the details of the person authorized to represent your organization and manage its
          participation in IMDX.
        </p>
      </div>

      <div className="imdx-card rounded-[14px] p-5 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <TextField
            id="rep-name"
            label="Name"
            required
            value={data.name}
            onChange={(val) => updateField('name', val)}
            placeholder="e.g. Sakshi Shinde"
            error={errors.name}
          />

          <SelectField
            id="rep-designation"
            label="Designation"
            required
            value={data.designation}
            onChange={(val) => updateField('designation', val)}
            options={DESIGNATIONS}
            placeholder="Select designation"
            error={errors.designation}
          />

          <TextField
            id="rep-email"
            label="Email"
            required
            type="email"
            value={data.email}
            onChange={(val) => updateField('email', val)}
            placeholder="name@organization.com"
            error={errors.email}
          />

          <div>
            <FieldLabel htmlFor="rep-phone" label="Phone Number" required />
            <PhoneInput
              id="rep-phone"
              heightClass="h-[40px]"
              countryCode={data.countryCode}
              phoneNumber={data.phoneNumber}
              onCountryCodeChange={(code) => updateField('countryCode', code)}
              onPhoneNumberChange={(phone) => updateField('phoneNumber', phone)}
              error={errors.phoneNumber}
            />
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-[#0f766e]/15 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={data.isDirectorOrOfficer}
              onChange={(e) => {
                onChange({ ...data, isDirectorOrOfficer: e.target.checked });
                if (errors.declarations) setErrors((prev) => ({ ...prev, declarations: '' }));
              }}
              className="size-[18px] shrink-0 rounded-[4px] border border-[#bfd8d4] accent-[#00a5c3] cursor-pointer"
            />
            <span className="text-[13.5px] sm:text-[14px] text-[#102529]">
              I am director or officer of this organization
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={data.isAuthorizedToBind}
              onChange={(e) => {
                onChange({ ...data, isAuthorizedToBind: e.target.checked });
                if (errors.declarations) setErrors((prev) => ({ ...prev, declarations: '' }));
              }}
              className="size-[18px] shrink-0 rounded-[4px] border border-[#bfd8d4] accent-[#00a5c3] cursor-pointer"
            />
            <span className="text-[13.5px] sm:text-[14px] text-[#102529]">
              I am authorized to bind this organization to these terms
            </span>
          </label>

          {errors.declarations && (
            <p className="text-[12px] text-[#dc2626] pt-0.5">{errors.declarations}</p>
          )}
        </div>
      </div>

      <StepActions onBack={onBack} />
    </form>
  );
}
