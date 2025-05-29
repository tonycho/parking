-- Remove user_id from parking_lots
ALTER TABLE parking_lots
DROP COLUMN user_id;

-- Remove user_id from vehicle_parking_spot
ALTER TABLE vehicle_parking_spot
DROP COLUMN user_id;

-- Remove user_id from vehicles
ALTER TABLE vehicles
DROP COLUMN user_id;

-- Update unique constraint on vehicles to only use license_plate
ALTER TABLE vehicles
DROP CONSTRAINT IF EXISTS vehicles_license_plate_user_id_key;

ALTER TABLE vehicles
ADD CONSTRAINT vehicles_license_plate_key UNIQUE (license_plate);