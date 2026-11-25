-- Cumberland lot layout: A1–A11 / B1–B11 aligned; A12–A14 extension row; B12 only under A12; remove C1–C4.

WITH parking_lot AS (
  SELECT id FROM parking_lots WHERE name = 'Cumberland Parking' LIMIT 1
),
expected_labels AS (
  SELECT unnest(ARRAY[
    'A1','A2','A3','A4','A5','A6','A7','A8','A9','A10','A11','A12','A13','A14',
    'B1','B2','B3','B4','B5','B6','B7','B8','B9','B10','B11','B12'
  ]) AS label
),
layout AS (
  SELECT * FROM (VALUES
    ('A12', 23::numeric, 0::numeric, 2),
    ('A13', 29, 0, 2),
    ('A14', 36, 0, 2),
    ('A11', 42, 10, 2),
    ('A10', 48, 10, 2),
    ('A9', 53, 10, 2),
    ('A8', 58, 10, 2),
    ('A7', 63, 10, 2),
    ('A6', 68, 10, 2),
    ('A5', 74, 10, 2),
    ('A4', 79, 10, 2),
    ('A3', 84, 10, 2),
    ('A2', 89, 10, 2),
    ('A1', 95, 10, 2),
    ('B12', 23, 23, 1),
    ('B11', 42, 23, 1),
    ('B10', 48, 23, 1),
    ('B9', 53, 23, 1),
    ('B8', 58, 23, 1),
    ('B7', 63, 23, 1),
    ('B6', 68, 23, 1),
    ('B5', 74, 23, 1),
    ('B4', 79, 23, 1),
    ('B3', 84, 23, 1),
    ('B2', 89, 23, 1),
    ('B1', 95, 23, 1)
  ) AS t(label, position_x, position_y, priority)
)
-- Unassign vehicles from spots that will be removed
DELETE FROM vehicle_parking_spot vps
WHERE vps.parking_spot_id IN (
  SELECT ps.id
  FROM parking_spots ps
  WHERE ps.parking_lot_id = (SELECT id FROM parking_lot)
    AND ps.label NOT IN (SELECT label FROM expected_labels)
);

WITH parking_lot AS (
  SELECT id FROM parking_lots WHERE name = 'Cumberland Parking' LIMIT 1
),
expected_labels AS (
  SELECT unnest(ARRAY[
    'A1','A2','A3','A4','A5','A6','A7','A8','A9','A10','A11','A12','A13','A14',
    'B1','B2','B3','B4','B5','B6','B7','B8','B9','B10','B11','B12'
  ]) AS label
)
DELETE FROM parking_spots ps
WHERE ps.parking_lot_id = (SELECT id FROM parking_lot)
  AND ps.label NOT IN (SELECT label FROM expected_labels);

WITH parking_lot AS (
  SELECT id FROM parking_lots WHERE name = 'Cumberland Parking' LIMIT 1
),
layout AS (
  SELECT * FROM (VALUES
    ('A12', 23::numeric, 0::numeric, 2),
    ('A13', 29, 0, 2),
    ('A14', 36, 0, 2),
    ('A11', 42, 10, 2),
    ('A10', 48, 10, 2),
    ('A9', 53, 10, 2),
    ('A8', 58, 10, 2),
    ('A7', 63, 10, 2),
    ('A6', 68, 10, 2),
    ('A5', 74, 10, 2),
    ('A4', 79, 10, 2),
    ('A3', 84, 10, 2),
    ('A2', 89, 10, 2),
    ('A1', 95, 10, 2),
    ('B12', 23, 23, 1),
    ('B11', 42, 23, 1),
    ('B10', 48, 23, 1),
    ('B9', 53, 23, 1),
    ('B8', 58, 23, 1),
    ('B7', 63, 23, 1),
    ('B6', 68, 23, 1),
    ('B5', 74, 23, 1),
    ('B4', 79, 23, 1),
    ('B3', 84, 23, 1),
    ('B2', 89, 23, 1),
    ('B1', 95, 23, 1)
  ) AS t(label, position_x, position_y, priority)
)
UPDATE parking_spots ps
SET
  position_x = l.position_x,
  position_y = l.position_y,
  width = 6,
  height = 12,
  rotation = 0,
  priority = l.priority
FROM layout l
WHERE ps.label = l.label
  AND ps.parking_lot_id = (SELECT id FROM parking_lot);

WITH parking_lot AS (
  SELECT id FROM parking_lots WHERE name = 'Cumberland Parking' LIMIT 1
),
layout AS (
  SELECT * FROM (VALUES
    ('A12', 23::numeric, 0::numeric, 2),
    ('A13', 29, 0, 2),
    ('A14', 36, 0, 2),
    ('A11', 42, 10, 2),
    ('A10', 48, 10, 2),
    ('A9', 53, 10, 2),
    ('A8', 58, 10, 2),
    ('A7', 63, 10, 2),
    ('A6', 68, 10, 2),
    ('A5', 74, 10, 2),
    ('A4', 79, 10, 2),
    ('A3', 84, 10, 2),
    ('A2', 89, 10, 2),
    ('A1', 95, 10, 2),
    ('B12', 23, 23, 1),
    ('B11', 42, 23, 1),
    ('B10', 48, 23, 1),
    ('B9', 53, 23, 1),
    ('B8', 58, 23, 1),
    ('B7', 63, 23, 1),
    ('B6', 68, 23, 1),
    ('B5', 74, 23, 1),
    ('B4', 79, 23, 1),
    ('B3', 84, 23, 1),
    ('B2', 89, 23, 1),
    ('B1', 95, 23, 1)
  ) AS t(label, position_x, position_y, priority)
)
INSERT INTO parking_spots (
  label,
  status,
  position_x,
  position_y,
  width,
  height,
  rotation,
  priority,
  parking_lot_id,
  "order"
)
SELECT
  l.label,
  'available',
  l.position_x,
  l.position_y,
  6,
  12,
  0,
  l.priority,
  pl.id,
  COALESCE((
    SELECT MAX(ps2."order")
    FROM parking_spots ps2
    WHERE ps2.parking_lot_id = pl.id
  ), 0) + ROW_NUMBER() OVER (ORDER BY l.label)
FROM layout l
CROSS JOIN parking_lot pl
WHERE pl.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM parking_spots ps
    WHERE ps.label = l.label
      AND ps.parking_lot_id = pl.id
  );

-- Recompute display order (A* then B*, numeric)
CREATE OR REPLACE FUNCTION extract_label_parts(label text, OUT letter text, OUT number integer) AS $$
BEGIN
    letter := substring(label from '^[A-Z]+');
    number := (substring(label from '[0-9]+$'))::integer;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

WITH parking_lot AS (
  SELECT id FROM parking_lots WHERE name = 'Cumberland Parking' LIMIT 1
),
ordered_spots AS (
  SELECT
    ps.id,
    ROW_NUMBER() OVER (
      ORDER BY
        (extract_label_parts(ps.label)).letter,
        (extract_label_parts(ps.label)).number
    ) AS new_order
  FROM parking_spots ps
  WHERE ps.parking_lot_id = (SELECT id FROM parking_lot)
)
UPDATE parking_spots ps
SET "order" = ordered_spots.new_order
FROM ordered_spots
WHERE ps.id = ordered_spots.id;

DROP FUNCTION extract_label_parts(text);