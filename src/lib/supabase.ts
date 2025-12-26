import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type CardType = 'Fire' | 'Water' | 'Stone' | 'Electric' | 'ICE' | 'Steel' | 'Pixie';

export interface Card {
  id: string;
  user_id: string;
  name: string;
  image_url: string;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  special_ability: string;
  ability_type: 'attack' | 'defense' | 'heal' | 'debuff';
  ability_power: number;
  card_type: CardType;
  card_subtype: string;
  created_at: string;
}

export const TYPE_SUBTYPES: Record<CardType, string[]> = {
  Fire: ['Electric'],
  Water: ['ICE'],
  Stone: ['Steel'],
  Electric: [],
  ICE: [],
  Steel: [],
  Pixie: [],
};

export const TYPE_ADVANTAGES: Record<CardType, CardType | null> = {
  Fire: 'Electric',
  Water: 'ICE',
  Stone: 'Steel',
  Electric: null,
  ICE: null,
  Steel: null,
  Pixie: null,
};

export interface Battle {
  id: string;
  status: 'waiting' | 'active' | 'completed';
  current_turn: string | null;
  winner_id: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface BattleParticipant {
  id: string;
  battle_id: string;
  user_id: string;
  card_id: string;
  current_hp: number;
  position: number;
  has_used_ability: boolean;
  is_defending: boolean;
}

export interface BattleTurn {
  id: string;
  battle_id: string;
  participant_id: string;
  action_type: 'attack' | 'ability' | 'defend';
  damage_dealt: number;
  turn_number: number;
  created_at: string;
}
