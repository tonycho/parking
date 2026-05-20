-- Update parking spot labels
WITH parking_lot AS (
  SELECT id FROM parking_lots 
  WHERE user_id = '932d78a8-33dc-40fe-849e-71ec7825a98b'
  LIMIT 1
)
UPDATE parking_spots
SET 
  label = CASE
    -- Rename B10-B12 to A10-A12
    WHEN label = 'B10' THEN 'A10'
    WHEN label = 'B11' THEN 'A11'
    WHEN label = 'B12' THEN 'A12'
    -- Rename 20-22 to B12, B10, B10
    WHEN label = '20' THEN 'B12'
    WHEN label = '21' THEN 'B10'
    WHEN label = '22' THEN 'B10'
    ELSE label
  END
WHERE parking_lot_id = (SELECT id FROM parking_lot);