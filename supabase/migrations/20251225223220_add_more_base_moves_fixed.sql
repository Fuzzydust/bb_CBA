/*
  # Add More Base Moves Without Subtype

  ## Summary
  This migration adds additional base moves for each card type to provide more variety
  when creating cards without a subtype.

  ## New Moves Added
  ### Fire (5 additional moves)
  - Ember Strike (attack, 45)
  - Inferno (attack, 65)
  - Smoke Screen (debuff, 35)
  - Flame Wall (defense, 45)
  - Scorch (debuff, 40)

  ### Water (5 additional moves)
  - Tidal Wave (attack, 60)
  - Water Pulse (attack, 45)
  - Mist Shield (defense, 40)
  - Cleanse (heal, 40)
  - Bubble Trap (debuff, 35)

  ### Stone (5 additional moves)
  - Earthquake (attack, 65)
  - Pebble Blast (attack, 45)
  - Sandstorm (debuff, 35)
  - Fortify (defense, 45)
  - Dust Cloud (debuff, 30)

  ### Pixie (5 additional moves)
  - Fairy Wind (attack, 45)
  - Moonbeam (attack, 60)
  - Magic Guard (defense, 40)
  - Wish (heal, 55)
  - Confuse (debuff, 35)

  ## Notes
  - All new moves have NULL subtype, making them available for base cards
  - Move types include attack, defense, heal, and debuff
  - Power values balanced to create interesting strategic choices
  - Total of 9 moves per card type (4 original + 5 new)
*/

-- Add more Fire base moves
INSERT INTO moves (name, description, move_type, power, card_type, subtype) VALUES
('Ember Strike', 'Strike with burning embers', 'attack', 45, 'Fire', NULL),
('Inferno', 'Unleash a devastating inferno', 'attack', 65, 'Fire', NULL),
('Smoke Screen', 'Create smoke to lower accuracy', 'debuff', 35, 'Fire', NULL),
('Flame Wall', 'Create a wall of protective flames', 'defense', 45, 'Fire', NULL),
('Scorch', 'Inflict severe burning damage', 'debuff', 40, 'Fire', NULL);

-- Add more Water base moves
INSERT INTO moves (name, description, move_type, power, card_type, subtype) VALUES
('Tidal Wave', 'Summon a massive tidal wave', 'attack', 60, 'Water', NULL),
('Water Pulse', 'Send out a pulsing water ring', 'attack', 45, 'Water', NULL),
('Mist Shield', 'Hide behind a protective mist', 'defense', 40, 'Water', NULL),
('Cleanse', 'Purify with healing waters', 'heal', 40, 'Water', NULL),
('Bubble Trap', 'Trap opponent in bubbles', 'debuff', 35, 'Water', NULL);

-- Add more Stone base moves
INSERT INTO moves (name, description, move_type, power, card_type, subtype) VALUES
('Earthquake', 'Create a powerful earthquake', 'attack', 65, 'Stone', NULL),
('Pebble Blast', 'Rapid fire small stones', 'attack', 45, 'Stone', NULL),
('Sandstorm', 'Create a blinding sandstorm', 'debuff', 35, 'Stone', NULL),
('Fortify', 'Strengthen defensive capabilities', 'defense', 45, 'Stone', NULL),
('Dust Cloud', 'Create a blinding dust storm', 'debuff', 30, 'Stone', NULL);

-- Add more Pixie base moves
INSERT INTO moves (name, description, move_type, power, card_type, subtype) VALUES
('Fairy Wind', 'Blow a magical fairy wind', 'attack', 45, 'Pixie', NULL),
('Moonbeam', 'Strike with concentrated moonlight', 'attack', 60, 'Pixie', NULL),
('Magic Guard', 'Create a mystical shield', 'defense', 40, 'Pixie', NULL),
('Wish', 'Make a wish to restore health', 'heal', 55, 'Pixie', NULL),
('Confuse', 'Confuse opponent with illusions', 'debuff', 35, 'Pixie', NULL);