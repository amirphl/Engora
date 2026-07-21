import React from 'react';
import { ExternalLink, Link, Tag } from 'lucide-react';
import Card from '../../ui/Card';
import { useLanguage } from '../../../hooks/useLanguage';
import { contentI18n } from './contentTranslations';
import {
  replaceUidPlaceholder,
  useLinkUidPlaceholder,
} from './useLinkUidPlaceholder';

interface LinkInsertionCardProps {
  insertLink: boolean;
  link: string;
  linkError: string;
  onInsertLinkChange: (value: boolean) => void;
  onLinkChange: (value: string) => void;
  title: string;
  onLabel: string;
  offLabel: string;
  enabledLabel: string;
  disabledLabel: string;
  linkLabel: string;
  linkPlaceholder: string;
  linkValidation: string;
  charactersLabel: string;
}

const LinkInsertionCard: React.FC<LinkInsertionCardProps> = ({
  insertLink,
  link,
  linkError,
  onInsertLinkChange,
  onLinkChange,
  title,
  onLabel,
  offLabel,
  enabledLabel,
  disabledLabel,
  linkLabel,
  linkPlaceholder,
  linkValidation,
  charactersLabel,
}) => {
  const linkCharacterCount = link?.length || 0;
  const maxLinkCharacters = 10000;
  const isLinkOverLimit = linkCharacterCount > maxLinkCharacters;
  const { language } = useLanguage();
  const t = contentI18n[language as keyof typeof contentI18n] || contentI18n.en;

  const { hasPlaceholder, inputRef, saveCursor, toggle } =
    useLinkUidPlaceholder(link);
  const canPreviewUidLink = Boolean(link) && hasPlaceholder && !linkError;

  const handlePreviewUidLink = () => {
    if (!canPreviewUidLink) return;
    const previewLink = replaceUidPlaceholder(link || '', '123456');
    window.open(previewLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className='h-full'>
      <div className='space-y-4'>
        <h3 className='text-lg font-medium text-gray-900 flex items-center gap-1'>
          <Link className='h-5 w-5 text-primary-600' />
          {title}
        </h3>
        <div className='flex items-center space-x-4'>
          <label className='inline-flex items-center space-x-2 cursor-pointer'>
            <input
              type='radio'
              name='insertLink'
              value='on'
              checked={insertLink === true}
              onChange={() => onInsertLinkChange(true)}
              className='h-4 w-4 text-primary-600 border-gray-300'
            />
            <span className='text-sm text-gray-700'>{onLabel}</span>
          </label>
          <label className='inline-flex items-center space-x-2 cursor-pointer'>
            <input
              type='radio'
              name='insertLink'
              value='off'
              checked={insertLink === false}
              onChange={() => onInsertLinkChange(false)}
              className='h-4 w-4 text-primary-600 border-gray-300'
            />
            <span className='text-sm text-gray-700'>{offLabel}</span>
          </label>
          <span className='text-sm text-gray-600'>
            {insertLink ? enabledLabel : disabledLabel}
          </span>
        </div>

        {insertLink && (
          <>
            <div className='bg-blue-50 border-l-4 border-primary-600 p-3 rounded text-sm text-gray-700'>
              {t.linkAnalysisInfo}
            </div>
            <div className='h-2' />

            <div className='space-y-2'>
              <label
                htmlFor='link'
                className='block text-sm font-medium text-gray-700'
              >
                {linkLabel}
                <span className='text-red-500 ml-1'>*</span>
              </label>
              <input
                id='link'
                ref={inputRef}
                type='text'
                dir='ltr'
                maxLength={maxLinkCharacters}
                placeholder={linkPlaceholder}
                value={link || ''}
                onChange={e => {
                  const sanitized = e.target.value.replace(/\s+/g, '');
                  onLinkChange(sanitized);
                }}
                onSelect={saveCursor}
                onKeyUp={saveCursor}
                onMouseUp={saveCursor}
                onBlur={saveCursor}
                className={`w-full px-3 py-2 border rounded-md shadow-sm text-left focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  linkError ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {!linkError && linkValidation && (
                <p className='text-sm text-gray-500'>{linkValidation}</p>
              )}
            </div>

            <div className='flex flex-wrap items-center gap-2'>
              <button
                type='button'
                onClick={() => toggle(onLinkChange)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                  hasPlaceholder
                    ? 'bg-primary-50 border-primary-500 text-primary-700 hover:bg-primary-100'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Tag className='h-4 w-4' />
                {hasPlaceholder
                  ? t.uidPlaceholderInserted
                  : t.insertUidPlaceholder}
              </button>

              <button
                type='button'
                onClick={handlePreviewUidLink}
                disabled={!canPreviewUidLink}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                  canPreviewUidLink
                    ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <ExternalLink className='h-4 w-4' />
                {t.previewUidLink}
              </button>
            </div>

            {hasPlaceholder && (
              <p className='text-sm text-gray-600'>{t.uidPlaceholderHelp}</p>
            )}

            {linkError && <p className='text-sm text-red-600'>{linkError}</p>}
            <div
              className={`text-sm ${isLinkOverLimit ? 'text-red-600' : 'text-gray-500'}`}
            >
              {linkCharacterCount} / {maxLinkCharacters} {charactersLabel}
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

export default LinkInsertionCard;
