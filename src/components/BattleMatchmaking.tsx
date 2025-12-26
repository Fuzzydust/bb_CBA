import { useEffect, useState } from 'react';
import { supabase, Card, Battle, BattleParticipant } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import CardCollection from './CardCollection';
import { Swords, Loader2, Users } from 'lucide-react';

interface BattleMatchmakingProps {
  onBattleStart: (battleId: string) => void;
}

export default function BattleMatchmaking({ onBattleStart }: BattleMatchmakingProps) {
  const { user } = useAuth();
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [searching, setSearching] = useState(false);
  const [waitingBattleId, setWaitingBattleId] = useState<string | null>(null);

  useEffect(() => {
    if (!searching || !waitingBattleId) return;

    const channel = supabase
      .channel('battle-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'battles',
          filter: `id=eq.${waitingBattleId}`,
        },
        (payload) => {
          const battle = payload.new as Battle;
          if (battle.status === 'active') {
            setSearching(false);
            setWaitingBattleId(null);
            onBattleStart(battle.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [searching, waitingBattleId, onBattleStart]);

  const findOrCreateBattle = async () => {
    if (!selectedCard || !user) return;

    try {
      setSearching(true);

      const { data: waitingBattles, error: fetchError } = await supabase
        .from('battles')
        .select('id, status, battle_participants(id, user_id, card_id)')
        .eq('status', 'waiting')
        .limit(10);

      if (fetchError) {
        console.error('Error fetching battles:', fetchError);
        setSearching(false);
        return;
      }

      let suitableBattle = null;
      if (waitingBattles && waitingBattles.length > 0) {
        for (const battle of waitingBattles) {
          const participants = battle.battle_participants as BattleParticipant[];
          if (participants.length === 1 && participants[0].user_id !== user.id) {
            suitableBattle = battle;
            break;
          }
        }
      }

      if (suitableBattle) {
        const participants = suitableBattle.battle_participants as BattleParticipant[];
        const existingParticipant = participants[0];

        const { error: participantError } = await supabase
          .from('battle_participants')
          .insert({
            battle_id: suitableBattle.id,
            user_id: user.id,
            card_id: selectedCard.id,
            current_hp: selectedCard.hp,
            position: 2,
          });

        if (participantError) {
          console.error('Error adding participant:', participantError);
          setSearching(false);
          return;
        }

        const speeds = [
          { id: existingParticipant.id, speed: 0 },
          { id: '', speed: selectedCard.speed }
        ];

        const { data: existingCard } = await supabase
          .from('cards')
          .select('speed')
          .eq('id', existingParticipant.card_id)
          .maybeSingle();

        if (existingCard) {
          speeds[0].speed = existingCard.speed;
        }

        const { data: newParticipants } = await supabase
          .from('battle_participants')
          .select('id')
          .eq('battle_id', suitableBattle.id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (newParticipants) {
          speeds[1].id = newParticipants.id;
        }

        const firstTurn = speeds[0].speed >= speeds[1].speed ? speeds[0].id : speeds[1].id;

        const { error: updateError } = await supabase
          .from('battles')
          .update({ status: 'active', current_turn: firstTurn })
          .eq('id', suitableBattle.id);

        if (updateError) {
          console.error('Error updating battle:', updateError);
          setSearching(false);
          return;
        }

        setSearching(false);
        onBattleStart(suitableBattle.id);
      } else {
        const { data: newBattle, error: battleError } = await supabase
          .from('battles')
          .insert({ status: 'waiting' })
          .select()
          .single();

        if (battleError || !newBattle) {
          console.error('Error creating battle:', battleError);
          setSearching(false);
          return;
        }

        const { error: participantError } = await supabase
          .from('battle_participants')
          .insert({
            battle_id: newBattle.id,
            user_id: user.id,
            card_id: selectedCard.id,
            current_hp: selectedCard.hp,
            position: 1,
          });

        if (participantError) {
          console.error('Error adding participant:', participantError);
          setSearching(false);
          return;
        }

        setWaitingBattleId(newBattle.id);
      }
    } catch (error) {
      console.error('Unexpected error in findOrCreateBattle:', error);
      setSearching(false);
    }
  };

  const cancelSearch = async () => {
    if (waitingBattleId) {
      await supabase
        .from('battles')
        .delete()
        .eq('id', waitingBattleId);
    }
    setSearching(false);
    setWaitingBattleId(null);
  };

  if (searching) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-amber-500 blur-3xl opacity-20 animate-pulse"></div>
            <Loader2 className="w-24 h-24 text-amber-500 animate-spin mx-auto relative" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Searching for Opponent</h2>
            <p className="text-slate-400">Finding a worthy challenger...</p>
          </div>
          <button
            onClick={cancelSearch}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Cancel Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-amber-500 p-2 rounded-lg">
            <Users className="w-6 h-6 text-slate-900" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Find a Battle</h2>
            <p className="text-slate-400 text-sm">Select a card and search for an opponent</p>
          </div>
        </div>

        {selectedCard ? (
          <div className="flex items-center justify-between bg-slate-900 rounded-lg p-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center">
                {selectedCard.image_url ? (
                  <img src={selectedCard.image_url} alt={selectedCard.name} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <Swords className="w-8 h-8 text-slate-600" />
                )}
              </div>
              <div>
                <p className="font-bold text-white">{selectedCard.name}</p>
                <p className="text-sm text-slate-400">HP: {selectedCard.hp} | ATK: {selectedCard.attack}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedCard(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Change
              </button>
              <button
                onClick={findOrCreateBattle}
                className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-amber-500/50"
              >
                Find Battle
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            Select a card from your collection below
          </div>
        )}
      </div>

      <CardCollection
        onSelectCard={setSelectedCard}
        selectedCardId={selectedCard?.id}
        selectionMode
      />
    </div>
  );
}
