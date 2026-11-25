-- Second parking lot (C-prefix spots) and tab metadata on parking_lots.

ALTER TABLE parking_lots
  ADD COLUMN IF NOT EXISTS map_sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tab_label text;

UPDATE parking_lots
SET
  map_sort_order = 0,
  tab_label = COALESCE(tab_label, 'Cumberland (A & B)')
WHERE name = 'Cumberland Parking';

INSERT INTO parking_lots (name, map_sort_order, tab_label)
SELECT 'Overflow Parking', 1, 'Lot C'
WHERE NOT EXISTS (
  SELECT 1 FROM parking_lots WHERE name = 'Overflow Parking'
);

WITH overflow_lot AS (
  SELECT id FROM parking_lots WHERE name = 'Overflow Parking' LIMIT 1
),
layout AS (
  SELECT * FROM (VALUES
    ('C1', 0.0::numeric, 14::numeric, 12.5::numeric, 12::numeric, 1),
    ('C2', 12.5, 14, 12.5, 12, 1),
    ('C3', 25.0, 14, 12.5, 12, 1),
    ('C4', 37.5, 14, 12.5, 12, 1),
    ('C5', 50.0, 14, 12.5, 12, 1),
    ('C6', 62.5, 14, 12.5, 12, 1),
    ('C7', 75.0, 14, 12.5, 12, 1),
    ('C8', 87.5, 14, 12.5, 12, 1),
    ('C9', 18.75, 27, 12.5, 12, 1),
    ('C10', 31.25, 27, 12.5, 12, 1),
    ('C11', 43.75, 27, 12.5, 12, 1),
    ('C12', 56.25, 27, 12.5, 12, 1),
    ('C13', 68.75, 27, 12.5, 12, 1)
  ) AS t(label, position_x, position_y, width, height, priority)
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
  l.width,
  l.height,
  0,
  l.priority,
  ol.id,
  ROW_NUMBER() OVER (
    ORDER BY substring(l.label from '^[A-Z]+'), (substring(l.label from '[0-9]+$'))::integer
  )
FROM layout l
CROSS JOIN overflow_lot ol
WHERE ol.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM parking_spots ps
    WHERE ps.parking_lot_id = ol.id
      AND ps.label = l.label
  );

CREATE OR REPLACE FUNCTION extract_label_parts(label text, OUT letter text, OUT number integer) AS $$
BEGIN
    letter := substring(label from '^[A-Z]+');
    number := (substring(label from '[0-9]+$'))::integer;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

WITH overflow_lot AS (
  SELECT id FROM parking_lots WHERE name = 'Overflow Parking' LIMIT 1
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
  WHERE ps.parking_lot_id = (SELECT id FROM overflow_lot)
)
UPDATE parking_spots ps
SET "order" = ordered_spots.new_order
FROM ordered_spots
WHERE ps.id = ordered_spots.id;

DROP FUNCTION extract_label_parts(text);