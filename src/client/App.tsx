// Shadow Duel Arena - Main App Component

import React, { useState, useEffect } from 'react';
import { SplashScreen } from './components/SplashScreen';
import { MainMenu } from './components/MainMenu';
import { CharacterSelect } from './components/CharacterSelect';
import { BattleScreen } from './components/BattleScreen';
import { Leaderboard } from './components/Leaderboard';
import { ProfilePage } from './components/ProfilePage';
import { RaidBossScreen } from './components/RaidBossScreen';
import { VictoryScreen } from './components/VictoryScreen';
import { DefeatScreen } from './components/DefeatScreen';
import { DrawScreen } from './components/DrawScreen';
import { Tutorial } from './components/Tutorial';
import { WaitingScreen } from './components/WaitingScreen';

type GameState = 'splash' | 'menu' | 'character_select' | 'battle' | 'victory' | 'defeat' | 'draw' | 'leaderboard' | 'profile' | 'raid' | 'waiting';

export const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('splash');
  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState<any>(null);
  const [battleData, setBattleData] = useState<any>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);
  const [battleInvitation, setBattleInvitation] = useState<any>(null);
  const [waitingForOpponent, setWaitingForOpponent] = useState<string | null>(null);

  useEffect(() => {
    // Load player data
    const loadPlayer = async () => {
      try {
        const response = await fetch('/api/game/player');
        const data = await response.json();
        console.log('Loaded player data:', data.player);
        console.log('Player rankPoints:', data.player?.rankPoints);
        setPlayer(data.player);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load player:', error);
        setLoading(false);
      }
    };

    loadPlayer();
  }, []);

  // Heartbeat to keep player online and check for battle invitations
  useEffect(() => {
    if (!player) return;

    const sendHeartbeat = async () => {
      try {
        const response = await fetch('/api/game/heartbeat', { method: 'POST' });
        const data = await response.json();
        
        // Check for battle invitations
        if (data.battleInvitation && (gameState === 'menu' || gameState === 'splash')) {
          console.log('Battle invitation received:', data.battleInvitation);
          setBattleInvitation(data.battleInvitation);
        } else {
          setBattleInvitation(null);
        }

        // Check for battle active notifications (when opponent accepts)
        if (data.battleActiveNotification && (gameState === 'battle' || gameState === 'menu')) {
          console.log('Battle is now active:', data.battleActiveNotification);
          
          // Fetch the active battle state and switch to battle screen
          try {
            const response = await fetch('/api/game/battle/accept', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ gameId: data.battleActiveNotification.gameId })
            });
            
            if (response.ok) {
              const battleData = await response.json();
              setBattleData(battleData);
              setGameState('battle');
            }
          } catch (error) {
            console.error('Failed to join active battle:', error);
          }
        }
      } catch (error) {
        console.error('Heartbeat failed:', error);
      }
    };

    // Send heartbeat every 10 seconds to check for battle invitations quickly
    const heartbeatInterval = setInterval(sendHeartbeat, 10000);
    
    // Send initial heartbeat
    sendHeartbeat();
    
    return () => clearInterval(heartbeatInterval);
  }, [player, gameState]);

  // Auto-dismiss splash screen after 3 seconds
  useEffect(() => {
    if (gameState === 'splash' && player) {
      const timer = setTimeout(() => {
        // Show tutorial if first time
        if (!hasSeenTutorial && player.totalBattles === 0) {
          setShowTutorial(true);
        } else {
          setGameState('menu');
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [gameState, player, hasSeenTutorial]);

  const handleBattleStart = (data: any) => {
    if (data.message && data.message.includes('invitation sent')) {
      // Show waiting screen for PvP invitation
      console.log('Battle invitation sent:', data.message);
      setWaitingForOpponent(data.opponent.username);
      setBattleData(data);
      setGameState('waiting');
    } else if (data.type === 'battle_started') {
      // Immediate battle start (shadow opponent)
      setBattleData(data);
      setGameState('battle');
    }
  };

  const handleWaitingCancel = () => {
    setWaitingForOpponent(null);
    setBattleData(null);
    setGameState('menu');
  };

  const handleBattleAccepted = (battleData: any) => {
    setBattleData(battleData);
    setWaitingForOpponent(null);
    setGameState('battle');
  };

  const handleBattleEnd = (result: 'victory' | 'defeat' | 'draw') => {
    setGameState(result);
  };

  const handleBackToMenu = () => {
    setGameState('menu');
    setBattleData(null);
  };

  const handleAcceptBattle = async (gameId: string) => {
    try {
      const acceptResponse = await fetch('/api/game/battle/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId })
      });
      
      if (acceptResponse.ok) {
        const acceptData = await acceptResponse.json();
        console.log('Accepting battle:', acceptData.gameId);
        
        // Set battle data and switch to battle screen
        setBattleData(acceptData);
        setGameState('battle');
        setBattleInvitation(null);
      }
    } catch (error) {
      console.error('Failed to accept battle:', error);
    }
  };

  const handleDeclineBattle = async (gameId: string) => {
    try {
      const declineResponse = await fetch('/api/game/battle/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId })
      });
      
      if (declineResponse.ok) {
        console.log('Battle declined');
        setBattleInvitation(null);
      }
    } catch (error) {
      console.error('Failed to decline battle:', error);
    }
  };

  if (loading || !player) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-purple-900 to-black">
        <div className="text-center">
          <div className="mb-4 text-6xl animate-bounce">🎮</div>
          <div className="text-white text-xl">Loading Shadow Duel Arena...</div>
        </div>
      </div>
    );
  }

  const handleTutorialClose = () => {
    setShowTutorial(false);
    setHasSeenTutorial(true);
    setGameState('menu');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-black to-purple-900 text-white overflow-x-hidden">
      {showTutorial && <Tutorial onClose={handleTutorialClose} />}
      
      {/* Battle Invitation Notification */}
      {battleInvitation && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-red-600 to-orange-600 p-4 rounded-lg shadow-lg border-2 border-yellow-400 animate-pulse">
          <div className="text-center">
            <div className="text-lg font-bold mb-2">⚔️ BATTLE INVITATION! ⚔️</div>
            <div className="text-sm mb-3">
              <span className="text-yellow-300 font-bold">{battleInvitation.inviterUsername}</span> wants to battle you!
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => handleAcceptBattle(battleInvitation.gameId)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-bold text-sm"
              >
                ✅ ACCEPT
              </button>
              <button
                onClick={() => handleDeclineBattle(battleInvitation.gameId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-bold text-sm"
              >
                ❌ DECLINE
              </button>
            </div>
          </div>
        </div>
      )}
      
      {gameState === 'splash' && (
        <SplashScreen 
          player={player}
          onEnter={() => {
            if (!hasSeenTutorial && player.totalBattles === 0) {
              setShowTutorial(true);
            } else {
              setGameState('menu');
            }
          }}
        />
      )}
      
      {gameState === 'menu' && (
        <MainMenu 
          player={player}
          onTutorial={() => setShowTutorial(true)}
          onCharacterSelect={() => setGameState('character_select')}
          onBattleStart={handleBattleStart}
          onLeaderboard={() => setGameState('leaderboard')}
          onProfile={() => setGameState('profile')}
          onRaidBoss={() => setGameState('raid')}
        />
      )}
      
      {gameState === 'character_select' && (
        <CharacterSelect 
          player={player}
          onStart={(data) => handleBattleStart(data)}
          onBack={handleBackToMenu}
        />
      )}

      {gameState === 'waiting' && waitingForOpponent && (
        <WaitingScreen 
          opponentName={waitingForOpponent}
          onCancel={handleWaitingCancel}
          onBattleAccepted={handleBattleAccepted}
        />
      )}
      
      {gameState === 'battle' && battleData && (
        <BattleScreen 
          battleData={battleData}
          player={player}
          onBattleEnd={handleBattleEnd}
          onBack={handleBackToMenu}
        />
      )}
      
      {gameState === 'victory' && (
        <VictoryScreen 
          battleData={battleData}
          player={player}
          onPlayAgain={() => {
            setBattleData(null);
            setGameState('character_select');
          }}
          onBackToMenu={handleBackToMenu}
        />
      )}
      
      {gameState === 'defeat' && (
        <DefeatScreen 
          battleData={battleData}
          player={player}
          onPlayAgain={() => {
            setBattleData(null);
            setGameState('character_select');
          }}
          onBackToMenu={handleBackToMenu}
        />
      )}

      {gameState === 'draw' && (
        <DrawScreen 
          battleData={battleData}
          player={player}
          onPlayAgain={() => {
            setBattleData(null);
            setGameState('character_select');
          }}
          onBackToMenu={handleBackToMenu}
        />
      )}
      
      {gameState === 'leaderboard' && (
        <Leaderboard 
          onBack={handleBackToMenu}
        />
      )}
      
      {gameState === 'profile' && (
        <ProfilePage 
          player={player}
          onBack={handleBackToMenu}
        />
      )}
      
      {gameState === 'raid' && (
        <RaidBossScreen 
          player={player}
          onBack={handleBackToMenu}
        />
      )}
    </div>
  );
};