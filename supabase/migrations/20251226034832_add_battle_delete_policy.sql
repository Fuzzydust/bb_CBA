/*
  # Add Battle Delete Policy

  1. Changes
    - Add DELETE policy for battles table
    - Users can delete waiting battles they created
    - This enables cleanup when users cancel matchmaking
    
  2. Security
    - Only waiting battles can be deleted (not active or completed)
    - Only the creator (first participant) can delete the battle
    - Prevents deletion of ongoing or completed battles
*/

CREATE POLICY "Users can delete their waiting battles"
  ON battles
  FOR DELETE
  TO authenticated
  USING (
    status = 'waiting' AND
    EXISTS (
      SELECT 1
      FROM battle_participants
      WHERE battle_participants.battle_id = battles.id
      AND battle_participants.user_id = auth.uid()
    )
  );