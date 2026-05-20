/*
  # Add INSERT policy for parking_lots table

  1. Changes
    - Add new RLS policy to allow authenticated users to create their own parking lots
    
  2. Security
    - Adds INSERT policy for parking_lots table
    - Policy ensures users can only create parking lots with their own user_id
*/

CREATE POLICY "Users can create their own parking lots"
  ON parking_lots
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);