/*
  # Simplify Battle Participants SELECT Policy for Realtime
  
  1. Problem
    - Two SELECT policies on battle_participants can confuse Supabase Realtime
    - Player 2 not receiving realtime updates even though subscribed
    
  2. Solution  
    - Drop the restrictive "Users can view their own participant records" policy
    - Keep only the permissive "All users can view battle participants" policy
    - This ensures consistent realtime event delivery to all battle participants
    
  3. Security
    - All authenticated users can view all battle participants
    - This is necessary for battle functionality (seeing opponent cards)
    - Still secure because battles are between matched players
*/

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can view their own participant records" ON battle_participants;

-- The permissive policy "All users can view battle participants" remains and allows all users to see all participants
