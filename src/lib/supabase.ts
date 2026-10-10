import { createBrowserClient } from '@supabase/ssr';

// Client-side Supabase client
export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.'
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
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
  address: any;
  preferences: any;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}