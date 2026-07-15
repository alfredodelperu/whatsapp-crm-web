import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicKey, getSupabaseUrl } from "./env";

export function createBrowserSupabaseClient() {
  const supabaseUrl = getSupabaseUrl();
  const supabasePublicKey = getSupabasePublicKey();

  if (!supabaseUrl || !supabasePublicKey) {
    return null;
  }

  return createClient(supabaseUrl, supabasePublicKey);
}
