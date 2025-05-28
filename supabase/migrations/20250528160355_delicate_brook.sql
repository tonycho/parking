/*
  # Add RLS policies for parking lots table

  1. Security Changes
    - Enable RLS on parking_lots table (if not already enabled)
    - Add policy for authenticated users to insert their own parking lots
    - Add policy for authenticated users to view and manage their own parking lots
    
  2. Changes
    - Ensures users can only access parking lots they own
    - Allows creation of new parking lots with proper user_id
*/

-- Enable RLS
ALTER TABLE parking_lots ENABLE ROW LEVEL SECURITY;

-- Policy for inserting new parking lots
CREATE POLICY "Users can create parking lots"
ON parking_lots
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy for managing own parking lots (view, update, delete)
CREATE POLICY "Users can manage own parking lots"
ON parking_lots
FOR ALL
TO authenticated
USING (auth.uid() = user_id);