/*
  # Enable Realtime for Battle Turns
  
  1. Changes
    - Enable realtime replication for battle_turns table
    
  2. Purpose
    - Allow real-time updates when players take turns
    - Ensure both players see turn actions immediately
*/

ALTER PUBLICATION supabase_realtime ADD TABLE battle_turns;
