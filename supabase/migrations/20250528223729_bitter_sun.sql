-- Remove spots A10-A12
WITH parking_lot AS (
  SELECT id FROM parking_lots 
  WHERE user_id = '932d78a8-33dc-40fe-849e-71ec7825a98b'
  LIMIT 1
)
DELETE FROM parking_spots
WHERE label IN ('A10', 'A11', 'A12')
AND parking_lot_id = (SELECT id FROM parking_lot);