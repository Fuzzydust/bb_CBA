/*
  # Fix Battle Participants RLS for Matchmaking

  1. Changes
    - Update battle_participants SELECT policy to allow viewing participants in waiting battles
    - Users can now see:
      - Participants in battles they're in
      - Participants in waiting battles (for matchmaking)
    
  2. Security
    - Participants in active battles remain private to battle members
    - Participants in waiting battles are visible for matchmaking
    - Insert/Update operations remain restricted to own records
*/

DROP POLICY IF EXISTS "Users can view battle participants in their battles" ON battle_participants;

CREATE POLICY "Users can view participants in their battles and waiting battles"
  ON battle_participants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM battles
      WHERE battles.id = battle_participants.battle_id
      AND (
        battles.status = 'waiting' OR
        EXISTS (
          SELECT 1
          FROM battle_participants bp
          WHERE bp.battle_id = battles.id
          AND bp.user_id = auth.uid()
        )
      )
    )
  );
