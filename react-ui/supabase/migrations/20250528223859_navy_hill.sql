-- Update parking spot labels to swap A10 and A12
WITH parking_lot AS (
  SELECT id FROM parking_lots 
  WHERE user_id = '932d78a8-33dc-40fe-849e-71ec7825a98b'
  LIMIT 1
)
UPDATE parking_spots
SET 
  label = CASE
    WHEN label = 'A10' THEN 'A12'
    WHEN label = 'A12' THEN 'A10'
    ELSE label
  END
WHERE parking_lot_id = (SELECT id FROM parking_lot);