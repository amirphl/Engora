import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordFieldProps {
  value: string;
  error?: string;
  label: string;
  placeholder?: string;
  showPassword: boolean;
  onToggleShow: () => void;
  onChange: (value: string) => void;
  isRTL: boolean;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  inputRef?: React.Ref<HTMLInputElement>;
}

const PasswordField: React.FC<PasswordFieldProps> = ({
  value,
  error,
  label,
  placeholder,
  showPassword,
  onToggleShow,
  onChange,
  isRTL,
  onBlur,
  inputRef,
}) => (
  <div>
    <label
      htmlFor='password'
      className='block text-sm font-medium text-gray-700 mb-2'
    >
      {label}
    </label>
    <div className='relative'>
      <input
        type={showPassword ? 'text' : 'password'}
        id='password'
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        ref={inputRef}
        className={`input-field ${isRTL ? 'pl-10' : 'pr-10'}`}
        placeholder={placeholder}
        dir='ltr'
        required
        minLength={8}
        maxLength={100}
        autoComplete='current-password'
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'password-error' : undefined}
      />
      <button
        type='button'
        onClick={onToggleShow}
        className={`absolute inset-y-0 ${isRTL ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center`}
      >
        {showPassword ? (
          <EyeOff className='h-5 w-5 text-gray-400' />
        ) : (
          <Eye className='h-5 w-5 text-gray-400' />
        )}
      </button>
    </div>
    {error && (
      <p id='password-error' className='mt-2 text-sm text-red-600'>
        {error}
      </p>
    )}
  </div>
);

export default PasswordField;
