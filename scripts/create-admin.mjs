import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'admin@restaurant.local';
const ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'Admin1234!';
const ADMIN_FULL_NAME = process.env.SUPER_ADMIN_FULL_NAME || 'Super Admin';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables.');
  console.error('Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this script.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    storage: null,
  },
});

async function ensureAdmin() {
  console.log('Creating or updating super admin account...');

  let userId = null;

  try {
    const listResult = await supabase.auth.admin.listUsers({ query: ADMIN_EMAIL });
    if (listResult.error) {
      throw listResult.error;
    }
    const existing = listResult.data?.users?.find((user) => user.email === ADMIN_EMAIL);
    if (existing) {
      userId = existing.id;
      console.log(`Found existing user with email ${ADMIN_EMAIL}.`);
    }
  } catch (error) {
    console.warn('Could not list users. Attempting to create or retrieve user by email.');
  }

  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      user_metadata: { full_name: ADMIN_FULL_NAME },
      email_confirm: true,
    });

    if (error) {
      if (error.message?.includes('duplicate key')) {
        console.warn('User already exists, attempting to look up by email.');
      } else {
        throw error;
      }
    } else {
      userId = data.user.id;
      console.log(`Created user ${ADMIN_EMAIL} (${userId}).`);
    }
  }

  if (!userId) {
    const lookup = await supabase.auth.admin.listUsers({ query: ADMIN_EMAIL });
    if (lookup.error) throw lookup.error;
    const found = lookup.data?.users?.find((user) => user.email === ADMIN_EMAIL);
    if (!found) {
      throw new Error('Unable to find or create the admin user.');
    }
    userId = found.id;
  }

  const { error: roleError } = await supabase
    .from('user_roles')
    .upsert({ user_id: userId, role: 'admin' }, { onConflict: ['user_id'] });

  if (roleError) throw roleError;

  console.log('Super admin role assigned successfully.');
  console.log('Credentials:');
  console.log(`  Email: ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log('Use the standard app login page to sign in.');
}

ensureAdmin().catch((error) => {
  console.error('Failed to create super admin:', error);
  process.exit(1);
});
