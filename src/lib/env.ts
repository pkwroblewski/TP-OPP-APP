/**
 * Environment configuration with runtime validation
 * Validates that all required environment variables are set
 */

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

const serverRequiredEnvVars = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'ANTHROPIC_API_KEY',
] as const;

// Type exports for external use if needed
export type RequiredEnvVar = (typeof requiredEnvVars)[number];
export type ServerRequiredEnvVar = (typeof serverRequiredEnvVars)[number];

interface Env {
  // Public (available on client and server)
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  NEXT_PUBLIC_APP_URL: string;

  // Server-only
  SUPABASE_SERVICE_ROLE_KEY: string;
  ANTHROPIC_API_KEY: string;
}

function getEnvVar(key: string): string | undefined {
  return process.env[key];
}

function validatePublicEnv(): void {
  const missing: string[] = [];

  for (const key of requiredEnvVars) {
    if (!getEnvVar(key)) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please check your .env.local file.`
    );
  }
}

function validateServerEnv(): void {
  // Only validate on server
  if (typeof window !== 'undefined') {
    return;
  }

  const missing: string[] = [];

  for (const key of serverRequiredEnvVars) {
    if (!getEnvVar(key)) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.warn(
      `Missing server environment variables: ${missing.join(', ')}\n` +
      `Some features may not work correctly.`
    );
  }
}

/**
 * Get environment configuration
 * Call this to access typed environment variables
 */
export function getEnv(): Env {
  return {
    NEXT_PUBLIC_SUPABASE_URL: getEnvVar('NEXT_PUBLIC_SUPABASE_URL') || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') || '',
    NEXT_PUBLIC_APP_URL: getEnvVar('NEXT_PUBLIC_APP_URL') || 'http://localhost:3000',
    SUPABASE_SERVICE_ROLE_KEY: getEnvVar('SUPABASE_SERVICE_ROLE_KEY') || '',
    ANTHROPIC_API_KEY: getEnvVar('ANTHROPIC_API_KEY') || '',
  };
}

/**
 * Validate environment on app startup
 * Call this in your root layout or _app
 */
export function validateEnv(): void {
  try {
    validatePublicEnv();
    validateServerEnv();
  } catch (error) {
    // In development, log the error but don't crash
    if (process.env.NODE_ENV === 'development') {
      console.error('Environment validation error:', error);
    } else {
      throw error;
    }
  }
}

// Export individual env vars for convenience
export const env = {
  get supabaseUrl(): string {
    return getEnvVar('NEXT_PUBLIC_SUPABASE_URL') || '';
  },
  get supabaseAnonKey(): string {
    return getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') || '';
  },
  get supabaseServiceRoleKey(): string {
    return getEnvVar('SUPABASE_SERVICE_ROLE_KEY') || '';
  },
  get anthropicApiKey(): string {
    return getEnvVar('ANTHROPIC_API_KEY') || '';
  },
  get appUrl(): string {
    return getEnvVar('NEXT_PUBLIC_APP_URL') || 'http://localhost:3000';
  },
  get isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  },
  get isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  },
};
