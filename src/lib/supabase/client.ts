'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

/**
 * Create a Supabase client for use in Client Components
 * This client runs in the browser and uses the anon key
 */
export const createClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

/**
 * Singleton instance for client-side use
 * Use this when you need a stable reference across renders
 */
let clientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null;

export const getClient = () => {
  if (!clientInstance) {
    clientInstance = createClient();
  }
  return clientInstance;
};
