'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, Upload, Files, Info, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DropZone } from '@/components/upload/DropZone';
import { MetadataForm } from '@/components/upload/MetadataForm';
import { useFileUpload } from '@/lib/hooks/useFileUpload';
import type { UploadMetadata } from '@/schemas/upload';

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    companyId?: string;
    message?: string;
  } | null>(null);

  const { upload, isUploading, progress, error, reset } = useFileUpload();

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
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Upload Financial Accounts</h1>
        <p className="text-gray-600">
          Upload Luxembourg annual accounts in PDF format to identify transfer pricing opportunities.
        </p>
      </div>

      {/* Success Alert */}
      {uploadResult?.success && (
        <Alert className="bg-emerald-50 border-emerald-200">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-800">
            <div className="flex items-center justify-between">
              <span>{uploadResult.message}</span>
              <div className="flex gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100"
                >
                  Upload Another
                </Button>
                {uploadResult.companyId && (
                  <Button
                    asChild
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Link href={`/companies/${uploadResult.companyId}`}>
                      View Company
                      <ArrowRight className="ml-1 h-4 w-4" />
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
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {uploadResult?.message || error || 'An error occurred during upload.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <Card className="bg-white shadow-sm border-0 rounded-xl">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Uploading...</span>
                <span className="text-sm text-gray-500">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-gray-500">
                Please wait while your file is being uploaded and processed.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Tabs */}
      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-12 bg-gray-100 rounded-lg p-1">
          <TabsTrigger
            value="single"
            className="flex items-center gap-2 rounded-md data-[state=active]:bg-white data-[state=active]:text-[#1e3a5f] data-[state=active]:shadow-sm transition-all"
          >
            <FileText className="h-4 w-4" />
            Single Upload
          </TabsTrigger>
          <TabsTrigger
            value="bulk"
            className="flex items-center gap-2 rounded-md data-[state=active]:bg-white data-[state=active]:text-[#1e3a5f] data-[state=active]:shadow-sm transition-all"
          >
            <Files className="h-4 w-4" />
            Bulk Upload
          </TabsTrigger>
        </TabsList>

        {/* Single Upload Tab */}
        <TabsContent value="single" className="mt-6 space-y-6">
          {/* Instructions */}
          <Card className="bg-[#1e3a5f]/5 border-0 shadow-none">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-[#1e3a5f] flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[#1e3a5f]">How it works</p>
                  <p className="text-sm text-gray-600">
                    Upload a PDF of Luxembourg annual accounts. Our AI will extract financial data,
                    identify intercompany transactions, and score the company for transfer pricing
                    advisory potential.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Card */}
          <Card className="bg-white shadow-sm border-0 rounded-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Document
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Drop Zone */}
              <DropZone
                selectedFile={selectedFile}
                onFileSelect={setSelectedFile}
                disabled={isUploading}
              />

              {/* Metadata Form */}
              <div className="pt-4 border-t border-gray-100">
                <MetadataForm
                  onSubmit={handleSubmit}
                  isLoading={isUploading}
                  hasFile={selectedFile !== null}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk Upload Tab */}
        <TabsContent value="bulk" className="mt-6">
          <Card className="bg-white shadow-sm border-0 rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
                <Files className="h-5 w-5" />
                Bulk Upload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Files className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-base font-medium text-gray-700 mb-2">
                  Bulk Upload Coming Soon
                </h3>
                <p className="text-sm text-gray-500 max-w-md">
                  Upload multiple PDFs at once with automatic metadata extraction from filenames.
                  This feature will be available in a future update.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Help Section */}
      <Card className="bg-white shadow-sm border-0 rounded-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-[#1e3a5f]">
            Supported Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <h4 className="font-medium text-gray-900">Annual Accounts</h4>
              <p className="text-sm text-gray-500">
                Luxembourg statutory annual accounts (bilan, compte de profits et pertes)
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <h4 className="font-medium text-gray-900">PDF Format</h4>
              <p className="text-sm text-gray-500">
                Standard PDF files up to 50MB. Scanned documents with OCR are supported.
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <h4 className="font-medium text-gray-900">RCS Filings</h4>
              <p className="text-sm text-gray-500">
                Documents downloaded from the Luxembourg Business Registers (LBR)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
