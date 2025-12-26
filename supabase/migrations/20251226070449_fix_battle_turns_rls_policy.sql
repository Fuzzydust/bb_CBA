/*
  # Fix battle_turns RLS policy for realtime

  1. Changes
    - Drop incorrect SELECT policy that checks turn creator instead of viewer
    - Create correct SELECT policy that checks if the current user is in the battle
  
  2. Security
    - Users can only see turns from battles they're participating in
*/

-- Drop the incorrect policy
DROP POLICY IF EXISTS "Users can view turns in their battles" ON battle_turns;

-- Create the correct policy - check if the CURRENT USER is in the battle, not the turn creator
CREATE POLICY "Users can view turns in their battles"
  ON battle_turns
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM battle_participants 
      WHERE battle_participants.battle_id = battle_turns.battle_id
        AND battle_participants.user_id = auth.uid()
    )
  );