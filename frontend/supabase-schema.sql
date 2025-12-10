-- Supabase Migration Schema
-- Run this SQL in your Supabase SQL Editor to create the whitelist_requests table

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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_status ON whitelist_requests(status);
CREATE INDEX IF NOT EXISTS idx_wallet_address ON whitelist_requests(wallet_address);
CREATE INDEX IF NOT EXISTS idx_created_at ON whitelist_requests(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE whitelist_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Enable read access for all users" ON whitelist_requests
  FOR SELECT
  USING (true);

-- Create policies for insert (anyone can submit a request)
CREATE POLICY "Enable insert for all users" ON whitelist_requests
  FOR INSERT
  WITH CHECK (true);

-- Create policies for update (you can add admin check here if needed)
CREATE POLICY "Enable update for all users" ON whitelist_requests
  FOR UPDATE
  USING (true);

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_whitelist_requests_updated_at
  BEFORE UPDATE ON whitelist_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
