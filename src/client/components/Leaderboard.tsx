// Leaderboard Component

import React, { useState, useEffect } from 'react';
import { getRankTier } from '../../shared/utils/helpers';

interface LeaderboardProps {
  onBack: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ onBack }) => {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const response = await fetch('/api/game/leaderboard?type=global');
        const data = await response.json();
        setLeaderboard(data.entries || []);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load leaderboard:', error);
        setLoading(false);
      }
    };
    loadLeaderboard();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 text-responsive-sm cursor-pointer">
          ← Back
        </button>
        <h2 className="text-responsive-lg font-bold">🏆 Leaderboard</h2>
        <div className="w-16 sm:w-20"></div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-4xl animate-spin">⚙️</div>
          <div className="mt-4">Loading leaderboard...</div>
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.slice(0, 50).map((entry, idx) => (
            <div
              key={entry.userId}
              className={`flex items-center gap-4 p-4 rounded-lg ${
                idx < 3
                  ? 'bg-gradient-to-r from-yellow-600/30 to-orange-600/30 border border-yellow-500/50'
                  : 'bg-purple-900/50'
              }`}
            >
              <div className="text-2xl font-bold w-12 text-center">
                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
              </div>
              <div className="flex-1">
                <div className="font-bold">{entry.username}</div>
                <div className="text-sm text-gray-400">
                  Level {entry.level} • {entry.wins}W/{entry.losses}L • {getRankTier(entry.rankPoints)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-cyan-400">{entry.rankPoints}</div>
                <div className="text-xs text-gray-500">{getRankTier(entry.rankPoints)}</div>
              </div>
            </div>
          ))}
          {leaderboard.length === 0 && (
            <div className="text-center py-12 text-gray-500">No leaderboard data yet</div>
          )}
        </div>
      )}
    </div>
  );
};

