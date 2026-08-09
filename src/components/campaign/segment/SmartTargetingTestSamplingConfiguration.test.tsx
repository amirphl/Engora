import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, jest } from '@jest/globals';
import { campaignLevelI18n } from './segmentTranslations';
import SmartTargetingTestSamplingConfiguration from './SmartTargetingTestSamplingConfiguration';

const copy = campaignLevelI18n.en.smartTargeting.testPreview;

describe('SmartTargetingTestSamplingConfiguration', () => {
  it('keeps required Test inputs on the segment page', () => {
    const onSampleSizeChange = jest.fn();
    const onScoreClassesChange = jest.fn();

    render(
      <SmartTargetingTestSamplingConfiguration
        selectedTagCount={1}
        sampleSizePerTag={0}
        selectedScoreClasses={[]}
        onSampleSizeChange={onSampleSizeChange}
        onScoreClassesChange={onScoreClassesChange}
        copy={copy}
      />
    );

    fireEvent.change(screen.getByRole('spinbutton'), {
      target: { value: '600' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: /Class A/i }));

    expect(onSampleSizeChange).toHaveBeenCalledWith(600);
    expect(onScoreClassesChange).toHaveBeenCalledWith(['A']);
    expect(screen.getByText(copy.sampleSizeInvalid)).toBeTruthy();
    expect(screen.getByText(copy.scoreClassesRequired)).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: copy.checkAvailability })
    ).toBeNull();
  });
});
