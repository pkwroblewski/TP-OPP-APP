'use client';

import { useCallback, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { Upload, FileText, X, AlertCircle, CheckCircle2 } from 'lucide-react';
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
      <div className="w-full space-y-4">
        {/* Selected file card */}
        <div className="bg-gradient-to-r from-[#1e3a5f]/5 to-[#d4a853]/5 border-2 border-[#1e3a5f]/20 rounded-xl p-5 transition-all duration-200 hover:border-[#1e3a5f]/30">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              {/* File icon */}
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#2a4a7f] flex items-center justify-center shadow-sm flex-shrink-0">
                <FileText className="h-7 w-7 text-white" />
              </div>
              {/* File info */}
              <div className="space-y-1.5 min-w-0">
                <p className="font-semibold text-gray-900 truncate max-w-[280px]">
                  {selectedFile.name}
                </p>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-500">{formatFileSize(selectedFile.size)}</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-[#1e3a5f] font-medium">PDF Document</span>
                </div>
                {/* Status badge */}
                <div className="flex items-center gap-1.5 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs font-medium">Ready to upload</span>
                </div>
              </div>
            </div>
            {/* Remove button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={removeFile}
              disabled={disabled}
              className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors h-9 w-9 flex-shrink-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Change file hint */}
        <p className="text-xs text-center text-gray-400">
          Click the X to remove and select a different file
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 cursor-pointer group',
          'hover:border-[#d4a853] hover:bg-gradient-to-br hover:from-amber-50/50 hover:to-orange-50/30 hover:shadow-sm',
          isDragActive && !isDragReject && 'border-[#d4a853] bg-gradient-to-br from-amber-50 to-orange-50/50 scale-[1.02] shadow-lg',
          isDragReject && 'border-red-400 bg-red-50',
          !isDragActive && !isDragReject && 'border-gray-200 bg-gradient-to-br from-gray-50/50 to-white',
          disabled && 'opacity-50 cursor-not-allowed hover:border-gray-200 hover:bg-white hover:shadow-none'
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center justify-center text-center space-y-4">
          {/* Icon */}
          <div
            className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm',
              isDragActive && !isDragReject
                ? 'bg-gradient-to-br from-[#d4a853] to-[#e4b863] text-white scale-110 shadow-md'
                : isDragReject
                ? 'bg-red-100 text-red-500'
                : 'bg-gradient-to-br from-[#1e3a5f]/10 to-[#1e3a5f]/5 text-[#1e3a5f] group-hover:from-[#1e3a5f]/15 group-hover:to-[#d4a853]/10'
            )}
          >
            <Upload className={cn(
              'h-8 w-8 transition-transform duration-300',
              isDragActive && 'animate-bounce'
            )} />
          </div>

          {/* Text */}
          <div className="space-y-2">
            {isDragActive && !isDragReject ? (
              <>
                <p className="text-lg font-semibold text-[#d4a853]">Drop your file here</p>
                <p className="text-sm text-[#d4a853]/70">Release to upload</p>
              </>
            ) : isDragReject ? (
              <>
                <p className="text-lg font-semibold text-red-500">Invalid file type</p>
                <p className="text-sm text-red-400">Only PDF files are accepted</p>
              </>
            ) : (
              <>
                <p className="text-base font-medium text-gray-700">
                  Drop your PDF here or{' '}
                  <span className="text-[#1e3a5f] font-semibold hover:text-[#d4a853] transition-colors underline underline-offset-2">
                    browse files
                  </span>
                </p>
                <p className="text-sm text-gray-400">
                  Accepts PDF files up to 50MB
                </p>
              </>
            )}
          </div>

          {/* Supported formats hint */}
          {!isDragActive && !isDragReject && (
            <div className="flex items-center gap-2 pt-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full border border-gray-100 shadow-sm">
                <FileText className="h-3.5 w-3.5 text-red-500" />
                <span className="text-xs font-medium text-gray-500">.PDF</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-3 flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
