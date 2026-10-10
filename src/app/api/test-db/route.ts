import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Test 1: Check connection
    const { data: testConnection, error: connectionError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);

    if (connectionError) {
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: connectionError.message,
      }, { status: 500 });
    }

    // Test 2: Get auth user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // Test 3: Count users
    const { count, error: countError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful!',
      tests: {
        connection: connectionError ? 'FAILED' : 'PASSED',
        authentication: user ? 'LOGGED_IN' : 'NOT_LOGGED_IN',
        userCount: count !== null ? count : 'N/A',
      },
      currentUser: user ? {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      } : null,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error.message,
    }, { status: 500 });
  }
}
