import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
  useRef,
} from 'react';
import {
  CampaignSegment,
  CampaignContent,
  CampaignBudget,
  CampaignPayment,
  CampaignData,
  AudienceTargetingMethod,
  AudienceGrade,
  CampaignPlatform,
} from '../types/campaign';
import { registerCampaignClearFunction } from './useAuth';
import { clearLevelSelection } from '../types/segment';
import {
  isUuidV4,
  isValidCampaignStringArray,
  MAX_CAMPAIGN_STRING_LENGTH,
  normalizeLinkPlaceholder,
  validateCampaignContent,
} from '../utils/campaignUtils';

interface CampaignContextType {
  currentStep: number;
  campaignData: CampaignData;
  error: string | null;

  // Navigation
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;

  // Data management
  updateLevel: (data: Partial<CampaignSegment>) => void;
  updateContent: (data: Partial<CampaignContent>) => void;
  updateBudget: (data: Partial<CampaignBudget>) => void;
  updatePayment: (data: Partial<CampaignPayment>) => void;
  replaceCampaignData: (data: CampaignData, step?: number) => void;

  // UUID management
  setCampaignId: (id: number | undefined) => void;
  setCampaignUuid: (uuid: string) => void;

  // Storage management
  saveCampaignData: () => void;
  clearCampaignData: () => void;
  clearAllCampaignData: () => void;

  // Campaign status
  hasExistingCampaign: boolean;
  getCampaignProgress: () => {
    completedSteps: number;
    totalSteps: number;
    progress: number;
  };

  // Reset
  resetCampaign: () => void;
}

const CampaignContext = createContext<CampaignContextType | undefined>(
  undefined
);

export const useCampaign = () => {
  const context = useContext(CampaignContext);
  if (!context) {
    throw new Error('useCampaign must be used within a CampaignProvider');
  }
  return context;
};

interface CampaignProviderProps {
  children: ReactNode;
}

type StoredCampaignData = Partial<CampaignData> & {
  level?: Partial<CampaignSegment>;
};

const isAudienceTargetingMethod = (
  value: unknown
): value is AudienceTargetingMethod =>
  value === 'standard' || value === 'smart_targeting' || value === 'excel';

const normalizeSelectedTagIds = (value: unknown): number[] => {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map(item => Number(item))
        .filter(item => Number.isInteger(item) && item > 0)
    )
  );
};

const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is string => typeof item === 'string' && item.trim().length > 0
  );
};

const normalizeAudienceGrades = (value: unknown): AudienceGrade[] => {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value.filter(
        (item): item is AudienceGrade =>
          item === 'A' || item === 'B' || item === 'C'
      )
    )
  );
};

const isCampaignPlatform = (value: unknown): value is CampaignPlatform =>
  value === 'sms' ||
  value === 'rubika' ||
  value === 'bale' ||
  value === 'splus';

const normalizeAudienceTargetingMethod = (
  storedSegment: Partial<CampaignSegment>
): AudienceTargetingMethod => {
  if (isAudienceTargetingMethod(storedSegment.audienceTargetingMethod)) {
    return storedSegment.audienceTargetingMethod;
  }

  if (normalizeSelectedTagIds(storedSegment.selectedTagIds).length > 0) {
    return 'smart_targeting';
  }

  return storedSegment.targetAudienceExcelFileUuid != null
    ? 'excel'
    : 'standard';
};

const createDefaultCampaignData = (): CampaignData => ({
  id: undefined,
  uuid: '',
  segment: {
    campaignTitle: '',
    level1: '',
    level2s: [],
    level3s: [],
    targetAudienceExcelFileUuid: null,
    platform: 'sms',
    tags: [],
    audienceTargetingMethod: 'standard',
    selectedTagIds: [],
    smartTargetingSelectedRawCapacity: 0,
    smartTargetingSelectionDirty: false,
    capacityTooLow: false,
    capacity: undefined,
    audienceGrades: [],
    sex: '',
    city: [],
    jobCategory: '',
    job: '',
    bundleId: null,
    phase: 'execution',
  },
  content: {
    insertLink: false,
    link: '',
    text: '',
    scheduleAt: undefined,
    shortLinkDomain: null,
    lineNumber: '',
    platformSettingsId: null,
    mediaUuid: null,
  },
  budget: {
    totalBudget: 0,
    estimatedMessages: undefined,
  },
  payment: {
    paymentMethod: '',
    termsAccepted: false,
  },
});

