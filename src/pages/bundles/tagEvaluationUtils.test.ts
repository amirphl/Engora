import { describe, expect, it } from '@jest/globals';
import {
  clampBundleFitScore,
  normalizeBundleTagEvaluationStatus,
} from './tagEvaluationUtils';

describe('normalizeBundleTagEvaluationStatus', () => {
  it.each([
    [null, 'not_evaluated'],
    ['Not Evaluated', 'not_evaluated'],
    ['pending', 'evaluating'],
    ['in-progress', 'evaluating'],
    ['completed', 'evaluated'],
    ['UpdateRequired', 'update_required'],
    ['stale', 'update_required'],
    ['failed', 'error'],
  ])('normalizes %p to %s', (input, expected) => {
    expect(normalizeBundleTagEvaluationStatus(input)).toBe(expected);
  });

  it('fails closed for an unsupported server status', () => {
    expect(normalizeBundleTagEvaluationStatus('unexpected-state')).toBe(
      'error'
    );
  });
});

describe('clampBundleFitScore', () => {
  it.each([
    [-1, 0],
    [0, 0],
    [72.5, 72.5],
    [100, 100],
    [101, 100],
    ['45', 45],
    ['not-a-number', 0],
  ])('clamps %p to %p', (input, expected) => {
    expect(clampBundleFitScore(input)).toBe(expected);
  });
});
