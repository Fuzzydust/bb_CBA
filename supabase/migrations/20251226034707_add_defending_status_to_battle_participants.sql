/*
  # Add Defending Status to Battle Participants

  1. Changes
    - Add `is_defending` column to battle_participants table
    - Defending reduces incoming damage by 50% on next turn
    - Defense status resets after opponent's turn
    
  2. Notes
    - Default is false (not defending)
    - This gives the defend action meaningful gameplay impact
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'battle_participants' AND column_name = 'is_defending'
  ) THEN
    ALTER TABLE battle_participants ADD COLUMN is_defending boolean DEFAULT false;
  END IF;
END $$;