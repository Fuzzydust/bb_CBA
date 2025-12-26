/*
  # Allow viewing opponent cards in battles

  1. Changes
    - Add policy to allow users to view cards of opponents in battles they're participating in
  
  2. Security
    - Users can only view cards from battles they are actively participating in
    - Maintains data privacy while enabling battle functionality
*/

CREATE POLICY "Users can view cards in their battles"
  ON cards FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM battle_participants bp1
      INNER JOIN battle_participants bp2 ON bp1.battle_id = bp2.battle_id
      WHERE bp1.user_id = auth.uid()
      AND bp2.card_id = cards.id
    )
  );
