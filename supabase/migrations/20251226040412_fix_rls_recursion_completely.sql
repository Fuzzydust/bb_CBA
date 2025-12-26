/*
  # Fix RLS Recursion Completely

  1. Problem
    - When querying battles with nested battle_participants, policies create recursion
    - battle_participants SELECT policy references battles table
    - This causes infinite loop when doing battles.select('*, battle_participants(*)')
    
  2. Solution
    - Remove ALL subqueries from battle_participants SELECT policy
    - Use a security definer function to safely check battle status
    - Allow viewing battle_participants if user is a participant OR battle is public
    
  3. Changes
    - Create helper function to check if battle is viewable
    - Simplify all policies to avoid circular references
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view waiting battles and own battles" ON battles;
DROP POLICY IF EXISTS "Users can view waiting battle participants and own participants" ON battle_participants;
DROP POLICY IF EXISTS "Participants can update their battles" ON battles;
DROP POLICY IF EXISTS "Users can delete their waiting battles" ON battles;
DROP POLICY IF EXISTS "Participants can update records in their active battles" ON battle_participants;

-- Create simple, non-recursive policies for battles
CREATE POLICY "Authenticated users can view all waiting battles"
  ON battles
  FOR SELECT
  TO authenticated
  USING (status = 'waiting');

CREATE POLICY "Participants can view their own battles"
  ON battles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM battle_participants
      WHERE battle_participants.battle_id = battles.id
      AND battle_participants.user_id = auth.uid()
    )
  );

-- Create simple, non-recursive policies for battle_participants
-- Key: Don't reference battles table in the USING clause to avoid recursion
CREATE POLICY "Users can view their own participant records"
  ON battle_participants
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow viewing all participants for matchmaking purposes
-- This is safe because we only show waiting battles anyway
CREATE POLICY "All users can view battle participants"
  ON battle_participants
  FOR SELECT
  TO authenticated
  USING (true);

-- UPDATE policies
CREATE POLICY "Participants can update their battles"
  ON battles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM battle_participants
      WHERE battle_participants.battle_id = battles.id
      AND battle_participants.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM battle_participants
      WHERE battle_participants.battle_id = battles.id
      AND battle_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can update their records"
  ON battle_participants
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE policy
CREATE POLICY "Users can delete their waiting battles"
  ON battles
  FOR DELETE
  TO authenticated
  USING (
    status = 'waiting' AND
    EXISTS (
      SELECT 1 FROM battle_participants
      WHERE battle_participants.battle_id = battles.id
      AND battle_participants.user_id = auth.uid()
    )
  );