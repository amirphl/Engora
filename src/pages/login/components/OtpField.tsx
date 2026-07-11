import React from 'react';

interface OtpFieldProps {
  value: string;
  label: string;
  placeholder: string;
  error?: string;
  onChange: (value: string) => void;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  inputRef?: React.Ref<HTMLInputElement>;
}

const OtpField: React.FC<OtpFieldProps> = ({
  value,
  label,
  placeholder,
  error,
  onChange,
  onBlur,
  inputRef,
}) => (
  <div>
    <label
      htmlFor='otp-code'
      className='block text-sm font-medium text-gray-700 mb-2'
    >
      {label}
    </label>
    <input
      id='otp-code'
      type='text'
      value={value}
      onChange={event => onChange(event.target.value)}
      onBlur={onBlur}
      ref={inputRef}
      className='input-field text-center text-xl tracking-widest'
      placeholder={placeholder}
      dir='ltr'
      required
      maxLength={6}
      inputMode='numeric'
      autoComplete='one-time-code'
      aria-invalid={Boolean(error)}
      aria-describedby={error ? 'otp-code-error' : undefined}
    />
    {error && (
      <p id='otp-code-error' className='mt-2 text-sm text-red-600'>
        {error}
      </p>
    )}
  </div>
);

export default OtpField;
