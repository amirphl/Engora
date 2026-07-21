import React from 'react';
import { BarChart3, Cpu, FileText, Info, Users } from 'lucide-react';
import { AdminGetCampaignResponse } from '../../../types/admin';
import { AdminCampaignManagementCopy } from '../translations';

interface CampaignDetailsModalProps {
  campaign: AdminGetCampaignResponse | null;
  copy: AdminCampaignManagementCopy;
  resolveStatusLabel: (status?: string | null) => string;
  formatDateTime: (value?: string | null) => string;
  onClose: () => void;
}

interface DetailFieldProps {
  label: string;
  value: string;
  mono?: boolean;
  full?: boolean;
}

interface DetailSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

type StatisticEntry = [key: string, value: unknown];

const renderArray = (value?: string[] | null): string =>
  Array.isArray(value) && value.length > 0 ? value.join(', ') : '-';

const formatNumber = (value?: number | null): string =>
  typeof value === 'number' ? value.toLocaleString() : '-';

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const flattenStatistics = (value: unknown, prefix = ''): StatisticEntry[] => {
  if (Array.isArray(value)) {
    if (!prefix) return [['statistics', value]];
    if (value.length === 0) return [[prefix, []]];

    const hasComplexItems = value.some(
      item => Array.isArray(item) || (typeof item === 'object' && item !== null)
    );

    if (!hasComplexItems) return [[prefix, value]];

    return value.flatMap((item, index) =>
      flattenStatistics(item, `${prefix}[${index}]`)
    );
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0) return prefix ? [[prefix, {}]] : [];

    return entries.flatMap(([key, nestedValue]) => {
      const nextPrefix = prefix ? `${prefix}.${key}` : key;
      return flattenStatistics(nestedValue, nextPrefix);
    });
  }

  return [[prefix || 'statistics', value]];
};

const formatStatisticValue = (value: unknown): string => {
  if (value === null || value === undefined) return '-';

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value.toLocaleString() : String(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (typeof value === 'string') {
    return value.trim() || '-';
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return '-';

    const primitiveOnly = value.every(
      item =>
        typeof item === 'string' ||
        typeof item === 'number' ||
        typeof item === 'boolean' ||
        item === null
    );

    if (primitiveOnly) {
      return value.map(item => (item === null ? '-' : String(item))).join(', ');
    }

    return JSON.stringify(value, null, 2);
  }

  return JSON.stringify(value, null, 2);
};

const isComplexStatisticValue = (value: unknown): boolean =>
  Array.isArray(value) || (typeof value === 'object' && value !== null);

const isTrackingResultsStatisticKey = (key: string): boolean =>
  key === 'trackingResults' ||
  key.startsWith('trackingResults.') ||
  key.startsWith('trackingResults[') ||
  key.endsWith('.trackingResults') ||
  key.includes('.trackingResults.') ||
  key.includes('.trackingResults[');

const DetailField: React.FC<DetailFieldProps> = ({
  label,
  value,
  mono = false,
  full = false,
}) => {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <div className='mb-1 text-xs font-medium text-gray-500'>{label}</div>
      <div
        className={`rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-800 ${mono ? 'font-mono' : ''} whitespace-pre-wrap break-words`}
      >
        {value || '-'}
      </div>
    </div>
  );
};

const DetailSection: React.FC<DetailSectionProps> = ({
  title,
  icon,
  children,
}) => {
  return (
    <section className='rounded-xl border border-gray-200 bg-white p-4 shadow-sm'>
      <div className='mb-3 flex items-center gap-2'>
        <span className='inline-flex rounded-lg bg-blue-50 p-2 text-blue-600'>
          {icon}
        </span>
        <h3 className='text-sm font-semibold text-gray-900'>{title}</h3>
      </div>
      <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>{children}</div>
    </section>
  );
};

