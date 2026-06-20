-- Add face_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS face_id TEXT UNIQUE;
