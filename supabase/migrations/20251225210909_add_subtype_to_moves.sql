/*
  # Add Subtype to Moves

  ## Summary
  This migration adds subtype restrictions to moves, so each subtype gets half of the main type's moves.

  ## 1. Changes to Tables
  
  ### `moves` table modifications
  - Add `subtype` (text, nullable) - The specific subtype that can use this move
  - Add check constraint to ensure valid subtypes
  
  ## 2. Data Migration
  Split existing moves between subtypes (each subtype gets half of main type moves):
  
  ### Fire Type (4 moves → 2 per subtype)
  - **Phoenix**: Fireball, Lightning Strike
  - **Dragon**: Poison Cloud, Curse of Weakness
  
  ### Water Type (5 moves → distributed)
  - **Leviathan**: Water Cannon, Water Regeneration, Healing Light
  - **Mermaid**: Nature's Blessing, Phoenix Revival
  
  ### Stone Type (4 moves → 2 per subtype)
  - **Golem**: Rock Armor, Steel Wall
  - **Gargoyle**: Stone Smash, Ice Shield
  
  ### Pixie Type (4 moves → 2 per subtype)
  - **Fairy**: Pixie Dust, Mystic Barrier
  - **Sprite**: Paralysis, Confusion

  ## 3. Security
  RLS policies remain unchanged as they already properly restrict access
*/

-- Add subtype column to moves table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'moves' AND column_name = 'subtype'
  ) THEN
    ALTER TABLE moves ADD COLUMN subtype text;
  END IF;
END $$;

-- Assign moves to Fire subtypes
UPDATE moves SET subtype = 'Phoenix' WHERE name IN ('Fireball', 'Lightning Strike');
UPDATE moves SET subtype = 'Dragon' WHERE name IN ('Poison Cloud', 'Curse of Weakness');

-- Assign moves to Water subtypes
UPDATE moves SET subtype = 'Leviathan' WHERE name IN ('Water Cannon', 'Water Regeneration', 'Healing Light');
UPDATE moves SET subtype = 'Mermaid' WHERE name IN ('Nature''s Blessing', 'Phoenix Revival');

-- Assign moves to Stone subtypes
UPDATE moves SET subtype = 'Golem' WHERE name IN ('Rock Armor', 'Steel Wall');
UPDATE moves SET subtype = 'Gargoyle' WHERE name IN ('Stone Smash', 'Ice Shield');

-- Assign moves to Pixie subtypes
UPDATE moves SET subtype = 'Fairy' WHERE name IN ('Pixie Dust', 'Mystic Barrier');
UPDATE moves SET subtype = 'Sprite' WHERE name IN ('Paralysis', 'Confusion');

-- Add NOT NULL constraint
ALTER TABLE moves ALTER COLUMN subtype SET NOT NULL;

-- Add check constraint for valid subtypes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'moves_subtype_check'
  ) THEN
    ALTER TABLE moves ADD CONSTRAINT moves_subtype_check 
      CHECK (subtype IN ('Phoenix', 'Dragon', 'Leviathan', 'Mermaid', 'Golem', 'Gargoyle', 'Fairy', 'Sprite'));
  END IF;
END $$;

-- Create index for filtering moves by subtype
CREATE INDEX IF NOT EXISTS idx_moves_subtype ON moves(subtype);

-- Create composite index for card_type and subtype
CREATE INDEX IF NOT EXISTS idx_moves_card_type_subtype ON moves(card_type, subtype);