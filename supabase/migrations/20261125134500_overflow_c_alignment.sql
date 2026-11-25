-- Align C3–C7 with C9–C13 (same columns); C1–C2 upper-left, C8 upper-right.

WITH overflow_lot AS (
  SELECT id FROM parking_lots WHERE name = 'Overflow Parking' LIMIT 1
),
layout AS (
  SELECT * FROM (VALUES
    ('C1', 0.0::numeric, 14::numeric),
    ('C2', 12.5, 14),
    ('C3', 18.75, 14),
    ('C4', 31.25, 14),
    ('C5', 43.75, 14),
    ('C6', 56.25, 14),
    ('C7', 68.75, 14),
    ('C8', 81.25, 14),
    ('C9', 18.75, 27),
    ('C10', 31.25, 27),
    ('C11', 43.75, 27),
    ('C12', 56.25, 27),
    ('C13', 68.75, 27)
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