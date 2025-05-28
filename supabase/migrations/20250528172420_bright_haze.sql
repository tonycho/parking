/*
  # Fix users table RLS policies

  1. Changes
    - Add RLS policy to allow users to insert their own record
    - Add RLS policy to allow service role to manage all records
    
  2. Security
    - Enable RLS on users table (if not already enabled)
    - Add policy for authenticated users to insert their own record
    - Add policy for service role to manage all records
*/

-- First ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own record
CREATE POLICY "Users can insert own record"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow service role to manage all records
CREATE POLICY "Service role can manage all records"
  ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);