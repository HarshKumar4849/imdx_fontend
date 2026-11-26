import chevronSm from '../assets/chevron-sm.svg';
import { COUNTRY_CODES } from '../data/onboardingConstants';

interface PhoneInputProps {
  id: string;
  countryCode: string;
  phoneNumber: string;
  onCountryCodeChange: (code: string) => void;
  onPhoneNumberChange: (phone: string) => void;
  heightClass?: string;
  placeholder?: string;
  error?: string;
}

export function PhoneInput({
  id,
  countryCode,
  phoneNumber,
  onCountryCodeChange,
  onPhoneNumberChange,
  heightClass = 'h-[40px]',
  placeholder = 'Enter your phone number',
  error,
}: PhoneInputProps) {
  return (
    <div>
      <div
        className={`flex items-center w-full ${heightClass} rounded-[9px] border bg-white/95 px-2.5 transition-all focus-within:border-[#008fa7] focus-within:ring-4 focus-within:ring-[#45c0b2]/15 ${
          error ? 'border-[#dc2626]' : 'border-[#c5dbd8]'
        }`}
      >
        <div className="relative flex items-center bg-[#e5faf6] border border-[#45c0b2]/25 rounded-[6px] h-[28px] shrink-0">
          <select
            aria-label="Country code"
            value={countryCode}
            onChange={(e) => onCountryCodeChange(e.target.value)}
            className="appearance-none bg-transparent pl-2 pr-6 h-full text-[13px] text-[#102529] font-medium cursor-pointer focus:outline-none"
          >
            {COUNTRY_CODES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <img
            src={chevronSm}
            alt=""
            width={11}
            height={6}
            className="pointer-events-none absolute right-2 shrink-0"
          />
        </div>

        <input
          id={id}
          type="tel"
          value={phoneNumber}
          onChange={(e) => onPhoneNumberChange(e.target.value)}
          placeholder={placeholder}
          className="ml-2.5 w-full bg-transparent text-[14px] text-[#102529] placeholder:text-[#8ea1a5] focus:outline-none"
        />
      </div>
      {error && <p className="mt-1 text-[12px] text-[#dc2626]">{error}</p>}
    </div>
  );
}
