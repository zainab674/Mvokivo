# Database Setup Guide for Vokivo

This guide will help you create all necessary tables in your new Supabase database.

## Prerequisites

- Supabase account with a new project created
- Database credentials configured in `.env` file
- Supabase CLI installed (optional but recommended)

## Option 1: Using Supabase Dashboard (Recommended for Beginners)

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run Migrations in Order

You need to run all SQL migration files in chronological order. The files are located in `supabase/migrations/` directory.

**Important:** Run migrations in the exact order listed below:

1. First, create the base tables and functions
2. Then run all numbered migration files in order (sorted by timestamp)

### Step 3: Execute Each Migration

For each `.sql` file in `supabase/migrations/`:

1. Open the file in your code editor
2. Copy the entire SQL content
3. Paste it into the Supabase SQL Editor
4. Click **Run** or press `Ctrl+Enter`
5. Verify there are no errors before proceeding to the next file

### Migration Files Order

Run these files in this exact order:

```
1. 20250102000000_create_phone_number_table.sql
2. 20250103000000_create_user_twilio_credentials.sql
3. 20250103000001_create_call_history_table.sql
4. 20250103000001_make_trunk_sid_optional.sql
5. 20250103000002_add_unique_phone_number_constraint.sql
... (continue with all files in chronological order)
```

## Option 2: Using Supabase CLI (Recommended for Advanced Users)

### Step 1: Install Supabase CLI

```bash
npm install -g supabase
```

### Step 2: Link Your Project

```bash
supabase link --project-ref jtszkaghpynclwnnpquv
```

When prompted, enter your database password: `vokivo1122`

### Step 3: Run All Migrations

```bash
supabase db push
```

This will automatically run all migrations in the correct order.

## Option 3: Using PostgreSQL Client (psql)

### Step 1: Install PostgreSQL Client

Download and install from: https://www.postgresql.org/download/

### Step 2: Connect to Database

```bash
psql "postgresql://postgres:vokivo1122@db.jtszkaghpynclwnnpquv.supabase.co:5432/postgres"
```

### Step 3: Run Migration Script

We'll create a combined migration script for you.

## Option 4: Using the Combined Migration Script (Easiest)

I'll create a single SQL file that combines all migrations for you.

### Step 1: Use the Combined Script

1. Go to Supabase Dashboard → SQL Editor
2. Copy the content from `COMPLETE_SCHEMA.sql` (will be created next)
3. Paste and run in SQL Editor

## Verification

After running all migrations, verify your tables were created:

```sql
-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Count tables
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

## Expected Tables

Your database should have these main tables:

- `assistant` - AI assistant configurations
- `phone_number` - Phone number mappings
- `call_history` - Call records
- `sms_messages` - SMS message history
- `contacts` - Contact management
- `campaigns` - Campaign management
- `campaign_calls` - Campaign call tracking
- `knowledge_bases` - Knowledge base storage
- `knowledge_documents` - Document storage
- `user_twilio_credentials` - Twilio API credentials
- `user_whatsapp_credentials` - WhatsApp credentials
- `user_calendar_credentials` - Calendar integration
- `minutes_purchases` - Minutes purchase tracking
- `payment_methods` - Payment method storage
- And many more...

## Troubleshooting

### Error: "relation already exists"
- This means the table is already created. Skip that migration.

### Error: "function does not exist"
- Make sure you run migrations in order. Some migrations depend on functions created in earlier migrations.

### Error: "permission denied"
- Ensure you're using the service role key, not the anon key.

### Error: "foreign key constraint"
- Run migrations in chronological order. Some tables reference others.

## Next Steps

After setting up the database:

1. Restart your backend server: `npm run backend`
2. Restart your frontend: `npm run dev`
3. Test the application to ensure database connectivity

## Need Help?

If you encounter any issues:
1. Check the Supabase logs in Dashboard → Logs
2. Verify your `.env` file has correct credentials
3. Ensure all migrations ran successfully
