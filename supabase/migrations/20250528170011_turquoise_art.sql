/*
  # Update parking lots RLS policies

  1. Changes
    - Drop existing RLS policies for parking_lots table
    - Create new comprehensive RLS policies that properly handle:
      - INSERT operations for authenticated users
      - SELECT/UPDATE/DELETE operations for users' own parking lots
  
  2. Security
    - Ensures users can only manage their own parking lots
    - Maintains data isolation between users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create parking lots" ON parking_lots;
DROP POLICY IF EXISTS "Users can manage own parking lots" ON parking_lots;

-- Create new comprehensive policies
CREATE POLICY "Enable insert for authenticated users" 
ON parking_lots
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable read access for users own parking lots" 
ON parking_lots
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Enable update for users own parking lots" 
ON parking_lots
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for users own parking lots" 
ON parking_lots
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);