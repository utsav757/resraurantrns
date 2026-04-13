# Welcome to your Lovable project

This project uses Supabase authentication and role-based access control.

## Create a super admin user

A helper script is provided to create or update an admin account.

1. Add your Supabase service role key to the environment:

```env
VITE_SUPABASE_URL="https://<your-project>.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="<your-service-role-key>"
SUPER_ADMIN_EMAIL="admin@restaurant.local"
SUPER_ADMIN_PASSWORD="Admin1234!"
SUPER_ADMIN_FULL_NAME="Super Admin"
```

2. Run:

```bash
npm run create-admin
```

This will create the admin user and assign the `admin` role.
