import type { ReactNode } from 'react';
import chevronLg from '../assets/chevron-lg.svg';

interface FieldLabelProps {
  htmlFor: string;
  label: string;
  required?: boolean;
  sizeClass?: string;
}

export function FieldLabel({
  htmlFor,
  label,
  required = false,
  sizeClass = 'text-[18px] sm:text-[20px]',
}: FieldLabelProps) {
  return (
    <label htmlFor={htmlFor} className={`block font-normal text-[#0f0f0f] mb-2.5 ${sizeClass}`}>
      {label}
      {required && <span className="text-[#dc2626] ml-1">*</span>}
    </label>
  );
}

interface TextFieldProps {
  id: string;
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'url';
  heightClass?: string;
  error?: string;
  className?: string;
}

export function TextField({
  id,
  label,
  required = false,
  value,
  onChange,
  placeholder,
  type = 'text',
  heightClass = 'h-[64px]',
  error,
  className = '',
}: TextFieldProps) {
  return (
    <div className={className}>
      <FieldLabel htmlFor={id} label={label} required={required} />
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full ${heightClass} rounded-[11px] border bg-white px-4 text-[17px] text-[#0f0f0f] placeholder:text-[#a3a3a3] transition-colors focus:outline-none focus:border-[#002456] ${
          error ? 'border-[#dc2626]' : 'border-[#c1c1c1]'
        }`}
      />
      {error && <p className="mt-1.5 text-[13px] text-[#dc2626]">{error}</p>}
    </div>
  );
}

interface SelectFieldProps {
  id: string;
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  error?: string;
  children?: ReactNode;
}

export function SelectField({
  id,
  label,
  required = false,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  error,
}: SelectFieldProps) {
  return (
    <div>
      <FieldLabel htmlFor={id} label={label} required={required} />
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full h-[64px] appearance-none rounded-[11px] border bg-white pl-4 pr-12 text-[17px] transition-colors focus:outline-none focus:border-[#002456] cursor-pointer ${
            value ? 'text-[#0f0f0f]' : 'text-[#a3a3a3]'
          } ${error ? 'border-[#dc2626]' : 'border-[#c1c1c1]'}`}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt} value={opt} className="text-[#0f0f0f]">
              {opt}
            </option>
          ))}
        </select>
        <img
          src={chevronLg}
          alt=""
          width={21}
          height={12}
          className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 shrink-0"
        />
      </div>
      {error && <p className="mt-1.5 text-[13px] text-[#dc2626]">{error}</p>}
    </div>
  );
}
