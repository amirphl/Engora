import React, { useMemo, useRef } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import FormField from '../../ui/FormField';
import { CampaignMediaType } from '../../../types/campaign';
import { hasLinkPlaceholder } from '../../../utils/campaignUtils';

interface MessageMediaCardProps {
  title: string;
  label: string;
  placeholder: string;
  mediaLabel: string;
  mediaHelp: string;
  removeLabel: string;
  text: string;
  insertLink: boolean;
  textAreaRef: React.RefObject<HTMLTextAreaElement>;
  linkCharacterInserted: boolean;
  onInsertLinkCharacter: () => void;
  insertLinkCharacterLabel: string;
  linkCharacterInsertedLabel: string;
  linkCharacterInsertedMessage: string;
  previewUrl?: string | null;
  previewName?: string | null;
  previewType?: CampaignMediaType | null;
  onTextChange: (value: string) => void;
  onMediaChange: (payload: {
    file: File;
    previewUrl: string;
    name: string;
    type: CampaignMediaType;
  }) => void;
  onMediaClear: () => void;
  onMediaDownload?: () => void;
  downloadLabel: string;
  maxCharactersLabel: string;
  maxCharacters: number;
  isUploading?: boolean;
  onMediaError?: (message: string) => void;
}

const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-matroska',
];
const MAX_MEDIA_BYTES = 100 * 1024 * 1024;

const MessageMediaCard: React.FC<MessageMediaCardProps> = ({
  title,
  label,
  placeholder,
  mediaLabel,
  mediaHelp,
  removeLabel,
  text,
  insertLink,
  textAreaRef,
  linkCharacterInserted,
  onInsertLinkCharacter,
  insertLinkCharacterLabel,
  linkCharacterInsertedLabel,
  linkCharacterInsertedMessage,
  previewUrl,
  previewName,
  previewType,
  onTextChange,
  onMediaChange,
  onMediaClear,
  onMediaDownload,
  downloadLabel,
  maxCharactersLabel,
  maxCharacters,
  isUploading,
  onMediaError,
}) => {
  const remaining = Math.max(0, maxCharacters - (text?.length || 0));
  const remainingLabel = useMemo(
    () => maxCharactersLabel.replace('{count}', String(remaining)),
    [maxCharactersLabel, remaining]
  );
  const hasLinkMarker = hasLinkPlaceholder(text || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextChange = (value: string) => {
    const nextValue =
      value.length > maxCharacters ? value.slice(0, maxCharacters) : value;
    onTextChange(nextValue);
  };

  const handleMediaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      onMediaError?.('Invalid file type');
      event.target.value = '';
      return;
    }
    if (file.size > MAX_MEDIA_BYTES) {
      onMediaError?.('File is too large (max 100MB)');
      event.target.value = '';
      return;
    }

    const type: CampaignMediaType = file.type.startsWith('image/')
      ? 'image'
      : 'video';
    onMediaChange({
      file,
      previewUrl: URL.createObjectURL(file),
      type,
      name: file.name,
    });
  };

  const handleMediaClear = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    onMediaClear();
  };

  return (
    <Card>
      <div className='space-y-4'>
        <h3 className='text-lg font-medium text-gray-900 flex items-center gap-1'>
          <ImageIcon className='h-5 w-5 text-primary-600' />
          {title}
        </h3>

        <FormField
          id='messageText'
          label={label}
          type='textarea'
          placeholder={placeholder}
          value={text || ''}
          onChange={handleTextChange}
          required
          rows={8}
          ref={textAreaRef}
        />
        {insertLink && !hasLinkMarker && (
          <p className='text-sm text-red-600'>{linkCharacterInsertedMessage}</p>
        )}
        {insertLink && (
          <div className='mt-2'>
            <Button
              variant='outline'
              onClick={onInsertLinkCharacter}
              size='sm'
              disabled={linkCharacterInserted || !text}
            >
              {linkCharacterInserted
                ? linkCharacterInsertedLabel
                : insertLinkCharacterLabel}
            </Button>
            {linkCharacterInserted && (
              <p className='text-sm text-green-600 mt-2'>
                {linkCharacterInsertedMessage}
              </p>
            )}
          </div>
        )}
        <p className='text-sm text-gray-500'>{remainingLabel}</p>

        <div className='space-y-2'>
          <label className='block text-sm font-medium text-gray-700'>
            {mediaLabel}
          </label>
          <input
            ref={fileInputRef}
            type='file'
            accept='image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/webm,video/x-matroska'
            onChange={handleMediaChange}
            disabled={isUploading}
            className='block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100'
          />
          <p className='text-xs text-gray-500'>{mediaHelp}</p>
        </div>

        {previewUrl && (
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-700'>
                {previewName || 'media'}
              </span>
              <div className='flex items-center gap-3'>
                {onMediaDownload && (
                  <button
                    type='button'
                    onClick={onMediaDownload}
                    className='text-sm text-blue-600 hover:text-blue-700'
                  >
                    {downloadLabel}
                  </button>
                )}
                <button
                  type='button'
                  onClick={handleMediaClear}
                  className='text-sm text-red-600 hover:text-red-700'
                >
                  {removeLabel}
                </button>
              </div>
            </div>
            {previewType === 'video' ? (
              <video controls className='w-full max-h-64 rounded-md border'>
                <source src={previewUrl} />
              </video>
            ) : (
              <img
                src={previewUrl}
                alt={previewName || 'media preview'}
                className='max-h-64 rounded-md border'
              />
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default MessageMediaCard;
