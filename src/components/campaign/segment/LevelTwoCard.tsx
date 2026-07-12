import React, { useEffect } from 'react';
import Card from '../../ui/Card';
import { getLevel2Metadata, getLevel3Options, formatLabel } from './utils';
import { AudienceSpec } from '../../../types/campaign';
import { useLanguage } from '../../../hooks/useLanguage';
import { campaignLevelI18n } from './segmentTranslations';

interface LevelTwoCardProps {
  spec: AudienceSpec | null;
  level1: string;
  label: string;
  help: string;
  options: Array<{ value: string; label: string }>;
  selectedLevel2s: string[];
  selectedLevel3s: string[];
  onToggleLevel2: (l2: string) => void;
  onToggleLevel3: (l3: string) => void;
  validationMessage: string;
}

const LevelTwoCard: React.FC<LevelTwoCardProps> = ({
  spec,
  level1,
  label,
  help,
  options,
  selectedLevel2s,
  selectedLevel3s,
  onToggleLevel2,
  onToggleLevel3,
  validationMessage,
}) => {
  const singleSelectedLevel2 = selectedLevel2s[0] || '';
  const { language, isRTL } = useLanguage();
  const t =
    campaignLevelI18n[language as keyof typeof campaignLevelI18n] ||
    campaignLevelI18n.en;

  const resolveMetaLabel = (rawKey: string) => {
    const lower = rawKey.toLowerCase();
    if (lower === 'inclusion') return t.inclusion;
    if (lower === 'exclusion') return t.exclusion;
    if (lower === 'one_line') return t.description || t.one_line;
    return formatLabel(rawKey);
  };

  const isJustifiedMetaField = (rawKey: string) => {
    const lower = rawKey.toLowerCase();
    return (
      lower === 'inclusion' ||
      lower === 'exclusion' ||
      lower === 'one_line' ||
      lower === 'description'
    );
  };

  // Auto-select Level 3 when there is only one option for a chosen Level 2
  useEffect(() => {
    if (!spec || !level1 || selectedLevel2s.length === 0) return;
    const l2 = selectedLevel2s[0];
    const l3Options = getLevel3Options(spec, level1, l2);
    if (l3Options.length === 1) {
      const onlyL3 = l3Options[0].value;
      selectedLevel3s.forEach(sel => {
        if (sel !== onlyL3) onToggleLevel3(sel);
      });
      if (!selectedLevel3s.includes(onlyL3)) {
        onToggleLevel3(onlyL3);
      }
    }
  }, [spec, level1, selectedLevel2s, selectedLevel3s, onToggleLevel3]);

  const handleLevel2Select = (value: string) => {
    if (singleSelectedLevel2 === value) return;
    selectedLevel2s.forEach(sel => {
      if (sel !== value) onToggleLevel2(sel);
    });
    selectedLevel3s.forEach(onToggleLevel3);
    if (!selectedLevel2s.includes(value)) {
      onToggleLevel2(value);
    }
  };

  const handleLevel3Select = (value: string) => {
    if (selectedLevel3s.length === 1 && selectedLevel3s[0] === value) return;
    selectedLevel3s.forEach(sel => {
      if (sel !== value) onToggleLevel3(sel);
    });
    if (!selectedLevel3s.includes(value)) {
      onToggleLevel3(value);
    }
  };

  return (
    <Card>
      <div className='space-y-4'>
        <h3 className='text-lg font-medium text-gray-900'>{label}</h3>
        <p className='text-sm text-gray-600'>{help}</p>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
          {options.map(lvl2 => (
            <div key={lvl2.value} className='flex items-center space-x-3'>
              <label className='flex items-center space-x-3 cursor-pointer'>
                <input
                  type='radio'
                  name='level2Select'
                  checked={selectedLevel2s.includes(lvl2.value)}
                  onChange={() => handleLevel2Select(lvl2.value)}
                  className='h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300'
                />
                <span className='text-sm text-gray-700'>{lvl2.label}</span>
              </label>
              <div className='relative group'>
                <span className='inline-flex items-center justify-center w-5 h-5 rounded-full border text-xs border-primary-600 text-primary-600 select-none leading-none text-center'>
                  {t.questionMark || '?'}
                </span>
                {(() => {
                  const meta = getLevel2Metadata(spec, level1, lvl2.value);
                  if (!meta || Object.keys(meta).length === 0) return null;
                  return (
                    <div className='absolute z-10 hidden group-hover:block bg-gray-900 text-white text-xs rounded-md shadow-lg p-3 w-80 -left-1/2 top-6'>
                      <div className='font-medium mb-1'>
                        {formatLabel(lvl2.value)}
                      </div>
                      <div className='space-y-1'>
                        {Object.entries(meta)
                          .sort(([a], [b]) => {
                            const order: Record<string, number> = {
                              one_line: 0,
                              One_line: 0,
                              inclusion: 1,
                              Inclusion: 1,
                              exclusion: 2,
                              Exclusion: 2,
                            };
                            const ra = order[a] ?? 99;
                            const rb = order[b] ?? 99;
                            return ra - rb;
                          })
                          .map(([k, v]) => (
                            <div
                              key={k}
                              className='flex flex-col text-ellipsis overflow-hidden'
                            >
                              <span className='mr-2 text-gray-300'>
                                {resolveMetaLabel(k)}
                              </span>
                              <span
                                className={`text-gray-100 ${
                                  isJustifiedMetaField(k)
                                    ? 'text-justify'
                                    : 'text-left'
                                }`}
                                dir={isRTL ? 'rtl' : 'ltr'}
                              >
                                {typeof v === 'object'
                                  ? JSON.stringify(v)
                                  : String(v)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>

        {selectedLevel2s.length > 0 && (
          <div className='space-y-4'>
            {selectedLevel2s.map(l2 => {
              const l3Options = getLevel3Options(spec, level1, l2);
              const showLevel3Choices = l3Options.length > 1;
              return (
                <div key={`meta-${l2}`}>
                  {showLevel3Choices && (
                    <div className='space-y-2 border-t pt-4'>
                      <h4 className='text-sm font-medium text-gray-800'>
                        {t.level3} {formatLabel(l2)}
                      </h4>
                      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
                        {l3Options.map(l3 => (
                          <label
                            key={`${l2}-${l3.value}`}
                            className='flex items-center space-x-3 cursor-pointer'
                          >
                            <input
                              type='radio'
                              name='level3Select'
                              checked={selectedLevel3s.includes(l3.value)}
                              onChange={() => handleLevel3Select(l3.value)}
                              className='h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300'
                            />
                            <span className='text-sm text-gray-700'>
                              {l3.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {selectedLevel2s.length === 0 && (
          <p className='text-sm text-red-600'>{validationMessage}</p>
        )}
      </div>
    </Card>
  );
};

export default LevelTwoCard;
