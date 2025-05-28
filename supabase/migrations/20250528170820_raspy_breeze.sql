-- Drop custom auth functions and columns
DROP FUNCTION IF EXISTS authenticate_user(text, text);
DROP FUNCTION IF EXISTS register_user(text, text);

-- Remove auth columns from users table
ALTER TABLE users 
DROP COLUMN IF EXISTS password_hash,
DROP COLUMN IF EXISTS salt,
DROP COLUMN IF EXISTS reset_token,
DROP COLUMN IF EXISTS reset_token_expires_at;