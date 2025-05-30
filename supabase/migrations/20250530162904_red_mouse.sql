-- Add index for order field
CREATE INDEX idx_parking_spots_order ON parking_spots ("order");

-- Add composite index for parking_lot_id and order since they're often used together
CREATE INDEX idx_parking_spots_lot_order ON parking_spots (parking_lot_id, "order");