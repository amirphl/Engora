import React from 'react';
import ModalShell from './ModalShell';
import { AdminCustomerManagementCopy } from '../translations';
import { AdminGetCampaignResponse } from '../../../types/admin';
import {
  CampaignSpecInfoGrid,
  CampaignSpecInfoItem,
  CampaignSpecSection,
  CampaignSpecTextBlock,
} from './CampaignSpecLayout';

interface CampaignDetailsModalProps {
  isOpen: boolean;
  loading: boolean;
  error: string | null;
  campaign: AdminGetCampaignResponse | null;
  copy: AdminCustomerManagementCopy;
  onClose: () => void;
  formatDateTime: (iso?: string | null) => string;
  formatNumber: (n?: number | null) => string;
}

const CampaignDetailsModal: React.FC<CampaignDetailsModalProps> = ({
  isOpen,
  loading,
  error,
  campaign,
  copy,
  onClose,
  formatDateTime,
  formatNumber,
}) => {
  const fields = copy.campaignDetails;
  const formatList = (items?: string[] | null) =>
    Array.isArray(items) && items.length > 0 ? items.join(', ') : '-';

  const statsValue =
    campaign?.statistics && Object.keys(campaign.statistics).length > 0
      ? JSON.stringify(campaign.statistics, null, 2)
      : null;

  const hasAdlink =
    typeof campaign?.adlink === 'string' && campaign.adlink.trim() !== '';
  const platformChannel =
    campaign?.platform === 'sms'
      ? campaign.line_number || '-'
      : campaign?.platform_settings_name || campaign?.line_number || '-';
  const scheduleAt = campaign?.scheduleat;

  return (
    <ModalShell
      isOpen={isOpen}
      title={copy.modals.campaignTitle}
      onClose={onClose}
      maxWidthClassName='max-w-5xl'
    >
      {loading && (
        <div className='text-sm text-gray-500'>{copy.common.loading}</div>
      )}
      {error && !loading && <div className='text-sm text-red-600'>{error}</div>}
      {!loading && !error && campaign && (
        <div className='space-y-6'>
          <CampaignSpecSection title={fields.sections.overview}>
            <CampaignSpecInfoGrid columns={3}>
              <CampaignSpecInfoItem
                label={fields.campaignId}
                value={campaign.campaign_id ?? '-'}
              />
              <CampaignSpecInfoItem label={fields.id} value={campaign.id} />
              <CampaignSpecInfoItem label={fields.uuid} value={campaign.uuid} />
              <CampaignSpecInfoItem
                label={fields.status}
                value={campaign.status}
              />
              <CampaignSpecInfoItem
                label={fields.platform}
                value={campaign.platform || '-'}
              />
              <CampaignSpecInfoItem
                label={fields.platformChannel}
                value={platformChannel}
              />
              <CampaignSpecInfoItem
                label={fields.platformSettingsName}
                value={campaign.platform_settings_name || '-'}
              />
              <CampaignSpecInfoItem
                label={fields.platformSettingsId}
                value={
                  typeof campaign.platform_settings_id === 'number'
                    ? campaign.platform_settings_id
                    : '-'
                }
              />
              <CampaignSpecInfoItem
                label={fields.mediaUuid}
                value={campaign.media_uuid || '-'}
              />
              <CampaignSpecInfoItem
                label={fields.created}
                value={formatDateTime(campaign.created_at)}
              />
              <CampaignSpecInfoItem
                label={fields.updated}
                value={formatDateTime(campaign.updated_at)}
              />
              <CampaignSpecInfoItem
                label={fields.schedule}
                value={formatDateTime(scheduleAt)}
              />
            </CampaignSpecInfoGrid>
          </CampaignSpecSection>

          <CampaignSpecSection title={fields.sections.specification}>
            <CampaignSpecInfoGrid>
              <CampaignSpecInfoItem
                label={fields.title}
                value={campaign.title || '-'}
              />
              <CampaignSpecInfoItem
                label={fields.level1}
                value={campaign.level1 || '-'}
              />
              <CampaignSpecInfoItem
                label={fields.level2s}
                value={formatList(campaign.level2s)}
              />
              <CampaignSpecInfoItem
                label={fields.level3s}
                value={formatList(campaign.level3s)}
              />
              <CampaignSpecInfoItem
                label={fields.tags}
                value={formatList(campaign.tags)}
              />
              <CampaignSpecInfoItem
                label={fields.sex}
                value={campaign.sex || '-'}
              />
              <CampaignSpecInfoItem
                label={fields.cities}
                value={formatList(campaign.city)}
              />
              <CampaignSpecInfoItem
                label={fields.jobCategory}
                value={campaign.job_category || '-'}
              />
              <CampaignSpecInfoItem
                label={fields.job}
                value={campaign.job || '-'}
              />
              <CampaignSpecInfoItem
                label={fields.lineNumber}
                value={campaign.line_number || '-'}
              />
              <CampaignSpecInfoItem
                label={fields.targetAudienceExcelFileUuid}
                value={campaign.target_audience_excel_file_uuid || '-'}
              />
            </CampaignSpecInfoGrid>
          </CampaignSpecSection>

          <CampaignSpecSection title={fields.sections.message}>
            <div className='space-y-3'>
              <CampaignSpecInfoGrid>
                <CampaignSpecInfoItem
                  label={fields.adLink}
                  value={campaign.adlink || '-'}
                />
                <CampaignSpecInfoItem
                  label={fields.shortLinkDomain}
                  value={
                    hasAdlink && campaign.short_link_domain?.trim()
                      ? campaign.short_link_domain.trim()
                      : '-'
                  }
                />
              </CampaignSpecInfoGrid>
              <CampaignSpecTextBlock>
                <p className='whitespace-pre-wrap break-words'>
                  {campaign.content || '-'}
                </p>
              </CampaignSpecTextBlock>
            </div>
          </CampaignSpecSection>

          <CampaignSpecSection title={fields.sections.pricing}>
            <CampaignSpecInfoGrid>
              <CampaignSpecInfoItem
                label={fields.budget}
                value={formatNumber(campaign.budget)}
              />
              <CampaignSpecInfoItem
                label={fields.segmentPriceFactor}
                value={
                  typeof campaign.segment_price_factor === 'number'
                    ? campaign.segment_price_factor
                    : '-'
                }
              />
              <CampaignSpecInfoItem
                label={fields.lineNumberPriceFactor}
                value={
                  typeof campaign.line_number_price_factor === 'number'
                    ? campaign.line_number_price_factor
                    : '-'
                }
              />
              <CampaignSpecInfoItem
                label={fields.numAudience}
                value={formatNumber(campaign.num_audience)}
              />
            </CampaignSpecInfoGrid>
          </CampaignSpecSection>

          <CampaignSpecSection title={fields.sections.performance}>
            <CampaignSpecInfoGrid>
              <CampaignSpecInfoItem
                label={fields.totalSent}
                value={formatNumber(campaign.total_sent)}
              />
              <CampaignSpecInfoItem
                label={fields.totalDelivered}
                value={formatNumber(campaign.total_delivered)}
              />
              <CampaignSpecInfoItem
                label={fields.totalClicks}
                value={formatNumber(campaign.total_clicks)}
              />
              <CampaignSpecInfoItem
                label={fields.clickRate}
                value={
                  typeof campaign.click_rate === 'number'
                    ? `${(campaign.click_rate * 100).toFixed(2)}%`
                    : '-'
                }
              />
            </CampaignSpecInfoGrid>
          </CampaignSpecSection>

          <CampaignSpecSection title={fields.sections.ownership}>
            <CampaignSpecInfoGrid>
              <CampaignSpecInfoItem
                label={fields.customerFullName}
                value={campaign.customer_full_name || '-'}
              />
              <CampaignSpecInfoItem
                label={fields.agencyFullName}
                value={campaign.agency_full_name || '-'}
              />
            </CampaignSpecInfoGrid>
          </CampaignSpecSection>

          <CampaignSpecSection title={fields.sections.admin}>
            <div className='space-y-3'>
              <CampaignSpecTextBlock>
                <p className='whitespace-pre-wrap break-words'>
                  {campaign.comment || '-'}
                </p>
              </CampaignSpecTextBlock>
              <CampaignSpecInfoItem
                label={fields.statistics}
                value={
                  statsValue ? (
                    <pre className='whitespace-pre-wrap break-words text-xs font-normal'>
                      {statsValue}
                    </pre>
                  ) : (
                    '-'
                  )
                }
              />
            </div>
          </CampaignSpecSection>
        </div>
      )}
    </ModalShell>
  );
};

export default CampaignDetailsModal;
