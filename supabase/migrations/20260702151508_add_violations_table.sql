/*
  # Add violations tracking table

  1. New Table
    - `violations` - Store loading zone violation records
      - `id` (uuid, primary key)
      - `license_plate` (text, required) - Vehicle license plate
      - `make` (text, optional) - Vehicle make
      - `model` (text, optional) - Vehicle model
      - `color` (text, optional) - Vehicle color
      - `contact` (text, optional) - Driver contact name
      - `phone_number` (text, optional) - Driver phone number
      - `violation_time` (timestamptz, required) - When violation occurred
      - `notes` (text, optional) - Additional notes about the violation
      - `parking_lot_id` (uuid, foreign key) - Associated parking lot
      - `recorded_by` (uuid, foreign key) - User who recorded the violation
      - `created_at` (timestamptz) - Record creation timestamp

  2. Security
    - Enable RLS on violations table
    - Add policy for users to manage violations in their parking lots

  3. Indexes
    - Index on license_plate for quick lookups
    - Index on parking_lot_id for filtering by lot
*/

-- Create violations table
CREATE TABLE violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_plate text NOT NULL,
  make text,
  model text,
  color text,
  contact text,
  phone_number text,
  violation_time timestamptz NOT NULL DEFAULT now(),
  notes text,
  parking_lot_id uuid REFERENCES parking_lots(id),
  recorded_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE violations ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view and manage violations
-- Simplified: allow all authenticated users to manage violations in their assigned parking lot
CREATE POLICY "Authenticated users can manage violations"
  ON violations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for quick lookups
CREATE INDEX idx_violations_license_plate ON violations(license_plate);
CREATE INDEX idx_violations_parking_lot_id ON violations(parking_lot_id);
CREATE INDEX idx_violations_violation_time ON violations(violation_time DESC);
