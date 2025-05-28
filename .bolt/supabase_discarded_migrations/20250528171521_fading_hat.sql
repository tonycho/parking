-- Drop existing policies
DROP POLICY IF EXISTS "Users can create their own parking lots" ON parking_lots;
DROP POLICY IF EXISTS "Users can read their own parking lots" ON parking_lots;
DROP POLICY IF EXISTS "Users can update their own parking lots" ON parking_lots;
DROP POLICY IF EXISTS "Users can delete their own parking lots" ON parking_lots;

-- Enable RLS on all tables
ALTER TABLE parking_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Parking Lots Policies
CREATE POLICY "Users can manage their own parking lots"
ON parking_lots
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Parking Spots Policies
CREATE POLICY "Users can manage spots in their lots"
ON parking_spots
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM parking_lots
    WHERE parking_lots.id = parking_spots.parking_lot_id
    AND parking_lots.user_id = auth.uid()
  )
);

-- Vehicles Policies
CREATE POLICY "Users can manage their own vehicles"
ON vehicles
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);