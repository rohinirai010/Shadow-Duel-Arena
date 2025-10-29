// Defeat Screen Component

import React from 'react';

interface DefeatScreenProps {
  battleData: any;
  player: any;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export const DefeatScreen: React.FC<DefeatScreenProps> = ({ battleData, player, onPlayAgain, onBackToMenu }) => {
  // Determine if this was a ranked match
  const isRankedMatch = battleData?.gameState?.mode === 'ranked' || battleData?.mode === 'ranked';
  return (
    <div className="container-responsive text-center">
      <div className="text-responsive-3xl mb-2 sm:mb-4 opacity-50">💀</div>
      <h2 className="text-responsive-3xl font-bold text-red-400 mb-4">DEFEAT</h2>
      
      <div className="bg-purple-900/50 p-responsive rounded-xl max-w-md mx-auto mb-4 sm:mb-6">
        <div className="text-responsive-lg font-bold mb-4">Battle Results:</div>
        <div className="space-y-2 text-left">
          <div className="flex justify-between text-responsive-sm">
            <span>💰 Battle Coins:</span>
            <span className="font-bold text-green-400">+50</span>
          </div>
          <div className="flex justify-between text-responsive-sm">
            <span>⭐ Experience:</span>
            <span className="font-bold text-blue-400">+20</span>
          </div>
          {isRankedMatch && (
            <div className="flex justify-between text-responsive-sm">
              <span>🏆 Rank Points:</span>
              <span className="font-bold text-red-400">-15</span>
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
          🎮 Try Again
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

