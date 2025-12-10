# Supabase Database Migration Guide

## Migration Completed ✅

Your application has been successfully migrated from SQLite to Supabase PostgreSQL database.

## What Changed

1. **Database Client**: Replaced `better-sqlite3` with `@supabase/supabase-js`
2. **Database Operations**: All operations are now async (Promises)
3. **Environment Variables**: Added Supabase credentials to `.env.local`

## Next Steps

### 1. Create the Database Table in Supabase

1. Go to your Supabase Dashboard: https://vsbkgqjeiidnueyxokhs.supabase.co
2. Navigate to **SQL Editor**
3. Run the SQL script from `supabase-schema.sql`

**Or copy and paste this:**

```sql
-- Supabase Migration Schema
CREATE TABLE IF NOT EXISTS whitelist_requests (
  id BIGSERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  email TEXT,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
  tx_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_status ON whitelist_requests(status);
CREATE INDEX IF NOT EXISTS idx_wallet_address ON whitelist_requests(wallet_address);
CREATE INDEX IF NOT EXISTS idx_created_at ON whitelist_requests(created_at DESC);

ALTER TABLE whitelist_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON whitelist_requests
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON whitelist_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON whitelist_requests
  FOR UPDATE USING (true);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_whitelist_requests_updated_at
  BEFORE UPDATE ON whitelist_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 2. Configure Vercel Environment Variables

Add these to your Vercel project settings:

1. Go to your Vercel project
2. Navigate to **Settings > Environment Variables**
3. Add the following:

```
NEXT_PUBLIC_SUPABASE_URL=https://vsbkgqjeiidnueyxokhs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzYmtncWplaWlkbnVleXhva2hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNjI5NjcsImV4cCI6MjA4MDkzODk2N30._uUs5dkIgdaMJdSUOs0YI7YKOyXaTCujMaa0PMGHD7g
```

4. Redeploy your application

### 3. Test Locally

```bash
npm run dev
```

Visit your application and test:
- Submitting a whitelist request
- Viewing requests in the admin dashboard
- Approving/rejecting requests

### 4. Deploy to Vercel

```bash
git add .
git commit -m "Migrate from SQLite to Supabase"
git push
```

Or redeploy through Vercel dashboard.

## Files Modified

- ✅ `lib/db.ts` - Migrated to Supabase client
- ✅ `app/api/whitelist/request/route.ts` - Added async/await
- ✅ `app/api/whitelist/admin/route.ts` - Added async/await
- ✅ `app/api/whitelist/admin/[id]/route.ts` - Added async/await
- ✅ `.env.local` - Added Supabase credentials
- ✅ `.env.example` - Updated with Supabase env vars

## Files You Can Remove (Optional)

- `whitelist-requests.db` - Old SQLite database file
- `whitelist-requests.db-shm` - SQLite shared memory file
- `whitelist-requests.db-wal` - SQLite write-ahead log file

**Note:** You can keep the old SQLite database as a backup before removing it.

## Database Schema Comparison

### SQLite (Old)
- Integer timestamps (Unix epoch)
- Synchronous operations
- File-based storage
- Not compatible with Vercel serverless

### Supabase PostgreSQL (New)
- TIMESTAMPTZ (PostgreSQL timestamps with timezone)
- Asynchronous operations (Promises)
- Cloud-hosted database
- Fully compatible with Vercel serverless
- Row Level Security (RLS) enabled
- Auto-updating timestamps via triggers

## Troubleshooting

### Error: "Missing Supabase environment variables"
- Check that `.env.local` contains the Supabase credentials
- Restart your development server

### Error connecting to Supabase
- Verify your Supabase project is active
- Check the URL and API key are correct
- Ensure you've run the SQL schema in Supabase

### Database operations failing
- Make sure the table was created successfully in Supabase
- Check Row Level Security policies are configured correctly
- Verify all API routes are using `await` for database operations
