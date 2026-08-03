import { GetCampaignResponse } from '../../../../types/campaign';
import { BundleListItem } from '../../../../types/bundle';
import { ReportsCopy } from '../../translations';

export const FALLBACK_VALUE = '-';

export const toNumericValue = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

export const formatDisplayValue = (value: unknown): string => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || FALLBACK_VALUE;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toLocaleString();
  }

  return FALLBACK_VALUE;
};

export const formatNumberValue = (
  value: unknown,
  options?: Intl.NumberFormatOptions
): string => {
  const numericValue = toNumericValue(value);
  if (numericValue === null) return FALLBACK_VALUE;

  return numericValue.toLocaleString(undefined, options);
};

export const formatPercentValue = (value: unknown): string => {
  const numericValue = toNumericValue(value);
  if (numericValue === null) return FALLBACK_VALUE;

  return `${(numericValue * 100).toFixed(2)}%`;
};

export const joinValues = (value?: string[] | null): string => {
  if (!Array.isArray(value) || value.length === 0) return FALLBACK_VALUE;

  const items = value.map(item => item.trim()).filter(Boolean);
  return items.length > 0 ? items.join(', ') : FALLBACK_VALUE;
};

export const getSegmentationMethod = (
  campaign: GetCampaignResponse,
  copy: ReportsCopy
): string =>
  campaign.audience_targeting_method === 'smart_targeting'
    ? copy.modal.segmentationMethodSmartTargeting
    : campaign.target_audience_excel_file_uuid ||
        campaign.audience_targeting_method === 'excel'
      ? copy.modal.segmentationMethodExcelFile
      : copy.modal.segmentationMethodLevels;

export const getPhaseLabel = (
  phase: GetCampaignResponse['phase'],
  copy: ReportsCopy
): string => {
  if (!phase) return FALLBACK_VALUE;
  if (phase === 'test') return copy.phaseTest;
  if (phase === 'execution') return copy.phaseExecution;
  return phase;
};

export const getPlatformChannelLabel = (
  campaign: GetCampaignResponse,
  copy: ReportsCopy
) => {
  const platform = campaign.platform ?? 'sms';

  return {
    platformLabel: copy.platforms[platform] ?? platform,
    channelLabel:
      platform === 'sms'
        ? copy.modal.lineNumber
        : copy.modal.platformSettingsName,
    channelValue:
      platform === 'sms'
        ? formatDisplayValue(campaign.line_number)
        : formatDisplayValue(campaign.platform_settings_name),
    priceLabel:
      platform === 'sms'
        ? copy.modal.linePriceFactor
        : copy.modal.platformBasePrice,
    priceValue:
      platform === 'sms'
        ? formatNumberValue(campaign.line_price_factor)
        : formatNumberValue(campaign.platform_base_price),
  };
};

export const getRefundValue = (campaign: GetCampaignResponse): number | null =>
  toNumericValue(campaign.statistics?.undeliveredRefundAmount);

export const getCampaignCostValue = (
  campaign: GetCampaignResponse
): number | null => {
  const budget = toNumericValue(campaign.budget);
  const totalSent = toNumericValue(campaign.statistics?.aggregatedTotalSent);
  const totalRecords = toNumericValue(
    campaign.statistics?.aggregatedTotalRecords
  );

  if (
    budget === null ||
    totalSent === null ||
    totalRecords === null ||
    totalRecords <= 0
  ) {
    return null;
  }

  return (budget * totalSent) / totalRecords;
};

export const getBundleCategoryValue = (bundle: BundleListItem | null): string =>
  formatDisplayValue(bundle?.job_category);

export const getBundleJobValue = (bundle: BundleListItem | null): string =>
  formatDisplayValue(bundle?.job);
