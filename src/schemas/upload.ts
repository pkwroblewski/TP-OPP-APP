import { z } from 'zod';

// Legal forms available in Luxembourg
export const legalForms = [
  { value: 'SA', label: 'SA - Société Anonyme' },
  { value: 'SARL', label: 'SARL - Société à Responsabilité Limitée' },
  { value: 'SCS', label: 'SCS - Société en Commandite Simple' },
  { value: 'SCA', label: 'SCA - Société en Commandite par Actions' },
  { value: 'SE', label: 'SE - Société Européenne' },
  { value: 'SNC', label: 'SNC - Société en Nom Collectif' },
  { value: 'BRANCH', label: 'Branch Office' },
  { value: 'OTHER', label: 'Other' },
] as const;

// Fiscal years available for selection
export const fiscalYears = [
  { value: '2024', label: '2024' },
  { value: '2023', label: '2023' },
  { value: '2022', label: '2022' },
  { value: '2021', label: '2021' },
  { value: '2020', label: '2020' },
] as const;

// Common parent countries
export const countries = [
  { value: 'LU', label: 'Luxembourg' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'BE', label: 'Belgium' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'US', label: 'United States' },
  { value: 'CH', label: 'Switzerland' },
  { value: 'IT', label: 'Italy' },
  { value: 'ES', label: 'Spain' },
  { value: 'AT', label: 'Austria' },
  { value: 'IE', label: 'Ireland' },
  { value: 'SE', label: 'Sweden' },
  { value: 'DK', label: 'Denmark' },
  { value: 'NO', label: 'Norway' },
  { value: 'FI', label: 'Finland' },
  { value: 'PL', label: 'Poland' },
  { value: 'CZ', label: 'Czech Republic' },
  { value: 'PT', label: 'Portugal' },
  { value: 'JP', label: 'Japan' },
  { value: 'CN', label: 'China' },
  { value: 'SG', label: 'Singapore' },
  { value: 'HK', label: 'Hong Kong' },
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'OTHER', label: 'Other' },
] as const;

// RCS Number validation pattern (B followed by digits)
const rcsPattern = /^B\d+$/i;

// File upload metadata schema - all fields optional for auto-detection
export const uploadMetadataSchema = z.object({
  rcsNumber: z
    .string()
    .regex(rcsPattern, 'RCS number must start with B followed by digits (e.g., B123456)')
    .optional()
    .or(z.literal('')),
  companyName: z
    .string()
    .min(2, 'Company name must be at least 2 characters')
    .optional()
    .or(z.literal('')),
  fiscalYear: z
    .string()
    .optional()
    .or(z.literal('')),
  legalForm: z
    .string()
    .optional()
    .or(z.literal('')),
  parentCompanyName: z
    .string()
    .optional()
    .or(z.literal('')),
  parentCountry: z
    .string()
    .optional()
    .or(z.literal('')),
});

export type UploadMetadata = z.infer<typeof uploadMetadataSchema>;

// File validation constants
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const ACCEPTED_FILE_TYPES = ['application/pdf'];
export const ACCEPTED_FILE_EXTENSIONS = ['.pdf'];
