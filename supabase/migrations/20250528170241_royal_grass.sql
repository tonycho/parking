/*
  # Fix parking lots RLS policies

  1. Changes
    - Drop existing RLS policies for parking_lots table
    - Create new consolidated RLS policy for all operations
    - Ensure authenticated users can manage their own parking lots

  2. Security
    - Maintains RLS enabled on parking_lots table
    - Ensures users can only access their own parking lots
    - Verifies user_id matches authenticated user for all operations
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable delete for users own parking lots" ON parking_lots;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON parking_lots;
DROP POLICY IF EXISTS "Enable read access for users own parking lots" ON parking_lots;
DROP POLICY IF EXISTS "Enable update for users own parking lots" ON parking_lots;

-- Create new consolidated policy
CREATE POLICY "Users can manage their own parking lots" 
ON parking_lots
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);