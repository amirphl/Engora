import {
  AudienceGrade,
  AudienceSpec,
  AudienceSpecItem,
} from '../../../types/campaign';

export const formatLabel = (s: string) => {
  return s.replace(/_/g, ' ');
};

export const getLevel1Options = (spec: AudienceSpec | null) => {
  if (!spec) return [] as Array<{ value: string; label: string }>;
  return Object.keys(spec).map(key => ({
    value: key,
    label: formatLabel(key),
  }));
};

export const getLevel2Options = (spec: AudienceSpec | null, level1: string) => {
  if (!spec || !level1 || !spec[level1])
    return [] as Array<{ value: string; label: string }>;
  return Object.keys(spec[level1]).map(l2 => ({
    value: l2,
    label: formatLabel(l2),
  }));
};

export const getLevel3Options = (
  spec: AudienceSpec | null,
  level1: string,
  level2: string
) => {
  if (!spec || !level1 || !level2)
    return [] as Array<{ value: string; label: string }>;
  const bucket = spec[level1]?.[level2]?.items || {};
  return Object.keys(bucket).map(l3 => ({ value: l3, label: formatLabel(l3) }));
};

export const getLevel2Metadata = (
  spec: AudienceSpec | null,
  level1: string,
  level2: string
): Record<string, unknown> | null => {
  if (!spec || !level1 || !level2) return null;
  const meta = spec[level1]?.[level2]?.metadata;
  if (!meta || typeof meta !== 'object') return null;
  return meta;
};

export const getAudienceSpecItem = (
  spec: AudienceSpec | null,
  level1: string,
  level2: string,
  level3: string
): AudienceSpecItem | undefined => spec?.[level1]?.[level2]?.items?.[level3];

export const getItemTags = (
  spec: AudienceSpec | null,
  level1: string,
  level2: string,
  level3: string
): string[] => {
  if (!spec || !level1 || !level2 || !level3) return [];
  const item = getAudienceSpecItem(spec, level1, level2, level3);
  return Array.from(new Set(item?.tags || []));
};

export const calculateAudienceGradeCapacity = (
  item: AudienceSpecItem,
  grade: AudienceGrade,
  platform: string
): number => {
  const prefix = grade === 'A' ? 'best' : grade === 'B' ? 'good' : 'weak';
  const white = item[`${prefix}_white`];
  const pink = item[`${prefix}_pink`];

  if (platform === 'sms') {
    return Math.round(white + pink / 3);
  }

  return white + pink + item[`${prefix}_black`];
};
