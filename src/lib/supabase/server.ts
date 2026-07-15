import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceKey, getSupabaseUrl } from "./env";

export function createServerSupabaseClient() {
  const supabaseUrl = getSupabaseUrl();
  const supabaseServiceRoleKey = getSupabaseServiceKey();

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
