/*
  # Create Moves System

  ## Summary
  This migration creates a moves system for cards, allowing players to assign multiple moves to their cards from a predefined list.

  ## 1. New Tables
  
  ### `moves`
  - `id` (uuid, primary key) - Unique identifier for each move
  - `name` (text) - Name of the move
  - `description` (text) - Description of what the move does
  - `move_type` (text) - Type of move: attack, defense, heal, or debuff
  - `power` (integer) - Power/effectiveness of the move (10-100)
  - `created_at` (timestamptz) - When the move was created
  
  ### `card_moves`
  - `id` (uuid, primary key) - Unique identifier for the card-move relationship
  - `card_id` (uuid, foreign key) - Reference to the card
  - `move_id` (uuid, foreign key) - Reference to the move
  - `created_at` (timestamptz) - When the move was added to the card

  ## 2. Security
  - Enable RLS on both `moves` and `card_moves` tables
  - `moves` table: Public read access (all users can view available moves)
  - `card_moves` table: Users can only manage moves for their own cards

  ## 3. Default Moves
  Seed the database with 12 default moves (3 per type):
  - Attack moves: Fireball, Lightning Strike, Stone Smash
  - Defense moves: Ice Shield, Steel Wall, Mystic Barrier
  - Heal moves: Healing Light, Nature's Blessing, Phoenix Revival
  - Debuff moves: Poison Cloud, Paralysis, Curse of Weakness
*/

-- Create moves table
CREATE TABLE IF NOT EXISTS moves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  move_type text NOT NULL CHECK (move_type IN ('attack', 'defense', 'heal', 'debuff')),
  power integer NOT NULL CHECK (power >= 10 AND power <= 100),
  created_at timestamptz DEFAULT now()
);

-- Create card_moves junction table
CREATE TABLE IF NOT EXISTS card_moves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  move_id uuid NOT NULL REFERENCES moves(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(card_id, move_id)
);

-- Enable RLS
ALTER TABLE moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_moves ENABLE ROW LEVEL SECURITY;

-- RLS Policies for moves table
CREATE POLICY "Anyone can view moves"
  ON moves FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for card_moves table
CREATE POLICY "Users can view moves for any card"
  ON card_moves FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can add moves to their own cards"
  ON card_moves FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cards
      WHERE cards.id = card_moves.card_id
      AND cards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove moves from their own cards"
  ON card_moves FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cards
      WHERE cards.id = card_moves.card_id
      AND cards.user_id = auth.uid()
    )
  );

-- Seed default moves
INSERT INTO moves (name, description, move_type, power) VALUES
  -- Attack moves
  ('Fireball', 'Launch a blazing fireball at the opponent', 'attack', 60),
  ('Lightning Strike', 'Call down a powerful lightning bolt', 'attack', 70),
  ('Stone Smash', 'Crush the opponent with a massive stone', 'attack', 65),
  ('Water Cannon', 'Blast the enemy with high-pressure water', 'attack', 55),
  ('Pixie Dust', 'Magical dust that damages over time', 'attack', 50),
  
  -- Defense moves
  ('Ice Shield', 'Create a protective shield of ice', 'defense', 45),
  ('Steel Wall', 'Summon an impenetrable steel barrier', 'defense', 50),
  ('Mystic Barrier', 'Magical protection from all attacks', 'defense', 55),
  ('Rock Armor', 'Cover yourself in protective stone', 'defense', 40),
  
  -- Heal moves
  ('Healing Light', 'Restore health with radiant energy', 'heal', 60),
  ('Nature''s Blessing', 'Channel the power of nature to heal', 'heal', 55),
  ('Phoenix Revival', 'Rise from damage with renewed vigor', 'heal', 70),
  ('Water Regeneration', 'Slowly restore health over time', 'heal', 50),
  
  -- Debuff moves
  ('Poison Cloud', 'Release toxic fumes that weaken the enemy', 'debuff', 40),
  ('Paralysis', 'Stun the opponent, reducing their speed', 'debuff', 45),
  ('Curse of Weakness', 'Lower the enemy''s attack power', 'debuff', 50),
  ('Confusion', 'Disorient the opponent, reducing accuracy', 'debuff', 35);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_card_moves_card_id ON card_moves(card_id);
CREATE INDEX IF NOT EXISTS idx_card_moves_move_id ON card_moves(move_id);
CREATE INDEX IF NOT EXISTS idx_moves_type ON moves(move_type);