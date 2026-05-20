-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own vehicle history" ON vehicle_history;
DROP POLICY IF EXISTS "Users can view their own vehicle history" ON vehicle_history;

-- Rename table
ALTER TABLE vehicle_history RENAME TO vehicles;

-- Rename index
ALTER INDEX vehicle_history_license_plate_user_id_idx RENAME TO vehicles_license_plate_user_id_idx;
ALTER INDEX vehicle_history_pkey RENAME TO vehicles_pkey;

-- Create new policies
CREATE POLICY "Users can manage their own vehicles"
  ON vehicles
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Update references in useParking hook
UPDATE vehicle_parking_spot vps
SET contact = v.contact,
    phone_number = v.phone_number,
    make = v.make,
    model = v.model,
    color = v.color
FROM vehicles v
WHERE vps.license_plate = v.license_plate
  AND vps.user_id = v.user_id;