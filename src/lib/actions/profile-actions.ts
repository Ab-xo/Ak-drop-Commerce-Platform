'use server';

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function updateProfile(data: {
  full_name: string;
  username: string;
  phone: string;
  date_of_birth: string;
  gender: string;
}) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: 'Not authenticated' };
    }

    // Upsert user profile to ensure it creates if missing
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        id: user.id, // Primary key column
        email: user.email,
        full_name: data.full_name,
        username: data.username,
        phone: data.phone,
        date_of_birth: data.date_of_birth || null,
        gender: data.gender || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (error) {
      console.error('Profile upsert error:', error);
      return { error: error.message };
    }

    revalidatePath('/account');
    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    return { error: err.message || 'Failed to update profile' };
  }
}
