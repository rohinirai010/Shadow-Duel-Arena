// Main Menu Component

import React from 'react';
import { getRankTier } from '../../shared/utils/helpers';

interface MainMenuProps {
  player: any;
  onTutorial: () => void;
  onCharacterSelect: () => void;
  onBattleStart: (data: any) => void;
  onLeaderboard: () => void;
  onProfile: () => void;
  onRaidBoss: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  player,
  onTutorial,
  onCharacterSelect,
  onLeaderboard,
  onProfile,
  onRaidBoss,
}) => {
  // Debug logging for rank points
  console.log('MainMenu player data:', {
    username: player?.username,
    level: player?.level,
    rankPoints: player?.rankPoints,
    wins: player?.wins,
    coins: player?.coins
  });
  return (
    <div className="container-responsive">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-responsive-3xl font-bold mb-2">
          🎮 <span className='bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent'> Shadow Duel Arena </span>  ⚔️
        </h1>
        <p className="text-responsive-sm text-gray-400">Welcome back, {player.username}!</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 sm:mb-8">
        <div className="bg-purple-900/50 p-responsive rounded-xl sm:rounded-2xl text-center">
          <div className="text-responsive-xl font-bold text-cyan-400">{player.level || 1}</div>
          <div className="text-responsive-xs text-gray-400 mt-1">Level</div>
        </div>
        <div className="bg-purple-900/50 p-responsive rounded-xl sm:rounded-2xl text-center">
          <div className="text-responsive-base font-bold text-yellow-400">{getRankTier(player.rankPoints || 0)}</div>
          <div className="text-responsive-xs text-gray-400 mt-1">Rank</div>
        </div>
        <div className="bg-purple-900/50 p-responsive rounded-xl sm:rounded-2xl text-center">
          <div className="text-responsive-xl font-bold text-orange-400">{player.rankPoints || 0}</div>
          <div className="text-responsive-xs text-gray-400 mt-1">Rank Points</div>
        </div>
        <div className="bg-purple-900/50 p-responsive rounded-xl sm:rounded-2xl text-center">
          <div className="text-responsive-xl font-bold text-green-400">{player.wins || 0}</div>
          <div className="text-responsive-xs text-gray-400 mt-1">Wins</div>
        </div>
      </div>
      
      {/* Additional Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-5 sm:mb-8">
        <div className="bg-purple-900/50 p-responsive rounded-xl sm:rounded-2xl text-center">
          <div className="text-responsive-xl font-bold text-red-400">{player.losses || 0}</div>
          <div className="text-responsive-xs text-gray-400 mt-1">Losses</div>
        </div>
        <div className="bg-purple-900/50 p-responsive rounded-xl sm:rounded-2xl text-center">
          <div className="text-responsive-xl font-bold text-purple-400">{player.totalBattles || 0}</div>
          <div className="text-responsive-xs text-gray-400 mt-1">Total Battles</div>
        </div>
        <div className="bg-purple-900/50 p-responsive rounded-xl sm:rounded-2xl text-center">
          <div className="text-responsive-xl font-bold text-yellow-400">💰 {player.coins || 500}</div>
          <div className="text-responsive-xs text-gray-400 mt-1">Coins</div>
        </div>
      </div>

      {/* Menu Options */}
      <div className="space-responsive">
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4'>

        <button
          onClick={onCharacterSelect}
          className="w-full p-2 sm:p-3 lg:p-5 bg-gradient-to-r from-purple-600 to-purple-800 rounded-xl hover:from-purple-700 hover:to-purple-900 transition-all transform hover:scale-95 text-left cursor-pointer"
        >
          <div className="flex items-center gap-3 sm:gap-2 lg:gap-4">
            <span className="text-3xl sm:text-4xl">⚔️</span>
            <div>
              <div className="text-responsive-lg font-bold">Quick Match</div>
              <div className="text-responsive-xs text-gray-300">Fight instantly, earn rewards</div>
            </div>
          </div>
        </button>

        <button
          onClick={onCharacterSelect}
          className="w-full p-2 sm:p-3 lg:p-5 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl hover:from-yellow-700 hover:to-orange-700 transition-all transform hover:scale-95 text-left cursor-pointer"
        >
          <div className="flex items-center gap-3 sm:gap-2 lg:gap-4">
            <span className="text-3xl sm:text-4xl">🏆</span>
            <div>
              <div className="text-responsive-lg font-bold">Ranked Battle</div>
              <div className="text-responsive-xs text-gray-300">Competitive mode, earn rank points</div>
            </div>
          </div>
        </button>

        <button
          onClick={onRaidBoss}
          className="w-full p-2 sm:p-3 lg:p-5 bg-gradient-to-r from-red-600 to-purple-600 rounded-xl hover:from-red-700 hover:to-purple-700 transition-all transform hover:scale-95 text-left cursor-pointer"
        >
          <div className="flex items-center gap-3 sm:gap-2 lg:gap-4">
            <span className="text-3xl sm:text-4xl">🐉</span>
            <div>
              <div className="text-responsive-lg font-bold">Raid Boss</div>
              <div className="text-responsive-xs text-gray-300">10+ players online - Join now!</div>
            </div>
          </div>
        </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={onLeaderboard}
            className="p-responsive bg-purple-900/50 rounded-xl hover:bg-purple-800 transition-all text-left cursor-pointer"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-2xl sm:text-3xl">📊</span>
              <div>
                <div className="text-responsive-base font-bold">Leaderboard</div>
                <div className="text-responsive-xs text-gray-400">Top players</div>
              </div>
            </div>
          </button>

          <button
            onClick={onProfile}
            className="p-responsive bg-purple-900/50 rounded-xl hover:bg-purple-800 transition-all text-left cursor-pointer"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-2xl sm:text-3xl">👤</span>
              <div>
                <div className="text-responsive-base font-bold">Profile</div>
                <div className="text-responsive-xs text-gray-400">Your stats</div>
              </div>
            </div>
          </button>
        </div>

        {/* <div className="p-responsive bg-cyan-900/30 rounded-xl border border-cyan-500/30">
          <div className="text-responsive-sm font-semibold text-cyan-400 mb-1">🎯 Daily Challenge</div>
          <div className="text-responsive-xs text-gray-300">Win 3 battles today [2/3]</div>
          <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
            <div className="bg-cyan-500 h-2 rounded-full" style={{ width: '67%' }}></div>
          </div>
        </div> */}

        {/* Tutorial Button */}
        <button
          onClick={onTutorial}
          className="w-full  py-responsive bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl sm:rounded-2xl text-responsive-lg font-bold hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105 flex items-center justify-center gap-2 mt-4 cursor-pointer"
        >
          📖 How to Play
        </button>
      </div>
    </div>
  );
};

