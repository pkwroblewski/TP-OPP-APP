'use client';

import { useState, useCallback } from 'react';
import type { UploadMetadata } from '@/schemas/upload';

interface UploadResponse {
  success: boolean;
  data?: {
    fileId: string;
    companyId: string;
    filingId: string;
    batchId: string;
    storagePath: string;
  };
  error?: string;
  details?: unknown;
}

interface UseFileUploadReturn {
  upload: (file: File, metadata: UploadMetadata) => Promise<UploadResponse>;
  isUploading: boolean;
  progress: number;
  error: string | null;
  reset: () => void;
}

export function useFileUpload(): UseFileUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  const upload = useCallback(
    async (file: File, metadata: UploadMetadata): Promise<UploadResponse> => {
      setIsUploading(true);
      setProgress(0);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('metadata', JSON.stringify(metadata));

        // Simulate progress for better UX (actual progress tracking would require XHR)
        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return prev;
            }
            return prev + 10;
          });
        }, 200);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);

        const result: UploadResponse = await response.json();

        if (!response.ok) {
          const errorMessage = result.error || 'Upload failed';
          setError(errorMessage);
          setProgress(0);
          return { success: false, error: errorMessage };
        }

        setProgress(100);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(errorMessage);
        setProgress(0);
        return { success: false, error: errorMessage };
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  return {
    upload,
    isUploading,
    progress,
    error,
    reset,
  };
}
