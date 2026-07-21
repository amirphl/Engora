import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { RefreshCw, Search } from 'lucide-react';
import Button from '../../ui/Button';
import { apiService } from '../../../services/api';
import { useLanguage } from '../../../hooks/useLanguage';
import { getApiErrorMessage } from '../../../utils/errorHandler';
import {
  ListSmartTargetingTagsResponse,
  PaginationInfo,
  SmartTargetingSortBy,
  SmartTargetingSortDirection,
  SmartTargetingTagItem,
} from '../../../types/campaign';

const UNAVAILABLE = '—';
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const MAX_SEARCH_LENGTH = 200;
const MAX_AUTO_SELECT_COUNT = 10000;
const AUTO_SELECTION_PAGE_CONCURRENCY = 4;

export interface SmartTargetingCopy {
  title: string;
  description: string;
  searchLabel: string;
  searchPlaceholder: string;
  sortByLabel: string;
  sortDirectionLabel: string;
  defaultOrder: string;
  ascending: string;
  descending: string;
  columns: {
    selection: string;
    tagDisplayTitle: string;
    tagCapacity: string;
    bundlePersonaFitScore: string;
    testPhaseAvgCtr: string;
    overallAvgCtr: string;
  };
  sortOptions: {
    tagCapacity: string;
    bundlePersonaFitScore: string;
    testPhaseAvgCtr: string;
    overallAvgCtr: string;
  };
  autoSelectLabel: string;
  autoSelectPlaceholder: string;
  autoSelectButton: string;
  autoSelecting: string;
  selectedTags: string;
  selectedRawCapacity: string;
  audiences: string;
  loading: string;
  refreshing: string;
  retry: string;
  noBundle: string;
  noTags: string;
  noSearchResults: string;
  searchTooLong: string;
  invalidAutoCount: string;
  autoCountTooLarge: string;
  fetchError: string;
  autoSelectError: string;
  unavailable: string;
  pagination: {
    showing: string;
    rowsPerPage: string;
    previous: string;
    next: string;
  };
}

type SelectionChangeSource = 'local' | 'server';

interface SmartTargetingTagsTableProps {
  bundleId?: number | null;
  campaignUuid?: string;
  useCampaignEndpoints: boolean;
  selectedTagIds: number[];
  selectedRawCapacity: number;
  selectionIsDirty: boolean;
  onSelectionChange: (
    tagIds: number[],
    selectedRawCapacity: number,
    source: SelectionChangeSource
  ) => void;
  copy: SmartTargetingCopy;
}

const createDefaultPagination = (limit = 20): PaginationInfo => ({
  page: 1,
  limit,
  total_items: 0,
  total_pages: 1,
});

const normalizePositiveInteger = (value: unknown): number | null => {
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric > 0 ? numeric : null;
};

const normalizeTagIds = (value: unknown): number[] => {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map(normalizePositiveInteger)
        .filter((item): item is number => item !== null)
    )
  );
};

const normalizePagination = (
  pagination: Partial<PaginationInfo> | null | undefined,
  fallbackLimit: number
): PaginationInfo => {
  const page = normalizePositiveInteger(pagination?.page) ?? 1;
  const limit = normalizePositiveInteger(pagination?.limit) ?? fallbackLimit;
  const totalItems =
    typeof pagination?.total_items === 'number' &&
    Number.isFinite(pagination.total_items)
      ? Math.max(0, pagination.total_items)
      : 0;
  const totalPages =
    normalizePositiveInteger(pagination?.total_pages) ??
    Math.max(1, Math.ceil(totalItems / Math.max(limit, 1)));

  return {
    page,
    limit,
    total_items: totalItems,
    total_pages: Math.max(totalPages, 1),
  };
};

