import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, FlaskConical } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useLanguage } from '../../../hooks/useLanguage';
import { apiService } from '../../../services/api';
import {
  AudienceGrade,
  CampaignPlatform,
  SmartTargetingSortBy,
  SmartTargetingSortDirection,
  SmartTargetingTestSamplingPreviewResponse,
  SmartTargetingTestSamplingTagResult,
} from '../../../types/campaign';
import { getErrorMessage } from '../../../utils/errorHandler';
import { getEffectiveScoreClassKey } from '../../../utils/smartTargetingCapacity';
import {
  areSameOrderedTagIds,
  normalizeOrderedTagIds,
  normalizeSmartTargetingTestPreview,
} from '../../../utils/smartTargetingTestPreview';
import Button from '../../ui/Button';
import SmartTargetingScoreClassSelector, {
  SmartTargetingScoreClassCopy,
} from './SmartTargetingScoreClassSelector';

export interface SmartTargetingTestPreviewCopy extends SmartTargetingScoreClassCopy {
  title: string;
  description: string;
  sampleSizeLabel: string;
  sampleSizeHelp: string;
  sampleSizeInvalid: string;
  selectedTags: string;
  requestedAudience: string;
  satisfiedTags: string;
  unsatisfiedTags: string;
  effectiveAudience: string;
  campaignCost: string;
  audiences: string;
  currency: string;
  checkAvailability: string;
  checkingAvailability: string;
  selectTags: string;
  completeCampaignDataFirst: string;
  campaignWillBeCreated: string;
  campaignPreparationFailed: string;
  selectionSaveFailed: string;
  previewFailed: string;
  invalidResponse: string;
  inputsChangedDuringRequest: string;
  selectionOrderPending: string;
  stale: string;
  previewRequired: string;
  unsatisfiedWarning: string;
  availabilityLabel: string;
  tagLabel: string;
  estimateLimitation: string;
}

interface SmartTargetingTestSamplingPreviewProps {
  campaignUuid?: string;
  bundleId?: number | null;
  platform: CampaignPlatform;
  selectedTagIds: number[];
  selectedRawCapacity: number;
  sampleSizePerTag: number;
  selectedScoreClasses: AudienceGrade[];
  sortBy: SmartTargetingSortBy | '';
  sortDirection: SmartTargetingSortDirection;
  preview?: SmartTargetingTestSamplingPreviewResponse | null;
  previewIsCurrent: boolean;
  previewIsStale: boolean;
  selectionOrderIsPending: boolean;
  canCreateCampaign: boolean;
  prepareCampaign: (signal?: AbortSignal) => Promise<{
    success: boolean;
    uuid?: string;
    errorCode?: string;
  }>;
  onSampleSizeChange: (value: number) => void;
  onScoreClassesChange: (value: AudienceGrade[]) => void;
  onConfigurationPersisted: (
    tagIds: number[],
    selectedRawCapacity: number
  ) => void;
  onPreviewChange: (
    preview: SmartTargetingTestSamplingPreviewResponse,
    campaignUuid: string
  ) => void;
  copy: SmartTargetingTestPreviewCopy;
}

const SmartTargetingTestSamplingPreview: React.FC<
  SmartTargetingTestSamplingPreviewProps
