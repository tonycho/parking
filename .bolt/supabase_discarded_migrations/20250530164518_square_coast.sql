-- Update the order values for parking spots
WITH ordered_spots AS (
  SELECT 
    id,
    label,
    CASE 
      WHEN substring(label from '^[A-Z]+') = 'A' THEN 0
      WHEN substring(label from '^[A-Z]+') = 'B' THEN 100
      WHEN substring(label from '^[A-Z]+') = 'C' THEN 200
    END + (substring(label from '[0-9]+$'))::integer as new_order
  FROM parking_spots
)
UPDATE parking_spots
SET "order" = ordered_spots.new_order
FROM ordered_spots
WHERE parking_spots.id = ordered_spots.id;