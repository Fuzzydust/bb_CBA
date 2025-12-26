import { useEffect, useState } from 'react';
import { supabase, Card } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import CardDisplay from './CardDisplay';
import { Library, Trash2 } from 'lucide-react';

interface CardCollectionProps {
  onSelectCard?: (card: Card) => void;
  selectedCardId?: string;
  selectionMode?: boolean;
}

export default function CardCollection({ onSelectCard, selectedCardId, selectionMode }: CardCollectionProps) {
  const { user } = useAuth();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCards = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCards(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCards();
  }, [user]);

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Are you sure you want to delete this card?')) return;

    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', cardId);

    if (!error) {
      setCards(cards.filter(c => c.id !== cardId));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-amber-500 p-2 rounded-lg">
          <Library className="w-6 h-6 text-slate-900" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Your Cards</h2>
          <p className="text-slate-400 text-sm">{cards.length} {cards.length === 1 ? 'card' : 'cards'} in collection</p>
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-12 text-center">
          <Library className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Cards Yet</h3>
          <p className="text-slate-400">Create your first character card to start battling!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div key={card.id} className="relative group">
              <CardDisplay
                card={card}
                onClick={onSelectCard ? () => onSelectCard(card) : undefined}
                selected={selectedCardId === card.id}
              />
              {!selectionMode && (
                <button
                  onClick={() => handleDeleteCard(card.id)}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  title="Delete card"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
