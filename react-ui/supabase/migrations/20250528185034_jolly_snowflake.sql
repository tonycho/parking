/*
  # Update vehicle history RLS policies

  1. Changes
    - Add UPDATE policy for vehicle history table to allow users to update their own records
    - Add DELETE policy for vehicle history table to allow users to delete their own records
    - Update existing policies to be more permissive for upsert operations

  2. Security
    - Maintains row-level security by ensuring users can only modify their own records
    - All policies are restricted to authenticated users only
*/

-- Drop existing policies to recreate them with correct permissions
DROP POLICY IF EXISTS "Users can insert their own vehicle history" ON vehicle_history;
DROP POLICY IF EXISTS "Users can view their own vehicle history" ON vehicle_history;

-- Create comprehensive policies for all required operations
CREATE POLICY "Users can manage their own vehicle history"
  ON vehicle_history
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add specific SELECT policy to maintain explicit intent
CREATE POLICY "Users can view their own vehicle history"
  ON vehicle_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);