// Splash Screen Component

import React, { useState, useEffect } from 'react';
import { getRankTier } from '../../shared/utils/helpers';

interface SplashScreenProps {
  player: any;
  onEnter: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ player, onEnter }) => {
  const total = (player.totalBattles ?? (player.wins + player.losses)) || 0;
  const [onlineCount, setOnlineCount] = useState(42);
  const [battlesToday, setBattlesToday] = useState(1247);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch dynamic stats
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/game/stats');
        if (response.ok) {
          const data = await response.json();
          setOnlineCount(data.onlineCount || 1);
          setBattlesToday(data.battlesToday || 0);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
    
    // Refresh stats every 30 seconds
    const statsInterval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(statsInterval);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 animate-pulse">
      <div className="text-center space-y-6">
        {/* Logo */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-4xl font-bold  animate-pulse">
            🎮 <span className='bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent'>Shadow Duel Arena</span>  ⚔️
          </h1>
          <p className="text-lg sm:text-2xl text-purple-300">Turn-Based Battle Royale</p>
        </div>
        
        {/* Stats */}
        <div className="mt-5 sm:mt-8 grid grid-cols-3 gap-3 sm:gap-6 max-w-2xl mx-auto">
          <div className="bg-purple-900/50 p-3 sm:p-6 rounded-lg backdrop-blur-sm">
            <div className="text-2xl sm:text-4xl font-bold text-cyan-400">{onlineCount}</div>
            <div className="text-sm text-gray-400 mt-1">Players Online</div>
          </div>
          <div className="bg-purple-900/50 p-3 sm:p-6 rounded-lg backdrop-blur-sm">
            <div className="text-2xl sm:text-4xl font-bold text-cyan-400">{battlesToday.toLocaleString()}</div>
            <div className="text-sm text-gray-400 mt-1">Battles Today</div>
          </div>
          <div className="bg-purple-900/50 p-3 sm:p-6 rounded-lg backdrop-blur-sm">
            <div className="text-2xl sm:text-4xl font-bold text-cyan-400">🐉</div>
            <div className="text-sm text-gray-400 mt-1">Raid Active</div>
          </div>
        </div>
        
        {/* Player Stats */}
        <div className="mt-5 sm:mt-8 bg-black/50 p-6 rounded-lg backdrop-blur-sm max-w-md mx-auto">
          <div className="text-lg font-semibold text-cyan-400 mb-2">
            Welcome, {player.username}!
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Level</div>
              <div className="text-lg sm:text-xl lg:2xl font-bold">{player.level || 1}</div>
            </div>
            <div>
              <div className="text-gray-400">Rank</div>
              <div className="text-sm font-bold text-yellow-400">{getRankTier(player.rankPoints || 0)}</div>
              <div className="text-xs text-gray-500">{player.rankPoints || 0} pts</div>
            </div>
            <div>
              <div className="text-gray-400">W/L</div>
              <div className="text-lg sm:text-xl lg:2xl font-bold">{player.wins || 0}/{player.losses || 0}</div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Total Battles</div>
              <div className="text-lg sm:text-xl lg:2xl font-bold">{total}</div>
            </div>
            <div>
              <div className="text-gray-400">Win Rate</div>
              <div className="text-lg sm:text-xl lg:2xl font-bold">{total > 0 ? Math.round(((player.wins || 0) / total) * 100) : 0}%</div>
            </div>
            <div>
              <div className="text-gray-400">Coins</div>
              <div className="text-lg sm:text-xl lg:2xl font-bold text-green-400">💰 {player.coins || 500}</div>
            </div>
          </div>
        </div>
        
        {/* Enter Button */}
        <button
          onClick={onEnter}
          className={`mt-5 sm:mt-8 px-12 py-4 text-lg font-bold rounded-xl transition-all transform shadow-lg shadow-purple-500/50 ${
            isLoading 
              ? 'bg-gray-600 cursor-not-allowed opacity-50' 
              : 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 hover:scale-105 cursor-pointer'
          }`}
        >
          {isLoading ? '⏳ Loading...' : '🎮 ENTER ARENA 🎮'}
        </button>
        
        <div className="text-sm text-gray-500 mt-4">
          {isLoading ? 'Loading stats...' : 'Press to start your first duel!'}
        </div>
      </div>
    </div>
  );
};

