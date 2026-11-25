-- School lot: 8-column top row full width; C9–C13 under C3–C7.

WITH overflow_lot AS (
  SELECT id FROM parking_lots WHERE name = 'Overflow Parking' LIMIT 1
),
layout AS (
  SELECT * FROM (VALUES
    ('C1', 0.0::numeric, 0::numeric),
    ('C2', 12.5, 0),
    ('C3', 25.0, 0),
    ('C4', 37.5, 0),
    ('C5', 50.0, 0),
    ('C6', 62.5, 0),
    ('C7', 75.0, 0),
    ('C8', 87.5, 0),
    ('C9', 25.0, 26),
    ('C10', 37.5, 26),
    ('C11', 50.0, 26),
    ('C12', 62.5, 26),
    ('C13', 75.0, 26)
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