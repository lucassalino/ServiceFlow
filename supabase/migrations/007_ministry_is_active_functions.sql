-- Add is_active and functions columns to ministries table
ALTER TABLE ministries
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS functions text[] NOT NULL DEFAULT '{}';