const CampaignDetailsModal: React.FC<CampaignDetailsModalProps> = ({
  campaign,
  copy,
  resolveStatusLabel,
  formatDateTime,
  onClose,
}) => {
  if (!campaign) return null;

  const statusText = resolveStatusLabel(campaign.status);
  const statisticsEntries = flattenStatistics(campaign.statistics || {})
    .filter(([key]) => !isTrackingResultsStatisticKey(key))
    .sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className='fixed inset-0 z-50 flex items-end justify-center bg-black/45 backdrop-blur-[2px] sm:items-center sm:p-4'>
      <div className='flex max-h-[min(100dvh,100svh)] w-full flex-col overflow-hidden rounded-none border-gray-200 bg-gradient-to-b from-gray-50 to-white shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:max-w-5xl sm:rounded-2xl sm:border'>
        <div className='mb-0 flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-gray-200 p-4 sm:p-5'>
          <div>
            <h2 className='text-xl font-semibold text-gray-900'>
              {copy.modal.detailsTitle}
            </h2>
            <div className='mt-1 text-sm text-gray-600'>
              {copy.table.headers.id}: {campaign.id} |{' '}
              {copy.table.headers.status}: {statusText}
            </div>
          </div>
          <button
            type='button'
            className='rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-100'
            onClick={onClose}
            aria-label={copy.modal.closeLabel}
          >
            {copy.modal.closeLabel}
          </button>
        </div>

        <div className='min-h-0 space-y-4 overflow-y-auto p-4 sm:p-5'>
          <DetailSection
            title={copy.modal.sections.overview}
            icon={<Info className='h-4 w-4' />}
          >
            <DetailField label={copy.modal.uuid} value={campaign.uuid} mono />
            <DetailField
              label={copy.modal.title}
              value={campaign.title || '-'}
            />
            <DetailField
              label={copy.table.headers.scheduleAt}
              value={formatDateTime(campaign.scheduleat) || '-'}
            />
            <DetailField
              label={copy.modal.platform}
              value={campaign.platform || '-'}
            />
            <DetailField
              label={copy.table.headers.createdAt}
              value={formatDateTime(campaign.created_at) || '-'}
            />
            <DetailField
              label={copy.table.headers.updatedAt}
              value={formatDateTime(campaign.updated_at) || '-'}
            />
          </DetailSection>

          <DetailSection
            title={copy.modal.sections.audience}
            icon={<Users className='h-4 w-4' />}
          >
            <DetailField
              label={copy.table.headers.segment}
              value={campaign.level1 || '-'}
            />
            <DetailField
              label={copy.table.headers.subsegment}
              value={renderArray(campaign.level2s)}
            />
            <DetailField
              label={copy.modal.detailFields.level3s}
              value={renderArray(campaign.level3s)}
            />
            <DetailField
              label={copy.modal.detailFields.tags}
              value={renderArray(campaign.tags)}
            />
            <DetailField
              label={copy.table.headers.sex}
              value={campaign.sex || '-'}
            />
            <DetailField
              label={copy.table.headers.city}
              value={renderArray(campaign.city)}
            />
          </DetailSection>

          <DetailSection
            title={copy.modal.sections.content}
            icon={<FileText className='h-4 w-4' />}
          >
            <DetailField
              label={copy.table.headers.adLink}
              value={campaign.adlink || '-'}
              full
            />
            <DetailField
              label={copy.table.headers.content}
              value={campaign.content || '-'}
              full
            />
            <DetailField
              label={copy.table.headers.lineNumber}
              value={campaign.line_number || '-'}
            />
            <DetailField
              label={copy.table.headers.comment}
              value={campaign.comment || '-'}
              full
            />
            <DetailField
              label={copy.modal.detailFields.shortLinkDomain}
              value={
                campaign.adlink && campaign.short_link_domain?.trim()
                  ? campaign.short_link_domain.trim()
                  : '-'
              }
            />
            <DetailField
              label={copy.modal.detailFields.jobCategory}
              value={campaign.job_category || '-'}
            />
            <DetailField
              label={copy.modal.detailFields.job}
              value={campaign.job || '-'}
            />
          </DetailSection>

          <DetailSection
            title={copy.modal.sections.performance}
            icon={<BarChart3 className='h-4 w-4' />}
          >
            <DetailField
              label={copy.table.headers.budget}
              value={formatNumber(campaign.budget)}
            />
            <DetailField
              label={copy.modal.detailFields.totalClicks}
              value={formatNumber(campaign.total_clicks)}
            />
            <DetailField
              label={copy.modal.detailFields.clickRate}
              value={
                typeof campaign.click_rate === 'number'
                  ? String(campaign.click_rate)
                  : '-'
              }
            />
            <DetailField
              label={copy.modal.detailFields.segmentPriceFactor}
              value={
                typeof campaign.segment_price_factor === 'number'
                  ? String(campaign.segment_price_factor)
                  : '-'
              }
            />
            <DetailField
              label={copy.modal.detailFields.lineNumberPriceFactor}
              value={
                typeof campaign.line_number_price_factor === 'number'
                  ? String(campaign.line_number_price_factor)
                  : '-'
              }
            />
          </DetailSection>

          <DetailSection
            title={copy.modal.sections.technical}
            icon={<Cpu className='h-4 w-4' />}
          >
            <DetailField
              label={copy.modal.platformSettingsId}
              value={
                typeof campaign.platform_settings_id === 'number'
                  ? String(campaign.platform_settings_id)
                  : '-'
              }
            />
            <DetailField
              label={copy.modal.mediaUuid}
              value={campaign.media_uuid || '-'}
              mono
            />

            {statisticsEntries.length > 0 ? (
              statisticsEntries.map(([key, value]) => (
                <DetailField
                  key={`statistics-${key}`}
                  label={`${copy.modal.detailFields.statistics}: ${key}`}
                  value={formatStatisticValue(value)}
                  mono={isComplexStatisticValue(value)}
                  full
                />
              ))
            ) : (
              <DetailField
                label={copy.modal.detailFields.statistics}
                value='-'
                mono
                full
              />
            )}
          </DetailSection>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetailsModal;
