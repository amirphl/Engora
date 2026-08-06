export interface CampaignFlowErrorCopy {
  unknownError: string;
  networkError: string;
  errorCodes: Record<string, string>;
}

const campaignFlowErrorsEn: CampaignFlowErrorCopy = {
  unknownError: 'An unexpected error occurred. Please try again.',
  networkError: 'Network error. Please check your connection and try again.',
  errorCodes: {
    MISSING_CAMPAIGN_UUID: 'Campaign UUID is required.',
    INVALID_CAMPAIGN_UUID: 'Campaign UUID is invalid.',
    MISSING_CUSTOMER_ID: 'Authentication is missing. Please log in again.',
    INVALID_STATE: 'Another request is already in progress.',
    SMART_TARGETING_CAPACITY_PENDING:
      'Exact Smart Targeting capacity is being calculated. Please wait and try again.',
    SMART_TARGETING_EXACT_CAPACITY_REQUIRED:
      'Recalculate the current exact Smart Targeting capacity before proceeding.',
    CAMPAIGN_NOT_FOUND: 'Campaign not found.',
    CAMPAIGN_ACCESS_DENIED: 'You do not have access to this campaign.',
    CAMPAIGN_UPDATE_NOT_ALLOWED:
      'Campaign cannot be updated in its current status.',
    CAMPAIGN_CANCEL_NOT_ALLOWED:
      'Campaign cannot be cancelled in its current status.',
    CAMPAIGN_NOT_APPROVED: 'Campaign is not approved.',
    INSUFFICIENT_CAPACITY: 'Insufficient campaign capacity.',
    INSUFFICIENT_FUNDS: 'Insufficient funds.',
    CUSTOMER_NOT_FOUND: 'Customer not found.',
    ACCOUNT_INACTIVE: 'Account is inactive.',
    ACCOUNT_TYPE_NOT_FOUND: 'Account type not found.',
    WALLET_NOT_FOUND: 'Wallet not found.',
    BALANCE_SNAPSHOT_NOT_FOUND: 'Balance snapshot not found.',
    FREEZE_TRANSACTION_NOT_FOUND: 'Freeze transaction not found.',
    MULTIPLE_FREEZE_TRANSACTIONS_FOUND:
      'Multiple freeze transactions were found.',
    CAMPAIGN_DEBIT_TRANSACTION_NOT_FOUND:
      'Campaign debit transaction not found.',
    MULTIPLE_CAMPAIGN_DEBIT_TRANSACTIONS_FOUND:
      'Multiple campaign debit transactions were found.',
    INVALID_PLATFORM: 'Invalid platform.',
    PLATFORM_SETTINGS_REQUIRED:
      'Platform settings are required for non-SMS campaigns.',
    PLATFORM_SETTINGS_NOT_APPLICABLE:
      'Platform settings are only applicable for non-SMS campaigns.',
    PLATFORM_SETTINGS_NOT_FOUND: 'Platform settings not found.',
    PLATFORM_SETTINGS_INVALID:
      'Platform settings are invalid for test message sending.',
    TEST_RECIPIENT_MISSING:
      'Representative mobile number is missing for test message.',
    TEST_SEND_STATE_NOT_ALLOWED:
      'Campaign state does not allow sending a test message.',
    TEST_SEND_RATE_LIMITED: 'Please wait before sending another test message.',
    TEST_SEND_COOLDOWN_UNAVAILABLE:
      'Test message cooldown is temporarily unavailable.',
    LINE_NUMBER_NOT_APPLICABLE:
      'Line number is only applicable for SMS campaigns.',
    LINE_NUMBER_REQUIRED: 'Line number is required for SMS campaigns.',
    LINE_NUMBER_NOT_FOUND: 'Line number not found.',
    LINE_NUMBER_NOT_ACTIVE: 'Line number is not active.',
    MEDIA_NOT_FOUND: 'Media not found.',
    EXCEL_MEDIA_NOT_FOUND: 'Excel media not found.',
    EXCEL_FILE_INVALID: 'Excel file is invalid.',
    SEGMENT_PRICE_FACTOR_NOT_FOUND: 'Segment price factor not found.',
    LEVEL3_REQUIRED: 'At least one level 3 option is required.',
    CAMPAIGN_VALIDATION_FAILED: 'Campaign validation failed.',
    SCHEDULE_TIME_REQUIRED: 'Schedule time is required.',
    SCHEDULE_TIME_TOO_SOON:
      'Schedule time must be at least 10 minutes in the future.',
    SCHEDULE_TIME_OUTSIDE_WINDOW:
      'Schedule time must be between 08:00 and 21:00 Asia/Tehran.',
    CAMPAIGN_RESCHEDULE_NOT_ALLOWED:
      'Campaign cannot be rescheduled in its current status.',
    PLATFORM_BASE_PRICE_NOT_FOUND: 'Platform base price not found.',
    PAGE_PRICE_NOT_FOUND: 'Page price not found.',
    CAMPAIGN_TEST_SEND_FAILED: 'Campaign test message sending failed.',
  },
};

