import { useState, useEffect } from 'react';
import { supabase, CardType, TYPE_ADVANTAGES, TYPE_SUBTYPES } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, Zap, Shield, Gauge, Tag, Swords } from 'lucide-react';

interface CardCreatorProps {
  onCardCreated: () => void;
}

interface Move {
  id: string;
  name: string;
  description: string;
  move_type: 'attack' | 'defense' | 'heal' | 'debuff';
  power: number;
  card_type: CardType;
  subtype: string;
}

export default function CardCreator({ onCardCreated }: CardCreatorProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [cardType, setCardType] = useState<CardType>('Pixie');
  const [cardSubtype, setCardSubtype] = useState('');
  const [attack, setAttack] = useState(50);
  const [defense, setDefense] = useState(25);
  const [speed, setSpeed] = useState(50);
  const [availableMoves, setAvailableMoves] = useState<Move[]>([]);
  const [selectedMoves, setSelectedMoves] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalStats = attack + defense + speed;
  const maxStats = 200;
  const remainingPoints = maxStats - totalStats;

  useEffect(() => {
    fetchMoves();
    setSelectedMoves([]);
  }, [cardType, cardSubtype]);

  const fetchMoves = async () => {
    let query = supabase
      .from('moves')
      .select('*')
      .eq('card_type', cardType);

    if (cardSubtype) {
      query = query.or(`subtype.is.null,subtype.eq.${cardSubtype}`);
    } else {
      query = query.is('subtype', null);
    }

    const { data, error } = await query.order('move_type', { ascending: true });

    if (data && !error) {
      setAvailableMoves(data);
    }
  };

  const toggleMove = (moveId: string) => {
    setSelectedMoves(prev => {
      if (prev.includes(moveId)) {
        return prev.filter(id => id !== moveId);
      }
      if (prev.length >= 4) {
        setError('You can only select up to 4 moves');
        return prev;
      }
      setError('');
      return [...prev, moveId];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (totalStats > maxStats) {
      setError(`Total stats cannot exceed ${maxStats}. You have ${totalStats - maxStats} too many points.`);
      return;
    }

    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const { data: cardData, error: insertError } = await supabase.from('cards').insert({
        user_id: user.id,
        name,
        image_url: imageUrl,
        hp: 500,
        attack,
        defense,
        speed,
        card_type: cardType,
        card_subtype: cardSubtype,
      }).select().single();

      if (insertError) throw insertError;

      if (selectedMoves.length > 0 && cardData) {
        const cardMoves = selectedMoves.map(moveId => ({
          card_id: cardData.id,
          move_id: moveId,
        }));

        const { error: movesError } = await supabase
          .from('card_moves')
          .insert(cardMoves);

        if (movesError) throw movesError;
      }

      setName('');
      setImageUrl('');
      setCardType('Pixie');
      setCardSubtype('');
      setAttack(50);
      setDefense(25);
      setSpeed(50);
      setSelectedMoves([]);
      onCardCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create card');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-amber-500 p-2 rounded-lg">
          <Sparkles className="w-6 h-6 text-slate-900" />
        </div>
        <h2 className="text-2xl font-bold text-white">Create Your Card</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Character Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={50}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Enter character name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Image URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <Tag className="w-4 h-4 text-cyan-400" />
                Card Type
              </label>
              <select
                value={cardType}
                onChange={(e) => setCardType(e.target.value as CardType)}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="Fire">Fire</option>
                <option value="Water">Water</option>
                <option value="Stone">Stone</option>
                <option value="Pixie">Pixie</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Subtype
              </label>
              <select
                value={cardSubtype}
                onChange={(e) => setCardSubtype(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">None (Base moves)</option>
                {TYPE_SUBTYPES[cardType].map((subtype) => (
                  <option key={subtype} value={subtype}>
                    {subtype}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
              <p className="text-sm text-slate-400 mb-2">
                Stat Points: <span className={remainingPoints < 0 ? 'text-red-400' : 'text-green-400'}>{remainingPoints}/{maxStats}</span>
              </p>

              <div className="space-y-3">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Attack: {attack}
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={attack}
                    onChange={(e) => setAttack(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                    <Shield className="w-4 h-4 text-blue-400" />
                    Defense: {defense}
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={defense}
                    onChange={(e) => setDefense(Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                    <Gauge className="w-4 h-4 text-green-400" />
                    Speed: {speed}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    className="w-full accent-green-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 bg-slate-900 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Swords className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-semibold text-white">Select Moves</h3>
              <span className="text-sm text-slate-400">({selectedMoves.length}/4)</span>
            </div>
            <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {cardSubtype ? `${cardSubtype} Moves` : 'Base Moves'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
            {availableMoves.length === 0 && (
              <div className="col-span-2 text-center py-8 text-slate-400">
                No moves available
              </div>
            )}
            {availableMoves.map((move) => {
              const isSelected = selectedMoves.includes(move.id);
              const moveTypeColors = {
                attack: 'border-red-500 bg-red-500/10',
                defense: 'border-blue-500 bg-blue-500/10',
                heal: 'border-green-500 bg-green-500/10',
                debuff: 'border-purple-500 bg-purple-500/10',
              };

              return (
                <button
                  key={move.id}
                  type="button"
                  onClick={() => toggleMove(move.id)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    isSelected
                      ? `${moveTypeColors[move.move_type]} ring-2 ring-amber-400`
                      : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white text-sm">{move.name}</h4>
                      <p className="text-xs text-slate-400 mt-1">{move.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                          {move.move_type}
                        </span>
                        <span className="text-xs text-amber-400">
                          Power: {move.power}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || remainingPoints < 0}
          className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-amber-500/50"
        >
          {loading ? 'Creating...' : 'Create Card'}
        </button>
      </form>
    </div>
  );
}
