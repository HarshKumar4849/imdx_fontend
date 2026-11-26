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
  sizeClass = 'text-[13px] sm:text-[13.5px]',
}: FieldLabelProps) {
  return (
    <label htmlFor={htmlFor} className={`block font-semibold text-[#192a2c] mb-1.5 ${sizeClass}`}>
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
  heightClass = 'h-[40px]',
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
        className={`w-full ${heightClass} rounded-[9px] border bg-white/95 px-3.5 text-[14px] text-[#102529] placeholder:text-[#8ea1a5] transition-all focus:outline-none focus:border-[#008fa7] focus:ring-4 focus:ring-[#45c0b2]/15 ${
          error ? 'border-[#dc2626]' : 'border-[#c5dbd8]'
        }`}
      />
      {error && <p className="mt-1 text-[12px] text-[#dc2626]">{error}</p>}
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
          className={`w-full h-[40px] appearance-none rounded-[9px] border bg-white/95 pl-3.5 pr-10 text-[14px] transition-all focus:outline-none focus:border-[#008fa7] focus:ring-4 focus:ring-[#45c0b2]/15 cursor-pointer ${
            value ? 'text-[#102529]' : 'text-[#8ea1a5]'
          } ${error ? 'border-[#dc2626]' : 'border-[#c5dbd8]'}`}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt} value={opt} className="text-[#102529]">
              {opt}
            </option>
          ))}
        </select>
        <img
          src={chevronLg}
          alt=""
          width={15}
          height={9}
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 shrink-0"
        />
      </div>
      {error && <p className="mt-1 text-[12px] text-[#dc2626]">{error}</p>}
    </div>
  );
}
