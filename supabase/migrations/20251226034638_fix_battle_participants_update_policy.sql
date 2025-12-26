/*
  # Fix Battle Participants Update Policy

  1. Changes
    - Drop restrictive UPDATE policy that only allows self-updates
    - Create new policy that allows participants in the same active battle to update each other
    - This enables players to update opponent HP during their turn
    
  2. Security
    - Only participants in the same battle can update each other
    - Battle must be active (not waiting or completed)
    - Maintains data integrity while enabling gameplay
*/

DROP POLICY IF EXISTS "Users can update their participation" ON battle_participants;

CREATE POLICY "Participants can update records in their active battles"
  ON battle_participants
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM battle_participants bp
      INNER JOIN battles b ON b.id = bp.battle_id
      WHERE bp.battle_id = battle_participants.battle_id
      AND bp.user_id = auth.uid()
      AND b.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM battle_participants bp
      INNER JOIN battles b ON b.id = bp.battle_id
      WHERE bp.battle_id = battle_participants.battle_id
      AND bp.user_id = auth.uid()
      AND b.status = 'active'
    )
  );