> = ({
  campaignUuid,
  bundleId,
  platform,
  selectedTagIds,
  selectedRawCapacity,
  sampleSizePerTag,
  selectedScoreClasses,
  sortBy,
  sortDirection,
  preview,
  previewIsCurrent,
  previewIsStale,
  selectionOrderIsPending,
  canCreateCampaign,
  prepareCampaign,
  onSampleSizeChange,
  onScoreClassesChange,
  onConfigurationPersisted,
  onPreviewChange,
  copy,
}) => {
  const { accessToken } = useAuth();
  const { language } = useLanguage();
  const locale = language === 'fa' ? 'fa-IR' : 'en-US';
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestSequenceRef = useRef(0);
  const requestInFlightRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const campaignUuidRef = useRef(campaignUuid?.trim() || '');
  campaignUuidRef.current = campaignUuid?.trim() || '';

  const orderedTagIds = useMemo(
    () => normalizeOrderedTagIds(selectedTagIds),
    [selectedTagIds]
  );
  // Campaign creation changes the UUID during an in-flight preview request;
  // it is an expected transition, not an effective sampling-input change.
  const inputKey = `${bundleId ?? 'no-bundle'}|${platform}|${orderedTagIds.join(
    ','
  )}|${sampleSizePerTag}|${getEffectiveScoreClassKey(
    selectedScoreClasses
  )}|${sortBy || 'default'}|${sortBy ? sortDirection : 'default'}`;
  const inputKeyRef = useRef(inputKey);
  inputKeyRef.current = inputKey;

  const sampleSizeIsValid =
    Number.isSafeInteger(sampleSizePerTag) && sampleSizePerTag > 0;
  const requestedAudienceCount = sampleSizeIsValid
    ? orderedTagIds.length * sampleSizePerTag
    : 0;
  const requestedAudienceIsValid = Number.isSafeInteger(requestedAudienceCount);
  const currentPreview = previewIsCurrent
    ? normalizeSmartTargetingTestPreview(preview)
    : null;

  useEffect(() => {
    apiService.setAccessToken(accessToken || null);
  }, [accessToken]);

  useEffect(() => {
    requestSequenceRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    requestInFlightRef.current = false;
    setIsLoading(false);
    setError(null);
  }, [inputKey]);

  useEffect(
    () => () => {
      requestSequenceRef.current += 1;
      requestInFlightRef.current = false;
      abortRef.current?.abort();
    },
    []
  );

  const handlePreview = async () => {
    if (requestInFlightRef.current) return;
    if (orderedTagIds.length === 0) {
      setError(copy.selectTags);
      return;
    }
    if (selectionOrderIsPending) {
      setError(copy.selectionOrderPending);
      return;
    }
    if (!sampleSizeIsValid || !requestedAudienceIsValid) {
      setError(copy.sampleSizeInvalid);
      return;
    }
    if (!campaignUuid?.trim() && !canCreateCampaign) {
      setError(copy.completeCampaignDataFirst);
      return;
    }

    const sequence = requestSequenceRef.current + 1;
    requestSequenceRef.current = sequence;
    const requestedInputKey = inputKeyRef.current;
    const requestedCampaignUuid = campaignUuidRef.current;
    const requestedTagIds = [...orderedTagIds];
    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;
    requestInFlightRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const prepared = await prepareCampaign(controller.signal);
      if (controller.signal.aborted || requestSequenceRef.current !== sequence)
        return;
      if (!prepared.success || !prepared.uuid?.trim()) {
        setError(
          getErrorMessage(
            prepared.errorCode,
            language,
            copy.campaignPreparationFailed
          )
        );
        return;
      }
      const preparedUuid = prepared.uuid.trim();
      const currentCampaignUuid = campaignUuidRef.current;
      const campaignContextMatches = requestedCampaignUuid
        ? currentCampaignUuid === requestedCampaignUuid &&
          preparedUuid === requestedCampaignUuid
        : !currentCampaignUuid || currentCampaignUuid === preparedUuid;
      if (!campaignContextMatches) {
        setError(copy.inputsChangedDuringRequest);
        return;
      }
      if (inputKeyRef.current !== requestedInputKey) {
        setError(copy.inputsChangedDuringRequest);
        return;
      }

      const selectionResponse =
        await apiService.replaceCampaignSmartTargetingSelection(
          preparedUuid,
          { tag_ids: requestedTagIds },
          controller.signal
        );
      if (controller.signal.aborted || requestSequenceRef.current !== sequence)
        return;
      if (!selectionResponse.success || !selectionResponse.data) {
        setError(
          getErrorMessage(
            selectionResponse.error?.code,
            language,
            copy.selectionSaveFailed
          )
        );
        return;
      }
      if (
        inputKeyRef.current !== requestedInputKey ||
        (campaignUuidRef.current && campaignUuidRef.current !== preparedUuid) ||
        !areSameOrderedTagIds(
          selectionResponse.data.selected_tag_ids,
          requestedTagIds
        )
      ) {
        const contextChanged =
          inputKeyRef.current !== requestedInputKey ||
          Boolean(
            campaignUuidRef.current && campaignUuidRef.current !== preparedUuid
          );
        setError(
          contextChanged
            ? copy.inputsChangedDuringRequest
            : copy.invalidResponse
        );
        return;
      }

      onConfigurationPersisted(
        requestedTagIds,
        Math.max(
          0,
          selectionResponse.data.summary?.selected_raw_capacity ??
            selectedRawCapacity
        )
      );

      const response = await apiService.previewSmartTargetingTestSampling(
        preparedUuid,
        controller.signal
      );
      if (controller.signal.aborted || requestSequenceRef.current !== sequence)
        return;
      if (!response.success || !response.data) {
        setError(
          getErrorMessage(response.error?.code, language, copy.previewFailed)
        );
        return;
      }

      const normalized = normalizeSmartTargetingTestPreview(response.data);
      if (
        inputKeyRef.current !== requestedInputKey ||
        (campaignUuidRef.current && campaignUuidRef.current !== preparedUuid) ||
        !normalized ||
        normalized.sample_size_per_tag !== sampleSizePerTag ||
        !areSameOrderedTagIds(normalized.tag_sampling_order, requestedTagIds)
      ) {
        const contextChanged =
          inputKeyRef.current !== requestedInputKey ||
          Boolean(
            campaignUuidRef.current && campaignUuidRef.current !== preparedUuid
          );
        setError(
          contextChanged
            ? copy.inputsChangedDuringRequest
            : copy.invalidResponse
        );
        return;
      }

      onPreviewChange(normalized, preparedUuid);
    } catch {
      if (
        !controller.signal.aborted &&
        requestSequenceRef.current === sequence
      ) {
        setError(copy.previewFailed);
      }
    } finally {
      if (requestSequenceRef.current === sequence) {
        requestInFlightRef.current = false;
        setIsLoading(false);
      }
      if (abortRef.current === controller) abortRef.current = null;
    }
  };

  const formatNumber = (value: number) => value.toLocaleString(locale);
  const sortedResults = (items: SmartTargetingTestSamplingTagResult[]) =>
    [...items].sort(
      (left, right) => left.selection_order - right.selection_order
    );

  return (
    <section
      className='mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5'
      aria-labelledby='smart-targeting-test-preview-title'
    >
      <div className='flex items-start gap-3'>
        <FlaskConical className='mt-0.5 h-5 w-5 shrink-0 text-primary-600' />
        <div>
          <h3
            id='smart-targeting-test-preview-title'
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
      {!sampleSizeIsValid || !requestedAudienceIsValid ? (
        <p className='mt-2 text-sm text-red-600'>{copy.sampleSizeInvalid}</p>
      ) : null}

      <div className='mt-5'>
        <SmartTargetingScoreClassSelector
          value={selectedScoreClasses}
          onChange={onScoreClassesChange}
          copy={copy}
        />
      </div>

      <dl className='mt-5 grid gap-3 text-sm sm:grid-cols-2'>
        <div>
          <dt className='text-gray-600'>{copy.selectedTags}</dt>
          <dd className='font-semibold text-gray-900'>
            {formatNumber(orderedTagIds.length)}
          </dd>
        </div>
        <div>
          <dt className='text-gray-600'>{copy.requestedAudience}</dt>
          <dd className='font-semibold text-gray-900'>
            {sampleSizeIsValid && requestedAudienceIsValid
              ? formatNumber(requestedAudienceCount)
              : '—'}{' '}
            {copy.audiences}
          </dd>
        </div>
      </dl>

      <div className='mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <p className='text-sm text-gray-600'>
          {!campaignUuid?.trim() && canCreateCampaign
            ? copy.campaignWillBeCreated
            : selectionOrderIsPending
              ? copy.selectionOrderPending
              : previewIsStale
                ? copy.stale
                : !currentPreview
                  ? copy.previewRequired
                  : ''}
        </p>
        <Button
          onClick={() => void handlePreview()}
          disabled={
            isLoading ||
            orderedTagIds.length === 0 ||
            selectionOrderIsPending ||
            !sampleSizeIsValid ||
            !requestedAudienceIsValid ||
            (!campaignUuid?.trim() && !canCreateCampaign)
          }
        >
          {isLoading ? copy.checkingAvailability : copy.checkAvailability}
        </Button>
      </div>

      {currentPreview ? (
        <div className='mt-5 rounded-lg border border-green-200 bg-green-50/60 p-4'>
          <div className='flex items-center gap-2 text-sm font-medium text-green-800'>
            <CheckCircle2 className='h-4 w-4' aria-hidden='true' />
            {copy.checkAvailability}
          </div>
          <dl className='mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3'>
            <div>
              <dt className='text-gray-600'>{copy.selectedTags}</dt>
              <dd className='font-semibold text-gray-900'>
                {formatNumber(currentPreview.tag_sampling_order.length)}
              </dd>
            </div>
            <div>
              <dt className='text-gray-600'>{copy.sampleSizeLabel}</dt>
              <dd className='font-semibold text-gray-900'>
                {formatNumber(currentPreview.sample_size_per_tag)}
              </dd>
            </div>
            <div>
              <dt className='text-gray-600'>{copy.requestedAudience}</dt>
              <dd className='font-semibold text-gray-900'>
                {formatNumber(
                  currentPreview.tag_sampling_order.length *
                    currentPreview.sample_size_per_tag
                )}
              </dd>
            </div>
            <div>
              <dt className='text-gray-600'>{copy.satisfiedTags}</dt>
              <dd className='font-semibold text-green-800'>
                {formatNumber(currentPreview.satisfied_tag_count)}
              </dd>
            </div>
            <div>
              <dt className='text-gray-600'>{copy.unsatisfiedTags}</dt>
              <dd className='font-semibold text-amber-800'>
                {formatNumber(currentPreview.unsatisfied_tags.length)}
              </dd>
            </div>
            <div>
              <dt className='text-gray-600'>{copy.effectiveAudience}</dt>
              <dd className='font-bold text-green-800'>
                {formatNumber(currentPreview.effective_audience_count)}{' '}
                {copy.audiences}
              </dd>
            </div>
            <div>
              <dt className='text-gray-600'>{copy.campaignCost}</dt>
              <dd className='font-bold text-green-800'>
                {formatNumber(currentPreview.campaign_cost)} {copy.currency}
              </dd>
            </div>
          </dl>

          <div className='mt-4 grid gap-4 lg:grid-cols-2'>
            <div>
              <h4 className='text-sm font-medium text-gray-900'>
                {copy.satisfiedTags}
              </h4>
              <ul className='mt-2 space-y-1 text-sm text-gray-700'>
                {sortedResults(currentPreview.satisfied_tags).map(item => (
                  <li key={item.tag_id}>
                    {copy.tagLabel} {formatNumber(item.tag_id)}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className='text-sm font-medium text-gray-900'>
                {copy.unsatisfiedTags}
              </h4>
              {currentPreview.unsatisfied_tags.length > 0 ? (
                <>
                  <p className='mt-2 flex items-start gap-2 text-sm text-amber-800'>
                    <AlertTriangle
                      className='mt-0.5 h-4 w-4 shrink-0'
                      aria-hidden='true'
                    />
                    {copy.unsatisfiedWarning}
                  </p>
                  <ul className='mt-2 space-y-1 text-sm text-gray-700'>
                    {sortedResults(currentPreview.unsatisfied_tags).map(
                      item => (
                        <li key={item.tag_id}>
                          {copy.tagLabel} {formatNumber(item.tag_id)} —{' '}
                          {copy.availabilityLabel}:{' '}
                          {formatNumber(item.available_count)}
                        </li>
                      )
                    )}
                  </ul>
                </>
              ) : (
                <p className='mt-2 text-sm text-gray-600'>0</p>
              )}
            </div>
          </div>
          <p className='mt-4 text-xs leading-5 text-gray-600'>
            {copy.estimateLimitation}
          </p>
        </div>
      ) : null}

      {error ? (
        <p className='mt-4 text-sm text-red-600' role='alert'>
          {error}
        </p>
      ) : null}
    </section>
  );
};

export default SmartTargetingTestSamplingPreview;
