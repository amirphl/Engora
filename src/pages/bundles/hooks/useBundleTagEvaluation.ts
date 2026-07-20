import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useLanguage } from '../../../hooks/useLanguage';
import apiService from '../../../services/api';
import {
  BundlePagination,
  BundleTagEvaluationStatus,
  BundleTagEvaluationStatusItem,
  BundleTagScoreItem,
} from '../../../types/bundle';
import { getApiErrorMessage } from '../../../utils/errorHandler';
import bundlesApi from '../api';
import { BundlesCopy } from '../translations';
import { normalizeBundleTagEvaluationStatus } from '../tagEvaluationUtils';

const POLL_INTERVAL_MS = 10000;
const DEFAULT_PAGE_SIZE = 20;

const defaultPagination = (limit = DEFAULT_PAGE_SIZE): BundlePagination => ({
  page: 1,
  limit,
  total_items: 0,
  total_pages: 1,
});

const toSafeNumber = (value: unknown, fallback: number): number => {
  const numericValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

const normalizePagination = (
  value: Partial<BundlePagination> | null | undefined,
  fallbackLimit: number
): BundlePagination => {
  const totalItems = Math.max(
    toSafeNumber(value?.total_items ?? value?.total, 0),
    0
  );

  return {
    page: Math.max(toSafeNumber(value?.page, 1), 1),
    limit: Math.max(toSafeNumber(value?.limit, fallbackLimit), 1),
    total_items: totalItems,
    total_pages: Math.max(toSafeNumber(value?.total_pages, 1), 1),
  };
};

interface UseBundleTagEvaluationOptions {
  bundleId: number;
  initialStatus?: string | null;
  initialEvaluatedAt?: string | null;
  scoresEnabled?: boolean;
  copy: BundlesCopy;
}

export const useBundleTagEvaluation = ({
  bundleId,
  initialStatus,
  initialEvaluatedAt,
  scoresEnabled = true,
  copy,
}: UseBundleTagEvaluationOptions) => {
  const { accessToken } = useAuth();
  const { language } = useLanguage();
  const [status, setStatus] = useState<BundleTagEvaluationStatus>(() =>
    normalizeBundleTagEvaluationStatus(initialStatus)
  );
  const [statusItem, setStatusItem] =
    useState<BundleTagEvaluationStatusItem | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [scores, setScores] = useState<BundleTagScoreItem[]>([]);
  const [scoresLoading, setScoresLoading] = useState(false);
  const [scoresError, setScoresError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimitState] = useState(DEFAULT_PAGE_SIZE);
  const [pagination, setPagination] = useState<BundlePagination>(() =>
    defaultPagination()
  );
  const statusRequestIdRef = useRef(0);
  const scoresRequestIdRef = useRef(0);
  const scoreRunIdRef = useRef<number | 'existing-successful-run' | null>(null);

  const latestSuccessfulRunId = statusItem?.latest_successful_run_id ?? null;
  const scoreSourceKey =
    latestSuccessfulRunId ??
    (initialEvaluatedAt ? 'existing-successful-run' : null);

  const fetchStatus = useCallback(
    async (
      signal?: AbortSignal,
      options: { silent?: boolean } = {}
    ): Promise<BundleTagEvaluationStatus | null> => {
      if (!accessToken) {
        setStatusError(copy.messages.authRequired);
        setStatusLoading(false);
        return null;
      }

      const requestId = statusRequestIdRef.current + 1;
      statusRequestIdRef.current = requestId;
      if (!options.silent) setStatusLoading(true);
      setStatusError(null);

      try {
        apiService.setAccessToken(accessToken);
        const response = await bundlesApi.getTagEvaluationStatus(
          bundleId,
          signal
        );

        if (signal?.aborted) return null;
        if (requestId !== statusRequestIdRef.current) return null;
        if (!response.success || !response.data) {
          setStatusError(
            getApiErrorMessage(
              response,
              language,
              copy.detailPage.tagEvaluation.messages.statusLoadFailed
            )
          );
          return null;
        }

        const item = response.data.item ?? null;
        const nextStatus = normalizeBundleTagEvaluationStatus(item?.status);
        setStatusItem(item);
        setStatus(nextStatus);
        return nextStatus;
      } catch (error) {
        if (signal?.aborted) return null;
        if (requestId === statusRequestIdRef.current) {
          setStatusError(
            error instanceof Error
              ? error.message
              : copy.detailPage.tagEvaluation.messages.statusLoadFailed
          );
        }
        return null;
      } finally {
        if (requestId === statusRequestIdRef.current) {
          setStatusLoading(false);
        }
      }
    },
    [accessToken, bundleId, copy, language]
  );

  const fetchScores = useCallback(
    async (signal?: AbortSignal) => {
      if (!scoresEnabled || !accessToken || !scoreSourceKey) return;

      const requestId = scoresRequestIdRef.current + 1;
      scoresRequestIdRef.current = requestId;
      setScoresLoading(true);
      setScoresError(null);

      try {
        apiService.setAccessToken(accessToken);
        const response = await bundlesApi.listTagScores(
          bundleId,
          { page, limit },
          signal
        );

        if (signal?.aborted) return;
        if (requestId !== scoresRequestIdRef.current) return;
        if (!response.success || !response.data) {
          setScoresError(
            getApiErrorMessage(
              response,
              language,
              copy.detailPage.tagEvaluation.messages.scoresLoadFailed
            )
          );
          return;
        }

        setScores(response.data.items ?? []);
        setPagination(normalizePagination(response.data.pagination, limit));
      } catch (error) {
        if (signal?.aborted) return;
        if (requestId === scoresRequestIdRef.current) {
          setScoresError(
            error instanceof Error
              ? error.message
              : copy.detailPage.tagEvaluation.messages.scoresLoadFailed
          );
        }
      } finally {
        if (requestId === scoresRequestIdRef.current) {
          setScoresLoading(false);
        }
      }
    },
    [
      accessToken,
      bundleId,
      copy,
      language,
      scoreSourceKey,
      scoresEnabled,
      limit,
      page,
    ]
  );

  const requestEvaluation = useCallback(async (): Promise<boolean> => {
    if (!accessToken || actionLoading || status === 'evaluating') return false;

    setActionLoading(true);
    setActionError(null);

    try {
      apiService.setAccessToken(accessToken);
      const response = await bundlesApi.requestTagEvaluation(bundleId);

      if (!response.success) {
        if (response.error?.code === 'BUNDLE_TAG_EVALUATION_ACTIVE') {
          setStatus('evaluating');
          await fetchStatus(undefined, { silent: true });
          return true;
        }

        setActionError(
          getApiErrorMessage(
            response,
            language,
            copy.detailPage.tagEvaluation.messages.requestFailed
          )
        );
        return false;
      }

      setStatus('evaluating');
      if (response.data) {
        setStatusItem(previous => ({
          bundle_id: bundleId,
          status: response.data?.status || 'evaluating',
          latest_run_id: response.data?.evaluation_run_id,
          latest_run_created_at: response.data?.created_at,
          latest_successful_run_id: previous?.latest_successful_run_id ?? null,
          latest_completed_at: previous?.latest_completed_at ?? null,
          latest_error_message: null,
          latest_error_at: null,
        }));
      }
      return true;
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : copy.detailPage.tagEvaluation.messages.requestFailed
      );
      return false;
    } finally {
      setActionLoading(false);
    }
  }, [
    accessToken,
    actionLoading,
    bundleId,
    copy,
    fetchStatus,
    language,
    status,
  ]);

  useEffect(() => {
    const controller = new AbortController();
    fetchStatus(controller.signal);
    return () => controller.abort();
  }, [fetchStatus]);

  useEffect(() => {
    if (status !== 'evaluating') return;

    let cancelled = false;
    let timeoutId: number | undefined;
    let controller: AbortController | null = null;

    const poll = async () => {
      if (cancelled) return;
      if (document.visibilityState === 'hidden') {
        timeoutId = window.setTimeout(poll, POLL_INTERVAL_MS);
        return;
      }

      controller = new AbortController();
      const nextStatus = await fetchStatus(controller.signal, { silent: true });
      if (!cancelled && (nextStatus === 'evaluating' || nextStatus === null)) {
        timeoutId = window.setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    timeoutId = window.setTimeout(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      controller?.abort();
    };
  }, [fetchStatus, status]);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible' && status === 'evaluating') {
        fetchStatus(undefined, { silent: true });
      }
    };
    document.addEventListener('visibilitychange', refreshWhenVisible);
    window.addEventListener('focus', refreshWhenVisible);
    return () => {
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.removeEventListener('focus', refreshWhenVisible);
    };
  }, [fetchStatus, status]);

  useEffect(() => {
    if (!scoresEnabled) {
      scoreRunIdRef.current = null;
      setScores([]);
      setScoresLoading(false);
      setScoresError(null);
      setPagination(defaultPagination(limit));
      return;
    }

    if (!scoreSourceKey) {
      scoreRunIdRef.current = null;
      setScores([]);
      setPagination(defaultPagination(limit));
      return;
    }

    if (scoreRunIdRef.current !== scoreSourceKey) {
      scoreRunIdRef.current = scoreSourceKey;
      if (page !== 1) {
        setPage(1);
        return;
      }
    }

    const controller = new AbortController();
    fetchScores(controller.signal);
    return () => controller.abort();
  }, [fetchScores, limit, page, scoreSourceKey, scoresEnabled]);

  const setLimit = useCallback((nextLimit: number) => {
    setLimitState(nextLimit);
    setPage(1);
  }, []);

  const totalItems = useMemo(
    () => pagination.total_items ?? pagination.total ?? 0,
    [pagination]
  );

  return {
    status,
    statusItem,
    statusLoading,
    statusError,
    actionLoading,
    actionError,
    requestEvaluation,
    refreshStatus: fetchStatus,
    scores,
    scoresLoading,
    scoresError,
    retryScores: fetchScores,
    page,
    limit,
    totalItems,
    totalPages: pagination.total_pages,
    setPage,
    setLimit,
  };
};
