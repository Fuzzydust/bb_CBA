/*
  # Fix Battle RLS for Matchmaking

  1. Changes
    - Update battles SELECT policy to allow viewing waiting battles for matchmaking
    - Users can now see:
      - Battles they're participating in
      - Battles with status 'waiting' (for matchmaking)
    
  2. Security
    - Active battles remain private to participants only
    - Waiting battles are visible for matchmaking
    - All other operations remain restricted
*/

DROP POLICY IF EXISTS "Users can view their battles" ON battles;

CREATE POLICY "Users can view their battles and waiting battles"
  ON battles
  FOR SELECT
  TO authenticated
  USING (
    status = 'waiting' OR
    EXISTS (
      SELECT 1
      FROM battle_participants
      WHERE battle_participants.battle_id = battles.id
      AND battle_participants.user_id = auth.uid()
    )
  );
