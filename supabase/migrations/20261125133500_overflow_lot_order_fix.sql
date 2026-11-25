-- Fix display order for C-prefix spots (numeric, not lexicographic).

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