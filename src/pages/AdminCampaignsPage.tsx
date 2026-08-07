import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ROUTES } from '../config/routes';
import { useNavigation } from '../contexts/NavigationContext';
import { useLanguage } from '../hooks/useLanguage';
import { useToast } from '../hooks/useToast';
import {
  AdminGetCampaignResponse,
  AdminListCampaignsFilter,
} from '../types/admin';
import ActionModal from './adminCampaignManagement/components/ActionModal';
import CampaignDetailsModal from './adminCampaignManagement/components/CampaignDetailsModal';
import RescheduleCampaignModal from './adminCampaignManagement/components/RescheduleCampaignModal';
import CampaignsTable from './adminCampaignManagement/components/CampaignsTable';
import FiltersBar from './adminCampaignManagement/components/FiltersBar';
import {
  CampaignActionType,
  DEFAULT_CAMPAIGN_STATUS_FILTER,
} from './adminCampaignManagement/constants';
import { useCampaignActions } from './adminCampaignManagement/hooks/useCampaignActions';
import { useCampaignFilters } from './adminCampaignManagement/hooks/useCampaignFilters';
import { useCampaignList } from './adminCampaignManagement/hooks/useCampaignList';
import { useCampaignReschedule } from './adminCampaignManagement/hooks/useCampaignReschedule';
import { getAdminCampaignManagementCopy } from './adminCampaignManagement/translations';
import {
  formatCampaignDateTime,
  getActionResultStatus,
  getTranslatedStatus,
} from './adminCampaignManagement/utils';

