/*
  # Fix Infinite Recursion in Battle Participants Policy

  1. Problem
    - The current policy has a nested query on battle_participants within the policy itself
    - This causes infinite recursion: policy checks battle_participants, which triggers the policy again
    
  2. Solution
    - Simplify the policy to avoid self-referencing
    - For waiting battles: allow all authenticated users to see participants (needed for matchmaking)
    - For active/completed battles: use a simpler check without nested battle_participants query
    
  3. Security
    - Waiting battle participants are visible for matchmaking
    - Active/completed battle participants require direct user_id check
*/

DROP POLICY IF EXISTS "Users can view participants in their battles and waiting battles" ON battle_participants;

CREATE POLICY "Users can view participants in waiting battles and own battles"
  ON battle_participants
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1
      FROM battles
      WHERE battles.id = battle_participants.battle_id
      AND battles.status = 'waiting'
    )
  );