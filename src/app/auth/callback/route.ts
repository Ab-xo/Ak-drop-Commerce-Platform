import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/';
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

  // Handle OAuth provider errors
  if (error) {
    console.error('OAuth provider error:', error, error_description);
    return NextResponse.redirect(
      new URL(
        `/auth/signin?error=${encodeURIComponent(error_description || error)}`,
        request.url
      )
    );
  }

  if (code) {
    const cookieStore = await cookies();

    // Create a response so we can mutate cookies on it
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Code exchange error:', exchangeError.message);
      return NextResponse.redirect(
        new URL(
          `/auth/signin?error=${encodeURIComponent(exchangeError.message)}`,
          request.url
        )
      );
    }

    // Ensure a profile row exists for this user (especially for Google OAuth)
    if (data?.user) {
      console.log('Google OAuth user metadata:', JSON.stringify(data.user.user_metadata, null, 2));
      
      // Extract comprehensive user data from Google OAuth
      const metadata = data.user.user_metadata || {};
      
      // Full name - try multiple sources
      const fullName = 
        metadata.full_name ||
        metadata.name ||
        (metadata.given_name && metadata.family_name 
          ? `${metadata.given_name} ${metadata.family_name}` 
          : null) ||
        metadata.given_name ||
        data.user.email?.split('@')[0];
      
      // Avatar URL - Google uses 'picture'
      const avatarUrl =
        metadata.avatar_url ||
        metadata.picture ||
        null;
      
      // Phone number if provided
      const phone = metadata.phone || metadata.phone_number || null;
      
      // Generate username from email or name
      const username = 
        metadata.preferred_username ||
        metadata.username ||
        fullName?.toLowerCase().replace(/\s+/g, '') ||
        data.user.email?.split('@')[0];

      // Profile data to upsert
      const profileData = {
        id: data.user.id,
        email: data.user.email,
        full_name: fullName,
        avatar_url: avatarUrl,
        phone: phone,
        username: username,
        is_verified: true,  // OAuth users are pre-verified by provider
        is_active: true,
      };

      console.log('Upserting profile with data:', JSON.stringify(profileData, null, 2));

      const { error: upsertError } = await supabase
        .from('user_profiles')
        .upsert(profileData, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });
      
      if (upsertError) {
        console.error('OAuth profile upsert error:', upsertError.message);
      } else {
        console.log('✅ Profile created/updated successfully for:', data.user.email);
      }
    }

    return NextResponse.redirect(new URL(next, request.url));
  }

  // No code — redirect to sign in
  return NextResponse.redirect(new URL('/auth/signin', request.url));
}
