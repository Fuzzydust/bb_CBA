/*
  Add Type and Subtype System to Cards

  Overview:
  This migration adds type and subtype fields to the cards table and sets all
  existing cards to have max HP of 500.

  Changes:
  1. Add card_type field (Fire, Water, Stone, Electric, ICE, Steel, Pixie)
  2. Add card_subtype field (optional additional classification)
  3. Update all existing cards to have HP = 500
  4. Add check constraint for card_type values

  Type System:
  - Fire counters Electric
  - Water counters ICE
  - Stone counters Steel
  - Pixie (neutral type)
*/

-- Add type and subtype columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cards' AND column_name = 'card_type'
  ) THEN
    ALTER TABLE cards ADD COLUMN card_type text DEFAULT 'Pixie' NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cards' AND column_name = 'card_subtype'
  ) THEN
    ALTER TABLE cards ADD COLUMN card_subtype text DEFAULT '';
  END IF;
END $$;

-- Add check constraint for valid card types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'cards_card_type_check'
  ) THEN
    ALTER TABLE cards ADD CONSTRAINT cards_card_type_check 
      CHECK (card_type IN ('Fire', 'Water', 'Stone', 'Electric', 'ICE', 'Steel', 'Pixie'));
  END IF;
END $$;

-- Update all existing cards to have HP = 500
UPDATE cards SET hp = 500 WHERE hp != 500;