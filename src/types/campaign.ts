// Campaign Types and Interfaces

export type AudienceGrade = 'A' | 'B' | 'C';
export type AudienceTargetingMethod = 'standard' | 'smart_targeting' | 'excel';
export type CampaignPhase = 'test' | 'execution';
export type SmartTargetingSortBy =
  | 'tag_capacity'
  | 'bundle_persona_fit_score'
  | 'test_phase_avg_ctr'
  | 'overall_avg_ctr';
export type SmartTargetingSortDirection = 'asc' | 'desc';

export interface CampaignSegment {
  campaignTitle: string;
  level1: string; // Level 1 selection (single)
  level2s: string[]; // Level 2 selections (multiple)
  level3s: string[]; // Level 3 selections (multiple)
  targetAudienceExcelFileUuid?: string | null; // Excel segmentation upload UUID
  platform: CampaignPlatform;
  tags?: string[]; // Union of tags from selected level3s
  audienceTargetingMethod?: AudienceTargetingMethod;
  selectedTagIds?: number[]; // Campaign-level Smart Targeting tag IDs
  smartTargetingSelectedRawCapacity?: number;
  smartTargetingSelectionDirty?: boolean;
  capacityTooLow?: boolean;
  capacity?: number; // Total audience capacity (calculated from CSV)
  audienceGrades?: AudienceGrade[]; // Selected audience quality grades
  sex?: string;
  city?: string[];
  jobCategory?: string;
  job?: string;
  bundleId?: number | null;
  phase?: CampaignPhase;
}

export interface CustomFilter {
  field: string;
  operator: string;
  value: string;
}

export interface CampaignContent {
  insertLink: boolean;
  link: string;
  text: string;
  scheduleAt?: string; // ISO string for datetime
  shortLinkDomain: string | null;
  lineNumber?: string;
  platformSettingsId?: number | null;
  mediaUuid?: string | null;
}

export interface CampaignBudget {
  totalBudget: number;
  estimatedMessages?: number; // Populated by backend, not stored in localStorage
}

export interface CampaignPayment {
  paymentMethod: string;
  termsAccepted: boolean;
  hasEnoughBalance?: boolean; // Track if user has sufficient wallet balance
  finalCost?: number; // Populated by API, not stored in localStorage
  total?: number; // Populated by API, not stored in localStorage
}

export interface CampaignData {
  id?: number;
  uuid: string;
  segment: CampaignSegment;
  content: CampaignContent;
  budget: CampaignBudget;
  payment: CampaignPayment;
}

export type CampaignPlatform = 'sms' | 'rubika' | 'bale' | 'splus';
export type CampaignMediaType = 'image' | 'video';

// API payload interface matching Go backend structure
export interface CreateCampaignPayload {
  title?: string;
  level1?: string; // Level 1 selection (single)
  level2s?: string[]; // Level 2 selections (multiple)
  level3s?: string[]; // Level 3 selections (multiple)
  target_audience_excel_file_uuid?: string | null;
  tags?: string[]; // Union of tags from selected level3s
  audience_targeting_method?: AudienceTargetingMethod;
  selected_tag_ids?: number[];
  sex?: string;
  city?: string[];
  adlink?: string;
  content?: string;
  scheduleat?: string;
  line_number?: string | null;
  budget?: number;
  short_link_domain?: string | null;
  job_category?: string;
  job?: string;
  platform?: CampaignPlatform;
  platform_settings_id?: number | null;
  media_uuid?: string | null;
  bundle_id?: number | null;
  phase?: CampaignPhase;
  audience_grades?: AudienceGrade[];
}

// API response interface matching Go backend structure
export interface CreateSMSCampaignResponse {
  message: string;
  id: number;
  uuid: string;
  status: string;
  created_at: string;
}

export interface CloneCampaignResponse {
  message: string;
  id: number;
  uuid: string;
  status: string;
  created_at: string;
}

export interface GetLastInitiatedCampaignResponse {
  message?: string;
  item?: GetCampaignResponse;
}

