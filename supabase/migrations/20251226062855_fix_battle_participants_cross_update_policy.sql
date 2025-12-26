/*
  # Fix Battle Participants Update Policy
  
  1. Changes
    - Drop the restrictive update policy that only allows self-updates
    - Add new policy allowing participants in the same battle to update each other
    
  2. Security
    - Users can only update participant records within their active battles
    - Prevents updating records from battles they're not part of
*/

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Participants can update their records" ON battle_participants;

-- Create new policy that allows cross-updates within a battle
CREATE POLICY "Participants can update records in their battles"
  ON battle_participants
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM battle_participants bp
      WHERE bp.battle_id = battle_participants.battle_id
      AND bp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM battle_participants bp
      WHERE bp.battle_id = battle_participants.battle_id
      AND bp.user_id = auth.uid()
    )
  );