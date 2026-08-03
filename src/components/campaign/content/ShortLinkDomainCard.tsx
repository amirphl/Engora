import React from 'react';
import Card from '../../ui/Card';
import FormField from '../../ui/FormField';
import { ALLOWED_SHORT_LINK_DOMAINS } from '../../../utils/campaignUtils';

const AVAILABLE_DOMAINS = ALLOWED_SHORT_LINK_DOMAINS.map(domain => ({
  value: domain,
  label: domain,
}));

interface ShortLinkDomainCardProps {
  value: string | null;
  onChange: (value: string | null) => void;
  title: string;
  placeholder: string;
  onLabel: string;
  offLabel: string;
  enabledLabel: string;
  disabledLabel: string;
}

const ShortLinkDomainCard: React.FC<ShortLinkDomainCardProps> = ({
  value,
  onChange,
  title,
  placeholder,
  onLabel,
  offLabel,
  enabledLabel,
  disabledLabel,
}) => {
  const isEnabled = Boolean(value?.trim());

  const handleToggleOn = () => {
    if (!isEnabled) {
      onChange(AVAILABLE_DOMAINS[0].value);
    }
  };

  const handleToggleOff = () => {
    if (isEnabled) {
      onChange(null);
    }
  };

  return (
    <Card>
      <div className='space-y-4'>
        <h3 className='text-lg font-medium text-gray-900'>{title}</h3>
        <div className='flex items-center space-x-4'>
          <label className='inline-flex items-center space-x-2 cursor-pointer'>
            <input
              type='radio'
              name='shortLinkDomain'
              value='on'
              checked={isEnabled}
              onChange={handleToggleOn}
              className='h-4 w-4 text-primary-600 border-gray-300'
            />
            <span className='text-sm text-gray-700'>{onLabel}</span>
          </label>
          <label className='inline-flex items-center space-x-2 cursor-pointer'>
            <input
              type='radio'
              name='shortLinkDomain'
              value='off'
              checked={!isEnabled}
              onChange={handleToggleOff}
              className='h-4 w-4 text-primary-600 border-gray-300'
            />
            <span className='text-sm text-gray-700'>{offLabel}</span>
          </label>
          <span className='text-sm text-gray-600'>
            {isEnabled ? enabledLabel : disabledLabel}
          </span>
        </div>
        {isEnabled && (
          <FormField
            id='shortLinkDomain'
            label={''}
            type='select'
            options={AVAILABLE_DOMAINS}
            value={value ?? ''}
            onChange={onChange}
            required
            placeholder={placeholder}
          />
        )}
      </div>
    </Card>
  );
};

export default ShortLinkDomainCard;
