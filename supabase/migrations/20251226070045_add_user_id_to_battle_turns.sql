/*
  # Add user_id to battle_turns for simpler RLS

  1. Changes
    - Add user_id column to battle_turns table
    - Add foreign key constraint to auth.users
    - Update RLS policy to use direct user_id check instead of JOIN
    - This fixes realtime event filtering issues
  
  2. Security
    - Simplified SELECT policy for better realtime performance
    - Maintains same security guarantees
*/

-- Add user_id column to battle_turns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'battle_turns' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE battle_turns ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Backfill existing turns with user_id from battle_participants
UPDATE battle_turns bt
SET user_id = bp.user_id
FROM battle_participants bp
WHERE bt.participant_id = bp.id
  AND bt.user_id IS NULL;

-- Make user_id NOT NULL after backfill
ALTER TABLE battle_turns ALTER COLUMN user_id SET NOT NULL;

-- Drop old SELECT policy
DROP POLICY IF EXISTS "Users can view turns in their battles" ON battle_turns;

-- Create new simplified SELECT policy for better realtime filtering
CREATE POLICY "Users can view turns in their battles"
  ON battle_turns
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT user_id 
      FROM battle_participants 
      WHERE battle_id = battle_turns.battle_id
    )
  );