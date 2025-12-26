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
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[#1e3a5f]">
          <div className="w-7 h-7 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center">
            <Building2 className="h-4 w-4" />
          </div>
          <h3 className="font-semibold">Company Information</h3>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* RCS Number */}
          <div className="space-y-1.5">
            <Label htmlFor="rcsNumber" className="text-gray-700 font-medium text-sm">
              RCS Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="rcsNumber"
              placeholder="B123456"
              {...register('rcsNumber')}
              disabled={isLoading}
              className={`h-10 rounded-lg border-gray-200 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]/20 transition-colors text-sm ${
                errors.rcsNumber ? 'border-red-300 focus:border-red-500' : ''
              }`}
            />
            {errors.rcsNumber && (
              <p className="text-xs text-red-500">{errors.rcsNumber.message}</p>
            )}
          </div>

          {/* Company Name */}
          <div className="space-y-1.5">
            <Label htmlFor="companyName" className="text-gray-700 font-medium text-sm">
              Company Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="companyName"
              placeholder="Enter company name"
              {...register('companyName')}
              disabled={isLoading}
              className={`h-10 rounded-lg border-gray-200 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]/20 transition-colors text-sm ${
                errors.companyName ? 'border-red-300 focus:border-red-500' : ''
              }`}
            />
            {errors.companyName && (
              <p className="text-xs text-red-500">{errors.companyName.message}</p>
            )}
          </div>

          {/* Fiscal Year & Legal Form - Side by side */}
          <div className="grid grid-cols-2 gap-3">
            {/* Fiscal Year */}
            <div className="space-y-1.5">
              <Label className="text-gray-700 font-medium text-sm">
                Fiscal Year <span className="text-red-500">*</span>
              </Label>
              <Select
                value={fiscalYear}
                onValueChange={(value) => setValue('fiscalYear', value)}
                disabled={isLoading}
              >
                <SelectTrigger
                  className={`h-10 rounded-lg border-gray-200 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]/20 text-sm ${
                    errors.fiscalYear ? 'border-red-300' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    <SelectValue placeholder="Year" />
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
                <p className="text-xs text-red-500">{errors.fiscalYear.message}</p>
              )}
            </div>

            {/* Legal Form */}
            <div className="space-y-1.5">
              <Label className="text-gray-700 font-medium text-sm">
                Legal Form <span className="text-red-500">*</span>
              </Label>
              <Select
                value={legalForm}
                onValueChange={(value) => setValue('legalForm', value)}
                disabled={isLoading}
              >
                <SelectTrigger
                  className={`h-10 rounded-lg border-gray-200 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]/20 text-sm ${
                    errors.legalForm ? 'border-red-300' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-gray-400" />
                    <SelectValue placeholder="Select" />
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
                <p className="text-xs text-red-500">{errors.legalForm.message}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Parent Company Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[#1e3a5f]">
          <div className="w-7 h-7 rounded-lg bg-[#d4a853]/10 flex items-center justify-center">
            <Users className="h-4 w-4 text-[#d4a853]" />
          </div>
          <h3 className="font-semibold">Parent Company</h3>
          <span className="text-xs text-gray-400 font-normal">(Optional)</span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Parent Company Name */}
          <div className="space-y-1.5">
            <Label htmlFor="parentCompanyName" className="text-gray-700 font-medium text-sm">
              Parent Company Name
            </Label>
            <Input
              id="parentCompanyName"
              placeholder="Enter parent company name"
              {...register('parentCompanyName')}
              disabled={isLoading}
              className="h-10 rounded-lg border-gray-200 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]/20 transition-colors text-sm"
            />
          </div>

          {/* Parent Country */}
          <div className="space-y-1.5">
            <Label className="text-gray-700 font-medium text-sm">Parent Country</Label>
            <Select
              value={parentCountry}
              onValueChange={(value) => setValue('parentCountry', value)}
              disabled={isLoading}
            >
              <SelectTrigger className="h-10 rounded-lg border-gray-200 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]/20 text-sm">
                <div className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-gray-400" />
                  <SelectValue placeholder="Select country" />
                </div>
              </SelectTrigger>
              <SelectContent className="max-h-60">
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
      <div className="pt-2">
        <Button
          type="submit"
          disabled={isLoading || !hasFile}
          className="w-full h-11 bg-gradient-to-r from-[#1e3a5f] to-[#2a4a7f] hover:from-[#2a4a7f] hover:to-[#1e3a5f] text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload & Analyse
            </>
          )}
        </Button>
        {!hasFile && (
          <p className="text-xs text-gray-400 text-center mt-2">
            Select a PDF file to enable upload
          </p>
        )}
      </div>
    </form>
  );
}
