-- Layout v2: 14 columns full width; top A14,A13,A12,A11..A1; bottom _,_,B12,B11..B1 (same row gap as main grid).

WITH parking_lot AS (
  SELECT id FROM parking_lots WHERE name = 'Cumberland Parking' LIMIT 1
),
layout AS (
  SELECT * FROM (VALUES
    ('A14', 0.0::numeric, 10::numeric, 7.142857::numeric, 12::numeric, 2),
    ('A13', 7.1429, 10, 7.142857, 12, 2),
    ('A12', 14.2857, 10, 7.142857, 12, 2),
    ('A11', 21.4286, 10, 7.142857, 12, 2),
    ('A10', 28.5714, 10, 7.142857, 12, 2),
    ('A9', 35.7143, 10, 7.142857, 12, 2),
    ('A8', 42.8571, 10, 7.142857, 12, 2),
    ('A7', 50.0, 10, 7.142857, 12, 2),
    ('A6', 57.1429, 10, 7.142857, 12, 2),
    ('A5', 64.2857, 10, 7.142857, 12, 2),
    ('A4', 71.4286, 10, 7.142857, 12, 2),
    ('A3', 78.5714, 10, 7.142857, 12, 2),
    ('A2', 85.7143, 10, 7.142857, 12, 2),
    ('A1', 92.8571, 10, 7.142857, 12, 2),
    ('B12', 14.2857, 23, 7.142857, 12, 1),
    ('B11', 21.4286, 23, 7.142857, 12, 1),
    ('B10', 28.5714, 23, 7.142857, 12, 1),
    ('B9', 35.7143, 23, 7.142857, 12, 1),
    ('B8', 42.8571, 23, 7.142857, 12, 1),
    ('B7', 50.0, 23, 7.142857, 12, 1),
    ('B6', 57.1429, 23, 7.142857, 12, 1),
    ('B5', 64.2857, 23, 7.142857, 12, 1),
    ('B4', 71.4286, 23, 7.142857, 12, 1),
    ('B3', 78.5714, 23, 7.142857, 12, 1),
    ('B2', 85.7143, 23, 7.142857, 12, 1),
    ('B1', 92.8571, 23, 7.142857, 12, 1)
  ) AS t(label, position_x, position_y, width, height, priority)
)
UPDATE parking_spots ps
SET
  position_x = l.position_x,
  position_y = l.position_y,
  width = l.width,
  height = l.height,
  rotation = 0,
  priority = l.priority
FROM layout l
WHERE ps.label = l.label
  AND ps.parking_lot_id = (SELECT id FROM parking_lot);