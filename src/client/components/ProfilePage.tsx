// Profile Page Component

import React from 'react';
import { getRankTier } from '../../shared/utils/helpers';

interface ProfilePageProps {
  player: any;
  onBack: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ player, onBack }) => {
  const computedTotal = (player.totalBattles ?? (player.wins + player.losses)) || 0;
  const winRate = computedTotal > 0
    ? Math.round((player.wins / computedTotal) * 100)
    : 0;

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="px-4 py-2 bg-gray-700 rounded-xl hover:bg-gray-600 text-responsive-sm cursor-pointer">
          ← Back
        </button>
        <h2 className="text-responsive-lg font-bold"> <span className='text-gray-700'>👤</span>  Profile</h2>
        <div className="w-16 sm:w-20"></div>
      </div>

      {/* Player Info */}
      <div className="bg-purple-900/50 p-4 rounded-xl mb-5 sm:mb-6">
        <div className="text-xl sm:text-2xl font-bold mb-2">{player.username}</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <div>
            <div className="text-gray-400 text-sm">Level</div>
            <div className="text-xl sm:text-2xl font-bold">{player.level || 1}</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Rank</div>
            <div className="text-lg font-bold text-yellow-400">{getRankTier(player.rankPoints || 0)}</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Rank Points</div>
            <div className="text-xl sm:text-2xl font-bold text-orange-400">{player.rankPoints || 0}</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Coins</div>
            <div className="text-xl sm:text-2xl font-bold text-green-400">💰 {player.coins || 500}</div>
          </div>
        </div>
      </div>

      {/* Battle Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-5 sm:mb-6">
        <div className="bg-purple-900/50 p-4 rounded-xl">
          <div className="text-gray-400 text-sm mb-1">Total Battles</div>
          <div className="text-2xl font-bold">{computedTotal}</div>
        </div>
        <div className="bg-purple-900/50 p-4 rounded-xl">
          <div className="text-gray-400 text-sm mb-1">Win Rate</div>
          <div className="text-2xl font-bold">{winRate}%</div>
        </div>
        <div className="bg-purple-900/50 p-4 rounded-xl">
          <div className="text-gray-400 text-sm mb-1">Wins</div>
          <div className="text-2xl font-bold text-green-400">{player.wins || 0}</div>
        </div>
        <div className="bg-purple-900/50 p-4 rounded-xl">
          <div className="text-gray-400 text-sm mb-1">Losses</div>
          <div className="text-2xl font-bold text-red-400">{player.losses || 0}</div>
        </div>
      </div>

      {/* Best Streak */}
      <div className="bg-purple-900/50 p-4 rounded-xl mb-5 sm:mb-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-gray-400 text-sm">Best Win Streak</div>
            <div className="text-2xl font-bold text-yellow-400">{player.bestStreak || 0}</div>
          </div>
          <div className="text-4xl">🔥</div>
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-purple-900/50 p-4 rounded-xl">
        <div className="font-bold mb-3">🏆 Achievements</div>
        <div className="grid grid-cols-2 gap-2">
          {(player.achievements && player.achievements.length > 0) ? (
            player.achievements.slice(0, 8).map((ach: string) => (
              <div key={ach} className="text-sm bg-gray-800 p-2 rounded">
                {ach}
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500">No achievements yet. Keep fighting!</div>
          )}
        </div>
      </div>
    </div>
  );
};

