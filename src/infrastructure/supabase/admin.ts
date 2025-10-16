import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Admin Client
 *
 * ⚠️ SECURITY: Only use this in Server Actions, API Routes, or Server Components
 * NEVER expose SUPABASE_SERVICE_ROLE_KEY to the client
 *
 * Usage:
 * - Operations requiring admin privileges (delete auth users)
 * - Sensitive database transactions
 * - Never in client components
 *
 * @throws Error if environment variables are missing
 * @returns Supabase client with admin permissions
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
