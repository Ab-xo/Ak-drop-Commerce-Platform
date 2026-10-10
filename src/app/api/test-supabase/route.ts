import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    return NextResponse.json({
      success: true,
      config: {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
        url: supabaseUrl,
        keyLength: supabaseKey?.length || 0,
        keyPreview: supabaseKey?.substring(0, 20) + '...',
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