const AdminCampaignsPage: React.FC = () => {
  const { language } = useLanguage();
  const copy = useMemo(
    () => getAdminCampaignManagementCopy(language),
    [language]
  );
  const { showError, showSuccess } = useToast();
  const { navigate } = useNavigation();

  const {
    items,
    loading,
    loadingMore,
    error,
    hasMore,
    replaceCampaigns,
    loadNextPage,
    updateCampaign,
  } = useCampaignList({
    copy,
    showError,
  });

  const {
    title,
    status,
    start,
    end,
    setTitle,
    setStatus,
    setStart,
    setEnd,
    statusOptions,
    getAppliedParams,
  } = useCampaignFilters({
    copy,
    onInvalid: message => {
      showError(message);
    },
  });

  const didInitRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [detailsCampaign, setDetailsCampaign] =
    useState<AdminGetCampaignResponse | null>(null);

  const runReplaceCampaigns = useCallback(
    async (filters: AdminListCampaignsFilter) => {
      await replaceCampaigns(filters);
    },
    [replaceCampaigns]
  );

  const handleActionSuccess = useCallback(
    (campaignUuid: string, actionType: CampaignActionType, comment: string) => {
      const nextStatus = getActionResultStatus(actionType);
      updateCampaign(campaignUuid, item => ({
        ...item,
        status: nextStatus,
        ...(comment ? { comment } : {}),
      }));
    },
    [updateCampaign]
  );

  const handleRetryLoadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    void loadNextPage();
  }, [hasMore, loadNextPage, loading, loadingMore]);

  const loadMoreRef = useCallback(
    (node: HTMLTableRowElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      if (!node) return;

      observerRef.current = new IntersectionObserver(
        entries => {
          const [entry] = entries;
          if (!entry?.isIntersecting) return;
          if (loading || loadingMore || !hasMore) return;
          void loadNextPage();
        },
        {
          rootMargin: '300px 0px',
        }
      );

      observerRef.current.observe(node);
    },
    [hasMore, loadNextPage, loading, loadingMore]
  );

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  const handleRescheduleSuccess = useCallback(
    (campaignUuid: string, scheduleAtUtc: string) => {
      updateCampaign(campaignUuid, item => ({
        ...item,
        scheduleat: scheduleAtUtc,
      }));
    },
    [updateCampaign]
  );

  const {
    actionCampaign,
    actionType,
    actionComment,
    actionError,
    actionSubmitting,
    setActionComment,
    openActionModal,
    closeActionModal,
    submitAction,
  } = useCampaignActions({
    copy,
    language,
    showError,
    onActionSuccess: (campaign, nextAction, comment) => {
      handleActionSuccess(campaign.uuid, nextAction, comment);
    },
  });

  const {
    campaign: rescheduleCampaign,
    selectedDate: rescheduleSelectedDate,
    enInputValue: rescheduleEnInputValue,
    minFutureDate,
    minLocalDateTimeValue,
    validationError: rescheduleValidationError,
    confirmOpen: rescheduleConfirmOpen,
    submitting: rescheduleSubmitting,
    openRescheduleModal,
    closeRescheduleModal,
    onEnDateTimeChange,
    onFaDateTimeChange,
    requestRescheduleConfirmation,
    cancelConfirmation,
    submitReschedule,
  } = useCampaignReschedule({
    copy,
    showError,
    showSuccess,
    onRescheduled: handleRescheduleSuccess,
  });

  const resolveStatusLabel = useCallback(
    (rawStatus?: string | null) => getTranslatedStatus(rawStatus, copy),
    [copy]
  );

  const formatDateTime = useCallback(
    (value?: string | null) => formatCampaignDateTime(value, language),
    [language]
  );
  const columnAlignClass = language === 'fa' ? 'text-right' : 'text-left';

  const handleApplyFilters = useCallback(async () => {
    const params = getAppliedParams();
    if (!params) return;

    await runReplaceCampaigns(params);
  }, [getAppliedParams, runReplaceCampaigns]);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    void runReplaceCampaigns({
      status: DEFAULT_CAMPAIGN_STATUS_FILTER,
    });
  }, [runReplaceCampaigns]);

  return (
    <div className='mx-auto max-w-[1400px] px-3 py-4 sm:px-4'>
      <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <h1 className='text-2xl font-semibold'>{copy.title}</h1>
        <button
          className='w-full rounded bg-gray-200 px-3 py-2 text-gray-800 hover:bg-gray-300 sm:w-auto'
          onClick={() => navigate(ROUTES.ADMIN_SARDIS.path)}
        >
          {copy.backToSardis}
        </button>
      </div>

      <FiltersBar
        language={language}
        title={title}
        status={status}
        start={start}
        end={end}
        loading={loading}
        copy={copy}
        statusOptions={statusOptions}
        onTitleChange={setTitle}
        onStatusChange={setStatus}
        onStartChange={setStart}
        onEndChange={setEnd}
        onApply={handleApplyFilters}
      />

      <CampaignsTable
        items={items}
        loading={loading}
        loadingMore={loadingMore}
        error={error}
        hasMore={hasMore}
        copy={copy}
        formatDateTime={formatDateTime}
        resolveStatusLabel={resolveStatusLabel}
        isActionSubmitting={actionSubmitting}
        columnAlignClass={columnAlignClass}
        loadMoreRef={loadMoreRef}
        onRetryLoadMore={handleRetryLoadMore}
        onSelectAction={openActionModal}
        onOpenDetails={setDetailsCampaign}
        onOpenReschedule={openRescheduleModal}
      />

      <ActionModal
        actionType={actionType}
        actionCampaign={actionCampaign}
        actionComment={actionComment}
        actionError={actionError}
        actionSubmitting={actionSubmitting}
        copy={copy}
        resolveStatusLabel={resolveStatusLabel}
        formatDateTime={formatDateTime}
        onClose={closeActionModal}
        onCommentChange={setActionComment}
        onSubmit={submitAction}
      />

      <CampaignDetailsModal
        campaign={detailsCampaign}
        copy={copy}
        resolveStatusLabel={resolveStatusLabel}
        formatDateTime={formatDateTime}
        onClose={() => setDetailsCampaign(null)}
      />

      <RescheduleCampaignModal
        language={language}
        campaign={rescheduleCampaign}
        selectedDate={rescheduleSelectedDate}
        enInputValue={rescheduleEnInputValue}
        minFutureDate={minFutureDate}
        minLocalDateTimeValue={minLocalDateTimeValue}
        validationError={rescheduleValidationError}
        confirmOpen={rescheduleConfirmOpen}
        submitting={rescheduleSubmitting}
        copy={copy}
        formatDateTime={formatDateTime}
        onClose={closeRescheduleModal}
        onEnDateTimeChange={onEnDateTimeChange}
        onFaDateTimeChange={onFaDateTimeChange}
        onRequestConfirm={requestRescheduleConfirmation}
        onCancelConfirm={cancelConfirmation}
        onConfirmSubmit={submitReschedule}
      />
    </div>
  );
};

export default AdminCampaignsPage;
