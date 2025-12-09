# Quick Database Setup Guide

After updating your `types.ts` file, you need to create the corresponding tables in your Supabase database.

## 🚀 Option 1: Using Supabase CLI (Fastest & Recommended)

### Step 1: Install Supabase CLI (if not already installed)
```powershell
npm install -g supabase
```

### Step 2: Link your project
```powershell
supabase link --project-ref jtszkaghpynclwnnpquv
```
When prompted, enter your database password.

### Step 3: Push all migrations
```powershell
supabase db push
```

This will automatically run all migrations in the correct order! ✅

---

## 📋 Option 2: Using Supabase Dashboard (No CLI needed)

### Step 1: Combine all migrations into one file
Run this PowerShell script in your project root:
```powershell
.\combine-migrations.ps1
```

This creates `COMPLETE_SCHEMA.sql` with all migrations combined.

### Step 2: Run in Supabase Dashboard
1. Go to https://supabase.com/dashboard/project/jtszkaghpynclwnnpquv
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Open `COMPLETE_SCHEMA.sql` from your project
5. Copy the entire content
6. Paste into the SQL Editor
7. Click **Run** (or press `Ctrl+Enter`)

---

## 🔍 Option 3: Run Migrations One by One

If you prefer to run migrations individually:

1. Go to Supabase Dashboard → SQL Editor
2. Open each file from `supabase/migrations/` in **chronological order** (sorted by filename)
3. Copy and paste each migration into SQL Editor
4. Run each one before moving to the next

**Important:** Run them in filename order (the timestamps ensure correct order).

---

## ✅ Verify Tables Were Created

After running migrations, verify in Supabase SQL Editor:

```sql
-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- You should see tables like:
-- agencies, appointments, assistant, call_history, 
-- call_logs, locations, sms_messages, users, etc.
```

---

## 🔄 Regenerate Types After Database Changes

If you make changes directly in Supabase Dashboard, regenerate your types:

```powershell
supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

---

## ⚠️ Troubleshooting

### "relation already exists"
- The table already exists. You can skip that migration or use `CREATE TABLE IF NOT EXISTS` (if the migration supports it).

### "permission denied"
- Make sure you're using the correct database credentials in your `.env` file.

### "foreign key constraint fails"
- Make sure you're running migrations in chronological order (by filename).

---

## 📝 Note

Your `types.ts` file is typically **generated FROM** your database schema, not the other way around. If you manually edited `types.ts`, make sure your database schema matches, or regenerate types from the database.