const campaignFlowErrorsFa: CampaignFlowErrorCopy = {
  unknownError: 'خطای غیرمنتظره‌ای رخ داد. لطفاً دوباره تلاش کنید.',
  networkError:
    'خطای شبکه رخ داده است. لطفاً اتصال خود را بررسی کرده و دوباره تلاش کنید.',
  errorCodes: {
    MISSING_CAMPAIGN_UUID: 'شناسه کمپین الزامی است.',
    INVALID_CAMPAIGN_UUID: 'شناسه کمپین نامعتبر است.',
    MISSING_CUSTOMER_ID: 'مشخصات احراز هویت یافت نشد. لطفاً دوباره وارد شوید.',
    INVALID_STATE: 'درخواست دیگری در حال پردازش است.',
    SMART_TARGETING_CAPACITY_PENDING:
      'ظرفیت دقیق هدف‌گیری هوشمند در حال محاسبه است. لطفاً منتظر بمانید و دوباره تلاش کنید.',
    SMART_TARGETING_EXACT_CAPACITY_REQUIRED:
      'پیش از ادامه، ظرفیت دقیق فعلی هدف‌گیری هوشمند را دوباره محاسبه کنید.',
    CAMPAIGN_NOT_FOUND: 'کمپین یافت نشد.',
    CAMPAIGN_ACCESS_DENIED: 'شما به این کمپین دسترسی ندارید.',
    CAMPAIGN_UPDATE_NOT_ALLOWED:
      'به‌روزرسانی کمپین در وضعیت فعلی امکان‌پذیر نیست.',
    CAMPAIGN_CANCEL_NOT_ALLOWED: 'لغو کمپین در وضعیت فعلی امکان‌پذیر نیست.',
    CAMPAIGN_NOT_APPROVED: 'کمپین تایید نشده است.',
    INSUFFICIENT_CAPACITY: 'ظرفیت کمپین کافی نیست.',
    INSUFFICIENT_FUNDS: 'موجودی کافی نیست.',
    CUSTOMER_NOT_FOUND: 'مشتری یافت نشد.',
    ACCOUNT_INACTIVE: 'حساب کاربری غیرفعال است.',
    ACCOUNT_TYPE_NOT_FOUND: 'نوع حساب یافت نشد.',
    WALLET_NOT_FOUND: 'کیف پول یافت نشد.',
    BALANCE_SNAPSHOT_NOT_FOUND: 'نمای وضعیت موجودی یافت نشد.',
    FREEZE_TRANSACTION_NOT_FOUND: 'تراکنش مسدودی یافت نشد.',
    MULTIPLE_FREEZE_TRANSACTIONS_FOUND: 'چند تراکنش مسدودی یافت شد.',
    CAMPAIGN_DEBIT_TRANSACTION_NOT_FOUND: 'تراکنش برداشت کمپین یافت نشد.',
    MULTIPLE_CAMPAIGN_DEBIT_TRANSACTIONS_FOUND:
      'چند تراکنش برداشت کمپین یافت شد.',
    INVALID_PLATFORM: 'پلتفرم نامعتبر است.',
    PLATFORM_SETTINGS_REQUIRED:
      'برای کمپین‌های غیر پیامکی، سرویس پلتفرم الزامی است.',
    PLATFORM_SETTINGS_NOT_APPLICABLE:
      'سرویس پلتفرم فقط برای کمپین‌های غیر پیامکی قابل استفاده است.',
    PLATFORM_SETTINGS_NOT_FOUND: 'سرویس پلتفرم یافت نشد.',
    PLATFORM_SETTINGS_INVALID:
      'سرویس پلتفرم انتخاب‌شده برای ارسال تست معتبر نیست.',
    TEST_RECIPIENT_MISSING: 'شماره نماینده برای ارسال پیام تست ثبت نشده است.',
    TEST_SEND_STATE_NOT_ALLOWED: 'وضعیت کمپین اجازه ارسال پیام تست را نمی‌دهد.',
    TEST_SEND_RATE_LIMITED: 'لطفاً پیش از ارسال مجدد پیام تست کمی صبر کنید.',
    TEST_SEND_COOLDOWN_UNAVAILABLE:
      'محدودیت زمانی ارسال تست موقتاً در دسترس نیست.',
    LINE_NUMBER_NOT_APPLICABLE:
      'سرشماره فقط برای کمپین‌های پیامکی قابل استفاده است.',
    LINE_NUMBER_REQUIRED: 'برای کمپین پیامکی، سرشماره الزامی است.',
    LINE_NUMBER_NOT_FOUND: 'سرشماره یافت نشد.',
    LINE_NUMBER_NOT_ACTIVE: 'سرشماره غیرفعال است.',
    MEDIA_NOT_FOUND: 'رسانه یافت نشد.',
    EXCEL_MEDIA_NOT_FOUND: 'رسانه اکسل یافت نشد.',
    EXCEL_FILE_INVALID: 'فایل اکسل نامعتبر است.',
    SEGMENT_PRICE_FACTOR_NOT_FOUND: 'ضریب قیمت سگمنت یافت نشد.',
    LEVEL3_REQUIRED: 'حداقل یک گزینه سطح ۳ باید انتخاب شود.',
    CAMPAIGN_VALIDATION_FAILED: 'اعتبارسنجی کمپین ناموفق بود.',
    SCHEDULE_TIME_REQUIRED: 'زمان‌بندی ارسال الزامی است.',
    SCHEDULE_TIME_TOO_SOON:
      'زمان‌بندی باید حداقل ۱۰ دقیقه بعد از زمان فعلی باشد.',
    SCHEDULE_TIME_OUTSIDE_WINDOW:
      'زمان‌بندی باید بین ساعت ۰۸:۰۰ تا ۲۱:۰۰ (Asia/Tehran) باشد.',
    CAMPAIGN_RESCHEDULE_NOT_ALLOWED:
      'زمان‌بندی مجدد کمپین در وضعیت فعلی امکان‌پذیر نیست.',
    PLATFORM_BASE_PRICE_NOT_FOUND: 'قیمت پایه پلتفرم یافت نشد.',
    PAGE_PRICE_NOT_FOUND: 'قیمت صفحه یافت نشد.',
    CAMPAIGN_TEST_SEND_FAILED: 'ارسال پیام تست کمپین ناموفق بود.',
  },
};

export const campaignFlowErrorI18n = {
  en: campaignFlowErrorsEn,
  fa: campaignFlowErrorsFa,
};
