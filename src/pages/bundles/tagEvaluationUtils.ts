import { BundleTagEvaluationStatus } from '../../types/bundle';

const STATUS_ALIASES: Record<string, BundleTagEvaluationStatus> = {
  not_evaluated: 'not_evaluated',
  evaluating: 'evaluating',
  in_progress: 'evaluating',
  queued: 'evaluating',
  pending: 'evaluating',
  running: 'evaluating',
  processing: 'evaluating',
  evaluated: 'evaluated',
  completed: 'evaluated',
  complete: 'evaluated',
  succeeded: 'evaluated',
  success: 'evaluated',
  update_required: 'update_required',
  stale: 'update_required',
  error: 'error',
  failed: 'error',
  failure: 'error',
};

export const normalizeBundleTagEvaluationStatus = (
  value?: string | null
): BundleTagEvaluationStatus => {
  if (!value?.trim()) return 'not_evaluated';

  const normalized = value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();

  return STATUS_ALIASES[normalized] ?? 'error';
};

export const clampBundleFitScore = (value: unknown): number => {
  const numericValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numericValue)) return 0;
  return Math.min(Math.max(numericValue, 0), 100);
};
