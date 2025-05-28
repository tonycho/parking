/*
  # Fix Row Level Security Policies

  1. Changes
    - Update RLS policies for parking_lots table to allow proper access
    - Ensure authenticated users can create and manage their own parking lots
    - Fix policy conditions to use auth.uid() correctly

  2. Security
    - Enable RLS on parking_lots table (already enabled)
    - Update policies to properly check user ownership
    - Ensure users can only access their own data
*/

-- Drop existing policies to recreate them with correct conditions
DROP POLICY IF EXISTS "Users can create their own parking lots" ON parking_lots;
DROP POLICY IF EXISTS "Users can delete their own parking lots" ON parking_lots;
DROP POLICY IF EXISTS "Users can read their own parking lots" ON parking_lots;
DROP POLICY IF EXISTS "Users can update their own parking lots" ON parking_lots;

-- Recreate policies with correct conditions
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