import { Card, CardType } from '../lib/supabase';
import { Heart, Zap, Shield, Gauge, Sparkles } from 'lucide-react';

interface CardDisplayProps {
  card: Card;
  currentHp?: number;
  onClick?: () => void;
  selected?: boolean;
  inBattle?: boolean;
}

export default function CardDisplay({ card, currentHp, onClick, selected, inBattle }: CardDisplayProps) {
  const displayHp = currentHp ?? card.hp;
  const hpPercentage = (displayHp / card.hp) * 100;

  const getAbilityColor = (type: string) => {
    switch (type) {
      case 'attack': return 'text-red-400 bg-red-500/20 border-red-500/50';
      case 'defense': return 'text-blue-400 bg-blue-500/20 border-blue-500/50';
      case 'heal': return 'text-green-400 bg-green-500/20 border-green-500/50';
      case 'debuff': return 'text-purple-400 bg-purple-500/20 border-purple-500/50';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/50';
    }
  };

  const getTypeColor = (type: CardType) => {
    switch (type) {
      case 'Fire': return 'bg-orange-500 text-white';
      case 'Water': return 'bg-blue-500 text-white';
      case 'Stone': return 'bg-stone-600 text-white';
      case 'Electric': return 'bg-yellow-400 text-slate-900';
      case 'ICE': return 'bg-cyan-400 text-slate-900';
      case 'Steel': return 'bg-slate-400 text-slate-900';
      case 'Pixie': return 'bg-pink-400 text-slate-900';
      default: return 'bg-slate-500 text-white';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border-2 overflow-hidden transition-all transform hover:scale-105 shadow-xl ${
        selected ? 'border-amber-500 shadow-amber-500/50 scale-105' : 'border-slate-700'
      } ${onClick ? 'cursor-pointer' : ''} ${inBattle ? 'w-64' : 'w-full'}`}
    >
      {card.image_url && (
        <div className="relative h-48 overflow-hidden bg-slate-900">
          <img
            src={card.image_url}
            alt={card.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
        </div>
      )}

      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">{card.name}</h3>
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded text-xs font-bold ${getTypeColor(card.card_type)}`}>
              {card.card_type}
            </span>
            {card.card_subtype && (
              <span className="px-2 py-1 rounded text-xs font-semibold bg-slate-700 text-slate-300">
                {card.card_subtype}
              </span>
            )}
          </div>
          {inBattle && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">HP</span>
                <span className={`font-bold ${hpPercentage > 50 ? 'text-green-400' : hpPercentage > 25 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {displayHp} / {card.hp}
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all ${hpPercentage > 50 ? 'bg-green-500' : hpPercentage > 25 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${hpPercentage}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-900/50 rounded-lg p-2 flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-400" />
            <div>
              <p className="text-xs text-slate-400">HP</p>
              <p className="text-sm font-bold text-white">{card.hp}</p>
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-2 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <div>
              <p className="text-xs text-slate-400">ATK</p>
              <p className="text-sm font-bold text-white">{card.attack}</p>
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400" />
            <div>
              <p className="text-xs text-slate-400">DEF</p>
              <p className="text-sm font-bold text-white">{card.defense}</p>
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-2 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-green-400" />
            <div>
              <p className="text-xs text-slate-400">SPD</p>
              <p className="text-sm font-bold text-white">{card.speed}</p>
            </div>
          </div>
        </div>

        {card.special_ability && (
          <div className={`rounded-lg p-3 border ${getAbilityColor(card.ability_type)}`}>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase">{card.ability_type}</span>
              <span className="ml-auto text-sm font-bold">{card.ability_power}</span>
            </div>
            <p className="text-xs text-slate-300">{card.special_ability}</p>
          </div>
        )}
      </div>

      {selected && (
        <div className="absolute top-2 right-2 bg-amber-500 text-slate-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg">
          SELECTED
        </div>
      )}
    </div>
  );
}