// API response wrapper matching Go backend structure
export interface CreateCampaignResponse {
  success: boolean;
  message: string;
  data?: CreateSMSCampaignResponse;
  error?: any;
}

// Campaign capacity calculation request interface
export interface CalculateCampaignCapacityRequest {
  campaign_id: number;
}

// Campaign capacity calculation response interface
export interface CalculateCampaignCapacityResponse {
  message: string;
  capacity: number;
}

// Campaign cost calculation request interface
export interface CalculateCampaignCostRequest {
  budget?: number;
  campaign_id: number;
}

export interface CalculateCampaignCostV2Request {
  campaign_id: number;
  num_messages: number;
}

// Campaign cost calculation response interface
export interface CalculateCampaignCostResponse {
  message: string;
  total_cost: number;
  msg_target: number;
  max_msg_target?: number;
}

// Wallet balance response interface
export interface GetWalletBalanceResponse {
  message: string;
  free: number;
  locked: number;
  frozen: number;
  credit?: number;
  spent_on_campaigns?: number;
  agency_share_with_tax?: number;
  total: number;
  currency: string;
  last_updated: string;
}

// Update campaign request interface
export interface UpdateSMSCampaignRequest {
  title?: string;
  level1?: string; // Level 1 selection (single)
  level2s?: string[]; // Level 2 selections (multiple)
  level3s?: string[]; // Level 3 selections (multiple)
  target_audience_excel_file_uuid?: string | null;
  tags?: string[]; // Union of tags from selected level3s
  audience_targeting_method?: AudienceTargetingMethod;
  selected_tag_ids?: number[];
  sex?: string;
  city?: string[];
  adlink?: string;
  content?: string;
  scheduleat?: string;
  line_number?: string | null;
  budget?: number;
  finalize?: boolean;
  short_link_domain?: string | null;
  job_category?: string;
  job?: string;
  platform?: CampaignPlatform;
  platform_settings_id?: number | null;
  media_uuid?: string | null;
  bundle_id?: number | null;
  phase?: CampaignPhase;
  audience_grades?: AudienceGrade[];
}

export interface UploadMultimediaResponse {
  message: string;
  uuid: string;
  media_type: string;
  mime_type: string;
  size_bytes: number;
  original_filename: string;
  created_at: string;
}

// Update campaign response interface
export interface UpdateSMSCampaignResponse {
  message: string;
}

export interface HideCampaignsRequest {
  campaign_ids: number[];
}

export interface HideCampaignsResponse {
  message: string;
  updated_count: number;
}

export interface UnhideCampaignsRequest {
  campaign_ids: number[];
}

export interface UnhideCampaignsResponse {
  message: string;
  updated_count: number;
}

export interface SendCampaignTestMessageResponse {
  [key: string]: unknown;
}

export interface SendCampaignTestMessageRequest {
  target_phone_number: string;
}

export interface CampaignStep {
  id: number;
  title: string;
  isCompleted: boolean;
  isAccessible: boolean;
}

export interface FormField {
  id: string;
  label: string;
  type:
    | 'text'
    | 'number'
    | 'select'
    | 'textarea'
    | 'checkbox'
    | 'radio'
    | 'datetime-local';
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    step?: number;
    pattern?: string;
    message?: string;
  };
}

export interface StepConfig {
  id: number;
  title: string;
  subtitle: string;
  component: React.ComponentType;
  validation: (data: CampaignData) => boolean;
  fields: FormField[];
}

