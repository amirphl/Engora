import React, { useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import { config } from '../../../config/environment';
import { useLanguage } from '../../../hooks/useLanguage';
import { useToast } from '../../../hooks/useToast';
import {
  BundleListItem,
  BundleTagEvaluationStatus,
  BundleTagScoreItem,
} from '../../../types/bundle';
import { useBundleTagEvaluation } from '../hooks/useBundleTagEvaluation';
import { BundlesCopy } from '../translations';
import { clampBundleFitScore } from '../tagEvaluationUtils';
import { BUNDLE_TOAST_DURATION_MS } from '../utils';
import BundleTagScoresPagination from './BundleTagScoresPagination';

interface BundleTagEvaluationSectionProps {
  bundle: BundleListItem;
  copy: BundlesCopy;
}

const statusClasses: Record<BundleTagEvaluationStatus, string> = {
  not_evaluated: 'border-gray-200 bg-gray-100 text-gray-700',
  evaluating: 'border-blue-200 bg-blue-50 text-blue-700',
  evaluated: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  update_required: 'border-amber-200 bg-amber-50 text-amber-800',
  error: 'border-red-200 bg-red-50 text-red-700',
};

const formatCodeLabel = (value: string): string =>
  value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase());

const getTagTitle = (score: BundleTagScoreItem): string =>
  score.tag_display_title_snapshot?.trim() ||
  score.tag_name_snapshot?.trim() ||
  `#${score.tag_id}`;

