-- Enable RLS
ALTER TABLE parking_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_spots ENABLE ROW LEVEL SECURITY;

-- Insert initial parking lot if it doesn't exist
INSERT INTO parking_lots (id, name, user_id)
SELECT 
  gen_random_uuid(),
  'Cumberland Parking',
  '932d78a8-33dc-40fe-849e-71ec7825a98b'
WHERE NOT EXISTS (
  SELECT 1 FROM parking_lots 
  WHERE user_id = '932d78a8-33dc-40fe-849e-71ec7825a98b'
);

-- Get the ID of the parking lot we just created
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
SELECT
  spot.label,
  'available',
  spot.x,
  spot.y,
  spot.w,
  spot.h,
  COALESCE(spot.r, 0),
  (SELECT id FROM parking_lot)
FROM (
  VALUES
    -- First column (23-26 vertically)
    ('26', 0, 15, 15, 10, 0),
    ('25', 0, 26, 15, 10, 0),
    ('24', 0, 37, 15, 10, 0),
    ('23', 0, 48, 15, 10, 0),
    
    -- Second column (17-22)
    -- First row (17-19)
    ('17', 16, 5, 6, 12, 0),
    ('18', 23, 5, 6, 12, 0),
    ('19', 30, 5, 6, 12, 0),
    -- Second row (20-22)
    ('20', 16, 18, 6, 12, 0),
    ('21', 23, 18, 6, 12, 0),
    ('22', 30, 18, 6, 12, 0),
    
    -- Third column - top row (8-1)
    ('8', 37, 10, 6, 12, 0),
    ('7', 44, 10, 6, 12, 0),
    ('6', 51, 10, 6, 12, 0),
    ('5', 58, 10, 6, 12, 0),
    ('4', 65, 10, 6, 12, 0),
    ('3', 72, 10, 6, 12, 0),
    ('2', 79, 10, 6, 12, 0),
    ('1', 86, 10, 6, 12, 0),
    
    -- Third column - bottom row (9-16)
    ('9', 37, 23, 6, 12, 0),
    ('10', 44, 23, 6, 12, 0),
    ('11', 51, 23, 6, 12, 0),
    ('12', 58, 23, 6, 12, 0),
    ('13', 65, 23, 6, 12, 0),
    ('14', 72, 23, 6, 12, 0),
    ('15', 79, 23, 6, 12, 0),
    ('16', 86, 23, 6, 12, 0)
) AS spot(label, x, y, w, h, r)
WHERE NOT EXISTS (
  SELECT 1 FROM parking_spots ps
  JOIN parking_lots pl ON ps.parking_lot_id = pl.id
  WHERE pl.user_id = '932d78a8-33dc-40fe-849e-71ec7825a98b'
);