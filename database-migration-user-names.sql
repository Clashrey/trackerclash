-- Migration: Add user names to couples table
-- Run via Supabase SQL Editor or Management API

-- Add columns
ALTER TABLE couples ADD COLUMN IF NOT EXISTS user1_name TEXT;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS user2_name TEXT;

-- Set default names
UPDATE couples SET user1_name = 'Данил', user2_name = 'Полина' WHERE user1_name IS NULL;
