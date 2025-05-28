-- Update parking spots with new labels and positions
WITH parking_lot AS (
  SELECT id FROM parking_lots 
  WHERE user_id = '932d78a8-33dc-40fe-849e-71ec7825a98b'
  LIMIT 1
)
UPDATE parking_spots
SET 
  label = CASE
    -- First column (C1-C4)
    WHEN label = '26' THEN 'C1'
    WHEN label = '25' THEN 'C2'
    WHEN label = '24' THEN 'C3'
    WHEN label = '23' THEN 'C4'
    -- Second column (B10-B12)
    WHEN label = '17' THEN 'B10'
    WHEN label = '18' THEN 'B11'
    WHEN label = '19' THEN 'B12'
    -- Third column - top row (A9-A1)
    WHEN label = '8' THEN 'A9'
    WHEN label = '7' THEN 'A8'
    WHEN label = '6' THEN 'A7'
    WHEN label = '5' THEN 'A6'
    WHEN label = '4' THEN 'A5'
    WHEN label = '3' THEN 'A4'
    WHEN label = '2' THEN 'A3'
    WHEN label = '1' THEN 'A2'
    -- Third column - bottom row (B9-B1)
    WHEN label = '9' THEN 'B9'
    WHEN label = '10' THEN 'B8'
    WHEN label = '11' THEN 'B7'
    WHEN label = '12' THEN 'B6'
    WHEN label = '13' THEN 'B5'
    WHEN label = '14' THEN 'B4'
    WHEN label = '15' THEN 'B3'
    WHEN label = '16' THEN 'B2'
    ELSE label
  END
WHERE parking_lot_id = (SELECT id FROM parking_lot);

-- Insert new spots A1, A10-A12, and B1
WITH parking_lot AS (
  SELECT id FROM parking_lots 
  WHERE user_id = '932d78a8-33dc-40fe-849e-71ec7825a98b'
  LIMIT 1
)
INSERT INTO parking_spots (
  label,
  status,
  position_x,
  position_y,
  width,
  height,
  rotation,
  parking_lot_id
)
SELECT * FROM (
  VALUES
    ('A1', 'available', 93, 10, 6, 12, 0, (SELECT id FROM parking_lot)),
    ('A10', 'available', 37, 0, 6, 12, 0, (SELECT id FROM parking_lot)),
    ('A11', 'available', 44, 0, 6, 12, 0, (SELECT id FROM parking_lot)),
    ('A12', 'available', 51, 0, 6, 12, 0, (SELECT id FROM parking_lot)),
    ('B1', 'available', 93, 23, 6, 12, 0, (SELECT id FROM parking_lot))
) AS new_spots(label, status, position_x, position_y, width, height, rotation, parking_lot_id)
WHERE NOT EXISTS (
  SELECT 1 FROM parking_spots ps
  WHERE ps.label = new_spots.label
  AND ps.parking_lot_id = (SELECT id FROM parking_lot)
);