export interface GetCampaignResponse {
  id?: number;
  uuid: string;
  status: string;
  created_at: string;
  updated_at?: string;
  hidden?: boolean;
  title?: string;
  level1?: string;
  level2s?: string[];
  level3s?: string[];
  target_audience_excel_file_uuid?: string | null;
  tags?: string[];
  audience_targeting_method?: AudienceTargetingMethod | string;
  sex?: string;
  city?: string[];
  adlink?: string;
  content?: string;
  short_link_domain?: string | null;
  job_category?: string;
  job?: string;
  scheduleat?: string;
  line_number?: string;
  line_price_factor?: number;
  segment_price_factor?: number | null;
  budget?: number;
  num_audience?: number;
  comment?: string;
  statistics?: Record<string, any>;
  click_rate?: number;
  total_clicks?: number;
  platform?: CampaignPlatform | null;
  platform_settings_id?: number | null;
  platform_settings_name?: string | null;
  platform_base_price?: number | null;
  media_uuid?: string | null;
  audience_grades?: AudienceGrade[];
  bundle_id?: number | null;
  bundle_title?: string | null;
  phase?: CampaignPhase | string | null;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

export interface SmartTargetingTagItem {
  tag_id: number;
  tag_display_title?: string | null;
  tag_capacity?: number | null;
  bundle_persona_fit_score?: number | null;
  evaluation_run_id?: number | null;
  fit_level?: string | null;
  relation_type?: string | null;
  test_phase_avg_ctr?: number | null;
  overall_avg_ctr?: number | null;
  selected: boolean;
}

export interface SmartTargetingSelectionSummary {
  selected_tag_count: number;
  selected_raw_capacity: number;
}

export interface ListSmartTargetingTagsParams {
  page: number;
  page_size: number;
  search?: string;
  sort_by?: SmartTargetingSortBy;
  sort_direction?: SmartTargetingSortDirection;
}

export interface ListSmartTargetingTagsResponse {
  items: SmartTargetingTagItem[];
  pagination: PaginationInfo;
  selected_tag_ids: number[];
  summary: SmartTargetingSelectionSummary;
  evaluation_available: boolean;
  effective_sort_by?: SmartTargetingSortBy | '';
  effective_sort_direction?: SmartTargetingSortDirection | '';
}

export interface ReplaceSmartTargetingSelectionRequest {
  tag_ids: number[];
}

export interface AutoSelectSmartTargetingTagsRequest {
  count: number;
  search?: string;
  sort_by?: SmartTargetingSortBy;
  sort_direction?: SmartTargetingSortDirection;
}

export interface SmartTargetingSelectionResponse {
  selected_tag_ids: number[];
  summary: SmartTargetingSelectionSummary;
}

export interface ListSMSCampaignsResponse {
  message: string;
  items: GetCampaignResponse[];
  pagination: PaginationInfo;
}

export interface ListSMSCampaignsParams {
  page: number;
  limit: number;
  orderby?:
    | 'newest'
    | 'oldest'
    | 'phase_test_first'
    | 'phase_execution_first'
    | 'highest_click_rate'
    | 'lowest_click_rate';
  campaign_title?: string;
  bundle_title?: string;
  status?:
    | 'initiated'
    | 'in-progress'
    | 'waiting-for-approval'
    | 'approved'
    | 'rejected'
    | 'running'
    | 'cancelled'
    | 'cancelled-by-admin'
    | 'expired'
    | 'executed';
  bundle_id?: number;
  platform?: 'sms' | 'rubika' | 'bale' | 'splus';
  start_date?: string;
  end_date?: string;
  phase?: 'test' | 'execution';
  hidden?: boolean;
}

// Audience Spec types
export interface AudienceSpecItem {
  tags: string[];
  available_audience: number;
}

export interface AudienceSpecLevel2 {
  metadata: Record<string, any>;
  items: Record<string, AudienceSpecItem>;
}

// Now three levels: level1 -> level2 -> level3 -> AudienceSpecItem
export type AudienceSpec = Record<string, Record<string, AudienceSpecLevel2>>;

export interface ListAudienceSpecResponse {
  message: string;
  spec: AudienceSpec;
}

// Active line numbers
export interface ActiveLineNumberItem {
  line_number: string;
}

export interface ListActiveLineNumbersResponse {
  message: string;
  items: ActiveLineNumberItem[];
}

// Segment price factors (latest per level3)
export interface SegmentPriceFactorItem {
  level3: string;
  price_factor: number;
  created_at: string;
}

export interface ListLatestSegmentPriceFactorsResponse {
  message: string;
  items: SegmentPriceFactorItem[];
}
