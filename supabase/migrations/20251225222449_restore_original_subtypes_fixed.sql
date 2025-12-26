/*
  # Restore Original Subtypes

  ## Summary
  This migration restores the original subtype system where subtypes match the type advantages
  (Fire->Electric, Water->ICE, Stone->Steel) instead of creature names.

  ## Changes
  1. Update moves table subtypes from creature names to advantage types
  2. Update check constraint to reflect new valid subtypes

  ## Subtype Mapping Changes
  - Fire moves: Phoenix -> Electric, Dragon -> Electric (all Fire moves now available to Electric subtype)
  - Water moves: Leviathan -> ICE, Mermaid -> ICE (all Water moves now available to ICE subtype)
  - Stone moves: Golem -> Steel, Gargoyle -> Steel (all Stone moves now available to Steel subtype)
  - Pixie moves: Fairy -> removed, Sprite -> removed (Pixie has no subtypes)
*/

-- Drop old constraint first
ALTER TABLE moves DROP CONSTRAINT IF EXISTS moves_subtype_check;

-- Update Fire subtypes
UPDATE moves SET subtype = 'Electric' WHERE card_type = 'Fire';

-- Update Water subtypes
UPDATE moves SET subtype = 'ICE' WHERE card_type = 'Water';

-- Update Stone subtypes
UPDATE moves SET subtype = 'Steel' WHERE card_type = 'Stone';

-- Delete Pixie moves since Pixie has no subtypes in original system
DELETE FROM moves WHERE card_type = 'Pixie';

-- Add new check constraint for valid subtypes
ALTER TABLE moves ADD CONSTRAINT moves_subtype_check 
  CHECK (subtype IN ('Electric', 'ICE', 'Steel'));