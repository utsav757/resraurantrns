import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STAFF_EMAIL = process.env.STAFF_EMAIL || 'staff@restaurant.local';
const STAFF_PASSWORD = process.env.STAFF_PASSWORD || 'Staff1234!';
const STAFF_FULL_NAME = process.env.STAFF_FULL_NAME || 'Staff Member';

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

async function ensureStaff() {
  console.log('Creating or updating staff account...');

  let userId = null;

  try {
    const listResult = await supabase.auth.admin.listUsers({ query: STAFF_EMAIL });
    if (listResult.error) {
      throw listResult.error;
    }
    const existing = listResult.data?.users?.find((user) => user.email === STAFF_EMAIL);
    if (existing) {
      userId = existing.id;
      console.log(`Found existing user with email ${STAFF_EMAIL}.`);
    }
  } catch (error) {
    console.warn('Could not list users. Attempting to create or retrieve user by email.');
  }

  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: STAFF_EMAIL,
      password: STAFF_PASSWORD,
      user_metadata: { full_name: STAFF_FULL_NAME },
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
      console.log(`Created user ${STAFF_EMAIL} (${userId}).`);
    }
  }

  if (!userId) {
    const lookup = await supabase.auth.admin.listUsers({ query: STAFF_EMAIL });
    if (lookup.error) throw lookup.error;
    const found = lookup.data?.users?.find((user) => user.email === STAFF_EMAIL);
    if (!found) {
      throw new Error('Unable to find or create the staff user.');
    }
    userId = found.id;
  }

  const { error: roleError } = await supabase
    .from('user_roles')
    .upsert({ user_id: userId, role: 'staff' }, { onConflict: 'user_id,role' });

  if (roleError) throw roleError;

  console.log('Staff role assigned successfully.');
  console.log('Credentials:');
  console.log(`  Email: ${STAFF_EMAIL}`);
  console.log(`  Password: ${STAFF_PASSWORD}`);
  console.log('Use the standard app login page to sign in.');
}

ensureStaff().catch((error) => {
  console.error('Failed to create staff account:', error);
  process.exit(1);
});
