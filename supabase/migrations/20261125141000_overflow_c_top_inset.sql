-- School lot: top row flush to top; shift right so C1/C2 are not clipped.

WITH overflow_lot AS (
  SELECT id FROM parking_lots WHERE name = 'Overflow Parking' LIMIT 1
),
layout AS (
  SELECT * FROM (VALUES
    ('C1', 2.0::numeric, 0::numeric),
    ('C2', 14.5, 0),
    ('C3', 20.75, 0),
    ('C4', 33.25, 0),
    ('C5', 45.75, 0),
    ('C6', 58.25, 0),
    ('C7', 70.75, 0),
    ('C8', 83.25, 0),
    ('C9', 20.75, 26),
    ('C10', 33.25, 26),
    ('C11', 45.75, 26),
    ('C12', 58.25, 26),
    ('C13', 70.75, 26)
  ) AS t(label, position_x, position_y)
)
UPDATE parking_spots ps
SET
  position_x = l.position_x,
  position_y = l.position_y,
  width = 12.5,
  height = 12
FROM layout l
CROSS JOIN overflow_lot ol
WHERE ps.label = l.label
  AND ps.parking_lot_id = ol.id;