/*
  Card Fighting Game Schema
  
  Overview:
  This migration creates the complete database schema for a card-based fighting game
  where players create character cards and battle against each other.

  New Tables:
  
  1. cards - Stores player-created character cards with stats and abilities
  2. battles - Tracks active and completed battles between players
  3. battle_participants - Links players and their cards to battles
  4. battle_turns - Records each action taken during battles

  Security:
  - All tables have RLS enabled
  - Users can only create/read their own cards
  - Battle data is readable by participants only
*/

-- Create cards table
CREATE TABLE IF NOT EXISTS cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  image_url text DEFAULT '',
  hp integer NOT NULL CHECK (hp BETWEEN 100 AND 500),
  attack integer NOT NULL CHECK (attack BETWEEN 10 AND 100),
  defense integer NOT NULL CHECK (defense BETWEEN 5 AND 50),
  speed integer NOT NULL CHECK (speed BETWEEN 1 AND 100),
  special_ability text DEFAULT '',
  ability_type text DEFAULT 'attack' CHECK (ability_type IN ('attack', 'defense', 'heal', 'debuff')),
  ability_power integer DEFAULT 0 CHECK (ability_power >= 0),
  created_at timestamptz DEFAULT now()
);

-- Create battles table
CREATE TABLE IF NOT EXISTS battles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed')),
  current_turn uuid,
  winner_id uuid,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create battle_participants table
CREATE TABLE IF NOT EXISTS battle_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id uuid REFERENCES battles(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  card_id uuid REFERENCES cards(id) ON DELETE CASCADE NOT NULL,
  current_hp integer NOT NULL,
  position integer NOT NULL CHECK (position IN (1, 2)),
  has_used_ability boolean DEFAULT false,
  UNIQUE(battle_id, position)
);

-- Create battle_turns table
CREATE TABLE IF NOT EXISTS battle_turns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id uuid REFERENCES battles(id) ON DELETE CASCADE NOT NULL,
  participant_id uuid REFERENCES battle_participants(id) ON DELETE CASCADE NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('attack', 'ability', 'defend')),
  damage_dealt integer DEFAULT 0,
  turn_number integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_turns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cards
CREATE POLICY "Users can view own cards"
  ON cards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cards"
  ON cards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cards"
  ON cards FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cards"
  ON cards FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for battles
CREATE POLICY "Users can view their battles"
  ON battles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM battle_participants
      WHERE battle_participants.battle_id = battles.id
      AND battle_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create battles"
  ON battles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Participants can update their battles"
  ON battles FOR UPDATE
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

-- RLS Policies for battle_participants
CREATE POLICY "Users can view battle participants in their battles"
  ON battle_participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM battle_participants bp
      WHERE bp.battle_id = battle_participants.battle_id
      AND bp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join battles"
  ON battle_participants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their participation"
  ON battle_participants FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for battle_turns
CREATE POLICY "Users can view turns in their battles"
  ON battle_turns FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM battle_participants
      WHERE battle_participants.battle_id = battle_turns.battle_id
      AND battle_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert turns in their battles"
  ON battle_turns FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM battle_participants
      WHERE battle_participants.id = participant_id
      AND battle_participants.user_id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);
CREATE INDEX IF NOT EXISTS idx_battles_status ON battles(status);
CREATE INDEX IF NOT EXISTS idx_battle_participants_battle_id ON battle_participants(battle_id);
CREATE INDEX IF NOT EXISTS idx_battle_participants_user_id ON battle_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_battle_turns_battle_id ON battle_turns(battle_id);