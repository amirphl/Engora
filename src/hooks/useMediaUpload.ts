import { useCallback, useRef, useState } from 'react';
import { useToast } from './useToast';
import { apiService } from '../services/api';

type UseMediaUploadMessages = {
  notAuthenticated: string;
  uploadFailed: string;
};

export const useMediaUpload = (
  accessToken: string | null,
  messages?: UseMediaUploadMessages
) => {
  const { showError } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const activeUploadsRef = useRef(0);
  const accessTokenRef = useRef(accessToken);
  const messagesRef = useRef<UseMediaUploadMessages>({
    notAuthenticated: messages?.notAuthenticated || 'Please log in again',
    uploadFailed: messages?.uploadFailed || 'Failed to upload media',
  });

  messagesRef.current = {
    notAuthenticated:
      messages?.notAuthenticated || messagesRef.current.notAuthenticated,
    uploadFailed: messages?.uploadFailed || messagesRef.current.uploadFailed,
  };
  accessTokenRef.current = accessToken;

  const uploadMedia = useCallback(
    async (file: File) => {
      if (!accessToken) {
        showError(messagesRef.current.notAuthenticated);
        return null;
      }
      activeUploadsRef.current += 1;
      setIsUploading(true);
      try {
        const requestToken = accessToken;
        apiService.setAccessToken(accessToken);
        const res = await apiService.uploadMultimedia(file);
        if (accessTokenRef.current !== requestToken) return null;
        if (!res.success || !res.data?.uuid) {
          showError(res.message || messagesRef.current.uploadFailed);
          return null;
        }
        return res.data.uuid;
      } catch (error) {
        const message =
          error instanceof Error && error.message
            ? error.message
            : messagesRef.current.uploadFailed;
        showError(message);
        return null;
      } finally {
        activeUploadsRef.current = Math.max(0, activeUploadsRef.current - 1);
        setIsUploading(activeUploadsRef.current > 0);
      }
    },
    [accessToken, showError]
  );

  return {
    uploadMedia,
    isUploading,
  };
};
