import { useState } from 'react';
import type { RegistrationData } from '../../types/onboarding';
import { FieldLabel } from '../FormField';
import { PhoneInput } from '../PhoneInput';

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
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-6">
      <div className="relative w-full max-w-[460px]">
        {/* Landing-style corner registration pluses */}
        <span
          aria-hidden="true"
          style={{ ['--stagger-i' as string]: 0 }}
          className="imdx-corner-plus hidden sm:block pointer-events-none absolute -top-3.5 -left-3.5 text-[#008fa7]/70 font-mono text-[15px] leading-none"
        >
          +
        </span>
        <span
          aria-hidden="true"
          style={{ ['--stagger-i' as string]: 1 }}
          className="imdx-corner-plus hidden sm:block pointer-events-none absolute -top-3.5 -right-3.5 text-[#008fa7]/70 font-mono text-[15px] leading-none"
        >
          +
        </span>
        <span
          aria-hidden="true"
          style={{ ['--stagger-i' as string]: 2 }}
          className="imdx-corner-plus hidden sm:block pointer-events-none absolute -bottom-3.5 -left-3.5 text-[#008fa7]/70 font-mono text-[15px] leading-none"
        >
          +
        </span>
        <span
          aria-hidden="true"
          style={{ ['--stagger-i' as string]: 3 }}
          className="imdx-corner-plus hidden sm:block pointer-events-none absolute -bottom-3.5 -right-3.5 text-[#008fa7]/70 font-mono text-[15px] leading-none"
        >
          +
        </span>

        <form
          onSubmit={validateAndSubmit}
          noValidate
          className="imdx-card rounded-[14px] overflow-hidden"
        >
          <div className="imdx-rule-animate h-[3px] w-full bg-gradient-to-r from-[#45c0b2] via-[#00a5c3] to-[#3987cf]" />

          <div className="px-5 sm:px-7 py-5 sm:py-6">
            <p className="imdx-kicker">IMDX / PARTICIPANT REGISTRATION</p>
            <h1 className="mt-1.5 text-[22px] sm:text-[24px] text-[#102529] leading-tight">
              Start your <span className="imdx-gradient-text">application</span>
            </h1>
            <p className="mt-1.5 text-[13px] sm:text-[13.5px] text-[#59666d] leading-relaxed">
              Enter your official work email, and we&apos;ll send you a secure link to continue your
              IMDX application.
            </p>

            <div className="mt-5 space-y-4">
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
                  className={`w-full h-[40px] rounded-[9px] border bg-white/95 px-3.5 text-[14px] text-[#102529] placeholder:text-[#8ea1a5] transition-all focus:outline-none focus:border-[#008fa7] focus:ring-4 focus:ring-[#45c0b2]/15 ${
                    errors.fullName ? 'border-[#dc2626]' : 'border-[#c5dbd8]'
                  }`}
                />
                {errors.fullName && (
                  <p className="mt-1 text-[12px] text-[#dc2626]">{errors.fullName}</p>
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
                  className={`w-full h-[40px] rounded-[9px] border bg-white/95 px-3.5 text-[14px] text-[#102529] placeholder:text-[#8ea1a5] transition-all focus:outline-none focus:border-[#008fa7] focus:ring-4 focus:ring-[#45c0b2]/15 ${
                    errors.workEmail ? 'border-[#dc2626]' : 'border-[#c5dbd8]'
                  }`}
                />
                {errors.workEmail && (
                  <p className="mt-1 text-[12px] text-[#dc2626]">{errors.workEmail}</p>
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
                    if (errors.phoneNumber)
                      setErrors((prev) => ({ ...prev, phoneNumber: undefined }));
                  }}
                  error={errors.phoneNumber}
                />
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  className="w-full h-[42px] rounded-[45px] imdx-btn-primary text-[15px] font-semibold cursor-pointer"
                >
                  Start Application →
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
