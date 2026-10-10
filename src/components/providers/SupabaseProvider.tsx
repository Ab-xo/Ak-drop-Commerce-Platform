'use client';

import { useEffect, useState } from 'react';
import SupabaseSetup from '@/components/setup/SupabaseSetup';

interface SupabaseProviderProps {
  children: React.ReactNode;
}

export default function SupabaseProvider({ children }: SupabaseProviderProps) {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkSupabaseConfig = () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const configured = !!(
        supabaseUrl && 
        supabaseAnonKey && 
        supabaseUrl !== 'your_supabase_project_url_here' && 
        supabaseAnonKey !== 'your_supabase_anon_key_here' &&
        supabaseUrl.startsWith('http')
      );

      setIsConfigured(configured);
      setIsChecking(false);
    };

    checkSupabaseConfig();
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isConfigured) {
    return <SupabaseSetup />;
  }

  return <>{children}</>;
}