-- Add priority column to parking_spots table
ALTER TABLE parking_spots
ADD COLUMN priority integer DEFAULT 1;

-- Update priorities for specific spots
WITH parking_lot AS (
  SELECT id FROM parking_lots 
  WHERE user_id = '932d78a8-33dc-40fe-849e-71ec7825a98b'
  LIMIT 1
)
UPDATE parking_spots
SET priority = CASE
  WHEN label IN ('C1', 'C2') THEN 2
  WHEN label LIKE 'A%' THEN 2
  ELSE 1
END
WHERE parking_lot_id = (SELECT id FROM parking_lot);