const normalizeStoredCampaignData = (value: unknown): CampaignData => {
  const defaults = createDefaultCampaignData();
  const data =
    value && typeof value === 'object'
      ? (value as StoredCampaignData)
      : ({} as StoredCampaignData);
  const segmentValue = data.segment ?? data.level;
  const storedSegment =
    segmentValue &&
    typeof segmentValue === 'object' &&
    !Array.isArray(segmentValue)
      ? segmentValue
      : {};
  const normalizedSelectedTagIds = normalizeSelectedTagIds(
    storedSegment.selectedTagIds
  );
  const contentValue =
    data.content &&
    typeof data.content === 'object' &&
    !Array.isArray(data.content)
      ? data.content
      : {};
  const { mediaAttachment: _mediaAttachment, ...storedContent } =
    contentValue as Partial<CampaignContent> & {
      mediaAttachment?: unknown;
    };
  const storedBudget: Partial<CampaignBudget> =
    data.budget &&
    typeof data.budget === 'object' &&
    !Array.isArray(data.budget)
      ? data.budget
      : {};
  const storedPayment: Partial<CampaignPayment> =
    data.payment &&
    typeof data.payment === 'object' &&
    !Array.isArray(data.payment)
      ? data.payment
      : {};

  return {
    id:
      typeof data.id === 'number' && Number.isInteger(data.id) && data.id > 0
        ? data.id
        : defaults.id,
    uuid: typeof data.uuid === 'string' ? data.uuid.trim() : defaults.uuid,
    segment: {
      campaignTitle:
        typeof storedSegment.campaignTitle === 'string'
          ? storedSegment.campaignTitle
          : defaults.segment.campaignTitle,
      level1:
        typeof storedSegment.level1 === 'string'
          ? storedSegment.level1
          : defaults.segment.level1,
      level2s: normalizeStringArray(storedSegment.level2s),
      level3s: normalizeStringArray(storedSegment.level3s),
      targetAudienceExcelFileUuid:
        typeof storedSegment.targetAudienceExcelFileUuid === 'string'
          ? storedSegment.targetAudienceExcelFileUuid
          : null,
      platform: isCampaignPlatform(storedSegment.platform)
        ? storedSegment.platform
        : defaults.segment.platform,
      tags: normalizeStringArray(storedSegment.tags),
      audienceTargetingMethod: normalizeAudienceTargetingMethod(storedSegment),
      selectedTagIds: normalizedSelectedTagIds,
      smartTargetingSelectedRawCapacity:
        typeof storedSegment.smartTargetingSelectedRawCapacity === 'number' &&
        Number.isFinite(storedSegment.smartTargetingSelectedRawCapacity)
          ? Math.max(0, storedSegment.smartTargetingSelectedRawCapacity)
          : defaults.segment.smartTargetingSelectedRawCapacity,
      smartTargetingSelectionDirty:
        typeof storedSegment.smartTargetingSelectionDirty === 'boolean'
          ? storedSegment.smartTargetingSelectionDirty
          : normalizedSelectedTagIds.length > 0,
      capacityTooLow:
        typeof storedSegment.capacityTooLow === 'boolean'
          ? storedSegment.capacityTooLow
          : defaults.segment.capacityTooLow,
      capacity:
        typeof storedSegment.capacity === 'number' &&
        Number.isFinite(storedSegment.capacity)
          ? Math.max(0, storedSegment.capacity)
          : defaults.segment.capacity,
      audienceGrades: normalizeAudienceGrades(storedSegment.audienceGrades),
      sex:
        typeof storedSegment.sex === 'string'
          ? storedSegment.sex
          : defaults.segment.sex,
      city: normalizeStringArray(storedSegment.city),
      jobCategory:
        typeof storedSegment.jobCategory === 'string'
          ? storedSegment.jobCategory
          : defaults.segment.jobCategory,
      job:
        typeof storedSegment.job === 'string'
          ? storedSegment.job
          : defaults.segment.job,
      bundleId:
        typeof storedSegment.bundleId === 'number' &&
        Number.isInteger(storedSegment.bundleId) &&
        storedSegment.bundleId > 0
          ? storedSegment.bundleId
          : defaults.segment.bundleId,
      phase:
        storedSegment.phase === 'test' || storedSegment.phase === 'execution'
          ? storedSegment.phase
          : defaults.segment.phase,
    },
    content: {
      insertLink:
        typeof storedContent.insertLink === 'boolean'
          ? storedContent.insertLink
          : defaults.content.insertLink,
      link:
        typeof storedContent.link === 'string'
          ? storedContent.link
          : defaults.content.link,
      text:
        typeof storedContent.text === 'string'
          ? normalizeLinkPlaceholder(storedContent.text)
          : defaults.content.text,
      scheduleAt:
        typeof storedContent.scheduleAt === 'string' &&
        storedContent.scheduleAt.trim()
          ? storedContent.scheduleAt
          : defaults.content.scheduleAt,
      shortLinkDomain:
        typeof storedContent.shortLinkDomain === 'string' &&
        storedContent.shortLinkDomain.trim()
          ? storedContent.shortLinkDomain.trim()
          : null,
      lineNumber:
        typeof storedContent.lineNumber === 'string'
          ? storedContent.lineNumber
          : defaults.content.lineNumber,
      platformSettingsId:
        typeof storedContent.platformSettingsId === 'number' &&
        Number.isInteger(storedContent.platformSettingsId) &&
        storedContent.platformSettingsId > 0
          ? storedContent.platformSettingsId
          : null,
      mediaUuid:
        typeof storedContent.mediaUuid === 'string' &&
        storedContent.mediaUuid.trim()
          ? storedContent.mediaUuid
          : null,
    },
    budget: {
      totalBudget:
        typeof storedBudget.totalBudget === 'number' &&
        Number.isFinite(storedBudget.totalBudget)
          ? Math.max(0, storedBudget.totalBudget)
          : defaults.budget.totalBudget,
      estimatedMessages: undefined,
    },
    payment: {
      paymentMethod:
        typeof storedPayment.paymentMethod === 'string'
          ? storedPayment.paymentMethod
          : defaults.payment.paymentMethod,
      termsAccepted:
        typeof storedPayment.termsAccepted === 'boolean'
          ? storedPayment.termsAccepted
          : defaults.payment.termsAccepted,
      hasEnoughBalance: undefined,
      finalCost: undefined,
      total: undefined,
    },
  };
};

