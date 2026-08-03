const campaignLevelEn = {
  title: 'Define Your Target Audience',

  // Campaign Title
  campaignTitle: 'Campaign Title',
  campaignTitlePlaceholder: 'Enter campaign title (max 255 characters)',
  campaignTitleValidation: 'Campaign title must be at most 255 characters',

  // Level 1 Selection
  level1: 'Level 1',
  level1Placeholder: 'Choose Level 1',
  selectlevel1: 'Select Level 1',
  level1Label: 'Selecting the target audience',
  level1Description:
    'Which of the following should your target audience be consumers of?',

  // Level 2 Selection
  level2: 'Level 2',
  level2For: 'Level 2 for {level2}',
  level2Help: '',
  level2Validation: 'Please select at least one Level 2 item',
  level2Label: '',

  // Level 3
  level3: '',
  level3Help: '',

  // Sex Selection
  sex: 'Sex',
  sexPlaceholder: 'Choose sex preference',
  selectSex: 'Select Sex',

  // City Selection
  cities: 'Cities',
  citiesHelp: 'Select at least one city (multiple selection allowed)',
  citiesPlaceholder: 'Select a city',
  citiesValidation: 'Please select at least one city',

  // Summary Section
  campaignSummary: 'Campaign Summary',
  campaignTitleLabel: 'Campaign Title',
  level3Label: 'level3:',
  sexLabel: 'Sex:',
  citiesLabel: 'Cities:',
  notSet: 'Not set',

  // Campaign Capacity Section
  campaignCapacity: 'Campaign Capacity',
  capacityDescription:
    'Number of people who will receive your SMS based on selected filters',
  calculatingCapacity: 'Calculating capacity...',
  capacityResult: '{count} people will receive your SMS',
  capacityError: 'Unable to calculate capacity. Please check your selections.',
  capacityHelp:
    'Capacity is calculated automatically as you adjust your campaign filters.',
  campaignCapacityHelp:
    'Capacity is calculated automatically as you adjust your campaign filters.',
  capacityTooLow:
    'Capacity too low (< 500). Remove some filters to increase campaign capacity.',
  estimatedCapacity: 'Estimated Capacity',
  calculating: 'Calculating...',
  users: 'users',

  // Legacy fields (keeping for backward compatibility)
  customerType: 'Customer Type',
  customerTypePlaceholder: 'Select customer type',
  ageRange: 'Age Range',
  ageRangePlaceholder: 'Select age range',
  location: 'Location',
  locationPlaceholder: 'Enter city or province',
  interests: 'Interests',
  interestsPlaceholder: 'Select interests',
  customFilters: 'Custom Filters',
  addFilter: 'Add Filter',
  removeFilter: 'Remove',
  filterField: 'Field',
  filterOperator: 'Operator',
  filterValue: 'Value',

  searchPlaceholder: 'Search ...',

  // Metadata fields
  inclusion: 'Inclusion',
  exclusion: 'Exclusion',
  one_line: 'Description',
  description: 'Description',
  tags: 'Tags',
  available_audience: 'Available Audience',
  count: 'Count',
  metadata: 'Metadata',
  items: 'Items',
  total: 'Total',
  category: 'Category',
  type: 'Type',
  status: 'Status',
  questionMark: '?',

  // Segment price factors
  segmentPriceFactors: 'Level 3 Price Factor:',

  // Platform selection
  platform: 'Platform',
  platformSms: 'SMS',
  platformRubika: 'Rubika',
  platformBale: 'Bale',
  platformSplus: 'Splus',

  // Segmentation mode
  segmentationMode: 'Segmentation Method',
  segmentationByLevels: 'Select Levels',
  segmentationBySmartTargeting: 'Smart Targeting',
  segmentationByTargetAudienceExcelFile: 'Upload Excel file',
  segmentationByTargetAudienceExcelFileTitle: 'Target Audience Excel File',
  segmentationByTargetAudienceExcelFileHelp:
    'Upload .xls or .xlsx file to segment audience',
  segmentationByTargetAudienceExcelFileSampleDownload:
    'Download sample Excel file',
  segmentationByTargetAudienceExcelFileUploading: 'Uploading Excel file...',
  segmentationByTargetAudienceExcelFileUploaded: 'Uploaded',
  segmentationByTargetAudienceExcelFileRemove: 'Remove',
  segmentationByTargetAudienceExcelFileInvalidType:
    'Please upload a valid Excel file (.xls or .xlsx)',
  segmentationByTargetAudienceExcelFileRequired:
    'Please upload your Excel file',
  smartTargeting: {
    title: 'Smart Targeting Tags',
    description:
      'Select the campaign tags to target. Selections remain saved across search, sorting, and pagination.',
    searchLabel: 'Search Tag Display Title',
    searchPlaceholder: 'Search tags',
    sortByLabel: 'Sort by',
    sortDirectionLabel: 'Direction',
    defaultOrder: 'Default order',
    ascending: 'Ascending',
    descending: 'Descending',
    columns: {
      selection: 'Selection',
      tagDisplayTitle: 'Tag Display Title',
      tagCapacity: 'Tag Capacity',
      bundlePersonaFitScore: 'Bundle Persona Fit Score',
      testPhaseAvgCtr: 'Test Phase Average CTR',
      overallAvgCtr: 'Overall Average CTR',
    },
    sortOptions: {
      tagCapacity: 'Tag Capacity',
      bundlePersonaFitScore: 'Bundle Persona Fit Score',
      testPhaseAvgCtr: 'Test Phase Average CTR',
      overallAvgCtr: 'Overall Average CTR',
    },
    autoSelectLabel: 'Number of Tags for Automatic Selection',
    autoSelectPlaceholder: 'Example: 20',
    autoSelectButton: 'Automatically Select Tags',
    autoSelecting: 'Selecting...',
    selectedTags: 'Selected tags',
    selectedRawCapacity: 'Selected raw capacity',
    audiences: 'audiences',
    loading: 'Loading Smart Targeting tags...',
    refreshing: 'Refreshing...',
    retry: 'Retry',
    noBundle: 'Select a bundle before choosing Smart Targeting tags.',
    noTags: 'No Smart Targeting tags are available for this bundle.',
    noSearchResults: 'No tags match this search.',
    searchTooLong: 'Search is limited to 200 characters.',
    invalidAutoCount: 'Enter a whole number greater than zero.',
    autoCountTooLarge:
      'Automatic selection cannot exceed the current result count: {count}.',
    validationRequired:
      'At least one tag must be selected for Smart Targeting.',
    fetchError: 'Failed to load Smart Targeting tags. Please try again.',
    autoSelectError:
      'Failed to automatically select Smart Targeting tags. Please try again.',
    unavailable: '—',
    pagination: {
      showing: 'Showing {from} to {to} of {total} tags',
      rowsPerPage: 'Rows per page',
      previous: 'Previous',
      next: 'Next',
    },
  },

  // Bundle info
  bundleInfoTitle: 'Bundle Information',
  bundle: 'Bundle',
  bundlePlaceholder: 'Select a bundle',
  bundleLoading: 'Loading bundles...',
  bundleLoadError: 'Failed to load bundles. Please try again.',
  bundleEmpty: 'No bundles found yet. Create one to continue.',
  bundleCreateAction: 'Create a new bundle',
  phase: 'Sending Phase',
  phasePlaceholder: 'Select a phase',
  phaseTest: 'Test',
  phaseExecution: 'Execution',

  // Audience grade selection
  audienceGradeTitle: 'Audience Grade Selection',
  audienceGradeA: 'Class A',
  audienceGradeB: 'Class B',
  audienceGradeC: 'Class C',

  // Common fields
  loading: 'Loading...',
  reset: 'Reset',

  // Job fields for agencies
  agencyCategoryHeader:
    'Please select the category and subcategory that best describes your business',
  agencyCategory: 'Category',
  agencyJob: 'Job',
  agencySelectCategory: 'Select category',
  agencySelectJob: 'Select job',
  agencyCategoryRequired: 'Category is required',
  agencyJobRequired: 'Job is required',
};

