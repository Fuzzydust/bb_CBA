import { useEffect, useState, useRef } from 'react';
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
  const waitingBattleIdRef = useRef<string | null>(null);

  useEffect(() => {
    waitingBattleIdRef.current = waitingBattleId;
  }, [waitingBattleId]);

  useEffect(() => {
    if (!searching || !waitingBattleId) return;

    const checkBattleStatus = async () => {
      const { data } = await supabase
        .from('battles')
        .select('status')
        .eq('id', waitingBattleId)
        .maybeSingle();

      if (data?.status === 'active') {
        waitingBattleIdRef.current = null;
        setSearching(false);
        setWaitingBattleId(null);
        onBattleStart(waitingBattleId);
      }
    };

    checkBattleStatus();

    const interval = setInterval(checkBattleStatus, 1000);

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
            waitingBattleIdRef.current = null;
            setSearching(false);
            setWaitingBattleId(null);
            onBattleStart(battle.id);
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [searching, waitingBattleId, onBattleStart]);

  useEffect(() => {
    return () => {
      if (waitingBattleIdRef.current) {
        supabase
          .from('battles')
          .delete()
          .eq('id', waitingBattleIdRef.current)
          .eq('status', 'waiting');
      }
    };
  }, []);

  const findOrCreateBattle = async () => {
    if (!selectedCard || !user) return;

    setSearching(true);

    const { data: waitingBattles, error: searchError } = await supabase
      .from('battles')
      .select('*, battle_participants(*)')
      .eq('status', 'waiting')
      .limit(1)
      .maybeSingle();

    if (searchError) {
      setSearching(false);
      return;
    }

    if (waitingBattles) {
      const participants = waitingBattles.battle_participants as BattleParticipant[];
      const existingParticipant = participants[0];

      if (existingParticipant && existingParticipant.user_id !== user.id) {
        const { error: participantError } = await supabase
          .from('battle_participants')
          .insert({
            battle_id: waitingBattles.id,
            user_id: user.id,
            card_id: selectedCard.id,
            current_hp: selectedCard.hp,
            position: 2,
          });

        if (participantError) {
          setSearching(false);
          findOrCreateBattle();
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
          .eq('battle_id', waitingBattles.id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (newParticipants) {
          speeds[1].id = newParticipants.id;
        }

        const firstTurn = speeds[0].speed >= speeds[1].speed ? speeds[0].id : speeds[1].id;

        await supabase
          .from('battles')
          .update({ status: 'active', current_turn: firstTurn })
          .eq('id', waitingBattles.id);

        waitingBattleIdRef.current = null;
        setSearching(false);
        onBattleStart(waitingBattles.id);
      } else {
        setSearching(false);
        findOrCreateBattle();
      }
    } else {
      const { data: newBattle, error: battleError } = await supabase
        .from('battles')
        .insert({ status: 'waiting' })
        .select()
        .single();

      if (battleError || !newBattle) {
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
        setSearching(false);
        return;
      }

      setWaitingBattleId(newBattle.id);
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
    waitingBattleIdRef.current = null;
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
