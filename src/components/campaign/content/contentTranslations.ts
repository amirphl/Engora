const contentEn = {
  // Step header
  title: 'Design Your Message',

  // Link insertion section
  insertLink: 'Insert Link',
  on: 'ON',
  off: 'OFF',
  linkInsertionEnabled: 'Link insertion is enabled',
  linkInsertionDisabled: 'Link insertion is disabled',
  campaignLink: 'Campaign Link',
  linkPlaceholder: 'Enter link URL (max 10000 characters)',
  linkValidation: 'Link must be at most 10000 characters',
  linkInvalidUrl:
    'Please enter a valid URL (must start with http:// or https://)',
  characters: 'characters',
  linkAnalysisInfo:
    'By enabling this feature you can analyze click results on your landing link.',
  insertUidPlaceholder: 'Add Tracking Term',
  uidPlaceholderInserted: 'Tracking term inserted',
  previewUidLink: 'Open Test Link',
  uidPlaceholderHelp:
    'Each recipient ID will be inserted uniquely at the selected position. Make sure the link still opens correctly, points to the right page, and records data properly on the destination site.',

  // Schedule section
  scheduleAt: 'Schedule At (Optional)',
  disableSchedule: 'Disable Schedule',
  enableSchedule: 'Enable Schedule',
  campaignScheduled: 'Campaign will be scheduled',
  campaignImmediate: 'Campaign will be sent immediately after approval.',
  scheduleDateTime: 'Schedule Date & Time',
  scheduleTooSoon: 'Please pick a time at least 10 minutes from now',
  scheduleOutsideWindow:
    'Delivery time must be between 08:00 and 21:00 Tehran time',

  // Message text section
  text: 'Text',
  campaignText: '',
  textPlaceholder: 'Enter your campaign message text',
  mediaMessageTitle: 'Media Message',
  mediaLabel: 'Image or Video',
  mediaHelp: 'Upload JPG, PNG, or MP4 (max 1 file)',
  removeMedia: 'Remove',
  downloadMedia: 'Download',
  maxCharactersLabel: 'Remaining: {count}',
  insertLinkCharacter: 'Add link here',
  linkCharacterInserted: 'Link position marked',
  linkCharacterInsertedMessage:
    'Link will be inserted at the marked position ({YOUR_LINK}).',
  charactersLabel: 'Characters: {count} (user input)',
  totalLabel: 'Total: {count} / {max}',
  partsLabel: 'Parts: {count}',
  partsCount: '{total}/{parts}',
  partsBreakdown: 'Parts breakdown:',
  partsExplanation:
    '≤70 chars = 1 part, ≤132 = 2 parts, ≤198 = 3 parts, ≤264 = 4 parts, ≤330 = 5 parts',
  withLinkExplanation:
    'With link: starts at 20 chars (6 cancellation + 14 shortened link)',
  withoutLinkExplanation:
    'Without link: starts at 6 chars (cancellation append)',
  textExceedsLimit:
    '⚠️ Text exceeds maximum length. Please shorten your message.',
  nonSmsTextExceedsLimit: 'Text exceeds maximum length (1000 characters).',

  // Line number section
  lineNumber: 'Line Number',
  selectLineNumber: 'Select Line Number',
  lineNumberPlaceholder: 'Choose a line number for your campaign',
  linePriceFactor: 'Line price factor',

  // Platform settings
  platformSettings: 'Platform Settings',
  platformSettingsPlaceholder: 'Select a platform settings',
  createPlatformInSettings:
    'No platform settings found. Create one in Settings.',
  platformSettingsActionRequired: '',
  platformSettingsGoToSettings: 'Go to Settings',

  // Short link domain
  shortLinkDomain: 'Short link domain',
  shortLinkDomainPlaceholder: 'Select a short link domain',
  shortLinkDomainEnabled: 'Short link domain is enabled',
  shortLinkDomainDisabled: 'Short link domain is disabled',
  reset: 'Reset',

  // Bundle info
  bundleInfoTitle: 'Bundle Information',
  bundle: 'Bundle',
  bundlePlaceholder: 'Select a bundle',
  bundleLoading: 'Loading bundles...',
  bundleLoadError: 'Failed to load bundles. Please try again.',
  phase: 'Sending Phase',
  phasePlaceholder: 'Select a phase',
  phaseTest: 'Test',
  phaseExecution: 'Execution',
};

