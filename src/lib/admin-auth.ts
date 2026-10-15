import 'server-only';

import { createClient } from '@/lib/supabase-server';

export async function getServerVerifiedAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error && error.message !== 'Auth session missing!') {
    console.error('Admin identity verification failed:', error.message);
    throw new Error('Unable to verify admin access.');
  }

  if (user?.app_metadata?.role !== 'admin') return null;
  return user;
}
