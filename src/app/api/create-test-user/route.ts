import { createClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = createClient();
    
    const email = 'gebeyehuabraham19@gmail.com';
    const password = 'Test123456!';
    const fullName = 'Gebeyehu Abraham';
    const username = 'gebeyehu_test';

    // Sign up the user
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName,
          username: username,
        },
        emailRedirectTo: 'http://localhost:3000',
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        return NextResponse.json({
          success: true,
          message: 'User already exists! You can sign in now.',
          credentials: {
            email: email,
            password: password,
          },
        });
      }
      
      return NextResponse.json({
        success: false,
        error: error.message,
      }, { status: 400 });
    }

    // Update user profile with username
    if (data.user) {
      await supabase
        .from('user_profiles')
        .update({ username: username })
        .eq('id', data.user.id);
    }

    return NextResponse.json({
      success: true,
      message: 'Test user created successfully!',
      credentials: {
        email: email,
        password: password,
        username: username,
      },
      user: data.user ? {
        id: data.user.id,
        email: data.user.email,
      } : null,
      note: 'Check your email to verify your account (or check spam folder)',
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

// Also allow GET for easy browser testing
export async function GET() {
  return POST();
}
