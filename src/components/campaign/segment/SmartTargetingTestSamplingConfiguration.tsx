import React from 'react';
import { FlaskConical } from 'lucide-react';
import { AudienceGrade } from '../../../types/campaign';
import SmartTargetingScoreClassSelector from './SmartTargetingScoreClassSelector';
import type { SmartTargetingTestPreviewCopy } from './SmartTargetingTestSamplingPreview';

interface SmartTargetingTestSamplingConfigurationProps {
  selectedTagCount: number;
  sampleSizePerTag: number;
  selectedScoreClasses: AudienceGrade[];
  onSampleSizeChange: (value: number) => void;
  onScoreClassesChange: (value: AudienceGrade[]) => void;
  copy: SmartTargetingTestPreviewCopy;
}

const SmartTargetingTestSamplingConfiguration: React.FC<
  SmartTargetingTestSamplingConfigurationProps
> = ({
  selectedTagCount,
  sampleSizePerTag,
  selectedScoreClasses,
  onSampleSizeChange,
  onScoreClassesChange,
  copy,
}) => {
  const sampleSizeIsValid =
    Number.isSafeInteger(sampleSizePerTag) &&
    sampleSizePerTag > 0 &&
    Number.isSafeInteger(sampleSizePerTag * selectedTagCount);

  return (
    <section
      className='mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5'
      aria-labelledby='smart-targeting-test-configuration-title'
    >
      <div className='flex items-start gap-3'>
        <FlaskConical className='mt-0.5 h-5 w-5 shrink-0 text-primary-600' />
        <div>
          <h3
            id='smart-targeting-test-configuration-title'
            className='font-semibold text-gray-900'
          >
            {copy.title}
          </h3>
          <p className='mt-1 text-sm text-gray-600'>{copy.description}</p>
        </div>
      </div>

      <label className='mt-5 block max-w-sm text-sm font-medium text-gray-900'>
        <span>
          {copy.sampleSizeLabel} <span className='text-red-600'>*</span>
        </span>
        <input
          type='number'
          min={1}
          step={1}
          required
          value={sampleSizePerTag || ''}
          onChange={event => onSampleSizeChange(Number(event.target.value))}
          className='mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'
        />
        <span className='mt-1 block text-xs font-normal text-gray-500'>
          {copy.sampleSizeHelp}
        </span>
      </label>
      {!sampleSizeIsValid ? (
        <p className='mt-2 text-sm text-red-600' role='alert'>
          {copy.sampleSizeInvalid}
        </p>
      ) : null}

      <div className='mt-5'>
        <SmartTargetingScoreClassSelector
          value={selectedScoreClasses}
          onChange={onScoreClassesChange}
          copy={copy}
          required
          requiredMessage={copy.scoreClassesRequired}
        />
      </div>
    </section>
  );
};

export default SmartTargetingTestSamplingConfiguration;
