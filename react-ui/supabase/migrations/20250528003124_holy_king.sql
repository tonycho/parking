/*
  # Initial schema setup for ParkSmart

  1. New Tables
    - `users` - Store user authentication data
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `created_at` (timestamp)
    
    - `parking_lots` - Store parking lot information
      - `id` (uuid, primary key)
      - `name` (text)
      - `created_at` (timestamp)
      - `user_id` (uuid, foreign key to users)

    - `parking_spots` - Store individual parking spots
      - `id` (uuid, primary key)
      - `label` (text)
      - `status` (text)
      - `position_x` (numeric)
      - `position_y` (numeric)
      - `width` (numeric)
      - `height` (numeric)
      - `rotation` (numeric)
      - `parking_lot_id` (uuid, foreign key to parking_lots)
      - `created_at` (timestamp)

    - `vehicles` - Store vehicle information
      - `id` (uuid, primary key)
      - `driver_name` (text)
      - `phone_number` (text)
      - `license_plate` (text)
      - `make` (text)
      - `color` (text)
      - `parking_spot_id` (uuid, foreign key to parking_spots)
      - `time_parked` (timestamp)
      - `created_at` (timestamp)
      - `user_id` (uuid, foreign key to users)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create tables
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE parking_lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES users(id) NOT NULL
);

CREATE TABLE parking_spots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  status text NOT NULL DEFAULT 'available',
  position_x numeric NOT NULL,
  position_y numeric NOT NULL,
  width numeric NOT NULL,
  height numeric NOT NULL,
  rotation numeric DEFAULT 0,
  parking_lot_id uuid REFERENCES parking_lots(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_name text NOT NULL,
  phone_number text NOT NULL,
  license_plate text NOT NULL,
  make text NOT NULL,
  color text NOT NULL,
  parking_spot_id uuid REFERENCES parking_spots(id) NOT NULL,
  time_parked timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES users(id) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can manage own parking lots"
  ON parking_lots
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view spots in their lots"
  ON parking_spots
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parking_lots
      WHERE parking_lots.id = parking_spots.parking_lot_id
      AND parking_lots.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage spots in their lots"
  ON parking_spots
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parking_lots
      WHERE parking_lots.id = parking_spots.parking_lot_id
      AND parking_lots.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own vehicles"
  ON vehicles
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);