const BundleTagEvaluationSection: React.FC<BundleTagEvaluationSectionProps> = ({
  bundle,
  copy,
}) => {
  const { language } = useLanguage();
  const { showError, showInfo } = useToast();
  const locale = language === 'fa' ? 'fa-IR' : 'en-US';
  const evaluationCopy = copy.detailPage.tagEvaluation;
  const scoresEnabled = config.features.bundleTagScores;
  const {
    status,
    statusItem,
    statusLoading,
    statusError,
    actionLoading,
    actionError,
    requestEvaluation,
    refreshStatus,
    scores,
    scoresLoading,
    scoresError,
    retryScores,
    page,
    limit,
    totalItems,
    totalPages,
    setPage,
    setLimit,
  } = useBundleTagEvaluation({
    bundleId: bundle.id,
    initialStatus: bundle.tag_evaluation_status,
    initialEvaluatedAt: bundle.tag_evaluated_at,
    scoresEnabled,
    copy,
  });

  useEffect(() => {
    if (actionError) {
      showError(actionError, BUNDLE_TOAST_DURATION_MS);
    }
  }, [actionError, showError]);

  const statusLabels: Record<BundleTagEvaluationStatus, string> = {
    not_evaluated: evaluationCopy.statuses.notEvaluated,
    evaluating: evaluationCopy.statuses.evaluating,
    evaluated: evaluationCopy.statuses.evaluated,
    update_required: evaluationCopy.statuses.updateRequired,
    error: evaluationCopy.statuses.error,
  };

  const handleEvaluate = async () => {
    const accepted = await requestEvaluation();
    if (accepted) {
      showInfo(
        evaluationCopy.messages.requestAccepted,
        BUNDLE_TOAST_DURATION_MS
      );
    }
  };

  const renderScore = (score: BundleTagScoreItem) => {
    const value = clampBundleFitScore(score.bundle_fit_score);
    return (
      <div className='min-w-28'>
        <div className='flex items-center justify-between gap-2'>
          <span className='font-semibold text-gray-900'>
            {value.toLocaleString(locale, { maximumFractionDigits: 1 })}
          </span>
          <span className='text-xs text-gray-400'>/ 100</span>
        </div>
        <progress
          className='bundle-score-progress mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100'
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
          max={100}
          value={value}
        />
      </div>
    );
  };

  const statusIcon = statusLoading ? (
    <RefreshCw className='h-4 w-4 animate-spin' />
  ) : status === 'evaluating' ? (
    <RefreshCw className='h-4 w-4 animate-spin' />
  ) : status === 'evaluated' ? (
    <CheckCircle2 className='h-4 w-4' />
  ) : status === 'error' ? (
    <AlertCircle className='h-4 w-4' />
  ) : (
    <Clock3 className='h-4 w-4' />
  );

  const lastCompletedAt =
    statusItem?.latest_completed_at || bundle.tag_evaluated_at;
  const errorMessage = statusItem?.latest_error_message?.trim();

  return (
    <section className='overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm'>
      <div className='flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between'>
        <div>
          <div className='flex items-center gap-2'>
            <Sparkles className='h-6 w-6 text-primary-600' />
            <h2 className='text-2xl font-bold text-gray-900'>
              {evaluationCopy.title}
            </h2>
          </div>
          <p className='mt-2 max-w-3xl text-sm leading-6 text-gray-500'>
            {evaluationCopy.description}
          </p>
          {lastCompletedAt ? (
            <p className='mt-2 text-xs text-gray-500'>
              {evaluationCopy.lastEvaluated.replace(
                '{date}',
                new Date(lastCompletedAt).toLocaleString(locale)
              )}
            </p>
          ) : null}
        </div>

        <div className='flex flex-wrap items-center gap-3'>
          <Button
            icon={Sparkles}
            disabled={actionLoading || status === 'evaluating'}
            aria-busy={actionLoading || status === 'evaluating'}
            onClick={handleEvaluate}
          >
            {evaluationCopy.evaluateButton}
          </Button>
          <span
            className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold ${statusClasses[status]}`}
            aria-live='polite'
            aria-busy={statusLoading}
          >
            {statusIcon}
            {statusLabels[status]}
          </span>
        </div>
      </div>

      {status === 'evaluating' ? (
        <div className='border-y border-blue-100 bg-blue-50 px-5 py-3 text-sm text-blue-800 sm:px-6'>
          {evaluationCopy.evaluatingNotice}
        </div>
      ) : null}
      {status === 'update_required' ? (
        <div className='border-y border-amber-100 bg-amber-50 px-5 py-3 text-sm text-amber-900 sm:px-6'>
          {evaluationCopy.staleNotice}
        </div>
      ) : null}
      {status === 'error' ? (
        <div className='border-y border-red-100 bg-red-50 px-5 py-3 text-sm text-red-800 sm:px-6'>
          {errorMessage || evaluationCopy.evaluationError}
        </div>
      ) : null}

      {statusError ? (
        <div className='flex flex-wrap items-center justify-between gap-3 border-t border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700 sm:px-6'>
          <span>{statusError}</span>
          <Button variant='outline' size='sm' onClick={() => refreshStatus()}>
            {copy.states.retry}
          </Button>
        </div>
      ) : null}

      {scoresEnabled ? (
        <div className='border-t border-gray-200'>
          {scoresError ? (
            <div className='flex flex-wrap items-center justify-between gap-3 bg-red-50 px-5 py-3 text-sm text-red-700 sm:px-6'>
              <span>{scoresError}</span>
              <Button variant='outline' size='sm' onClick={() => retryScores()}>
                {copy.states.retry}
              </Button>
            </div>
          ) : null}

          {scores.length > 0 ? (
            <>
              <div className='hidden overflow-x-auto lg:block'>
                <table className='w-full min-w-[980px] divide-y divide-gray-200'>
                  <thead className='bg-gray-50'>
                    <tr>
                      {[
                        evaluationCopy.table.tag,
                        evaluationCopy.table.score,
                        evaluationCopy.table.audience,
                        evaluationCopy.table.fitLevel,
                        evaluationCopy.table.relation,
                        evaluationCopy.table.reason,
                      ].map(label => (
                        <th
                          key={label}
                          scope='col'
                          className='px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-gray-500'
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-100 bg-white'>
                    {scores.map(score => (
                      <tr key={`${score.evaluation_run_id}-${score.tag_id}`}>
                        <td className='max-w-xs px-4 py-4 align-top'>
                          <p className='font-semibold text-gray-900'>
                            {getTagTitle(score)}
                          </p>
                          {score.tag_persona_snapshot ? (
                            <p className='mt-1 line-clamp-2 text-xs leading-5 text-gray-500'>
                              {score.tag_persona_snapshot}
                            </p>
                          ) : null}
                        </td>
                        <td className='px-4 py-4 align-top'>
                          {renderScore(score)}
                        </td>
                        <td className='px-4 py-4 align-top text-sm text-gray-700'>
                          {score.tag_audience_count_snapshot == null
                            ? copy.states.unknown
                            : score.tag_audience_count_snapshot.toLocaleString(
                                locale
                              )}
                        </td>
                        <td className='px-4 py-4 align-top text-sm text-gray-700'>
                          {formatCodeLabel(score.fit_level)}
                        </td>
                        <td className='px-4 py-4 align-top text-sm text-gray-700'>
                          {formatCodeLabel(score.relation_type)}
                        </td>
                        <td className='max-w-sm px-4 py-4 align-top text-sm leading-6 text-gray-600'>
                          {score.reason || copy.states.unknown}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className='space-y-4 p-4 lg:hidden'>
                {scores.map(score => (
                  <article
                    key={`${score.evaluation_run_id}-${score.tag_id}`}
                    className='rounded-2xl border border-gray-200 p-4'
                  >
                    <h3 className='font-semibold text-gray-900'>
                      {getTagTitle(score)}
                    </h3>
                    {score.tag_persona_snapshot ? (
                      <p className='mt-1 text-xs leading-5 text-gray-500'>
                        {score.tag_persona_snapshot}
                      </p>
                    ) : null}
                    <div className='mt-4'>{renderScore(score)}</div>
                    <dl className='mt-4 grid grid-cols-2 gap-3 text-sm'>
                      <div>
                        <dt className='text-gray-500'>
                          {evaluationCopy.table.audience}
                        </dt>
                        <dd className='mt-1 font-medium text-gray-900'>
                          {score.tag_audience_count_snapshot == null
                            ? copy.states.unknown
                            : score.tag_audience_count_snapshot.toLocaleString(
                                locale
                              )}
                        </dd>
                      </div>
                      <div>
                        <dt className='text-gray-500'>
                          {evaluationCopy.table.fitLevel}
                        </dt>
                        <dd className='mt-1 font-medium text-gray-900'>
                          {formatCodeLabel(score.fit_level)}
                        </dd>
                      </div>
                      <div className='col-span-2'>
                        <dt className='text-gray-500'>
                          {evaluationCopy.table.relation}
                        </dt>
                        <dd className='mt-1 font-medium text-gray-900'>
                          {formatCodeLabel(score.relation_type)}
                        </dd>
                      </div>
                      <div className='col-span-2'>
                        <dt className='text-gray-500'>
                          {evaluationCopy.table.reason}
                        </dt>
                        <dd className='mt-1 leading-6 text-gray-700'>
                          {score.reason || copy.states.unknown}
                        </dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            </>
          ) : scoresLoading ? (
            <div className='px-5 py-12 text-center text-sm text-gray-500'>
              <RefreshCw className='mx-auto mb-3 h-6 w-6 animate-spin text-primary-600' />
              {copy.states.loading}
            </div>
          ) : (
            <div className='px-5 py-12 text-center text-sm text-gray-500'>
              {evaluationCopy.table.empty}
            </div>
          )}

          {scoresLoading && scores.length > 0 ? (
            <div
              className='h-1 overflow-hidden bg-primary-50'
              aria-hidden='true'
            >
              <div className='h-full w-1/3 animate-pulse bg-primary-500' />
            </div>
          ) : null}

          <BundleTagScoresPagination
            copy={copy}
            page={page}
            limit={limit}
            totalItems={totalItems}
            totalPages={totalPages}
            onPageChange={setPage}
            onLimitChange={setLimit}
          />
        </div>
      ) : null}
    </section>
  );
};

export default BundleTagEvaluationSection;
