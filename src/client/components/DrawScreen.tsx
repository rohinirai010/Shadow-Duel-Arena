// Draw Screen Component - Shows when battle ends in a draw

import React, { useState, useEffect } from 'react';

interface DrawScreenProps {
  battleData: any;
  player: any;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export const DrawScreen: React.FC<DrawScreenProps> = ({ 
  battleData, 
  player, 
  onPlayAgain, 
  onBackToMenu 
}) => {
  // Determine if this was a ranked match
  const isRankedMatch = battleData?.gameState?.mode === 'ranked' || battleData?.mode === 'ranked';
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowStats(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const opponent = battleData?.opponent || { username: 'Opponent' };
  const gameState = battleData?.gameState;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-800 via-gray-900 to-black text-white flex items-center justify-center p-6">
      <div className="text-center max-w-2xl mx-auto">
        {/* Draw Animation */}
        <div className="mb-8 animate-pulse">
          <div className="text-8xl mb-4">🤝</div>
          <div className="text-6xl animate-bounce">⚖️</div>
        </div>

        {/* Draw Title */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-6xl font-bold mb-4 bg-gradient-to-r from-gray-400 to-gray-600 bg-clip-text text-transparent">
            IT'S A DRAW!
          </h1>
          <p className="text-xl text-gray-300 mb-4">
            Both warriors fought valiantly to a stalemate
          </p>
          <div className="text-lg text-gray-400">
            {gameState?.turnNumber >= 10 ? 
              "Battle reached the 10-turn limit with equal HP!" : 
              "Both players were defeated simultaneously!"
            }
          </div>
        </div>

        {/* Battle Summary */}
        <div className="mb-8 p-6 bg-gray-800/50 rounded-lg backdrop-blur-sm">
          <h3 className="text-2xl font-bold mb-4 text-gray-300">Battle Summary</h3>
          <div className="grid grid-cols-2 gap-6">
            {/* Player Stats */}
            <div className="text-center p-4 bg-blue-900/30 rounded-lg">
              <div className="text-lg font-bold text-cyan-400 mb-2">{player.username}</div>
              <div className="text-sm text-gray-400 space-y-1">
                <div>Final HP: {gameState?.player1?.hp || 0}/{gameState?.player1?.maxHP || 100}</div>
                <div>Damage Dealt: {gameState?.player1?.totalDamageDealt || 0}</div>
                <div>Turns Survived: {gameState?.turnNumber || 0}</div>
              </div>
            </div>

            {/* Opponent Stats */}
            <div className="text-center p-4 bg-purple-900/30 rounded-lg">
              <div className="text-lg font-bold text-purple-400 mb-2">{opponent.username}</div>
              <div className="text-sm text-gray-400 space-y-1">
                <div>Final HP: {gameState?.player2?.hp || 0}/{gameState?.player2?.maxHP || 100}</div>
                <div>Damage Dealt: {gameState?.player2?.totalDamageDealt || 0}</div>
                <div>Turns Survived: {gameState?.turnNumber || 0}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Rewards */}
        {showStats && (
          <div className="mb-8 p-4 bg-yellow-900/20 rounded-lg backdrop-blur-sm animate-fadeIn">
            <h3 className="text-xl font-bold mb-3 text-yellow-400">Draw Rewards</h3>
            <div className="flex justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💰</span>
                <span>+75 Coins</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">⭐</span>
                <span>+30 XP</span>
              </div>
              {isRankedMatch ? (
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏆</span>
                  <span>No rank change (Draw)</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-400">
                  <span className="text-2xl">🏆</span>
                  <span>Quick Match (No rank change)</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-2xl">💰</span>
                <span>+75 Coins</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                <span>Honor Maintained</span>
              </div>
            </div>
          </div>
        )}

        {/* Motivational Message */}
        <div className="mb-8 p-4 bg-gray-700/30 rounded-lg">
          <div className="text-lg text-gray-300 italic">
            "A draw against a worthy opponent is still an honorable outcome. 
            Both warriors showed equal skill and determination!"
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onPlayAgain}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg"
          >
            ⚔️ Battle Again
          </button>
          <button
            onClick={onBackToMenu}
            className="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 rounded-xl font-bold transition-all transform hover:scale-105"
          >
            🏠 Main Menu
          </button>
        </div>

        {/* Fun Facts */}
        <div className="mt-8 text-xs text-gray-500 space-y-1">
          <p>💡 Fun Fact: Only {Math.round(Math.random() * 15 + 5)}% of battles end in a draw!</p>
          <p>🎯 Tip: Try different strategies to break the stalemate next time</p>
        </div>
      </div>
    </div>
  );
};