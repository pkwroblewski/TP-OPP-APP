'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, Upload, Files, Info, CheckCircle, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { DropZone } from '@/components/upload/DropZone';
import { MetadataForm } from '@/components/upload/MetadataForm';
import { UploadQueue } from '@/components/upload/UploadQueue';
import { useFileUpload } from '@/lib/hooks/useFileUpload';
import type { UploadMetadata } from '@/schemas/upload';

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    companyId?: string;
    message?: string;
  } | null>(null);

  const { upload, isUploading, progress, error, reset, status } = useFileUpload();

  const handleSubmit = async (data: UploadMetadata) => {
    if (!selectedFile) return;

    setUploadResult(null);

    const result = await upload(selectedFile, data);

    if (result.success && result.data) {
      setUploadResult({
        success: true,
        companyId: result.data.companyId,
        message: 'File uploaded successfully! The analysis will begin shortly.',
      });
      setSelectedFile(null);
    } else {
      setUploadResult({
        success: false,
        message: result.error || 'Upload failed. Please try again.',
      });
    }
  };

  const handleReset = () => {
    reset();
    setUploadResult(null);
    setSelectedFile(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Upload Financial Accounts</h1>
        <p className="text-gray-600">
          Upload Luxembourg annual accounts in PDF format to identify transfer pricing opportunities.
        </p>
      </div>

      {/* Success Alert */}
      {uploadResult?.success && (
        <Alert className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 shadow-sm">
          <CheckCircle className="h-5 w-5 text-emerald-600" />
          <AlertDescription className="text-emerald-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                <span className="font-medium">{uploadResult.message}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100"
                >
                  Upload Another
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Link href="/processing">
                    View Processing Queue
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                {uploadResult.companyId && (
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  >
                    <Link href={`/companies/${uploadResult.companyId}`}>
                      View Company
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {(uploadResult?.success === false || error) && (
        <Alert variant="destructive" className="shadow-sm">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription className="font-medium">
            {uploadResult?.message || error || 'An error occurred during upload.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Tabs */}
      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 h-12 bg-gray-100 rounded-xl p-1">
          <TabsTrigger
            value="single"
            className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#1e3a5f] data-[state=active]:shadow-sm transition-all font-medium"
          >
            <FileText className="h-4 w-4" />
            Single Upload
          </TabsTrigger>
          <TabsTrigger
            value="bulk"
            className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#1e3a5f] data-[state=active]:shadow-sm transition-all font-medium"
          >
            <Files className="h-4 w-4" />
            Bulk Upload
          </TabsTrigger>
        </TabsList>

        {/* Single Upload Tab */}
        <TabsContent value="single" className="mt-6">
          {/* Instructions Banner */}
          <div className="mb-6 bg-gradient-to-r from-[#1e3a5f]/5 to-[#d4a853]/5 border border-[#1e3a5f]/10 rounded-xl p-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center flex-shrink-0">
                <Info className="h-5 w-5 text-[#1e3a5f]" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-[#1e3a5f]">How it works</p>
                <p className="text-sm text-gray-600">
                  Upload a PDF of Luxembourg annual accounts. Our AI will extract financial data,
                  identify intercompany transactions, and score the company for transfer pricing
                  advisory potential.
                </p>
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT COLUMN - File Upload */}
            <Card className="bg-white shadow-tp border-0 rounded-xl h-fit">
              <CardHeader className="pb-4 border-b border-gray-100">
                <CardTitle className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center">
                    <Upload className="h-4 w-4 text-[#1e3a5f]" />
                  </div>
                  Select Document
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <DropZone
                  selectedFile={selectedFile}
                  onFileSelect={setSelectedFile}
                  disabled={isUploading}
                />
              </CardContent>
            </Card>

            {/* RIGHT COLUMN - Metadata Form */}
            <Card className="bg-white shadow-tp border-0 rounded-xl">
              <CardHeader className="pb-4 border-b border-gray-100">
                <CardTitle className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#d4a853]/10 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-[#d4a853]" />
                  </div>
                  Company Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <MetadataForm
                  onSubmit={handleSubmit}
                  isLoading={isUploading}
                  hasFile={selectedFile !== null}
                />
              </CardContent>
            </Card>
          </div>

          {/* Upload Queue - Shows during upload */}
          {isUploading && selectedFile && (
            <div className="mt-6">
              <UploadQueue
                fileName={selectedFile.name}
                fileSize={selectedFile.size}
                progress={progress}
                status={status}
              />
            </div>
          )}
        </TabsContent>

        {/* Bulk Upload Tab */}
        <TabsContent value="bulk" className="mt-6">
          <Card className="bg-white shadow-tp border-0 rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Files className="h-4 w-4 text-gray-500" />
                </div>
                Bulk Upload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mb-6 shadow-sm">
                  <Files className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Bulk Upload Coming Soon
                </h3>
                <p className="text-sm text-gray-500 max-w-md mb-6">
                  Upload multiple PDFs at once with automatic metadata extraction from filenames.
                  This feature will be available in a future update.
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Sparkles className="h-4 w-4" />
                  <span>Expected features: drag multiple files, batch processing, CSV import</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Help Section */}
      <Card className="bg-white shadow-tp border-0 rounded-xl">
        <CardHeader className="pb-4 border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-[#1e3a5f]">
            Supported Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center flex-shrink-0 shadow-sm">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-gray-900">Annual Accounts</h4>
                <p className="text-sm text-gray-500">
                  Luxembourg statutory annual accounts (bilan, compte de profits et pertes)
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center flex-shrink-0 shadow-sm">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-gray-900">PDF Format</h4>
                <p className="text-sm text-gray-500">
                  Standard PDF files up to 50MB. Scanned documents with OCR are supported.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center flex-shrink-0 shadow-sm">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-gray-900">RCS Filings</h4>
                <p className="text-sm text-gray-500">
                  Documents downloaded from the Luxembourg Business Registers (LBR)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
