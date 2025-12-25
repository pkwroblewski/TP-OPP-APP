import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/**
 * Create an admin Supabase client that bypasses RLS
 * ONLY use this server-side for operations that need elevated privileges
 * NEVER import this in client code
 */
export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY environment variable. ' +
      'Admin client can only be used server-side with the service role key.'
    );
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

/**
 * Singleton admin client instance
 * Use this when you need a stable reference
 */
let adminInstance: ReturnType<typeof createClient<Database>> | null = null;

export const getAdminClient = () => {
  if (!adminInstance) {
    adminInstance = createAdminClient();
  }
  return adminInstance;
};
