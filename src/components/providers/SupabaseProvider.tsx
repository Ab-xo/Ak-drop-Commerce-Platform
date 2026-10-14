'use client';

import SupabaseSetup from '@/components/setup/SupabaseSetup';
import { isSupabaseConfigured } from '@/lib/supabase-config';

interface SupabaseProviderProps {
  children: React.ReactNode;
}

export default function SupabaseProvider({ children }: SupabaseProviderProps) {
  if (!isSupabaseConfigured()) {
    return <SupabaseSetup />;
  }

  return <>{children}</>;
}