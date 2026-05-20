-- Strip dashes from phone numbers in vehicles table
UPDATE vehicles
SET phone_number = REPLACE(phone_number, '-', '')
WHERE phone_number LIKE '%-%'
  AND user_id = '932d78a8-33dc-40fe-849e-71ec7825a98b';

-- Update phone numbers in vehicle_parking_spot table
UPDATE vehicle_parking_spot
SET phone_number = REPLACE(phone_number, '-', '')
WHERE phone_number LIKE '%-%'
  AND user_id = '932d78a8-33dc-40fe-849e-71ec7825a98b';