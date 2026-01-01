/// <reference types="vite/client" />
import { createClient } from "@supabase/supabase-js";

// For Vite projects, use import.meta.env
// The VITE_ prefix is required for Vite to expose these variables to the client
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://placeholder-project.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder-key";

/**
 * Supabase client initialization
 * Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are in your .env file
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
