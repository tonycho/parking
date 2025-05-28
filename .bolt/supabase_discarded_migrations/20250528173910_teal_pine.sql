-- Enable RLS
ALTER TABLE parking_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_spots ENABLE ROW LEVEL SECURITY;

-- Create a function to get the first user's ID
CREATE OR REPLACE FUNCTION get_first_user_id()
RETURNS uuid AS $$
BEGIN
  RETURN (SELECT id FROM auth.users LIMIT 1);
END;
$$ LANGUAGE plpgsql;

-- Insert initial parking lot
INSERT INTO parking_lots (id, name, user_id)
VALUES (
  gen_random_uuid(),
  'Cumberland Parking',
  get_first_user_id()
);

-- Get the ID of the parking lot we just created
WITH parking_lot AS (
  SELECT id FROM parking_lots 
  WHERE user_id = get_first_user_id()
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
) AS spot(label, x, y, w, h, r);

-- Drop the helper function
DROP FUNCTION get_first_user_id();