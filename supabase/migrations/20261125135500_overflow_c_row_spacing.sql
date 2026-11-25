-- Lot C: ~10× vertical gap between upper row (C1–C8) and lower row (C9–C13).

WITH overflow_lot AS (
  SELECT id FROM parking_lots WHERE name = 'Overflow Parking' LIMIT 1
),
layout AS (
  SELECT * FROM (VALUES
    ('C1', 0.0::numeric, 10::numeric),
    ('C2', 12.5, 10),
    ('C3', 18.75, 10),
    ('C4', 31.25, 10),
    ('C5', 43.75, 10),
    ('C6', 56.25, 10),
    ('C7', 68.75, 10),
    ('C8', 81.25, 10),
    ('C9', 18.75, 36),
    ('C10', 31.25, 36),
    ('C11', 43.75, 36),
    ('C12', 56.25, 36),
    ('C13', 68.75, 36)
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