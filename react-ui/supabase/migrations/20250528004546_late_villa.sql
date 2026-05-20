/*
  # Add insert policy for parking lots

  1. Changes
    - Add new RLS policy to allow authenticated users to insert parking lots
    - Policy ensures user_id matches the authenticated user during insertion

  2. Security
    - Only allows users to create parking lots where they are the owner
    - Maintains data integrity by ensuring user ownership
*/

CREATE POLICY "Users can create parking lots"
  ON parking_lots
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);