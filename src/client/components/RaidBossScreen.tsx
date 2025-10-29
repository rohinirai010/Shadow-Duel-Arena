// Raid Boss Screen Component

import React, { useState, useEffect } from 'react';

interface RaidBossScreenProps {
  player: any;
  onBack: () => void;
}

export const RaidBossScreen: React.FC<RaidBossScreenProps> = ({ onBack }) => {
  const [raid, setRaid] = useState<any>(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const loadRaid = async () => {
      try {
        const response = await fetch('/api/game/raid');
        const data = await response.json();
        setRaid(data.raid);
      } catch (error) {
        console.error('Failed to load raid:', error);
      }
    };
    loadRaid();
  }, []);

  const handleJoin = async () => {
    try {
      const response = await fetch('/api/game/raid/join', { method: 'POST' });
      const data = await response.json();
      if (data.raidId) {
        setJoined(true);
        setRaid({ ...raid, participants: [...raid.participants, player.userId] });
      }
    } catch (error) {
      console.error('Failed to join raid:', error);
    }
  };

  if (!raid) {
    return (
      <div className="container mx-auto p-6 text-center">
        <button onClick={onBack} className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 mb-6 cursor-pointer">
          ← Back
        </button>
        <div className="text-6xl mb-4">🐉</div>
        <h2 className="text-3xl font-bold mb-4">No Active Raid Boss</h2>
        <p className="text-gray-400">
          Wait for 10+ players to be online simultaneously to trigger a raid boss!
        </p>
      </div>
    );
  }

  const hpPercent = (raid.hp / raid.maxHP) * 100;

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600">
          ← Back
        </button>
        <h2 className="text-3xl font-bold">🐉 Raid Boss</h2>
        <div className="w-20"></div>
      </div>

      {/* Boss Info */}
      <div className="bg-red-900/50 p-6 rounded-lg mb-6 border-2 border-red-500">
        <div className="text-center mb-4">
          <div className="text-8xl">🐉</div>
          <div className="text-3xl font-bold">{raid.name}</div>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <span className="font-semibold">HP</span>
            <span className="font-bold">{raid.hp}/{raid.maxHP}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-6">
            <div
              className="h-6 bg-red-600 rounded-full transition-all"
              style={{ width: `${hpPercent}%` }}
            ></div>
          </div>
        </div>

        <div className="text-center">
          <div className="font-semibold mb-1">Phase: {raid.phase}</div>
          <div className="text-2xl font-bold text-yellow-400">
            ⚔️ {raid.participants.length} Heroes Fighting
          </div>
        </div>
      </div>

      {!joined && !raid.participants.includes(player.userId) && (
        <button
          onClick={handleJoin}
          className="w-full py-4 bg-gradient-to-r from-red-600 to-purple-600 rounded-lg text-xl font-bold hover:from-red-700 hover:to-purple-700 transition-all transform hover:scale-105 mb-6"
        >
          ⚔️ JOIN RAID NOW
        </button>
      )}

      {joined && (
        <div className="bg-green-900/50 p-4 rounded-lg mb-6 border border-green-500">
          <div className="text-center font-bold text-green-400">
            ✅ Joined Raid! Waiting for players...
          </div>
        </div>
      )}

      {/* Participants List */}
      <div className="bg-purple-900/50 p-4 rounded-lg">
        <div className="font-bold mb-3">Heroes in Battle:</div>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {raid.participants.map((pid: string, idx: number) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <span>{pid === player.userId ? '🧙' : '⚔️'}</span>
              <span className={pid === player.userId ? 'font-bold text-cyan-400' : ''}>
                {pid === player.userId ? 'You' : `Player ${idx + 1}`}
              </span>
              {idx === 0 && <span className="ml-auto text-green-400">Attacking!</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

