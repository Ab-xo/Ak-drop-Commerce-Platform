'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase-server';

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export type AdminLoginState = { error: string | null };

export async function signInAdmin(
  _previousState: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const credentials = credentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!credentials.success) {
    return { error: 'Enter a valid email address and password.' };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword(credentials.data);

  if (signInError) {
    return { error: 'Invalid email or password. Please try again.' };
  }

  const { data: { user }, error: identityError } = await supabase.auth.getUser();
  if (identityError) {
    console.error('Admin sign-in identity verification failed:', identityError.message);
    return { error: 'We could not verify this account. Please try again.' };
  }

  if (user?.app_metadata?.role !== 'admin') {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error('Non-admin session cleanup failed:', signOutError.message);
    }
    return { error: 'This account is not authorized for the admin workspace.' };
  }

  redirect('/admin');
}
