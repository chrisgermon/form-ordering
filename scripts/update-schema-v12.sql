-- This script creates the 'allowed_ips' table for IP-based access control.
-- Run this script once from the 'System Actions' tab in the admin dashboard.

CREATE TABLE IF NOT EXISTS allowed_ips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_allowed_ips_ip_address ON allowed_ips(ip_address);
