-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create parking lots" ON parking_lots;
DROP POLICY IF EXISTS "Users can manage own parking lots" ON parking_lots;

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