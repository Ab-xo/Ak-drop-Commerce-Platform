import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readLocalEnvironment() {
  const envPath = resolve(process.cwd(), '.env.local');
  const values = {};

  try {
    for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const separator = trimmed.indexOf('=');
      if (separator < 0) continue;

      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
      values[key] = value;
    }
  } catch {
    throw new Error('Could not read .env.local. Create it from .env.example and retry.');
  }

  return values;
}

function readHiddenInput(prompt) {
  const { stdin, stdout } = process;
  if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
    throw new Error('Run this script from an interactive terminal to enter the admin password securely.');
  }

  stdout.write(prompt);
  stdin.setRawMode(true);
  stdin.resume();

  return new Promise((resolveInput, rejectInput) => {
    const bytes = [];

    function finish(error) {
      stdin.off('data', onData);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write('\n');
      if (error) rejectInput(error);
      else resolveInput(Buffer.from(bytes).toString('utf8'));
    }

    function onData(chunk) {
      for (const byte of chunk) {
        if (byte === 3) {
          finish(new Error('Password entry cancelled.'));
          return;
        }
        if (byte === 13 || byte === 10) {
          finish();
          return;
        }
        if (byte === 8 || byte === 127) {
          if (bytes.length > 0) {
            do {
              bytes.pop();
            } while (bytes.length > 0 && (bytes[bytes.length - 1] & 0xc0) === 0x80);
            stdout.write('\b \b');
          }
          continue;
        }
        if (byte >= 32 && byte !== 127) {
          bytes.push(byte);
          if ((byte & 0xc0) !== 0x80) stdout.write('*');
        }
      }
    }

    stdin.on('data', onData);
  });
}

async function requestJson(url, options, action) {
  const response = await fetch(url, options);
  let body;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok) {
    throw new Error(`${action} failed (HTTP ${response.status}).`);
  }
  return body;
}

async function main() {
  const envVars = readLocalEnvironment();
  const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
  const adminEmail = envVars.ADMIN_EMAIL?.trim().toLowerCase();
  const adminName = envVars.ADMIN_NAME?.trim() || 'AK Drop Admin';

  if (!supabaseUrl || !serviceRoleKey || !adminEmail) {
    throw new Error('Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and ADMIN_EMAIL in .env.local.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
    throw new Error('ADMIN_EMAIL must be a valid email address.');
  }

  const parsedUrl = new URL(supabaseUrl);
  if (parsedUrl.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(parsedUrl.hostname)) {
    throw new Error('Use HTTPS for the Supabase URL, except when using a local development instance.');
  }

  const headers = {
    Authorization: `Bearer ${serviceRoleKey}`,
    apikey: serviceRoleKey,
    'Content-Type': 'application/json',
  };
  const usersUrl = new URL('/auth/v1/admin/users', parsedUrl);
  usersUrl.searchParams.set('email', adminEmail);
  const users = await requestJson(usersUrl, { headers }, 'Admin account lookup');
  const existingUser = Array.isArray(users?.users)
    ? users.users.find((user) => user.email?.toLowerCase() === adminEmail)
    : null;

  let userId;
  if (existingUser?.id) {
    userId = existingUser.id;
    await requestJson(
      new URL(`/auth/v1/admin/users/${encodeURIComponent(userId)}`, parsedUrl),
      {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          app_metadata: { ...existingUser.app_metadata, role: 'admin' },
        }),
      },
      'Admin role update',
    );
    console.log('Admin role granted to the existing account. Its password was not changed.');
  } else {
    const password = await readHiddenInput('Enter a new admin password (minimum 16 characters): ');
    const confirmation = await readHiddenInput('Confirm the new admin password: ');
    if (password.length < 16) {
      throw new Error('Choose a password with at least 16 characters.');
    }
    if (password !== confirmation) {
      throw new Error('The passwords did not match. No admin account was created.');
    }

    const createdUser = await requestJson(
      new URL('/auth/v1/admin/users', parsedUrl),
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: adminEmail,
          password,
          user_metadata: { full_name: adminName },
          app_metadata: { role: 'admin' },
          email_confirm: true,
        }),
      },
      'Admin account creation',
    );
    if (typeof createdUser?.id !== 'string') {
      throw new Error('Supabase did not return the new admin account ID.');
    }
    userId = createdUser.id;
    console.log('Admin account created.');
  }

  const profileUrl = new URL('/rest/v1/user_profiles', parsedUrl);
  profileUrl.searchParams.set('on_conflict', 'id');
  const profileResponse = await fetch(profileUrl, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({
      id: userId,
      full_name: adminName,
      email: adminEmail,
    }),
  });
  if (!profileResponse.ok) {
    throw new Error(`Admin profile setup failed (HTTP ${profileResponse.status}).`);
  }

  console.log('Admin profile setup completed. No password or service key was printed.');
}

main().catch((error) => {
  console.error('Admin provisioning failed:', error instanceof Error ? error.message : 'Unexpected error.');
  process.exitCode = 1;
});
