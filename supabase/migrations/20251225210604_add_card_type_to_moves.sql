/*
  # Add Card Type to Moves

  ## Summary
  This migration adds card type restrictions to moves, so that moves can only be used by specific card types.

  ## 1. Changes to Tables
  
  ### `moves` table modifications
  - Add `card_type` (text) - The card type that can use this move (Fire, Water, Stone, or Pixie)
  - Make card_type NOT NULL with a check constraint
  
  ## 2. Data Migration
  Reassign existing moves to appropriate card types:
  - **Fire** - Attack-focused moves (Fireball, Lightning Strike, Stone Smash, Water Cannon, Poison Cloud, Curse of Weakness)
  - **Water** - Healing and support moves (Healing Light, Nature's Blessing, Phoenix Revival, Water Regeneration, Water Cannon)
  - **Stone** - Defense-focused moves (Ice Shield, Steel Wall, Rock Armor, Stone Smash)
  - **Pixie** - Magical and debuff moves (Pixie Dust, Mystic Barrier, Paralysis, Confusion)

  ## 3. Security
  RLS policies remain unchanged as they already properly restrict access
*/

-- Add card_type column to moves table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'moves' AND column_name = 'card_type'
  ) THEN
    ALTER TABLE moves ADD COLUMN card_type text;
  END IF;
END $$;

-- Update existing moves with card types
UPDATE moves SET card_type = 'Fire' WHERE name IN ('Fireball', 'Lightning Strike', 'Poison Cloud', 'Curse of Weakness');
UPDATE moves SET card_type = 'Water' WHERE name IN ('Healing Light', 'Nature''s Blessing', 'Phoenix Revival', 'Water Regeneration', 'Water Cannon');
UPDATE moves SET card_type = 'Stone' WHERE name IN ('Stone Smash', 'Steel Wall', 'Rock Armor', 'Ice Shield');
UPDATE moves SET card_type = 'Pixie' WHERE name IN ('Pixie Dust', 'Mystic Barrier', 'Paralysis', 'Confusion');

-- Add NOT NULL constraint and check constraint
ALTER TABLE moves ALTER COLUMN card_type SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'moves_card_type_check'
  ) THEN
    ALTER TABLE moves ADD CONSTRAINT moves_card_type_check 
      CHECK (card_type IN ('Fire', 'Water', 'Stone', 'Pixie'));
  END IF;
END $$;

-- Create index for filtering moves by card type
CREATE INDEX IF NOT EXISTS idx_moves_card_type ON moves(card_type);