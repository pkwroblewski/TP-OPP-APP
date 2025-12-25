'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Upload, Building2, Calendar, FileText, Globe, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  uploadMetadataSchema,
  type UploadMetadata,
  legalForms,
  fiscalYears,
  countries,
} from '@/schemas/upload';

interface MetadataFormProps {
  onSubmit: (data: UploadMetadata) => void;
  isLoading?: boolean;
  hasFile: boolean;
}

export function MetadataForm({ onSubmit, isLoading, hasFile }: MetadataFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UploadMetadata>({
    resolver: zodResolver(uploadMetadataSchema),
    defaultValues: {
      rcsNumber: '',
      companyName: '',
      fiscalYear: '',
      legalForm: '',
      parentCompanyName: '',
      parentCountry: '',
    },
  });

  const fiscalYear = watch('fiscalYear');
  const legalForm = watch('legalForm');
  const parentCountry = watch('parentCountry');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Company Information Section */}
      <div className="space-y-5">
        <div className="flex items-center gap-2 text-[#1e3a5f]">
          <Building2 className="h-5 w-5" />
          <h3 className="font-semibold">Company Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* RCS Number */}
          <div className="space-y-2">
            <Label htmlFor="rcsNumber" className="text-gray-700 font-medium">
              RCS Number <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="rcsNumber"
                placeholder="B123456"
                {...register('rcsNumber')}
                disabled={isLoading}
                className={`h-11 pl-4 pr-4 rounded-lg border-gray-200 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]/20 transition-colors ${
                  errors.rcsNumber ? 'border-red-300 focus:border-red-500' : ''
                }`}
              />
            </div>
            {errors.rcsNumber && (
              <p className="text-sm text-red-500">{errors.rcsNumber.message}</p>
            )}
          </div>

          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="companyName" className="text-gray-700 font-medium">
              Company Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="companyName"
              placeholder="Enter company name"
              {...register('companyName')}
              disabled={isLoading}
              className={`h-11 rounded-lg border-gray-200 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]/20 transition-colors ${
                errors.companyName ? 'border-red-300 focus:border-red-500' : ''
              }`}
            />
            {errors.companyName && (
              <p className="text-sm text-red-500">{errors.companyName.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Fiscal Year */}
          <div className="space-y-2">
            <Label className="text-gray-700 font-medium">
              Fiscal Year <span className="text-red-500">*</span>
            </Label>
            <Select
              value={fiscalYear}
              onValueChange={(value) => setValue('fiscalYear', value)}
              disabled={isLoading}
            >
              <SelectTrigger
                className={`h-11 rounded-lg border-gray-200 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]/20 ${
                  errors.fiscalYear ? 'border-red-300' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <SelectValue placeholder="Select fiscal year" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {fiscalYears.map((year) => (
                  <SelectItem key={year.value} value={year.value}>
                    {year.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.fiscalYear && (
              <p className="text-sm text-red-500">{errors.fiscalYear.message}</p>
            )}
          </div>

          {/* Legal Form */}
          <div className="space-y-2">
            <Label className="text-gray-700 font-medium">
              Legal Form <span className="text-red-500">*</span>
            </Label>
            <Select
              value={legalForm}
              onValueChange={(value) => setValue('legalForm', value)}
              disabled={isLoading}
            >
              <SelectTrigger
                className={`h-11 rounded-lg border-gray-200 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]/20 ${
                  errors.legalForm ? 'border-red-300' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <SelectValue placeholder="Select legal form" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {legalForms.map((form) => (
                  <SelectItem key={form.value} value={form.value}>
                    {form.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.legalForm && (
              <p className="text-sm text-red-500">{errors.legalForm.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Parent Company Section */}
      <div className="space-y-5 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-[#1e3a5f]">
          <Users className="h-5 w-5" />
          <h3 className="font-semibold">Parent Company (Optional)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Parent Company Name */}
          <div className="space-y-2">
            <Label htmlFor="parentCompanyName" className="text-gray-700 font-medium">
              Parent Company Name
            </Label>
            <Input
              id="parentCompanyName"
              placeholder="Enter parent company name"
              {...register('parentCompanyName')}
              disabled={isLoading}
              className="h-11 rounded-lg border-gray-200 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]/20 transition-colors"
            />
          </div>

          {/* Parent Country */}
          <div className="space-y-2">
            <Label className="text-gray-700 font-medium">Parent Country</Label>
            <Select
              value={parentCountry}
              onValueChange={(value) => setValue('parentCountry', value)}
              disabled={isLoading}
            >
              <SelectTrigger className="h-11 rounded-lg border-gray-200 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]/20">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <SelectValue placeholder="Select country" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.value} value={country.value}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <Button
          type="submit"
          disabled={isLoading || !hasFile}
          className="w-full h-12 bg-[#1e3a5f] hover:bg-[#2d4a6f] text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Uploading & Analysing...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-5 w-5" />
              Upload & Analyse
            </>
          )}
        </Button>
        {!hasFile && (
          <p className="text-sm text-gray-500 text-center mt-2">
            Please select a PDF file to upload
          </p>
        )}
      </div>
    </form>
  );
}
