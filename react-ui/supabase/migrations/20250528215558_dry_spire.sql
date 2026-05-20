/*
  # Update driver_name to contact in vehicles and vehicle_history tables

  1. Changes
    - Rename driver_name column to contact in vehicles table
    - Rename driver_name column to contact in vehicle_history table
    - Update all references to maintain data consistency
*/

-- Rename column in vehicles table
ALTER TABLE vehicles 
RENAME COLUMN driver_name TO contact;

-- Rename column in vehicle_history table
ALTER TABLE vehicle_history 
RENAME COLUMN driver_name TO contact;