-- Add order column
ALTER TABLE parking_spots
ADD COLUMN "order" integer;

-- Create a function to extract the letter prefix and number from a label
CREATE OR REPLACE FUNCTION extract_label_parts(label text, OUT letter text, OUT number integer) AS $$
BEGIN
    letter := substring(label from '^[A-Z]+');
    number := (substring(label from '[0-9]+$'))::integer;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update the order based on letter prefix and numerical order
WITH ordered_spots AS (
  SELECT 
    id,
    label,
    extract_label_parts(label) as parts,
    ROW_NUMBER() OVER (
      ORDER BY 
        (extract_label_parts(label)).letter,
        (extract_label_parts(label)).number
    ) as new_order
  FROM parking_spots
)
UPDATE parking_spots
SET "order" = ordered_spots.new_order
FROM ordered_spots
WHERE parking_spots.id = ordered_spots.id;

-- Make order column not nullable
ALTER TABLE parking_spots
ALTER COLUMN "order" SET NOT NULL;

-- Add unique constraint
ALTER TABLE parking_spots
ADD CONSTRAINT unique_order_per_parking_lot UNIQUE (parking_lot_id, "order");

-- Drop the helper function as it's no longer needed
DROP FUNCTION extract_label_parts(text);