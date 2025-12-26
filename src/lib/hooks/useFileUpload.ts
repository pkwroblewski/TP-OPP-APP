'use client';

import { useState, useCallback } from 'react';
import type { UploadMetadata } from '@/schemas/upload';
import type { UploadStatus } from '@/components/upload/UploadQueue';

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
  status: UploadStatus;
  error: string | null;
  reset: () => void;
}

export function useFileUpload(): UseFileUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setStatus('idle');
    setError(null);
  }, []);

  const upload = useCallback(
    async (file: File, metadata: UploadMetadata): Promise<UploadResponse> => {
      setIsUploading(true);
      setProgress(0);
      setStatus('uploading');
      setError(null);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('metadata', JSON.stringify(metadata));

        // Simulate upload progress (0-30%)
        const uploadInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 30) {
              clearInterval(uploadInterval);
              return prev;
            }
            return prev + 5;
          });
        }, 150);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        clearInterval(uploadInterval);

        // Processing phase (30-60%)
        setProgress(30);
        setStatus('processing');

        await new Promise((resolve) => setTimeout(resolve, 300));
        setProgress(45);

        await new Promise((resolve) => setTimeout(resolve, 300));
        setProgress(60);

        // Analyzing phase (60-90%)
        setStatus('analyzing');

        await new Promise((resolve) => setTimeout(resolve, 400));
        setProgress(75);

        await new Promise((resolve) => setTimeout(resolve, 400));
        setProgress(90);

        const result: UploadResponse = await response.json();

        if (!response.ok) {
          const errorMessage = result.error || 'Upload failed';
          setError(errorMessage);
          setProgress(0);
          setStatus('error');
          return { success: false, error: errorMessage };
        }

        // Complete (100%)
        setProgress(100);
        setStatus('complete');

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(errorMessage);
        setProgress(0);
        setStatus('error');
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
    status,
    error,
    reset,
  };
}
