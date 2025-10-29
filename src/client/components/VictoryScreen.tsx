// Victory Screen Component

import React from 'react';

interface VictoryScreenProps {
  battleData: any;
  player: any;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({ battleData, player, onPlayAgain, onBackToMenu }) => {
  // Determine if this was a ranked match
  const isRankedMatch = battleData?.gameState?.mode === 'ranked' || battleData?.mode === 'ranked';
  return (
    <div className="container-responsive text-center">
      <div className="animate-bounce text-responsive-3xl mb-2 sm:mb-4">🎉</div>
      <h2 className="text-responsive-3xl font-bold text-yellow-400 mb-4">VICTORY!</h2>
      
      <div className="bg-purple-900/50 p-responsive rounded-xl max-w-md mx-auto mb-4 sm:mb-6">
        <div className="text-responsive-lg font-bold text-green-400 mb-4">Rewards Earned:</div>
        <div className="space-y-2 text-left">
          <div className="flex justify-between text-responsive-sm">
            <span>💰 Battle Coins:</span>
            <span className="font-bold text-green-400">+100</span>
          </div>
          <div className="flex justify-between text-responsive-sm">
            <span>⭐ Experience:</span>
            <span className="font-bold text-blue-400">+50</span>
          </div>
          {isRankedMatch && (
            <div className="flex justify-between text-responsive-sm">
              <span>🏆 Rank Points:</span>
              <span className="font-bold text-yellow-400">+25</span>
            </div>
          )}
          {!isRankedMatch && (
            <div className="flex justify-between text-responsive-sm text-gray-400">
              <span>🏆 Rank Points:</span>
              <span>Quick Match (No rank change)</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <button
          onClick={onPlayAgain}
          className="w-full max-w-md mx-auto block py-responsive bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl text-responsive-lg font-bold hover:from-purple-700 hover:to-cyan-700 transition-all cursor-pointer"
        >
          🎮 Play Again
        </button>
        
        <button
          onClick={onBackToMenu}
          className="w-full max-w-md mx-auto block py-responsive bg-gray-700 rounded-xl text-responsive-lg font-bold hover:bg-gray-600 transition-all cursor-pointer"
        >
          ← Back to Menu
        </button>
      </div>
    </div>
  );
};

