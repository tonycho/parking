/*
  # Fix RLS policies for parking lots

  1. Changes
    - Update RLS policies for parking_lots table to properly handle authenticated users
    - Ensure proper access control for INSERT and SELECT operations

  2. Security
    - Enable RLS on parking_lots table
    - Add policies for authenticated users to:
      - Insert their own parking lots
      - Read their own parking lots
*/

-- First ensure RLS is enabled
ALTER TABLE parking_lots ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create their own parking lots" ON parking_lots;
DROP POLICY IF EXISTS "Users can manage their own parking lots" ON parking_lots;

-- Create new, more specific policies
CREATE POLICY "Users can create their own parking lots"
ON parking_lots
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own parking lots"
ON parking_lots
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own parking lots"
ON parking_lots
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own parking lots"
ON parking_lots
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);