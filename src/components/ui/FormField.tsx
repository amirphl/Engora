import React, { forwardRef } from 'react';
import { FormField as FormFieldType } from '../../types/campaign';

interface FormFieldProps extends FormFieldType {
  value: any;
  onChange: (value: any) => void;
  error?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  rows?: number;
  onBlur?: React.FocusEventHandler<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >;
}

const FormField = forwardRef<HTMLTextAreaElement, FormFieldProps>(
  (
    {
      id,
      label,
      type,
      placeholder,
      required = false,
      options = [],
      validation,
      value,
      onChange,
      error,
      className = '',
      inputClassName = '',
      disabled = false,
      rows,
      onBlur,
    },
    ref
  ) => {
    const handleChange = (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      let newValue: any = e.target.value;

      if (type === 'number') {
        newValue = Number(newValue) || 0;
      } else if (type === 'checkbox') {
        newValue = (e.target as HTMLInputElement).checked;
      }

      onChange(newValue);
    };

    const renderInput = () => {
      switch (type) {
        case 'textarea':
          return (
            <textarea
              id={id}
              rows={rows ?? 4}
              value={value || ''}
              onChange={handleChange}
              onBlur={onBlur}
              placeholder={placeholder}
              required={required}
              disabled={disabled}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none ${error ? 'border-red-300' : 'border-gray-300'} ${inputClassName}`}
              ref={ref}
            />
          );

        case 'select':
          return (
            <select
              id={id}
              value={value || ''}
              onChange={handleChange}
              onBlur={onBlur}
              required={required}
              disabled={disabled}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${error ? 'border-red-300' : 'border-gray-300'} ${inputClassName}`}
            >
              <option value=''>{placeholder || 'Select an option'}</option>
              {options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          );

        case 'checkbox':
          return (
            <input
              id={id}
              type='checkbox'
              checked={value || false}
              onChange={handleChange}
              onBlur={onBlur}
              required={required}
              disabled={disabled}
              className={`h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded ${inputClassName}`}
            />
          );

        case 'radio':
          return (
            <div className='space-y-2'>
              {options.map(option => (
                <label key={option.value} className='flex items-center'>
                  <input
                    type='radio'
                    name={id}
                    value={option.value}
                    checked={value === option.value}
                    onChange={handleChange}
                    onBlur={onBlur}
                    disabled={disabled}
                    className={`h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 ${inputClassName}`}
                  />
                  <span className='ml-2 text-sm text-gray-700'>
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          );

        default:
          return (
            <input
              id={id}
              type={type}
              value={value || ''}
              onChange={handleChange}
              onBlur={onBlur}
              placeholder={placeholder}
              required={required}
              disabled={disabled}
              min={validation?.min}
              max={validation?.max}
              maxLength={type === 'text' ? validation?.max : undefined}
              pattern={validation?.pattern}
              step={validation?.step}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${error ? 'border-red-300' : 'border-gray-300'} ${inputClassName}`}
            />
          );
      }
    };

    return (
      <div className={`space-y-2 ${className}`}>
        <label htmlFor={id} className='block text-sm font-medium text-gray-700'>
          {label}
          {label && required && <span className='text-red-500 ml-1'>*</span>}
        </label>

        {renderInput()}

        {error && <p className='text-sm text-red-600'>{error}</p>}

        {validation?.message && !error && (
          <p className='text-sm text-gray-500'>{validation.message}</p>
        )}
      </div>
    );
  }
);

export default FormField;