const contentFa = {
  // Step header
  title: 'پیام خود را طراحی کنید',

  // Link insertion section
  insertLink: 'قابلیت تحلیل نتایج عملکردی لینک',
  on: 'فعال',
  off: 'غیرفعال',
  linkInsertionEnabled: 'افزودن لینک فعال است',
  linkInsertionDisabled: 'افزودن لینک غیرفعال است',
  campaignLink: 'لینک ارسال',
  linkPlaceholder: 'آدرس لینک را وارد کنید (حداکثر ۱۰۰۰۰ کاراکتر)',
  linkValidation: 'لینک باید حداکثر ۱۰۰۰۰ کاراکتر باشد',
  linkInvalidUrl:
    'لطفاً یک آدرس لینک صحیح وارد کنید (باید با http:// یا https:// شروع شود)',
  characters: 'کاراکتر',
  linkAnalysisInfo:
    'با فعال‌کردن این قابلیت امکان تحلیل نتایج کلیک روی لینک مورد نظر شما فراهم می‌شود.',
  insertUidPlaceholder: 'افزودن شناسه رهگیری',
  uidPlaceholderInserted: 'شناسه رهگیری درج شد',
  previewUidLink: 'باز کردن لینک آزمایشی',
  uidPlaceholderHelp:
    'مقدار ID هر مخاطب ارسالی در موقعیت انتخابی شما به صورت یکتا قرار می‌گیرد. حتما از بازشدن لینک بعد از این تغییر، ارجاع به صفحه درست و ثبت صحیح اطلاعات در سایت مقصد مطمئن شوید.',

  // Schedule section
  scheduleAt: 'زمان‌بندی (اختیاری)',
  disableSchedule: 'غیرفعال کردن زمان‌بندی',
  enableSchedule: 'فعال کردن زمان‌بندی',
  campaignScheduled: 'کمپین زمان‌بندی خواهد شد.',
  campaignImmediate: 'کمپین بلافاصله بعد از تایید ارسال می‌شود.',
  scheduleDateTime: 'تاریخ و زمان زمان‌بندی',
  scheduleTooSoon: 'لطفاً زمانی حداقل ۱۰ دقیقه بعد از اکنون انتخاب کنید',
  scheduleOutsideWindow:
    'زمان ارسال باید بین ساعت ۰۸:۰۰ تا ۲۱:۰۰ به وقت تهران باشد',

  // Message text section
  text: 'متن',
  campaignText: '',
  textPlaceholder: 'متن پیام ارسال خود را وارد کنید',
  mediaMessageTitle: 'پیام رسانه‌ای',
  mediaLabel: 'تصویر یا ویدیو',
  mediaHelp: 'فرمت‌های مجاز: JPG, PNG, MP4 (حداکثر ۱ فایل)',
  removeMedia: 'حذف',
  downloadMedia: 'دانلود',
  maxCharactersLabel: 'باقی‌مانده: {count}',
  insertLinkCharacter: 'افزودن لینک در اینجا',
  linkCharacterInserted: 'موقعیت لینک شناسایی شده',
  linkCharacterInsertedMessage: 'لینک در محل {YOUR_LINK} قرار خواهد گرفت.',
  charactersLabel: 'تعداد کاراکترها: {count} (ورودی کاربر)',
  totalLabel: 'مجموع: {count} / {max}',
  partsLabel: 'تعداد صفحه: {count}',
  partsCount: '{total}/{parts}',
  partsBreakdown: 'تجزیه تعداد پیام:',
  partsExplanation:
    '≤۷۰ کاراکتر = ۱ پیام، ≤۱۳۲ = ۲ پیام، ≤۱۹۸ = ۳ پیام، ≤۲۶۴ = ۴ پیام، ≤۳۳۰ = ۵ پیام',
  // withLinkExplanation: 'با لینک: از ۲۰ کاراکتر شروع می‌شود (۶ لغو + ۱۴ لینک کوتاه)',
  withLinkExplanation:
    '۱۴ کاراکتر رزرو در صورت استفاده از لینک کوتاه جاذبه، ۶ کاراکتر رزرو لغو۱۱',
  withoutLinkExplanation:
    'بدون لینک: از ۶ کاراکتر شروع می‌شود (اضافه کردن لغو۱۱)',
  textExceedsLimit:
    '⚠️ متن از حداکثر طول مجاز فراتر رفته است. لطفاً پیام خود را کوتاه کنید.',
  nonSmsTextExceedsLimit:
    'متن از حداکثر طول مجاز (۱۰۰۰ کاراکتر) فراتر رفته است.',

  // Line number section
  lineNumber: 'انتخاب سرشماره',
  selectLineNumber: 'انتخاب سرشماره',
  lineNumberPlaceholder: 'سرشماره مدنظر خود را انتخاب کنید',
  linePriceFactor: 'ضریب قیمت سرشماره',

  // Platform settings
  platformSettings: 'سرویس‌های فعال',
  platformSettingsPlaceholder: 'انتخاب',
  createPlatformInSettings:
    'سرویس فعالی یافت نشد. با کلیک روی این لینک، یک سرویس جدید بسازید.',
  platformSettingsActionRequired: '',
  platformSettingsGoToSettings: 'رفتن به تنظیمات',

  // Short link domain
  shortLinkDomain: 'دامنه لینک کوتاه',
  shortLinkDomainPlaceholder: 'دامنه لینک کوتاه را انتخاب کنید',
  shortLinkDomainEnabled: 'کوتاه‌کننده لینک فعال است',
  shortLinkDomainDisabled: 'کوتاه‌کننده لینک غیرفعال است',
  reset: 'بازنشانی',

  // Bundle info
  bundleInfoTitle: 'اطلاعات کمپین',
  bundle: 'عنوان کمپین',
  bundlePlaceholder: 'انتخاب کمپین',
  bundleLoading: 'در حال بارگذاری کمپین‌ها...',
  bundleLoadError: 'خطا در بارگذاری کمپین‌ها. لطفاً دوباره تلاش کنید.',
  phase: 'فاز ارسال',
  phasePlaceholder: 'انتخاب فاز',
  phaseTest: 'فاز تست',
  phaseExecution: 'فاز اجرا',
};

export const contentI18n = {
  en: contentEn,
  fa: contentFa,
};
