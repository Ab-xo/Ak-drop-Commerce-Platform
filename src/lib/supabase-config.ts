export type SupabaseConfig = {
  url: string;
  anonKey: string;
};

const setupError =
  "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local to values from your Supabase project's API settings, then restart the Next.js dev server.";

export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey || /your-project-id|placeholder|<|>/i.test(url) || /^(your|replace|paste|<)/i.test(anonKey)) {
    throw new Error(setupError);
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error(setupError);
  }

  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    throw new Error(setupError);
  }

  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  try {
    getSupabaseConfig();
    return true;
  } catch {
    return false;
  }
}
