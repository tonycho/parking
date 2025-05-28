/*
  # Add model column to vehicles table

  1. Changes
    - Add 'model' column to vehicles table
      - Type: text
      - Nullable: true (to maintain compatibility with existing records)

  2. Notes
    - Uses safe migration pattern with IF NOT EXISTS check
    - Maintains existing data
*/

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'vehicles' 
    AND column_name = 'model'
  ) THEN 
    ALTER TABLE vehicles ADD COLUMN model text;
  END IF;
END $$;