'use client';

import { useCallback, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MAX_FILE_SIZE } from '@/schemas/upload';

interface DropZoneProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  disabled?: boolean;
}

export function DropZone({ onFileSelect, selectedFile, disabled }: DropZoneProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      setError(null);

      if (fileRejections.length > 0) {
        const rejection = fileRejections[0];
        const errorMessage = rejection.errors[0]?.message || 'File not accepted';
        setError(errorMessage);
        return;
      }

      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    disabled,
  });

  const removeFile = () => {
    onFileSelect(null);
    setError(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Show selected file state
  if (selectedFile) {
    return (
      <div className="w-full">
        <div className="bg-white border-2 border-[#1e3a5f]/20 rounded-xl p-6 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-[#1e3a5f]" />
              </div>
              <div>
                <p className="font-medium text-gray-900 truncate max-w-[300px]">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-gray-500">
                  {formatFileSize(selectedFile.size)} • PDF Document
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={removeFile}
              disabled={disabled}
              className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-10 transition-all duration-300 cursor-pointer',
          'hover:border-[#d4a853] hover:bg-amber-50/50 hover:shadow-sm',
          isDragActive && !isDragReject && 'border-[#d4a853] bg-amber-50 scale-[1.02] shadow-md',
          isDragReject && 'border-red-400 bg-red-50',
          !isDragActive && !isDragReject && 'border-gray-300 bg-white',
          disabled && 'opacity-50 cursor-not-allowed hover:border-gray-300 hover:bg-white hover:shadow-none'
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center justify-center text-center space-y-5">
          {/* Icon */}
          <div
            className={cn(
              'w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm',
              isDragActive && !isDragReject
                ? 'bg-[#d4a853] text-white scale-110'
                : isDragReject
                ? 'bg-red-100 text-red-500'
                : 'bg-gradient-to-br from-[#1e3a5f]/10 to-[#1e3a5f]/5 text-[#1e3a5f]'
            )}
          >
            <Upload className="h-9 w-9" />
          </div>

          {/* Text */}
          <div className="space-y-2">
            {isDragActive && !isDragReject ? (
              <p className="text-xl font-semibold text-[#d4a853]">Drop your file here</p>
            ) : isDragReject ? (
              <p className="text-xl font-semibold text-red-500">Only PDF files are accepted</p>
            ) : (
              <>
                <p className="text-lg font-medium text-gray-700">
                  Drop PDF files here or{' '}
                  <span className="text-[#1e3a5f] font-semibold hover:text-[#d4a853] transition-colors">
                    click to browse
                  </span>
                </p>
                <p className="text-sm text-gray-500">
                  Accepts PDF files up to 50MB
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
