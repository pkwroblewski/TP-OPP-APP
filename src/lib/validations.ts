import { z } from 'zod';

// Authentication schemas
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Company schemas
export const companySchema = z.object({
  rcs_number: z
    .string()
    .min(1, 'RCS number is required')
    .regex(/^B\d+$/, 'RCS number must start with B followed by numbers'),
  company_name: z
    .string()
    .min(1, 'Company name is required')
    .max(255, 'Company name is too long'),
  legal_form: z.string().optional(),
  address: z.string().optional(),
  parent_company_name: z.string().optional(),
  parent_country_code: z
    .string()
    .length(2, 'Country code must be 2 characters')
    .optional()
    .or(z.literal('')),
});

// Filing schemas
export const filingSchema = z.object({
  fiscal_year: z
    .number()
    .min(1990, 'Year must be 1990 or later')
    .max(new Date().getFullYear(), 'Year cannot be in the future'),
  pdf_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
});

// Opportunity schemas
export const opportunitySchema = z.object({
  status: z.enum(['identified', 'contacted', 'meeting_scheduled', 'proposal_sent', 'won', 'lost']),
  outreach_notes: z.string().max(2000, 'Notes are too long').optional(),
  next_action: z.string().max(500, 'Next action is too long').optional(),
  next_action_date: z.string().optional(),
});

// Settings schemas
export const profileSchema = z.object({
  full_name: z
    .string()
    .min(1, 'Full name is required')
    .max(100, 'Name is too long'),
  email: z.string().email('Please enter a valid email address'),
  company: z.string().max(100, 'Company name is too long').optional(),
  role: z.string().max(50, 'Role is too long').optional(),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Passwords do not match',
  path: ['confirmNewPassword'],
});

export const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  newOpportunities: z.boolean(),
  weeklyDigest: z.boolean(),
  processingAlerts: z.boolean(),
});

// Upload/Search schemas
export const searchSchema = z.object({
  query: z
    .string()
    .min(2, 'Search query must be at least 2 characters')
    .max(100, 'Search query is too long'),
});

export const uploadSchema = z.object({
  rcsNumber: z
    .string()
    .min(1, 'RCS number is required')
    .regex(/^B\d+$/, 'RCS number must start with B followed by numbers'),
  fiscalYear: z
    .number()
    .min(1990, 'Year must be 1990 or later')
    .max(new Date().getFullYear(), 'Year cannot be in the future'),
  file: z.instanceof(File, { message: 'Please select a PDF file' })
    .refine((file) => file.type === 'application/pdf', 'File must be a PDF')
    .refine((file) => file.size <= 50 * 1024 * 1024, 'File must be less than 50MB'),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type CompanyInput = z.infer<typeof companySchema>;
export type FilingInput = z.infer<typeof filingSchema>;
export type OpportunityInput = z.infer<typeof opportunitySchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
export type NotificationSettingsInput = z.infer<typeof notificationSettingsSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type UploadInput = z.infer<typeof uploadSchema>;

// Validation helper function
export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
} {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    errors[path] = issue.message;
  });

  return { success: false, errors };
}
