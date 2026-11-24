import { useState } from 'react';
import type { RegistrationData } from '../../types/onboarding';
import { PhoneInput } from '../PhoneInput';
import { FieldLabel } from '../FormField';

interface RegisterScreenProps {
  data: RegistrationData;
  onChange: (data: RegistrationData) => void;
  onSubmit: () => void;
}

export function RegisterScreen({ data, onChange, onSubmit }: RegisterScreenProps) {
  const [errors, setErrors] = useState<Partial<Record<keyof RegistrationData, string>>>({});

  const validateAndSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Partial<Record<keyof RegistrationData, string>> = {};

    if (!data.fullName.trim()) {
      nextErrors.fullName = 'Please enter your full name.';
    }
    if (!data.workEmail.trim()) {
      nextErrors.workEmail = 'Please enter your work email.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.workEmail.trim())) {
      nextErrors.workEmail = 'Please enter a valid work email address.';
    }
    if (!data.phoneNumber.trim()) {
      nextErrors.phoneNumber = 'Please enter your phone number.';
    } else if (data.phoneNumber.replace(/\D/g, '').length < 7) {
      nextErrors.phoneNumber = 'Please enter a valid phone number.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      onSubmit();
    }
  };

  return (
    <div className="min-h-[calc(100vh-71px)] flex items-center justify-center px-4 py-12">
      <form
        onSubmit={validateAndSubmit}
        noValidate
        className="w-full max-w-[764px] bg-white border border-[#c1c1c1] rounded-[20px] px-6 sm:px-[34px] py-8 sm:py-9"
      >
        <h1 className="text-[24px] sm:text-[26px] font-semibold text-[#0f0f0f] leading-normal">
          Start your application
        </h1>
        <p className="mt-2 text-[16px] sm:text-[18px] text-[#808080] tracking-[0.18px] leading-normal">
          Enter your official work email, and we&apos;ll send you a secure link to continue your
          IMDX application
        </p>

        <div className="mt-8 space-y-6">
          <div>
            <FieldLabel htmlFor="reg-full-name" label="Full Name" />
            <input
              id="reg-full-name"
              type="text"
              value={data.fullName}
              onChange={(e) => {
                onChange({ ...data, fullName: e.target.value });
                if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
              }}
              placeholder="Enter your full name"
              className={`w-full h-[57px] rounded-[11px] border bg-white px-4 text-[17px] sm:text-[18px] text-[#0f0f0f] placeholder:text-[#a3a3a3] focus:outline-none focus:border-[#002456] ${
                errors.fullName ? 'border-[#dc2626]' : 'border-[#c1c1c1]'
              }`}
            />
            {errors.fullName && (
              <p className="mt-1.5 text-[13px] text-[#dc2626]">{errors.fullName}</p>
            )}
          </div>

          <div>
            <FieldLabel htmlFor="reg-work-email" label="Work Email" />
            <input
              id="reg-work-email"
              type="email"
              value={data.workEmail}
              onChange={(e) => {
                onChange({ ...data, workEmail: e.target.value });
                if (errors.workEmail) setErrors((prev) => ({ ...prev, workEmail: undefined }));
              }}
              placeholder="name@organization.com"
              className={`w-full h-[57px] rounded-[11px] border bg-white px-4 text-[17px] sm:text-[18px] text-[#0f0f0f] placeholder:text-[#a3a3a3] focus:outline-none focus:border-[#002456] ${
                errors.workEmail ? 'border-[#dc2626]' : 'border-[#c1c1c1]'
              }`}
            />
            {errors.workEmail && (
              <p className="mt-1.5 text-[13px] text-[#dc2626]">{errors.workEmail}</p>
            )}
          </div>

          <div>
            <FieldLabel htmlFor="reg-phone" label="Phone Number" />
            <PhoneInput
              id="reg-phone"
              countryCode={data.countryCode}
              phoneNumber={data.phoneNumber}
              onCountryCodeChange={(countryCode) => onChange({ ...data, countryCode })}
              onPhoneNumberChange={(phoneNumber) => {
                onChange({ ...data, phoneNumber });
                if (errors.phoneNumber) setErrors((prev) => ({ ...prev, phoneNumber: undefined }));
              }}
              error={errors.phoneNumber}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full h-[57px] rounded-[45px] bg-[#32c4a6] hover:bg-[#2ab195] text-white text-[20px] sm:text-[24px] font-semibold transition-colors cursor-pointer"
            >
              Start Application
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
