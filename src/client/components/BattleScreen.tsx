// Battle Screen Component - Traditional Fighting Game Style

import React, { useState, useEffect, useRef } from 'react';
import { GAME_CONFIG } from '../../shared/utils/constants';
import { BattleEffects, DamageNumber, ScreenShake, HitEffect } from './BattleEffects';

interface BattleScreenProps {
  battleData: any;
  player: any;
  onBattleEnd: (result: 'victory' | 'defeat' | 'draw') => void;
  onBack: () => void;
}

export const BattleScreen: React.FC<BattleScreenProps> = ({ battleData, player, onBattleEnd, onBack }) => {
  const [gameState, setGameState] = useState<any>(null);
  const [selectedMove, setSelectedMove] = useState<string | null>(null);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [comboCount, setComboCount] = useState(0);
  const [damageNumbers, setDamageNumbers] = useState<Array<{id: number, value: number, x: number, y: number, type: string, isCritical?: boolean}>>([]);
  const [fighterStates, setFighterStates] = useState<{player1: string, player2: string}>({player1: 'idle', player2: 'idle'});
  const [lastMove, setLastMove] = useState<string | null>(null);
  const [lastDamage, setLastDamage] = useState<number | null>(null);
  const [screenShake, setScreenShake] = useState(false);
  const [hitEffect, setHitEffect] = useState<{x: number, y: number, type: string, trigger: boolean}>({x: 0, y: 0, type: 'hit', trigger: false});
  const [countdown, setCountdown] = useState<number>(GAME_CONFIG.TURN_TIME_LIMIT);
  const [p1EnergyDelta, setP1EnergyDelta] = useState<number | null>(null);
  const [p2EnergyDelta, setP2EnergyDelta] = useState<number | null>(null);
  const prevEnergiesRef = React.useRef<{ p1?: number; p2?: number }>({});
  const [displayP1Energy, setDisplayP1Energy] = useState<number | null>(null);
  const [displayP2Energy, setDisplayP2Energy] = useState<number | null>(null);
  const regenHoldTimers = useRef<{ p1?: any; p2?: any }>({});
  
  // Determine which player role the current user has
  const myPlayerRole = battleData?.playerRole || 'player1';
  const isMyTurn = gameState?.currentTurn === myPlayerRole;
  
  // Only show countdown timer for the player whose turn it is
  const shouldShowTimer = isMyTurn && gameState?.status === 'active';
  
  // Debug logging with more details
  useEffect(() => {
    if (gameState && battleData) {
      console.log(`BattleScreen Debug - Battle Data:`, battleData);
      console.log(`BattleScreen Debug - My Role: ${myPlayerRole}, Current Turn: ${gameState.currentTurn}, Is My Turn: ${isMyTurn}`);
      console.log(`BattleScreen Debug - Player1: ${gameState.player1?.username}, Player2: ${gameState.player2?.username}`);
    }
  }, [myPlayerRole, gameState?.currentTurn, isMyTurn, battleData]);

  useEffect(() => {
    if (battleData) {
      // Handle the API response structure
      if (battleData.gameState) {
        setGameState(battleData.gameState);
      } else if (battleData.gameId) {
        // If only gameId is provided, fetch the full game state
        // For now, create a minimal gameState
        setGameState({
          gameId: battleData.gameId,
          mode: 'quick_match',
          player1: player,
          player2: battleData.opponent || {
            username: 'Opponent',
            hp: 100,
            maxHP: 100,
            energy: 50,
            maxEnergy: 50,
          },
          currentTurn: 'player1',
          turnNumber: 0,
          status: 'active',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          battleLog: [],
          isShadowMatch: battleData.isShadow || false,
          turnStartedAt: Date.now(),
        });
      } else {
        setGameState(battleData);
      }
    }
  }, [battleData, player]);

  // Poll for battle state updates (for real-time PvP synchronization and server-side timeout handling)
  useEffect(() => {
    if (!gameState?.gameId || gameState.status !== 'active') return;

    const pollBattleState = async () => {
      try {
        const response = await fetch(`/api/game/battle/state/${gameState.gameId}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.gameState) {
            // Check if battle is finished
            if (data.gameState.status === 'finished' && data.gameState.winner) {
              console.log(`Battle finished via polling! Winner: ${data.gameState.winner}, My role: ${myPlayerRole}`);
              setTimeout(() => {
                if (data.gameState.winner === 'draw') {
                  onBattleEnd('draw');
                } else {
                  onBattleEnd(data.gameState.winner === myPlayerRole ? 'victory' : 'defeat');
                }
              }, 500);
              return;
            }
            
            // Update state if changed (including timeout penalties applied by server)
            if (data.gameState.updatedAt !== gameState.updatedAt) {
              console.log(`Battle state updated: Turn is now ${data.gameState.currentTurn}, My role: ${myPlayerRole}`);
              setGameState(data.gameState);
            }
          }
        }
      } catch (error) {
        console.error('Error polling battle state:', error);
      }
    };

    // Poll every 2 seconds to catch server-side timeout penalties quickly
    const pollInterval = setInterval(pollBattleState, 2000);
    return () => clearInterval(pollInterval);
  }, [gameState?.gameId, gameState?.status, gameState?.updatedAt]);

  // Countdown timer per turn with timeout triggering
  const tickingRef = useRef(false);
  useEffect(() => {
    if (!gameState || gameState.status !== 'active') return;
    
    const interval = setInterval(() => {
      const startedAt = gameState.turnStartedAt || gameState.updatedAt || gameState.createdAt || Date.now();
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(0, GAME_CONFIG.TURN_TIME_LIMIT - elapsed);
      setCountdown(remaining);
      
      console.log(`Timer Debug - Current Turn: ${gameState.currentTurn}, My Role: ${myPlayerRole}, Remaining: ${remaining}s, Elapsed: ${elapsed}s`);
      
      // Trigger timeout when timer reaches 0 (any player can trigger it)
      if (remaining === 0 && !tickingRef.current) {
        console.log(`TIMEOUT TRIGGERED for game ${gameState.gameId}! Current turn: ${gameState.currentTurn}`);
        tickingRef.current = true;
        
        fetch('/api/game/battle/timeout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameId: gameState.gameId }),
        })
          .then(async (r) => {
            const data = await r.json();
            console.log('Timeout response:', data);
            
            if (data.type === 'battle_complete') {
              setTimeout(() => {
                if (data.winner === 'draw') {
                  onBattleEnd('draw');
                } else {
                  onBattleEnd(data.winner === myPlayerRole ? 'victory' : 'defeat');
                }
              }, 800);
              return;
            }
            
            if (data.type === 'timeout_penalty' && data.currentState) {
              console.log(`Timeout penalty applied to ${data.penalizedPlayer}: -${data.penaltyApplied} HP`);
              setGameState(data.currentState);
              // Reset countdown after timeout penalty - timer continues for same player
              setCountdown(GAME_CONFIG.TURN_TIME_LIMIT);
            } else if (data.currentState) {
              setGameState(data.currentState);
              setCountdown(GAME_CONFIG.TURN_TIME_LIMIT);
            }
          })
          .catch((error) => {
            console.error('Timeout request failed:', error);
          })
          .finally(() => {
            setTimeout(() => {
              tickingRef.current = false;
            }, 1000); // Prevent rapid timeout calls
          });
      }
    }, 250);
    
    return () => clearInterval(interval);
  }, [gameState?.turnStartedAt, gameState?.updatedAt, gameState?.currentTurn, myPlayerRole, onBattleEnd]);

  // Energy delta indicators (show consumption immediately when state updates)
  useEffect(() => {
    if (!gameState || !gameState.player1 || !gameState.player2) return;
    const prevP1 = displayP1Energy ?? gameState.player1.energy;
    const prevP2 = displayP2Energy ?? gameState.player2.energy;
    const curP1 = gameState.player1.energy;
    const curP2 = gameState.player2.energy;

    // Handle player1 energy transitions (no regen, so no delay needed)
    if (curP1 !== prevP1) {
      const diff = curP1 - prevP1;
      setP1EnergyDelta(diff);
      setDisplayP1Energy(curP1);
      setTimeout(() => setP1EnergyDelta(null), 1200);
    }

    // Handle player2 energy transitions (no regen)
    if (curP2 !== prevP2) {
      const diff = curP2 - prevP2;
      setP2EnergyDelta(diff);
      setDisplayP2Energy(curP2);
      setTimeout(() => setP2EnergyDelta(null), 1200);
    }
  }, [gameState?.player1?.energy, gameState?.player2?.energy]);

  const showDamageNumber = (value: number, x: number, y: number, type: string = 'damage', isCritical: boolean = false) => {
    const id = Date.now() + Math.random();
    setDamageNumbers(prev => [...prev, { id, value, x, y, type, isCritical }]);
    setTimeout(() => {
      setDamageNumbers(prev => prev.filter(d => d.id !== id));
    }, 1500);
  };

  const triggerScreenShake = () => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 500);
  };

  const triggerHitEffect = (x: number, y: number, type: string) => {
    setHitEffect({ x, y, type, trigger: true });
    setTimeout(() => setHitEffect(prev => ({ ...prev, trigger: false })), 100);
  };

  const setFighterState = (fighter: 'player1' | 'player2', state: string) => {
    setFighterStates(prev => ({ ...prev, [fighter]: state }));
    setTimeout(() => {
      setFighterStates(prev => ({ ...prev, [fighter]: 'idle' }));
    }, 600);
  };

  const handleMove = async (ability: string) => {
    if (loading || !gameState) return;
    
    setLoading(true);
    setSelectedMove(ability);
    // Optimistic energy update so user sees immediate consumption
    try {
      const energyCosts: any = { basic_attack: 10, defend: 15, fireball: 20, heal: 25, rest: 0 };
      const cost = energyCosts[ability] ?? 0;
      if (myPlayerRole === 'player1') {
        setGameState((prev: any) => prev ? { ...prev, player1: { ...prev.player1, energy: Math.max(0, (prev.player1.energy || 0) - cost) } } : prev);
      } else {
        setGameState((prev: any) => prev ? { ...prev, player2: { ...prev.player2, energy: Math.max(0, (prev.player2.energy || 0) - cost) } } : prev);
      }
    } catch {}
    setFighterState(myPlayerRole, 'attacking');
    setLastMove(ability);

    try {
      const response = await fetch('/api/game/battle/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: gameState.gameId, ability }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.currentState) {
        setGameState(data.currentState);
        
        // Enhanced visual effects
        if (data.damage) {
          const isCritical = data.damage > 20; // Define critical threshold
          const damageType = ability === 'heal' ? 'heal' : isCritical ? 'critical' : 'damage';
          
          showDamageNumber(data.damage, 60, 40, damageType, isCritical);
          setFighterState('player2', 'taking-damage');
          setLastDamage(data.damage);
          
          // Trigger screen shake for high damage
          if (data.damage > 15) {
            triggerScreenShake();
          }
          
          // Trigger hit effect
          triggerHitEffect(60, 40, isCritical ? 'critical' : 'hit');
        }
        
        // Update combo count
        if (data.combo) {
          setComboCount(data.combo);
        }
      }
      
      if (data.type === 'battle_complete') {
        setTimeout(() => {
          if (data.winner === 'draw') {
            alert('Battle ended in a draw.');
            onBack();
            return;
          }
          onBattleEnd(data.winner === 'draw' ? 'draw' : data.winner === myPlayerRole ? 'victory' : 'defeat');
        }, 1500);
      }
    } catch (error) {
      console.error('Battle move error:', error);
      alert('Failed to submit move. Please try again.');
    } finally {
      setLoading(false);
      setSelectedMove(null);
    }
  };

  if (!gameState) {
    return (
      <div className="battle-arena flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mb-4"></div>
          <div className="text-responsive-lg text-white">Loading battle...</div>
        </div>
      </div>
    );
  }

  const player1 = gameState.player1 || {
    username: player.username || 'You',
    hp: 100,
    maxHP: 100,
    energy: 50,
    maxEnergy: 50,
    character: 'knight',
    userId: 'player1',
    statusEffects: [],
    abilities: ['basic_attack', 'defend'],
    moves: [],
    totalDamageDealt: 0,
    totalDamageTaken: 0,
  };
  
  const player2 = gameState.player2 || {
    username: 'Opponent',
    hp: 100,
    maxHP: 100,
    energy: 50,
    maxEnergy: 50,
    character: 'knight',
    userId: 'player2',
    statusEffects: [],
    abilities: ['basic_attack', 'defend'],
    moves: [],
    totalDamageDealt: 0,
    totalDamageTaken: 0,
  };

  const getCharacterEmoji = (character: string) => {
    const emojis: {[key: string]: string} = {
      'mage': '🧙‍♂️',
      'knight': '⚔️',
      'ranger': '🏹',
      'assassin': '🗡️',
      'tank': '🛡️',
      'healer': '✨'
    };
    return emojis[character] || '⚔️';
  };

  const getHealthBarClass = (hp: number, maxHP: number) => {
    const ratio = hp / maxHP;
    if (ratio > 0.6) return 'health-fill';
    if (ratio > 0.3) return 'health-fill low';
    return 'health-fill critical';
  };

  return (
    <div className="battle-arena">
      {/* Battle Header */}
      <div className="flex justify-between items-center px-3 py-3 sm:pt-5 sm:px-6 lg:px-24">
        <button 
          onClick={onBack}
          className="px-3 sm:px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 text-responsive-sm cursor-pointer"
        >
          ← Back
        </button>
        
        <div className="text-center">
          <div className="bg-gradient-to-r from-red-600 to-orange-600 px-3 sm:px-4 py-1 rounded-full animate-pulse border-2 border-yellow-400 shadow-lg">
            <span className="text-base sm:text-lg  font-bold text-white">⚔️ BATTLE ⚔️</span>
          </div>
          <div className="text-responsive-xs sm:text-responsive-sm text-gray-400 mt-1">
            Turns: {Math.max(0, gameState.turnNumber || 0)}/{GAME_CONFIG.BATTLE_MAX_TURNS} 
            {shouldShowTimer && <span> • ⏱️ {countdown}s</span>}
            {!isMyTurn && gameState?.status === 'active' && <span> • ⏸️ Opponent's Turn</span>}
          </div>
        </div>
        
        <div className="w-16 sm:w-20"></div>
      </div>

      {/* Main Battle Arena */}
      <div className="battle-container px-3 sm:px-6 lg:px-24">
        <div className="fighter-container">
          {/* Player 1 (Left Side) */}
          <div className={`fighter ${fighterStates.player1} relative mobile-game-block left`}>
            <div className="text-center w-full">
              <div className="text-responsive-sm sm:text-responsive-lg font-bold text-cyan-400 mb-1 sm:mb-2">{player1.username}</div>
              <div className="character-emoji text-4xl sm:text-6xl lg:text-8xl mb-1 sm:mb-2">
                {getCharacterEmoji(player1.character)}
              </div>
              <div className="text-responsive-xs text-gray-400 mb-2">
                {myPlayerRole === 'player1' ? (isMyTurn ? '⏳ YOUR TURN' : '⏸️ Waiting...') : (gameState.currentTurn === 'player1' ? '⏳ OPPONENT TURN' : '⏸️ Waiting...')}
              </div>
              
              {/* Health Bar */}
              <div className="health-bar-container">
                <div className="flex justify-between text-responsive-xs mb-1">
                  <span className="text-cyan-400">❤️ HP</span>
                  <span className="text-white">{player1.hp}/{player1.maxHP}</span>
                </div>
                <div className="health-bar">
                  <div
                    className={getHealthBarClass(player1.hp, player1.maxHP)}
                    style={{ width: `${(player1.hp / player1.maxHP) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-responsive-xs mt-1 gap-2">
                  <span className="text-yellow-400 flex items-center gap-1">⚡ {(displayP1Energy ?? player1.energy)}/{player1.maxEnergy}
                    {p1EnergyDelta !== null && (
                      <span className={`${p1EnergyDelta >= 0 ? 'text-green-400' : 'text-red-400'} ml-1`}>
                        {p1EnergyDelta >= 0 ? '+' : ''}{p1EnergyDelta}
                      </span>
                    )}
                  </span>
                  {player1.statusEffects && player1.statusEffects.length > 0 && (
                    <span className="text-orange-400">🔥 {player1.statusEffects.length}</span>
                  )}
                </div>
              </div>
              
              {/* Combo Indicator */}
              {comboCount > 0 && (
                <div className="combo-indicator">
                  {comboCount}x COMBO!
                </div>
              )}
            </div>
          </div>

          {/* VS Divider */}
          <div className="text-responsive-2xl sm:text-responsive-3xl font-bold text-red-500 animate-pulse mx-1 sm:mx-2 lg:mx-8 flex items-center justify-center">
            ⚔️
          </div>

          {/* Player 2 (Right Side) */}
          <div className={`fighter ${fighterStates.player2} relative mobile-game-block right`}>
            <div className="text-center w-full">
              <div className="text-responsive-sm sm:text-responsive-lg font-bold text-purple-400 mb-1 sm:mb-2">{player2.username}</div>
              <div className="character-emoji text-4xl sm:text-6xl lg:text-8xl mb-1 sm:mb-2">
                {getCharacterEmoji(player2.character)}
              </div>
              <div className="text-responsive-xs text-gray-400 mb-2">
                {myPlayerRole === 'player2' ? (isMyTurn ? '⏳ YOUR TURN' : '⏸️ Waiting...') : (gameState.currentTurn === 'player2' ? '⏳ OPPONENT TURN' : '⏸️ Waiting...')}
              </div>
              
              {/* Health Bar */}
              <div className="health-bar-container">
                <div className="flex justify-between text-responsive-xs mb-1">
                  <span className="text-purple-400">❤️ HP</span>
                  <span className="text-white">{player2.hp}/{player2.maxHP}</span>
                </div>
                <div className="health-bar">
                  <div
                    className={getHealthBarClass(player2.hp, player2.maxHP)}
                    style={{ width: `${(player2.hp / player2.maxHP) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-responsive-xs mt-1 gap-2">
                  <span className="text-yellow-400 flex items-center gap-1">⚡ {(displayP2Energy ?? player2.energy)}/{player2.maxEnergy}
                    {p2EnergyDelta !== null && (
                      <span className={`${p2EnergyDelta >= 0 ? 'text-green-400' : 'text-red-400'} ml-1`}>
                        {p2EnergyDelta >= 0 ? '+' : ''}{p2EnergyDelta}
                      </span>
                    )}
                  </span>
                  {player2.statusEffects && player2.statusEffects.length > 0 && (
                    <span className="text-orange-400">🔥 {player2.statusEffects.length}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Battle Log */}
        <div className="battle-log mx-4 mb-2.5">
          <div className="text-responsive-base font-bold text-cyan-400 mb-2 flex items-center gap-2">
            📜 Battle Log
          </div>
          <div className="space-y-1">
            {gameState.battleLog && gameState.battleLog.length > 0 ? gameState.battleLog.slice(-8).map((log: any, idx: number) => (
              <div key={idx} className={`battle-log-entry ${
                log.type === 'damage' ? 'damage' :
                log.type === 'heal' ? 'heal' :
                log.type === 'status' ? 'status' :
                'info'
              }`}>
                {log.message}
              </div>
            )) : (
              <div className="text-responsive-xs text-gray-500 italic">Battle about to begin...</div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <div className="text-center text-responsive-base font-bold text-purple-400 mb-1 col-span-full">
          {loading || selectedMove ? '⏳ Processing...' : '🎯 Choose Your Move'}
        </div>
        
        {['basic_attack', 'defend', 'fireball', 'heal', 'rest'].map(ability => {
          const isDisabled = loading || selectedMove === ability || !isMyTurn;
            const getAbilityIcon = (ab: string) => {
            const icons: {[key: string]: string} = {
              'basic_attack': '⚔️',
              'defend': '🛡️',
              'fireball': '🔥',
              'heal': '💊',
              'rest': '😴'
            };
            return icons[ab] || '⚡';
          };
          
            const getAbilityName = (ab: string) => {
            const names: {[key: string]: string} = {
              'basic_attack': 'ATTACK',
              'defend': 'DEFEND',
              'fireball': 'FIREBALL',
              'heal': 'HEAL',
              'rest': 'REST'
            };
            return names[ab] || ab.toUpperCase();
          };

          const getEnergyCost = (ab: string) => {
            const costs: {[key: string]: number} = {
              'basic_attack': 10,
              'defend': 15,
              'fireball': 20,
              'heal': 25,
              'rest': 0
            };
            return costs[ab] || 0;
          };

          const energyCost = getEnergyCost(ability);
          const currentPlayer = myPlayerRole === 'player1' ? player1 : player2;
          const canAfford = currentPlayer.energy >= energyCost;
          
          // Debug logging for all abilities
          console.log(`Ability Debug - ${ability}: My Role: ${myPlayerRole}, Current Player Energy: ${currentPlayer.energy}, Energy Cost: ${energyCost}, Can Afford: ${canAfford}, Is My Turn: ${isMyTurn}`);

          return (
            <button
              key={ability}
              onClick={() => handleMove(ability)}
              disabled={isDisabled || !canAfford}
              className={`action-button ${isDisabled || !canAfford ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="icon">{getAbilityIcon(ability)}</div>
              <div className="label flex flex-row gap-1 items-center justify-center">{getAbilityName(ability)} <div className="cost">
                {ability === 'rest' ? '⚡ +15 / ❤️ -5' : `⚡${energyCost} ${!canAfford ? '(Need more!)' : ''}`}
              </div></div>
              
            </button>
          );
        })}
      </div>

      {/* Enhanced Visual Effects */}
      <BattleEffects 
        lastMove={lastMove || ''}
        damage={lastDamage || 0}
        isPlayerTurn={isMyTurn}
        comboCount={comboCount}
        moveType={lastMove === 'heal' ? 'heal' : lastMove === 'defend' ? 'defend' : 'attack'}
      />

      {/* Damage Numbers */}
      {damageNumbers.map(damage => (
        <DamageNumber
          key={damage.id}
          damage={damage.value}
          x={damage.x}
          y={damage.y}
          type={damage.type as 'damage' | 'heal' | 'critical' | 'blocked'}
          isCritical={damage.isCritical || false}
        />
      ))}

      {/* Screen Shake Effect */}
      <ScreenShake 
        intensity={3}
        duration={500}
        trigger={screenShake}
      />

      {/* Hit Effects */}
      <HitEffect
        x={hitEffect.x}
        y={hitEffect.y}
        type={hitEffect.type as 'hit' | 'block' | 'critical' | 'miss'}
        trigger={hitEffect.trigger}
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="text-center flex flex-row items-center justify-center gap-1">
            <div className="loading-spinner mb-4"></div>
            <div className="text-responsive-lg text-white">Processing move...</div>
          </div>
        </div>
      )}
    </div>
  );
};