const normalizeRows = (items: unknown): SmartTargetingTagItem[] => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item): SmartTargetingTagItem | null => {
      const row = item as Partial<SmartTargetingTagItem>;
      const tagId = normalizePositiveInteger(row.tag_id);
      if (!tagId) return null;

      return {
        tag_id: tagId,
        tag_display_title:
          typeof row.tag_display_title === 'string'
            ? row.tag_display_title
            : null,
        tag_capacity:
          typeof row.tag_capacity === 'number' &&
          Number.isFinite(row.tag_capacity)
            ? row.tag_capacity
            : null,
        bundle_persona_fit_score:
          typeof row.bundle_persona_fit_score === 'number' &&
          Number.isFinite(row.bundle_persona_fit_score)
            ? row.bundle_persona_fit_score
            : null,
        evaluation_run_id:
          typeof row.evaluation_run_id === 'number' &&
          Number.isFinite(row.evaluation_run_id)
            ? row.evaluation_run_id
            : null,
        fit_level: typeof row.fit_level === 'string' ? row.fit_level : null,
        relation_type:
          typeof row.relation_type === 'string' ? row.relation_type : null,
        test_phase_avg_ctr:
          typeof row.test_phase_avg_ctr === 'number' &&
          Number.isFinite(row.test_phase_avg_ctr)
            ? row.test_phase_avg_ctr
            : null,
        overall_avg_ctr:
          typeof row.overall_avg_ctr === 'number' &&
          Number.isFinite(row.overall_avg_ctr)
            ? row.overall_avg_ctr
            : null,
        selected: row.selected === true,
      };
    })
    .filter((item): item is SmartTargetingTagItem => item !== null);
};

const areSameIdSet = (left: number[], right: number[]): boolean => {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every(item => rightSet.has(item));
};

const getCapacityValue = (row: SmartTargetingTagItem): number =>
  typeof row.tag_capacity === 'number' && Number.isFinite(row.tag_capacity)
    ? Math.max(0, row.tag_capacity)
    : 0;

const appendUniqueRows = (
  currentRows: SmartTargetingTagItem[],
  nextRows: SmartTargetingTagItem[]
): SmartTargetingTagItem[] => {
  const currentIds = new Set(currentRows.map(row => row.tag_id));
  return [
    ...currentRows,
    ...nextRows.filter(row => !currentIds.has(row.tag_id)),
  ];
};

