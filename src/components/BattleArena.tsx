import { useEffect, useState } from 'react';
import { supabase, Card, Battle, BattleParticipant, TYPE_ADVANTAGES } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import CardDisplay from './CardDisplay';
import { Swords, Shield, Sparkles, Trophy, X, Zap } from 'lucide-react';

interface BattleArenaProps {
  battleId: string;
  onBattleEnd: () => void;
}

interface ParticipantWithCard extends BattleParticipant {
  card: Card;
}

export default function BattleArena({ battleId, onBattleEnd }: BattleArenaProps) {
  const { user } = useAuth();
  const [battle, setBattle] = useState<Battle | null>(null);
  const [participants, setParticipants] = useState<ParticipantWithCard[]>([]);
  const [actionLog, setActionLog] = useState<string[]>([]);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [loading, setLoading] = useState(false);

  const myParticipant = participants.find(p => p.user_id === user?.id);
  const opponentParticipant = participants.find(p => p.user_id !== user?.id);

  useEffect(() => {
    console.log(`[${user?.email}] BattleArena mounted for battle ${battleId}`);
    fetchBattleData();

    const channel = supabase
      .channel(`battle-${battleId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'battles',
          filter: `id=eq.${battleId}`,
        },
        (payload) => {
          console.log(`[${user?.email}] Battle update received:`, payload);
          fetchBattleData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'battle_participants',
          filter: `battle_id=eq.${battleId}`,
        },
        (payload) => {
          console.log(`[${user?.email}] Participant update received:`, payload);
          fetchBattleData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'battle_turns',
          filter: `battle_id=eq.${battleId}`,
        },
        (payload) => {
          console.log(`[${user?.email}] Turn insert received:`, payload);
          fetchBattleData();
        }
      )
      .subscribe((status) => {
        console.log(`[${user?.email}] Realtime subscription status:`, status);
      });

    return () => {
      console.log(`[${user?.email}] BattleArena unmounting, removing channel`);
      supabase.removeChannel(channel);
    };
  }, [battleId, user?.id]);

  const fetchBattleData = async () => {
    try {
      console.log(`[${user?.email}] fetchBattleData called`);
      const { data: battleData, error: battleError } = await supabase
        .from('battles')
        .select('*')
        .eq('id', battleId)
        .maybeSingle();

      if (battleError) {
        console.error(`[${user?.email}] Error fetching battle:`, battleError);
        return;
      }

      if (!battleData) {
        console.error(`[${user?.email}] Battle not found`);
        return;
      }

      console.log(`[${user?.email}] Battle data fetched:`, battleData);
      setBattle(battleData);

      const { data: participantsData, error: participantsError } = await supabase
        .from('battle_participants')
        .select('*')
        .eq('battle_id', battleId);

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
        return;
      }

      if (participantsData) {
        const participantsWithCards = await Promise.all(
          participantsData.map(async (p) => {
            const { data: card } = await supabase
              .from('cards')
              .select('*')
              .eq('id', p.card_id)
              .maybeSingle();
            return { ...p, card };
          })
        );

        const validParticipants = participantsWithCards.filter(p => p.card !== null) as ParticipantWithCard[];

        if (validParticipants.length < 2) {
          console.error('Battle participants missing valid cards');
          return;
        }

        console.log(`[${user?.email}] Setting participants:`, validParticipants);
        setParticipants(validParticipants);

        const myParticipantData = validParticipants.find(p => p.user_id === user?.id);
        const isMyTurnNow = battleData.current_turn === myParticipantData?.id;
        console.log(`[${user?.email}] Is my turn:`, isMyTurnNow, 'current_turn:', battleData.current_turn, 'my participant id:', myParticipantData?.id);
        setIsMyTurn(isMyTurnNow);

        // Fetch battle turns to rebuild action log
        const { data: turnsData, error: turnsError } = await supabase
          .from('battle_turns')
          .select('*, battle_participants(card_id, cards(name, special_ability))')
          .eq('battle_id', battleId)
          .order('turn_number', { ascending: false });

        if (turnsError) {
          console.error(`[${user?.email}] Error fetching turns:`, turnsError);
        }
        console.log(`[${user?.email}] Turns data fetched:`, turnsData);

        if (turnsData) {
          const logs = turnsData.map((turn: any) => {
            const cardName = turn.battle_participants?.cards?.name || 'Unknown';
            const abilityName = turn.battle_participants?.cards?.special_ability || '';

            if (turn.action_type === 'attack') {
              return `${cardName} attacks for ${turn.damage_dealt} damage!`;
            } else if (turn.action_type === 'ability') {
              return `${cardName} uses ${abilityName} for ${turn.damage_dealt} damage!`;
            } else if (turn.action_type === 'defend') {
              return `${cardName} takes a defensive stance!`;
            }
            return '';
          }).filter(Boolean);

          console.log(`[${user?.email}] Action logs generated:`, logs);
          setActionLog(logs);
        }
      }
    } catch (error) {
      console.error(`[${user?.email}] Error in fetchBattleData:`, error);
    }
  };

  const calculateDamage = (attacker: ParticipantWithCard, defender: ParticipantWithCard, isAbility: boolean = false) => {
    let baseDamage = isAbility ? attacker.card.ability_power : attacker.card.attack;

    const hasTypeAdvantage = TYPE_ADVANTAGES[attacker.card.card_type] === defender.card.card_type;
    if (hasTypeAdvantage) {
      baseDamage = Math.floor(baseDamage * 1.5);
    }

    let damage = 0;
    if (isAbility) {
      damage = Math.max(1, baseDamage - Math.floor(defender.card.defense / 2));
    } else {
      damage = Math.max(1, baseDamage - defender.card.defense);
    }

    if (defender.is_defending) {
      damage = Math.floor(damage * 0.5);
    }

    return damage;
  };

  const checkTypeAdvantage = (attacker: ParticipantWithCard, defender: ParticipantWithCard) => {
    return TYPE_ADVANTAGES[attacker.card.card_type] === defender.card.card_type;
  };

  const performAction = async (actionType: 'attack' | 'ability' | 'defend') => {
    if (!myParticipant || !opponentParticipant || !battle || !isMyTurn || loading) return;

    setLoading(true);

    try {
      let damage = 0;
      let logMessage = '';
      const hasAdvantage = checkTypeAdvantage(myParticipant, opponentParticipant);

      if (actionType === 'attack') {
        damage = calculateDamage(myParticipant, opponentParticipant);
        logMessage = `${myParticipant.card.name} attacks for ${damage} damage!`;
        if (opponentParticipant.is_defending) {
          logMessage += ' (Reduced by defense!)';
        }
        if (hasAdvantage) {
          logMessage += ' Super effective!';
        }
      } else if (actionType === 'ability') {
        if (myParticipant.has_used_ability) {
          setLoading(false);
          return;
        }
        damage = calculateDamage(myParticipant, opponentParticipant, true);
        logMessage = `${myParticipant.card.name} uses ${myParticipant.card.special_ability} for ${damage} damage!`;
        if (opponentParticipant.is_defending) {
          logMessage += ' (Reduced by defense!)';
        }
        if (hasAdvantage) {
          logMessage += ' Super effective!';
        }
      } else if (actionType === 'defend') {
        logMessage = `${myParticipant.card.name} takes a defensive stance!`;
      }

      const newOpponentHp = Math.max(0, opponentParticipant.current_hp - damage);

      // Optimistic update: Update local state immediately
      setParticipants(prev => prev.map(p => {
        if (p.id === myParticipant.id) {
          return {
            ...p,
            is_defending: actionType === 'defend',
            has_used_ability: actionType === 'ability' ? true : p.has_used_ability,
          };
        }
        if (p.id === opponentParticipant.id) {
          return {
            ...p,
            current_hp: newOpponentHp,
            is_defending: actionType === 'defend' ? p.is_defending : false,
          };
        }
        return p;
      }));

      setIsMyTurn(false);
      setBattle(prev => prev ? { ...prev, current_turn: opponentParticipant.id } : null);
      setActionLog(prev => [logMessage, ...prev]);

      // Now update the database
      if (actionType === 'attack') {
        await supabase
          .from('battle_participants')
          .update({ is_defending: false })
          .eq('id', myParticipant.id);

        await supabase
          .from('battle_participants')
          .update({ is_defending: false })
          .eq('id', opponentParticipant.id);
      } else if (actionType === 'ability') {
        await supabase
          .from('battle_participants')
          .update({ has_used_ability: true, is_defending: false })
          .eq('id', myParticipant.id);

        await supabase
          .from('battle_participants')
          .update({ is_defending: false })
          .eq('id', opponentParticipant.id);
      } else if (actionType === 'defend') {
        await supabase
          .from('battle_participants')
          .update({ is_defending: true })
          .eq('id', myParticipant.id);
      }

      await supabase
        .from('battle_participants')
        .update({ current_hp: newOpponentHp })
        .eq('id', opponentParticipant.id);

      const { data: turnData } = await supabase
        .from('battle_turns')
        .select('turn_number')
        .eq('battle_id', battleId)
        .order('turn_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextTurnNumber = (turnData?.turn_number || 0) + 1;

      await supabase
        .from('battle_turns')
        .insert({
          battle_id: battleId,
          participant_id: myParticipant.id,
          action_type: actionType,
          damage_dealt: damage,
          turn_number: nextTurnNumber,
        });

      if (newOpponentHp <= 0) {
        await supabase
          .from('battles')
          .update({
            status: 'completed',
            winner_id: user?.id,
            completed_at: new Date().toISOString(),
          })
          .eq('id', battleId);

        setBattle(prev => prev ? {
          ...prev,
          status: 'completed',
          winner_id: user?.id,
          completed_at: new Date().toISOString(),
        } : null);
      } else {
        await supabase
          .from('battles')
          .update({ current_turn: opponentParticipant.id })
          .eq('id', battleId);
      }
    } catch (error) {
      console.error('Error performing action:', error);
      // On error, refetch to get the correct state
      await fetchBattleData();
    } finally {
      setLoading(false);
    }
  };

  if (!battle || participants.length < 2) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
      </div>
    );
  }

  if (battle.status === 'completed') {
    const didIWin = battle.winner_id === user?.id;
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className={`absolute inset-0 ${didIWin ? 'bg-amber-500' : 'bg-slate-500'} blur-3xl opacity-20`}></div>
            <Trophy className={`w-24 h-24 ${didIWin ? 'text-amber-500' : 'text-slate-500'} mx-auto relative`} />
          </div>
          <div>
            <h2 className="text-4xl font-bold text-white mb-2">
              {didIWin ? 'Victory!' : 'Defeat'}
            </h2>
            <p className="text-slate-400 mb-6">
              {didIWin ? 'You have defeated your opponent!' : 'Better luck next time!'}
            </p>
            <button
              onClick={onBattleEnd}
              className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-amber-500/50"
            >
              Return to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Swords className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl font-bold text-white">Battle Arena</h2>
          </div>
          <button
            onClick={onBattleEnd}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            title="Leave battle"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-8">
            <div className="flex items-center justify-between gap-8">
              <div className="flex-1">
                {myParticipant && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-slate-400">Your Card</div>
                      {myParticipant.is_defending && (
                        <div className="flex items-center gap-1 bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs font-semibold border border-blue-500/50">
                          <Shield className="w-3 h-3" />
                          Defending
                        </div>
                      )}
                    </div>
                    <CardDisplay card={myParticipant.card} currentHp={myParticipant.current_hp} inBattle />
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center gap-4">
                <div className="bg-slate-900 rounded-full p-4 border-2 border-amber-500">
                  <Swords className="w-8 h-8 text-amber-500" />
                </div>
                <div className="text-center space-y-2">
                  {isMyTurn ? (
                    <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg border border-green-500/50 font-bold">
                      YOUR TURN
                    </div>
                  ) : (
                    <div className="bg-slate-700 text-slate-400 px-4 py-2 rounded-lg border border-slate-600">
                      Opponent's Turn
                    </div>
                  )}
                  {myParticipant && opponentParticipant && checkTypeAdvantage(myParticipant, opponentParticipant) && (
                    <div className="flex items-center gap-1 bg-green-500/20 text-green-400 px-3 py-1 rounded-lg border border-green-500/50 text-xs font-semibold">
                      <Zap className="w-3 h-3" />
                      Type Advantage
                    </div>
                  )}
                  {myParticipant && opponentParticipant && checkTypeAdvantage(opponentParticipant, myParticipant) && (
                    <div className="flex items-center gap-1 bg-red-500/20 text-red-400 px-3 py-1 rounded-lg border border-red-500/50 text-xs font-semibold">
                      <Zap className="w-3 h-3" />
                      Type Disadvantage
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1">
                {opponentParticipant && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-slate-400">Opponent</div>
                      {opponentParticipant.is_defending && (
                        <div className="flex items-center gap-1 bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs font-semibold border border-blue-500/50">
                          <Shield className="w-3 h-3" />
                          Defending
                        </div>
                      )}
                    </div>
                    <CardDisplay card={opponentParticipant.card} currentHp={opponentParticipant.current_hp} inBattle />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4">Actions</h3>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => performAction('attack')}
                disabled={!isMyTurn || loading}
                className="bg-red-500 hover:bg-red-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed flex flex-col items-center gap-2"
              >
                <Swords className="w-6 h-6" />
                <span>Attack</span>
              </button>

              <button
                onClick={() => performAction('ability')}
                disabled={!isMyTurn || loading || myParticipant?.has_used_ability}
                className="bg-purple-500 hover:bg-purple-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed flex flex-col items-center gap-2"
              >
                <Sparkles className="w-6 h-6" />
                <span>Ability</span>
                {myParticipant?.has_used_ability && (
                  <span className="text-xs">(Used)</span>
                )}
              </button>

              <button
                onClick={() => performAction('defend')}
                disabled={!isMyTurn || loading}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed flex flex-col items-center gap-2"
              >
                <Shield className="w-6 h-6" />
                <span>Defend</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Battle Log</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {actionLog.length === 0 ? (
              <p className="text-slate-500 text-sm">Battle begins...</p>
            ) : (
              actionLog.map((log, index) => (
                <div key={index} className="bg-slate-900 rounded-lg p-3 text-sm text-slate-300 border border-slate-700">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
