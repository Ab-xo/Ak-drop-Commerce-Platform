import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

function createUsername(email: string | undefined, fullName: string | null) {
  const base = (fullName || email?.split('@')[0] || 'member')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 12) || 'member';
  return `${base}_${crypto.randomUUID().slice(0, 6)}`.slice(0, 16);
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const nextParam = requestUrl.searchParams.get('next');
  const next = nextParam?.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/';
  const providerError = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  if (providerError) {
    return NextResponse.redirect(new URL(`/auth/signin?error=${encodeURIComponent(errorDescription || providerError)}`, request.url));
  }
  if (!code) return NextResponse.redirect(new URL('/auth/signin?error=Authentication%20was%20not%20completed', request.url));

  const cookieStore = await cookies();
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL(`/auth/signin?error=${encodeURIComponent('Unable to complete sign in. Please try again.')}`, request.url));

  if (data.user) {
    const metadata = data.user.user_metadata || {};
    const fullName = metadata.full_name || metadata.name || metadata.given_name || data.user.email?.split('@')[0] || null;
    const avatarUrl = metadata.avatar_url || metadata.picture || null;
    const { data: existingProfile } = await supabase.from('user_profiles').select('username').eq('id', data.user.id).maybeSingle();
    const profileData = {
      id: data.user.id,
      email: data.user.email,
      full_name: fullName,
      avatar_url: avatarUrl,
      phone: metadata.phone || metadata.phone_number || null,
      username: existingProfile?.username || createUsername(data.user.email, fullName),
      is_verified: true,
      is_active: true,
    };
    const { error: profileError } = await supabase.from('user_profiles').upsert(profileData, { onConflict: 'id' });
    if (profileError) console.error('OAuth profile upsert error:', profileError.message);
  }

  return NextResponse.redirect(new URL(next, request.url));
}
