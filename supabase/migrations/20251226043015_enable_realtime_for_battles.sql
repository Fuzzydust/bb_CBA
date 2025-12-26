/*
  # Enable Realtime for Battle Tables

  1. Changes
    - Enable realtime replication for battles table
    - Enable realtime replication for battle_participants table
    
  2. Purpose
    - Allow real-time updates to propagate to all connected clients
    - Ensure both players see battle state changes immediately
*/

ALTER PUBLICATION supabase_realtime ADD TABLE battles;
ALTER PUBLICATION supabase_realtime ADD TABLE battle_participants;