const getStoredCampaignData = (data: CampaignData): CampaignData => ({
  ...data,
  budget: {
    totalBudget: data.budget.totalBudget,
    estimatedMessages: undefined,
  },
  payment: {
    paymentMethod: data.payment.paymentMethod,
    termsAccepted: data.payment.termsAccepted,
  },
});

const normalizeStoredStep = (value: string | null): number => {
  const parsed = value === null ? 1 : Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 4 ? parsed : 1;
};

const invalidateDerivedCampaignState = (
  data: CampaignData
): Pick<CampaignData, 'budget' | 'payment'> => ({
  budget: {
    ...data.budget,
    estimatedMessages: undefined,
  },
  payment: {
    ...data.payment,
    hasEnoughBalance: undefined,
    finalCost: undefined,
    total: undefined,
  },
});

export const CampaignProvider: React.FC<CampaignProviderProps> = ({
  children,
}) => {
  // Initialize state from localStorage or defaults
  const [currentStep, setCurrentStep] = useState<number>(() => {
    return normalizeStoredStep(localStorage.getItem('campaign_creation_step'));
  });

  const [campaignData, setCampaignData] = useState<CampaignData>(() => {
    const savedData = localStorage.getItem('campaign_creation_data');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        return normalizeStoredCampaignData(parsedData);
      } catch (error) {
        console.warn('Failed to parse saved campaign data:', error);
      }
    }

    return createDefaultCampaignData();
  });

  const [error, setError] = useState<string | null>(null);
  const skipNextCampaignPersistenceRef = useRef(false);
  const skipNextStepPersistenceRef = useRef(false);
  const currentStepRef = useRef(currentStep);
  currentStepRef.current = currentStep;

  // Auto-save campaign data to localStorage whenever it changes
  useEffect(() => {
    if (skipNextCampaignPersistenceRef.current) {
      skipNextCampaignPersistenceRef.current = false;
      return;
    }
    localStorage.setItem(
      'campaign_creation_data',
      JSON.stringify(getStoredCampaignData(campaignData))
    );
  }, [campaignData]);

  // Auto-save current step to localStorage whenever it changes
  useEffect(() => {
    if (skipNextStepPersistenceRef.current) {
      skipNextStepPersistenceRef.current = false;
      return;
    }
    localStorage.setItem('campaign_creation_step', currentStep.toString());
  }, [currentStep]);

  const nextStep = useCallback(() => {
    if (currentStep < 4) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
    }
  }, [currentStep]);

  const previousStep = useCallback(() => {
    if (currentStep > 1) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
    }
  }, [currentStep]);

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= 4) {
      setCurrentStep(step);
    }
  }, []);

  const updateLevel = useCallback((data: Partial<CampaignSegment>) => {
    setCampaignData(prev => {
      const derivedState = invalidateDerivedCampaignState(prev);
      const updatedData = {
        ...prev,
        segment: {
          ...prev.segment,
          ...data,
        },
        ...derivedState,
      };
      return updatedData;
    });
  }, []);

  const updateContent = useCallback((data: Partial<CampaignContent>) => {
    setCampaignData(prev => {
      const derivedState = invalidateDerivedCampaignState(prev);
      const updatedData = {
        ...prev,
        content: {
          ...prev.content,
          ...data,
        },
        ...derivedState,
      };
      return updatedData;
    });
  }, []);

  const updateBudget = useCallback((data: Partial<CampaignBudget>) => {
    setCampaignData(prev => {
      const derivedState = invalidateDerivedCampaignState(prev);
      const updatedData = {
        ...prev,
        budget: {
          ...derivedState.budget,
          ...data,
        },
        payment: derivedState.payment,
      };
      return updatedData;
    });
  }, []);

  const updatePayment = useCallback((data: Partial<CampaignPayment>) => {
    setCampaignData(prev => {
      const updatedData = {
        ...prev,
        payment: {
          ...prev.payment,
          ...data,
        },
      };
      return updatedData;
    });
  }, []);

  const replaceCampaignData = useCallback(
    (data: CampaignData, step: number = 1) => {
      setCampaignData(normalizeStoredCampaignData(data));
      setCurrentStep(
        Number.isInteger(step) && step >= 1 && step <= 4 ? step : 1
      );
      setError(null);
    },
    []
  );

  const setCampaignUuid = useCallback((uuid: string) => {
    setCampaignData(prev => {
      const updatedData = {
        ...prev,
        uuid: uuid.trim(),
      };
      return updatedData;
    });
  }, []);

  const setCampaignId = useCallback((id: number | undefined) => {
    setCampaignData(prev => {
      const updatedData = {
        ...prev,
        id,
      };
      return updatedData;
    });
  }, []);

  const resetCampaign = useCallback(() => {
    if (currentStepRef.current !== 1) {
      skipNextStepPersistenceRef.current = true;
    }
    setCurrentStep(1);
    skipNextCampaignPersistenceRef.current = true;
    setCampaignData(createDefaultCampaignData());
    setError(null);

    // Clear localStorage
    localStorage.removeItem('campaign_creation_data');
    localStorage.removeItem('campaign_creation_step');
    clearLevelSelection(); // Clear dedicated level selection storage
  }, []);

  const saveCampaignData = useCallback(() => {
    localStorage.setItem(
      'campaign_creation_data',
      JSON.stringify(getStoredCampaignData(campaignData))
    );
    localStorage.setItem('campaign_creation_step', currentStep.toString());
  }, [campaignData, currentStep]);

  const clearCampaignData = useCallback(() => {
    localStorage.removeItem('campaign_creation_data');
    localStorage.removeItem('campaign_creation_step');
    clearLevelSelection(); // Clear dedicated level selection storage
  }, []);

  // Comprehensive cleanup function for logout scenarios
  const clearAllCampaignData = useCallback(() => {
    // Clear localStorage (includes level selection storage)
    clearCampaignData();

    // Reset state
    if (currentStepRef.current !== 1) {
      skipNextStepPersistenceRef.current = true;
    }
    setCurrentStep(1);
    skipNextCampaignPersistenceRef.current = true;
    setCampaignData(createDefaultCampaignData());
    setError(null);
  }, [clearCampaignData]);

  // Register the clear function with auth context for logout scenarios
  useEffect(() => {
    registerCampaignClearFunction(clearAllCampaignData);

    // Cleanup function
    return () => {
      registerCampaignClearFunction(() => {}); // Clear the reference
    };
  }, [clearAllCampaignData]);

  // Check if there's an existing campaign
  const hasExistingCampaign = campaignData.uuid !== '';

  // Get campaign progress information
  const getCampaignProgress = useCallback(() => {
    const totalSteps = 4;
    let completedSteps = 0;

    // Check each step for completion
    // Step 1: Campaign title, level1, and level3s required
    const isAgency =
      typeof window !== 'undefined'
        ? localStorage.getItem('account_type') === 'marketing_agency'
        : false;
    const targetAudienceExcelFileUuid =
      campaignData.segment.targetAudienceExcelFileUuid;
    const audienceTargetingMethod =
      campaignData.segment.audienceTargetingMethod ??
      (targetAudienceExcelFileUuid != null ? 'excel' : 'standard');
    const isTargetAudienceExcelFileMode = audienceTargetingMethod === 'excel';
    const isSmartTargetingMode = audienceTargetingMethod === 'smart_targeting';
    const excelFileUploaded = isUuidV4(targetAudienceExcelFileUuid);
    const audienceGradesValid =
      (campaignData.segment.audienceGrades?.length ?? 0) <= 3 &&
      (campaignData.segment.audienceGrades ?? []).every(
        grade => grade === 'A' || grade === 'B' || grade === 'C'
      ) &&
      new Set(campaignData.segment.audienceGrades ?? []).size ===
        (campaignData.segment.audienceGrades?.length ?? 0);
    const hasSmartTargetingSelection =
      (campaignData.segment.selectedTagIds?.length ?? 0) > 0 &&
      (campaignData.segment.selectedTagIds?.length ?? 0) <= 10000 &&
      campaignData.segment.selectedTagIds?.every(
        tagId => Number.isInteger(tagId) && tagId > 0
      ) &&
      new Set(campaignData.segment.selectedTagIds ?? []).size ===
        (campaignData.segment.selectedTagIds?.length ?? 0) &&
      (campaignData.segment.smartTargetingSelectedRawCapacity ?? 0) >= 500;
    if (
      campaignData.segment.campaignTitle.trim() &&
      campaignData.segment.campaignTitle.length <= MAX_CAMPAIGN_STRING_LENGTH &&
      campaignData.segment.platform &&
      (!isTargetAudienceExcelFileMode && !isSmartTargetingMode
        ? campaignData.segment.level1.trim() &&
          campaignData.segment.level1.length <= MAX_CAMPAIGN_STRING_LENGTH &&
          isValidCampaignStringArray(campaignData.segment.level2s, {
            required: true,
          }) &&
          isValidCampaignStringArray(campaignData.segment.level3s, {
            required: true,
          }) &&
          isValidCampaignStringArray(campaignData.segment.tags, {
            required: true,
          }) &&
          (campaignData.segment.audienceGrades?.length ?? 0) > 0 &&
          (campaignData.segment.capacity ?? 0) >= 500 &&
          campaignData.segment.capacityTooLow !== true
        : isSmartTargetingMode
          ? hasSmartTargetingSelection
          : excelFileUploaded) &&
      audienceGradesValid &&
      (!campaignData.segment.sex ||
        (campaignData.segment.sex.trim().length > 0 &&
          campaignData.segment.sex.length <= MAX_CAMPAIGN_STRING_LENGTH)) &&
      (campaignData.segment.city === undefined ||
        isValidCampaignStringArray(campaignData.segment.city)) &&
      (!isAgency ||
        (campaignData.segment.jobCategory?.trim() &&
          campaignData.segment.jobCategory.length <=
            MAX_CAMPAIGN_STRING_LENGTH &&
          campaignData.segment.job?.trim() &&
          campaignData.segment.job.length <= MAX_CAMPAIGN_STRING_LENGTH)) &&
      campaignData.segment.bundleId &&
      (campaignData.segment.phase === 'test' ||
        campaignData.segment.phase === 'execution')
    ) {
      completedSteps++;
    }
    if (
      validateCampaignContent(
        campaignData.content,
        campaignData.segment.platform
      ).isValid &&
      (campaignData.segment.platform === 'sms'
        ? Boolean(campaignData.content.lineNumber)
        : Boolean(campaignData.content.platformSettingsId))
    ) {
      completedSteps++;
    }
    if (
      (campaignData.segment.platform === 'sms'
        ? campaignData.content.lineNumber
        : campaignData.content.platformSettingsId) &&
      Number.isInteger(campaignData.budget.totalBudget) &&
      campaignData.budget.totalBudget >= 100000 &&
      campaignData.budget.totalBudget <= 160000000
    ) {
      completedSteps++;
    }
    if (
      campaignData.payment.hasEnoughBalance === true &&
      typeof campaignData.payment.finalCost === 'number' &&
      Number.isFinite(campaignData.payment.finalCost) &&
      campaignData.payment.finalCost >= 0
    ) {
      completedSteps++;
    }

    const progress = (completedSteps / totalSteps) * 100;

    return {
      completedSteps,
      totalSteps,
      progress: Math.round(progress),
    };
  }, [campaignData]);

  const value: CampaignContextType = {
    currentStep,
    campaignData,
    error,
    nextStep,
    previousStep,
    goToStep,
    updateLevel,
    updateContent,
    updateBudget,
    updatePayment,
    replaceCampaignData,
    setCampaignId,
    setCampaignUuid,
    saveCampaignData,
    clearCampaignData,
    clearAllCampaignData,
    hasExistingCampaign,
    getCampaignProgress,
    resetCampaign,
  };

  return (
    <CampaignContext.Provider value={value}>
      {children}
    </CampaignContext.Provider>
  );
};
