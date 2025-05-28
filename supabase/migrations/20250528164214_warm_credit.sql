-- Enable the pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add auth fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash text,
ADD COLUMN IF NOT EXISTS salt text,
ADD COLUMN IF NOT EXISTS reset_token text,
ADD COLUMN IF NOT EXISTS reset_token_expires_at timestamp with time zone;

-- Create auth function
CREATE OR REPLACE FUNCTION authenticate_user(
  p_email text,
  p_password text
) RETURNS users AS $$
DECLARE
  v_user users;
BEGIN
  SELECT *
  INTO v_user
  FROM users
  WHERE email = p_email
  AND password_hash = crypt(p_password, salt);
  
  RETURN v_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create user registration function
CREATE OR REPLACE FUNCTION register_user(
  p_email text,
  p_password text
) RETURNS users AS $$
DECLARE
  v_salt text;
  v_user users;
BEGIN
  -- Generate a new salt
  v_salt := gen_salt('bf');
  
  -- Insert new user
  INSERT INTO users (
    email,
    password_hash,
    salt,
    created_at
  ) VALUES (
    p_email,
    crypt(p_password, v_salt),
    v_salt,
    now()
  )
  RETURNING * INTO v_user;
  
  RETURN v_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;