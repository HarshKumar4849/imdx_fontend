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
  heightClass = 'h-[57px]',
  placeholder = 'Enter your phone number',
  error,
}: PhoneInputProps) {
  return (
    <div>
      <div
        className={`flex items-center w-full ${heightClass} rounded-[11px] border bg-white px-3 transition-colors focus-within:border-[#002456] ${
          error ? 'border-[#dc2626]' : 'border-[#c1c1c1]'
        }`}
      >
        <div className="relative flex items-center bg-[#ededed] rounded-[8px] h-[36px] shrink-0">
          <select
            aria-label="Country code"
            value={countryCode}
            onChange={(e) => onCountryCodeChange(e.target.value)}
            className="appearance-none bg-transparent pl-2.5 pr-7 h-full text-[16px] sm:text-[17px] text-[#0f0f0f] cursor-pointer focus:outline-none"
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
            width={13}
            height={7.5}
            className="pointer-events-none absolute right-2.5 shrink-0"
          />
        </div>

        <input
          id={id}
          type="tel"
          value={phoneNumber}
          onChange={(e) => onPhoneNumberChange(e.target.value)}
          placeholder={placeholder}
          className="ml-3 w-full bg-transparent text-[16px] sm:text-[18px] text-[#0f0f0f] placeholder:text-[#a3a3a3] focus:outline-none"
        />
      </div>
      {error && <p className="mt-1.5 text-[13px] text-[#dc2626]">{error}</p>}
    </div>
  );
}
