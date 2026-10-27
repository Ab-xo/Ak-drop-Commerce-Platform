import { readFileSync } from 'fs';
import { resolve } from 'path';

// --- Parse .env.local manually (no dotenv dependency) ---
const envPath = resolve(process.cwd(), '.env.local');
let envVars = {};
try {
  const raw = readFileSync(envPath, 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    envVars[key] = value;
  }
} catch (err) {
  console.error('Could not read .env.local:', err.message);
  process.exit(1);
}

const SUPABASE_URL = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const SERVICE_ROLE_KEY = envVars['SUPABASE_SERVICE_ROLE_KEY'];

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const ADMIN_EMAIL = 'admin@akdrop.com';
const ADMIN_PASSWORD = 'AkDrop@Admin2026';
const ADMIN_NAME = 'AK Admin';

const headers = {
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  apikey: SERVICE_ROLE_KEY,
  'Content-Type': 'application/json',
};

async function main() {
  console.log('Creating admin user:', ADMIN_EMAIL);

  // Step 1: Create the user
  const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      app_metadata: { role: 'admin' },
      email_confirm: true,
    }),
  });

  const createBody = await createRes.json();
  let userId;

  if (createRes.status === 409 || createBody?.error_code === 'email_exists') {
    // User already exists — fetch them
    console.log('User already exists. Fetching existing user to update role...');
    const listRes = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(ADMIN_EMAIL)}`,
      { headers }
    );
    const listBody = await listRes.json();
    const existingUser = Array.isArray(listBody?.users) ? listBody.users[0] : null;

    if (!existingUser?.id) {
      console.error('Could not find existing user:', JSON.stringify(listBody));
      process.exit(1);
    }
    userId = existingUser.id;

    // Update app_metadata
    const updateRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ app_metadata: { role: 'admin' } }),
    });
    const updateBody = await updateRes.json();
    if (!updateRes.ok) {
      console.error('Failed to update app_metadata:', JSON.stringify(updateBody));
      process.exit(1);
    }
    console.log('app_metadata.role set to admin for existing user.');
  } else if (!createRes.ok) {
    console.error('Failed to create user:', JSON.stringify(createBody));
    process.exit(1);
  } else {
    userId = createBody.id;
    console.log('User created with id:', userId);
  }

  // Step 2: Upsert user_profiles row
  const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?on_conflict=id`, {
    method: 'POST',
    headers: {
      ...headers,
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      id: userId,
      full_name: ADMIN_NAME,
      email: ADMIN_EMAIL,
    }),
  });

  if (!profileRes.ok) {
    const profileBody = await profileRes.text();
    console.warn('user_profiles upsert warning (non-fatal):', profileBody);
  } else {
    console.log('user_profiles row upserted.');
  }

  console.log('\n=== Admin credentials ===');
  console.log('  Email   :', ADMIN_EMAIL);
  console.log('  Password:', ADMIN_PASSWORD);
  console.log('  Role    : admin (app_metadata)');
  console.log('  User ID :', userId);
  console.log('========================\n');
  console.log('Done. You can now log in at /admin with the credentials above.');
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