const campaignLevelFa = {
  title: 'مخاطبان هدف خود را تعریف کنید',

  // Campaign Title
  campaignTitle: 'عنوان ارسال',
  campaignTitlePlaceholder: 'عنوان ارسال را وارد کنید (حداکثر ۲۵۵ کاراکتر)',
  campaignTitleValidation: 'عنوان ارسال باید حداکثر ۲۵۵ کاراکتر باشد',

  // Level 1 Selection
  level1: 'سطح ۱',
  level1Placeholder: 'سطح ۱ را انتخاب کنید',
  selectLevel1: 'انتخاب سطح ۱',
  level1Label: 'انتخاب مخاطبان هدف',
  level1Description:
    'مخاطبان هدف شما باید مصرف‌کنندگان کدام یک از موارد زیر باشند؟',

  // Level 2 Selection
  level2: 'سطح ۲',
  level2For: 'سطح ۲ برای {level2}',
  level2Help: '',
  level2Validation: 'لطفاً حداقل یک سطح ۲ را انتخاب کنید',
  level2Label: '',

  // Level 3
  level3: '',
  level3Help: '',

  // Sex Selection
  sex: 'جنسیت',
  sexPlaceholder: 'ترجیح جنسیت را انتخاب کنید',
  selectSex: 'انتخاب جنسیت',

  // City Selection
  cities: 'شهرها',
  citiesHelp: 'حداقل یک شهر را انتخاب کنید (انتخاب چندگانه مجاز است)',
  citiesPlaceholder: 'حداقل یک شهر را انتخاب کنید',
  citiesValidation: 'لطفاً حداقل یک شهر را انتخاب کنید',

  // Summary Section
  campaignSummary: 'خلاصه کمپین',
  campaignTitleLabel: 'عنوان ارسال',
  level3Label: 'سطح ۳:',
  sexLabel: 'جنسیت:',
  citiesLabel: 'شهرها:',
  notSet: 'تنظیم نشده',

  // Campaign Capacity Section
  campaignCapacity: 'ظرفیت ارسال',
  capacityDescription:
    'تعداد افرادی که بر اساس فیلترهای انتخاب شده پیام پیامکی شما را دریافت خواهند کرد',
  calculatingCapacity: 'در حال محاسبه ظرفیت...',
  capacityResult: '{count} نفر پیام پیامکی شما را دریافت خواهند کرد',
  capacityError:
    'قادر به محاسبه ظرفیت نیست. لطفاً انتخاب‌های خود را بررسی کنید.',
  capacityHelp:
    'ظرفیت به طور خودکار با تنظیم فیلترهای ارسال شما محاسبه می‌شود.',
  campaignCapacityHelp:
    'ظرفیت به طور خودکار با تنظیم فیلترهای ارسال شما محاسبه می‌شود.',
  capacityTooLow:
    'ظرفیت بسیار کم است (کمتر از ۵۰۰). چند فیلتر را حذف کنید تا ظرفیت افزایش یابد.',
  estimatedCapacity: 'ظرفیت تخمینی',
  calculating: 'در حال محاسبه...',
  users: 'مخاطب',

  // Legacy fields (keeping for backward compatibility)
  customerType: 'نوع مشتری',
  customerTypePlaceholder: 'نوع مشتری را انتخاب کنید',
  ageRange: 'محدوده سنی',
  ageRangePlaceholder: 'محدوده سنی را انتخاب کنید',
  location: 'مکان',
  locationPlaceholder: 'شهر یا استان را وارد کنید',
  interests: 'علایق',
  interestsPlaceholder: 'علایق را انتخاب کنید',
  customFilters: 'فیلترهای سفارشی',
  addFilter: 'افزودن فیلتر',
  removeFilter: 'حذف',
  filterField: 'فیلد',
  filterOperator: 'عملگر',
  filterValue: 'مقدار',

  searchPlaceholder: 'جستجو کنید.',

  // Metadata fields
  inclusion: 'شمول',
  exclusion: 'عدم شمول',
  one_line: 'توضیحات',
  description: 'توضیحات',
  tags: 'برچسب‌ها',
  available_audience: 'مخاطبان در دسترس',
  count: 'تعداد',
  metadata: 'فراداده',
  items: 'آیتم‌ها',
  total: 'مجموع',
  category: 'دسته‌بندی',
  type: 'نوع',
  status: 'وضعیت',
  questionMark: '؟',

  // Segment price factors
  segmentPriceFactors: 'ضریب قیمتی دسته انتخاب شما برابر است با:',

  // Platform selection
  platform: 'کانال ارسال',
  platformSms: 'پیامک',
  platformRubika: 'روبیکا',
  platformBale: 'بله',
  platformSplus: 'سروش پلاس',

  // Segmentation mode
  segmentationMode: 'نوع هدف‌گیری',
  segmentationByLevels: 'دسته‌بندی عادی',
  segmentationBySmartTargeting: 'هدف‌گیری هوشمند',
  segmentationByTargetAudienceExcelFile: 'مخاطبان مشخص',
  segmentationByTargetAudienceExcelFileTitle: 'فایل اکسل مخاطبان',
  segmentationByTargetAudienceExcelFileHelp:
    'فایل با فرمت xls. یا xlsx. بارگذاری کنید',
  segmentationByTargetAudienceExcelFileSampleDownload: 'دانلود فایل نمونه اکسل',
  segmentationByTargetAudienceExcelFileUploading:
    'در حال بارگذاری فایل اکسل...',
  segmentationByTargetAudienceExcelFileUploaded: 'بارگذاری شد',
  segmentationByTargetAudienceExcelFileRemove: 'حذف',
  segmentationByTargetAudienceExcelFileInvalidType:
    'لطفاً یک فایل اکسل معتبر با فرمت xls. یا xlsx. بارگذاری کنید',
  segmentationByTargetAudienceExcelFileRequired:
    'لطفاً فایل اکسل را بارگذاری کنید',
  smartTargeting: {
    title: 'برچسب‌های هدف‌گیری هوشمند',
    description:
      'برچسب‌های این ارسال را انتخاب کنید. انتخاب‌ها با جستجو، مرتب‌سازی و صفحه‌بندی حفظ می‌شوند.',
    searchLabel: 'جستجوی عنوان نمایشی برچسب',
    searchPlaceholder: 'جستجوی برچسب‌ها',
    sortByLabel: 'مرتب‌سازی بر اساس',
    sortDirectionLabel: 'جهت',
    defaultOrder: 'ترتیب پیش‌فرض',
    ascending: 'صعودی',
    descending: 'نزولی',
    columns: {
      selection: 'انتخاب',
      tagDisplayTitle: 'عنوان نمایشی برچسب',
      tagCapacity: 'ظرفیت برچسب',
      bundlePersonaFitScore: 'امتیاز تناسب پرسونای کمپین',
      testPhaseAvgCtr: 'میانگین CTR فاز تست',
      overallAvgCtr: 'میانگین CTR کلی',
    },
    sortOptions: {
      tagCapacity: 'ظرفیت برچسب',
      bundlePersonaFitScore: 'امتیاز تناسب پرسونای کمپین',
      testPhaseAvgCtr: 'میانگین CTR فاز تست',
      overallAvgCtr: 'میانگین CTR کلی',
    },
    autoSelectLabel: 'تعداد برچسب برای انتخاب خودکار',
    autoSelectPlaceholder: 'مثلاً: ۲۰',
    autoSelectButton: 'انتخاب خودکار برچسب‌ها',
    autoSelecting: 'در حال انتخاب...',
    selectedTags: 'برچسب‌های انتخاب‌شده',
    selectedRawCapacity: 'ظرفیت خام انتخاب‌شده',
    audiences: 'مخاطب',
    loading: 'در حال بارگذاری برچسب‌های هدف‌گیری هوشمند...',
    refreshing: 'در حال به‌روزرسانی...',
    retry: 'تلاش دوباره',
    noBundle:
      'برای انتخاب برچسب‌های هدف‌گیری هوشمند ابتدا یک کمپین انتخاب کنید.',
    noTags: 'برای این کمپین برچسب هدف‌گیری هوشمند موجود نیست.',
    noSearchResults: 'هیچ برچسبی با این جستجو پیدا نشد.',
    searchTooLong: 'جستجو حداکثر ۲۰۰ کاراکتر است.',
    invalidAutoCount: 'یک عدد صحیح بزرگ‌تر از صفر وارد کنید.',
    autoCountTooLarge:
      'انتخاب خودکار نمی‌تواند بیشتر از تعداد نتایج فعلی باشد: {count}.',
    validationRequired: 'برای هدف‌گیری هوشمند حداقل یک برچسب باید انتخاب شود.',
    fetchError:
      'بارگذاری برچسب‌های هدف‌گیری هوشمند ناموفق بود. لطفاً دوباره تلاش کنید.',
    autoSelectError:
      'انتخاب خودکار برچسب‌های هدف‌گیری هوشمند ناموفق بود. لطفاً دوباره تلاش کنید.',
    unavailable: '—',
    pagination: {
      showing: 'نمایش {from} تا {to} از {total} برچسب',
      rowsPerPage: 'ردیف در صفحه',
      previous: 'قبلی',
      next: 'بعدی',
    },
  },

  // Bundle info
  bundleInfoTitle: 'اطلاعات کمپین',
  bundle: 'عنوان کمپین',
  bundlePlaceholder: 'انتخاب کمپین',
  bundleLoading: 'در حال بارگذاری کمپین‌ها...',
  bundleLoadError: 'خطا در بارگذاری کمپین‌ها. لطفاً دوباره تلاش کنید.',
  bundleEmpty: 'هنوز کمپین‌ای ایجاد نشده است. برای ادامه یک کمپین جدید بسازید.',
  bundleCreateAction: 'ایجاد کمپین جدید',
  phase: 'فاز ارسال',
  phasePlaceholder: 'انتخاب فاز',
  phaseTest: 'فاز تست',
  phaseExecution: 'فاز اجرا',

  // Audience grade selection
  audienceGradeTitle: 'کلاس نمره مخاطب',
  audienceGradeA: 'دسته الف',
  audienceGradeB: 'دسته ب',
  audienceGradeC: 'دسته ج',

  // Common fields
  loading: 'در حال بارگذاری...',
  reset: 'بازنشانی',

  // Job fields for agencies
  agencyCategoryHeader:
    'لطفا با انتخاب دسته‌ و زیردسته نوع کسب‌وکار خود را به صورت دقیق انتخاب کنید',
  agencyCategory: 'دسته‌بندی اصلی کسب‌و‌کار شما',
  agencyJob: 'زیردسته دقیق‌تر کسب‌و‌کار شما',
  agencySelectCategory: 'انتخاب دسته‌بندی اصلی کسب و کار',
  agencySelectJob: 'انتخاب زیردسته دقیق‌تر',
  agencyCategoryRequired: 'انتخاب دسته‌بندی الزامی است',
  agencyJobRequired: 'انتخاب زیردسته الزامی است',
};

export const campaignLevelI18n = {
  en: campaignLevelEn,
  fa: campaignLevelFa,
};