const SmartTargetingTagsTable: React.FC<SmartTargetingTagsTableProps> = ({
  bundleId,
  campaignUuid,
  useCampaignEndpoints,
  selectedTagIds,
  selectedRawCapacity,
  selectionIsDirty,
  onSelectionChange,
  copy,
}) => {
  const { language } = useLanguage();
  const locale = language === 'fa' ? 'fa-IR' : undefined;
  const [rows, setRows] = useState<SmartTargetingTagItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>(() =>
    createDefaultPagination()
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<SmartTargetingSortBy | ''>('');
  const [sortDirection, setSortDirection] =
    useState<SmartTargetingSortDirection>('desc');
  const [effectiveSortBy, setEffectiveSortBy] = useState<
    SmartTargetingSortBy | ''
  >('');
  const [effectiveSortDirection, setEffectiveSortDirection] = useState<
    SmartTargetingSortDirection | ''
  >('');
  const [evaluationAvailable, setEvaluationAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoCount, setAutoCount] = useState('');
  const [autoError, setAutoError] = useState<string | null>(null);
  const [isAutoSelecting, setIsAutoSelecting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const selectedTagIdsRef = useRef(selectedTagIds);
  const selectedRawCapacityRef = useRef(selectedRawCapacity);
  const onSelectionChangeRef = useRef(onSelectionChange);
  const selectionIsDirtyRef = useRef(selectionIsDirty);
  const hasUserEditedRef = useRef(false);
  const requestSeqRef = useRef(0);
  const autoSeqRef = useRef(0);
  const autoAbortRef = useRef<AbortController | null>(null);
  const autoInFlightRef = useRef(false);
  const pageRequestInFlightRef = useRef(false);
  const tableContextKey = `${campaignUuid || 'new'}:${bundleId || 'none'}:${
    useCampaignEndpoints ? 'campaign' : 'bundle'
  }`;
  const tableContextKeyRef = useRef(tableContextKey);

  useEffect(() => {
    selectedTagIdsRef.current = selectedTagIds;
  }, [selectedTagIds]);

  useEffect(() => {
    selectedRawCapacityRef.current = selectedRawCapacity;
  }, [selectedRawCapacity]);

  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);

  useEffect(() => {
    selectionIsDirtyRef.current = selectionIsDirty;
  }, [selectionIsDirty]);

  useEffect(() => {
    if (tableContextKeyRef.current === tableContextKey) return;

    tableContextKeyRef.current = tableContextKey;
    requestSeqRef.current += 1;
    autoSeqRef.current += 1;
    autoAbortRef.current?.abort();
    autoAbortRef.current = null;
    autoInFlightRef.current = false;
    pageRequestInFlightRef.current = false;
    hasUserEditedRef.current = false;
    setRows([]);
    setPagination(createDefaultPagination());
    setPage(1);
    setSearch('');
    setDebouncedSearch('');
    setSortBy('');
    setSortDirection('desc');
    setEffectiveSortBy('');
    setEffectiveSortDirection('');
    setEvaluationAvailable(false);
    setError(null);
    setAutoError(null);
    setIsAutoSelecting(false);
  }, [tableContextKey]);

  useEffect(
    () => () => {
      requestSeqRef.current += 1;
      autoSeqRef.current += 1;
      autoAbortRef.current?.abort();
    },
    []
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextSearch = search.trim();
      setDebouncedSearch(nextSearch);
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

  const selectedSet = useMemo(() => new Set(selectedTagIds), [selectedTagIds]);

  const sortOptions = useMemo(
    () =>
      [
        { value: '', label: copy.defaultOrder },
        { value: 'tag_capacity', label: copy.sortOptions.tagCapacity },
        evaluationAvailable
          ? {
              value: 'bundle_persona_fit_score',
              label: copy.sortOptions.bundlePersonaFitScore,
            }
          : null,
        {
          value: 'test_phase_avg_ctr',
          label: copy.sortOptions.testPhaseAvgCtr,
        },
        {
          value: 'overall_avg_ctr',
          label: copy.sortOptions.overallAvgCtr,
        },
      ].filter(
        (
          item
        ): item is {
          value: SmartTargetingSortBy | '';
          label: string;
        } => item !== null
      ),
    [copy, evaluationAvailable]
  );

  const formatNumber = useCallback(
    (value: number): string => value.toLocaleString(locale),
    [locale]
  );

  const formatMetric = useCallback(
    (value: number | null | undefined): string =>
      typeof value === 'number' && Number.isFinite(value)
        ? value.toLocaleString(locale)
        : copy.unavailable || UNAVAILABLE,
    [copy.unavailable, locale]
  );

  const formatCtr = useCallback(
    (value: number | null | undefined): string =>
      typeof value === 'number' && Number.isFinite(value)
        ? `${(value * 100).toLocaleString(locale, {
            maximumFractionDigits: 2,
          })}%`
        : copy.unavailable || UNAVAILABLE,
    [copy.unavailable, locale]
  );

  const applyServerSelectionIfNeeded = useCallback(
    (data: ListSmartTargetingTagsResponse) => {
      if (
        !campaignUuid ||
        !useCampaignEndpoints ||
        selectionIsDirtyRef.current ||
        hasUserEditedRef.current
      ) {
        return;
      }

      const responseIds = normalizeTagIds(data.selected_tag_ids);
      const summary = data.summary || {
        selected_tag_count: responseIds.length,
        selected_raw_capacity: 0,
      };
      const currentIds = selectedTagIdsRef.current;
      const rawCapacity =
        typeof summary.selected_raw_capacity === 'number' &&
        Number.isFinite(summary.selected_raw_capacity)
          ? Math.max(0, summary.selected_raw_capacity)
          : 0;

      if (
        !areSameIdSet(currentIds, responseIds) ||
        rawCapacity !== selectedRawCapacityRef.current
      ) {
        onSelectionChangeRef.current(responseIds, rawCapacity, 'server');
      }
    },
    [campaignUuid, useCampaignEndpoints]
  );

  const fetchTags = useCallback(
    async (signal?: AbortSignal) => {
      if (!bundleId || bundleId <= 0) {
        setRows([]);
        setPagination(createDefaultPagination(pageSize));
        setEvaluationAvailable(false);
        setEffectiveSortBy('');
        setEffectiveSortDirection('');
        setError(null);
        return;
      }

      const seq = requestSeqRef.current + 1;
      requestSeqRef.current = seq;
      setIsLoading(true);
      setError(null);

      const params = {
        page,
        page_size: pageSize,
        search: debouncedSearch,
        sort_by: sortBy || undefined,
        sort_direction: sortBy ? sortDirection : undefined,
      };

      const response =
        useCampaignEndpoints && campaignUuid
          ? await apiService.listCampaignSmartTargetingTags(
              campaignUuid,
              params,
              signal
            )
          : await apiService.listBundleSmartTargetingTags(
              bundleId,
              params,
              signal
            );

      if (signal?.aborted || requestSeqRef.current !== seq) return;

      if (!response.success || !response.data) {
        setError(getApiErrorMessage(response, language, copy.fetchError));
        return;
      }

      const nextRows = normalizeRows(response.data.items);
      setRows(currentRows =>
        page === 1 ? nextRows : appendUniqueRows(currentRows, nextRows)
      );
      setPagination(normalizePagination(response.data.pagination, pageSize));
      setEvaluationAvailable(response.data.evaluation_available === true);
      setEffectiveSortBy(response.data.effective_sort_by || '');
      setEffectiveSortDirection(response.data.effective_sort_direction || '');
      applyServerSelectionIfNeeded(response.data);
    },
    [
      applyServerSelectionIfNeeded,
      bundleId,
      campaignUuid,
      copy.fetchError,
      debouncedSearch,
      language,
      page,
      pageSize,
      sortBy,
      sortDirection,
      useCampaignEndpoints,
    ]
  );

  useEffect(() => {
    const controller = new AbortController();
    pageRequestInFlightRef.current = true;
    fetchTags(controller.signal).finally(() => {
      if (!controller.signal.aborted) {
        setIsLoading(false);
        pageRequestInFlightRef.current = false;
      }
    });

    return () => controller.abort();
  }, [fetchTags, refreshKey]);

  const handleTableScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (isLoading || pageRequestInFlightRef.current || page >= totalPages) {
      return;
    }

    const { clientHeight, scrollHeight, scrollTop } = event.currentTarget;
    const threshold = 200;
    if (scrollTop + clientHeight < scrollHeight - threshold) return;

    pageRequestInFlightRef.current = true;
    setPage(currentPage => Math.min(totalPages, currentPage + 1));
  };

  const handleToggleRow = (row: SmartTargetingTagItem) => {
    const isSelected = selectedSet.has(row.tag_id);
    if (!isSelected && selectedTagIds.length >= MAX_AUTO_SELECT_COUNT) {
      setAutoError(copy.invalidAutoCount);
      return;
    }
    const nextIds = isSelected
      ? selectedTagIds.filter(tagId => tagId !== row.tag_id)
      : [...selectedTagIds, row.tag_id];
    const knownCapacity = getCapacityValue(row);
    const nextRawCapacity = Math.max(
      0,
      selectedRawCapacity + (isSelected ? -knownCapacity : knownCapacity)
    );

    hasUserEditedRef.current = true;
    onSelectionChange(nextIds, nextRawCapacity, 'local');
  };

  const handlePageSizeChange = (nextPageSize: number) => {
    setPageSize(nextPageSize);
    setPage(1);
  };

  const handleSortByChange = (nextSortBy: SmartTargetingSortBy | '') => {
    setSortBy(nextSortBy);
    setPage(1);
  };

  const getAutoCountValidation = (
    hasCurrentTotal: boolean
  ): {
    count: number | null;
    error: string | null;
  } => {
    const trimmed = autoCount.trim();
    if (!trimmed || !/^\d+$/.test(trimmed)) {
      return { count: null, error: copy.invalidAutoCount };
    }
    const count = Number(trimmed);
    if (
      !Number.isInteger(count) ||
      count < 1 ||
      count > MAX_AUTO_SELECT_COUNT
    ) {
      return { count: null, error: copy.invalidAutoCount };
    }
    if (
      hasCurrentTotal &&
      pagination.total_items > 0 &&
      count > pagination.total_items
    ) {
      return {
        count: null,
        error: copy.autoCountTooLarge.replace(
          '{count}',
          formatNumber(pagination.total_items)
        ),
      };
    }

    return { count, error: null };
  };

  const collectBundleAutoSelection = async (
    count: number,
    activeSearch: string,
    activeSortBy: SmartTargetingSortBy | undefined,
    activeSortDirection: SmartTargetingSortDirection | undefined,
    signal: AbortSignal,
    seq: number
  ): Promise<{ ids: number[]; rawCapacity: number } | null> => {
    if (!bundleId) return null;

    const requestPageSize = 100;
    const loadPage = async (
      nextPage: number
    ): Promise<{
      rows: SmartTargetingTagItem[];
      pagination: PaginationInfo;
    } | null> => {
      const response = await apiService.listBundleSmartTargetingTags(
        bundleId,
        {
          page: nextPage,
          page_size: requestPageSize,
          search: activeSearch,
          sort_by: activeSortBy,
          sort_direction: activeSortBy ? activeSortDirection : undefined,
        },
        signal
      );
      if (signal.aborted || autoSeqRef.current !== seq) return null;
      if (!response.success || !response.data) {
        setAutoError(
          getApiErrorMessage(response, language, copy.autoSelectError)
        );
        return null;
      }

      return {
        rows: normalizeRows(response.data.items),
        pagination: normalizePagination(
          response.data.pagination,
          requestPageSize
        ),
      };
    };

    const firstPage = await loadPage(1);
    if (!firstPage) return null;

    if (count > firstPage.pagination.total_items) {
      setAutoError(
        copy.autoCountTooLarge.replace(
          '{count}',
          formatNumber(firstPage.pagination.total_items)
        )
      );
      return null;
    }

    const lastRequiredPage = Math.min(
      firstPage.pagination.total_pages,
      Math.ceil(count / requestPageSize)
    );
    const pages = new Map<number, SmartTargetingTagItem[]>([
      [1, firstPage.rows],
    ]);

    for (
      let startPage = 2;
      startPage <= lastRequiredPage;
      startPage += AUTO_SELECTION_PAGE_CONCURRENCY
    ) {
      const batch = Array.from(
        {
          length: Math.min(
            AUTO_SELECTION_PAGE_CONCURRENCY,
            lastRequiredPage - startPage + 1
          ),
        },
        (_, index) => startPage + index
      );
      const responses = await Promise.all(
        batch.map(async pageNumber => ({
          pageNumber,
          result: await loadPage(pageNumber),
        }))
      );

      if (signal.aborted || autoSeqRef.current !== seq) return null;
      if (responses.some(({ result }) => result === null)) return null;

      responses.forEach(({ pageNumber, result }) => {
        if (result) pages.set(pageNumber, result.rows);
      });
    }

    const collected = Array.from(
      { length: lastRequiredPage },
      (_, index) => pages.get(index + 1) || []
    ).flat();

    if (collected.length < count) {
      setAutoError(
        copy.autoCountTooLarge.replace(
          '{count}',
          formatNumber(collected.length)
        )
      );
      return null;
    }

    const selectedRows = collected.slice(0, count);
    return {
      ids: selectedRows.map(row => row.tag_id),
      rawCapacity: selectedRows.reduce(
        (sum, row) => sum + getCapacityValue(row),
        0
      ),
    };
  };

  const handleAutoSelect = async () => {
    if (autoInFlightRef.current) return;

    const activeSearch = search.trim();
    const validation = getAutoCountValidation(activeSearch === debouncedSearch);
    if (validation.error || !validation.count) {
      setAutoError(validation.error || copy.invalidAutoCount);
      return;
    }
    if (!bundleId || bundleId <= 0) {
      setAutoError(copy.noBundle);
      return;
    }

    const seq = autoSeqRef.current + 1;
    autoSeqRef.current = seq;
    const controller = new AbortController();
    autoAbortRef.current?.abort();
    autoAbortRef.current = controller;
    autoInFlightRef.current = true;
    const activeSortBy = sortBy || effectiveSortBy || undefined;
    const activeSortDirection =
      (sortBy ? sortDirection : effectiveSortDirection) || undefined;

    setIsAutoSelecting(true);
    setAutoError(null);

    try {
      if (useCampaignEndpoints && campaignUuid) {
        const response = await apiService.autoSelectCampaignSmartTargetingTags(
          campaignUuid,
          {
            count: validation.count,
            search: activeSearch,
            sort_by: activeSortBy,
            sort_direction: activeSortBy ? activeSortDirection : undefined,
          },
          controller.signal
        );
        if (autoSeqRef.current !== seq) return;
        if (!response.success || !response.data) {
          setAutoError(
            getApiErrorMessage(response, language, copy.autoSelectError)
          );
          return;
        }

        // The auto-selection response is authoritative; ignore any older list
        // response that was started before the server replaced the selection.
        requestSeqRef.current += 1;
        hasUserEditedRef.current = false;
        onSelectionChange(
          normalizeTagIds(response.data.selected_tag_ids),
          Math.max(0, response.data.summary?.selected_raw_capacity ?? 0),
          'server'
        );
        setRefreshKey(value => value + 1);
        return;
      }

      const result = await collectBundleAutoSelection(
        validation.count,
        activeSearch,
        activeSortBy,
        activeSortDirection,
        controller.signal,
        seq
      );
      if (!result || autoSeqRef.current !== seq) return;

      hasUserEditedRef.current = true;
      onSelectionChange(result.ids, result.rawCapacity, 'local');
    } finally {
      if (autoSeqRef.current === seq) {
        setIsAutoSelecting(false);
        autoInFlightRef.current = false;
      }
      if (autoAbortRef.current === controller) autoAbortRef.current = null;
      controller.abort();
    }
  };

  const unavailable = copy.unavailable || UNAVAILABLE;
  const totalItems = pagination.total_items;
  const totalPages = Math.max(pagination.total_pages || 1, 1);
  const from = totalItems === 0 ? 0 : 1;
  const to = Math.min(rows.length, totalItems);
  const isInitialLoading = isLoading && rows.length === 0;
  const isRefreshing = isLoading && rows.length > 0;

  return (
    <div className='rounded-lg border border-gray-200 bg-white shadow-sm'>
      <div className='border-b border-gray-200 p-4 sm:p-5'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
          <div>
            <h3 className='text-base font-semibold text-gray-900'>
              {copy.title}
            </h3>
            <p className='mt-1 text-sm leading-6 text-gray-600'>
              {copy.description}
            </p>
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setRefreshKey(value => value + 1)}
            disabled={!bundleId || isLoading}
          >
            {isLoading ? copy.refreshing : copy.retry}
          </Button>
        </div>

        <div className='mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(220px,1fr)_220px_180px]'>
          <label className='block text-sm font-medium text-gray-700'>
            <span>{copy.searchLabel}</span>
            <div className='relative mt-1'>
              <Search className='pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
              <input
                type='search'
                maxLength={MAX_SEARCH_LENGTH}
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder={copy.searchPlaceholder}
                className='w-full rounded-md border border-gray-300 py-2 pe-3 ps-9 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'
              />
            </div>
          </label>

          <label className='block text-sm font-medium text-gray-700'>
            <span>{copy.sortByLabel}</span>
            <select
              value={sortBy}
              onChange={event =>
                handleSortByChange(
                  event.target.value as SmartTargetingSortBy | ''
                )
              }
              className='mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'
            >
              {sortOptions.map(option => (
                <option key={option.value || 'default'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className='block text-sm font-medium text-gray-700'>
            <span>{copy.sortDirectionLabel}</span>
            <select
              value={sortDirection}
              onChange={event =>
                setSortDirection(
                  event.target.value as SmartTargetingSortDirection
                )
              }
              disabled={!sortBy}
              className='mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'
            >
              <option value='desc'>{copy.descending}</option>
              <option value='asc'>{copy.ascending}</option>
            </select>
          </label>
        </div>

        <div className='mt-5 grid grid-cols-1 gap-3 md:grid-cols-[minmax(220px,320px)_auto] md:items-end'>
          <label className='block text-sm font-medium text-gray-700'>
            <span>{copy.autoSelectLabel}</span>
            <input
              type='number'
              min={1}
              step={1}
              max={MAX_AUTO_SELECT_COUNT}
              value={autoCount}
              onChange={event => {
                setAutoCount(event.target.value);
                setAutoError(null);
              }}
              placeholder={copy.autoSelectPlaceholder}
              className='mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'
            />
          </label>
          <Button
            onClick={handleAutoSelect}
            disabled={!bundleId || isAutoSelecting}
            className='md:w-fit'
          >
            {isAutoSelecting ? copy.autoSelecting : copy.autoSelectButton}
          </Button>
        </div>

        {search.length > MAX_SEARCH_LENGTH ? (
          <p className='mt-2 text-sm text-amber-700'>{copy.searchTooLong}</p>
        ) : null}
        {autoError ? (
          <p className='mt-2 text-sm text-red-600'>{autoError}</p>
        ) : null}
      </div>

      {!bundleId || bundleId <= 0 ? (
        <div className='px-5 py-12 text-center text-sm text-gray-500'>
          {copy.noBundle}
        </div>
      ) : error ? (
        <div className='px-5 py-12 text-center text-sm text-red-600'>
          <p>{error}</p>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setRefreshKey(value => value + 1)}
            className='mt-4'
          >
            {copy.retry}
          </Button>
        </div>
      ) : isInitialLoading ? (
        <div className='px-5 py-12 text-center text-sm text-gray-500'>
          <RefreshCw className='mx-auto mb-3 h-6 w-6 animate-spin text-primary-600' />
          {copy.loading}
        </div>
      ) : rows.length === 0 ? (
        <div className='px-5 py-12 text-center text-sm text-gray-500'>
          {debouncedSearch ? copy.noSearchResults : copy.noTags}
        </div>
      ) : (
        <div
          className='h-[32rem] overflow-auto'
          onScroll={handleTableScroll}
          role='region'
          aria-label={copy.title}
        >
          <table className='w-full min-w-[1040px] divide-y divide-gray-200'>
            <thead className='sticky top-0 z-10 bg-gray-50'>
              <tr>
                {[
                  copy.columns.selection,
                  copy.columns.tagDisplayTitle,
                  copy.columns.tagCapacity,
                  copy.columns.bundlePersonaFitScore,
                  copy.columns.testPhaseAvgCtr,
                  copy.columns.overallAvgCtr,
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
              {rows.map(row => {
                const checked = selectedSet.has(row.tag_id);
                return (
                  <tr
                    key={row.tag_id}
                    className={checked ? 'bg-primary-50/40' : ''}
                  >
                    <td className='px-4 py-4 align-top'>
                      <input
                        type='checkbox'
                        checked={checked}
                        onChange={() => handleToggleRow(row)}
                        disabled={
                          !checked &&
                          selectedTagIds.length >= MAX_AUTO_SELECT_COUNT
                        }
                        aria-label={row.tag_display_title || String(row.tag_id)}
                        className='h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50'
                      />
                    </td>
                    <td className='max-w-sm px-4 py-4 align-top'>
                      <p className='font-medium text-gray-900'>
                        {row.tag_display_title?.trim() || unavailable}
                      </p>
                    </td>
                    <td className='px-4 py-4 align-top text-sm text-gray-700'>
                      {formatMetric(row.tag_capacity)}
                    </td>
                    <td className='px-4 py-4 align-top text-sm text-gray-700'>
                      {formatMetric(row.bundle_persona_fit_score)}
                    </td>
                    <td className='px-4 py-4 align-top text-sm text-gray-700'>
                      {formatCtr(row.test_phase_avg_ctr)}
                    </td>
                    <td className='px-4 py-4 align-top text-sm text-gray-700'>
                      {formatCtr(row.overall_avg_ctr)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {isRefreshing ? (
        <div className='h-1 overflow-hidden bg-primary-50' aria-hidden='true'>
          <div className='h-full w-1/3 animate-pulse bg-primary-500' />
        </div>
      ) : null}

      <div className='border-t border-gray-200 px-4 py-4 sm:px-5'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
          <div className='grid grid-cols-1 gap-2 text-sm text-gray-700 sm:grid-cols-2 sm:gap-6'>
            <p>
              <span className='font-medium'>{copy.selectedTags}:</span>{' '}
              {formatNumber(selectedTagIds.length)}
            </p>
            <p>
              <span className='font-medium'>{copy.selectedRawCapacity}:</span>{' '}
              {formatNumber(Math.max(0, selectedRawCapacity))} {copy.audiences}
            </p>
          </div>

          {totalItems > 0 ? (
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
              <p className='text-sm text-gray-500'>
                {copy.pagination.showing
                  .replace('{from}', formatNumber(from))
                  .replace('{to}', formatNumber(to))
                  .replace('{total}', formatNumber(totalItems))}
              </p>
              <label className='flex items-center gap-2 text-sm text-gray-600'>
                <span>{copy.pagination.rowsPerPage}</span>
                <select
                  value={pageSize}
                  onChange={event =>
                    handlePageSizeChange(Number(event.target.value))
                  }
                  className='rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700'
                >
                  {PAGE_SIZE_OPTIONS.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={page <= 1 || isLoading}
                  onClick={() => setPage(value => Math.max(1, value - 1))}
                >
                  {copy.pagination.previous}
                </Button>
                <span className='min-w-16 text-center text-sm font-medium text-gray-700'>
                  {formatNumber(page)} / {formatNumber(totalPages)}
                </span>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={page >= totalPages || isLoading}
                  onClick={() =>
                    setPage(value => Math.min(totalPages, value + 1))
                  }
                >
                  {copy.pagination.next}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default SmartTargetingTagsTable;
