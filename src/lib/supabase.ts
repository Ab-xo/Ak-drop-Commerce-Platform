import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseConfig } from '@/lib/supabase-config';

// Client-side Supabase client
export const createClient = () => {
  const { url, anonKey } = getSupabaseConfig();
  return createBrowserClient(url, anonKey);
};

// Types for our database
export interface UserProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: 'male' | 'female' | 'other' | null;
  address: Record<string, unknown> | null;
  preferences: Record<string, unknown> | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}