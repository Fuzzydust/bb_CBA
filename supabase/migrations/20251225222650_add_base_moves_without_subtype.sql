/*
  # Add Base Moves Without Subtype

  ## Summary
  This migration adds basic moves for each card type that don't require a subtype,
  allowing cards to be created without selecting a subtype.

  ## Changes
  1. Allow NULL subtypes in moves table
  2. Add 4 base moves for each main card type (Fire, Water, Stone, Pixie)
  3. Update check constraint to include NULL as valid subtype

  ## New Moves
  ### Fire (no subtype)
  - Flame Burst (attack, 55)
  - Heat Wave (attack, 50)
  - Fire Shield (defense, 40)
  - Burn (debuff, 35)

  ### Water (no subtype)
  - Water Splash (attack, 50)
  - Aqua Shield (defense, 45)
  - Refresh (heal, 45)
  - Soak (debuff, 30)

  ### Stone (no subtype)
  - Rock Throw (attack, 60)
  - Stone Guard (defense, 50)
  - Boulder Smash (attack, 55)
  - Sand Attack (debuff, 25)

  ### Pixie (no subtype)
  - Pixie Dust (attack, 50)
  - Mystic Barrier (defense, 55)
  - Sparkle Heal (heal, 50)
  - Charm (debuff, 40)
*/

-- Drop old constraint
ALTER TABLE moves DROP CONSTRAINT IF EXISTS moves_subtype_check;

-- Allow NULL subtypes
ALTER TABLE moves ALTER COLUMN subtype DROP NOT NULL;

-- Add base moves for Fire
INSERT INTO moves (name, description, move_type, power, card_type, subtype) VALUES
('Flame Burst', 'Release a burst of flames', 'attack', 55, 'Fire', NULL),
('Heat Wave', 'Emit an intense wave of heat', 'attack', 50, 'Fire', NULL),
('Fire Shield', 'Surround yourself with protective flames', 'defense', 40, 'Fire', NULL),
('Burn', 'Inflict a burning status effect', 'debuff', 35, 'Fire', NULL);

-- Add base moves for Water
INSERT INTO moves (name, description, move_type, power, card_type, subtype) VALUES
('Water Splash', 'Splash water at the opponent', 'attack', 50, 'Water', NULL),
('Aqua Shield', 'Create a protective water barrier', 'defense', 45, 'Water', NULL),
('Refresh', 'Restore health with cool water', 'heal', 45, 'Water', NULL),
('Soak', 'Drench the opponent, reducing speed', 'debuff', 30, 'Water', NULL);

-- Add base moves for Stone
INSERT INTO moves (name, description, move_type, power, card_type, subtype) VALUES
('Rock Throw', 'Hurl a large rock at the enemy', 'attack', 60, 'Stone', NULL),
('Stone Guard', 'Create a protective stone wall', 'defense', 50, 'Stone', NULL),
('Boulder Smash', 'Smash with a massive boulder', 'attack', 55, 'Stone', NULL),
('Sand Attack', 'Throw sand to reduce accuracy', 'debuff', 25, 'Stone', NULL);

-- Add base moves for Pixie
INSERT INTO moves (name, description, move_type, power, card_type, subtype) VALUES
('Pixie Dust', 'Sprinkle magical pixie dust', 'attack', 50, 'Pixie', NULL),
('Mystic Barrier', 'Create a magical protective barrier', 'defense', 55, 'Pixie', NULL),
('Sparkle Heal', 'Heal with sparkling magic', 'heal', 50, 'Pixie', NULL),
('Charm', 'Charm the opponent, reducing attack', 'debuff', 40, 'Pixie', NULL);

-- Add new check constraint that allows NULL
ALTER TABLE moves ADD CONSTRAINT moves_subtype_check 
  CHECK (subtype IS NULL OR subtype IN ('Electric', 'ICE', 'Steel'));