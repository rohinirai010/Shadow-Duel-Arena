// Tutorial Component

import React from 'react';

interface TutorialProps {
  onClose: () => void;
}

export const Tutorial: React.FC<TutorialProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-start justify-center z-50 overflow-y-auto">
      <div className="bg-gradient-to-b from-purple-900 to-black p-responsive rounded-lg max-w-2xl mx-4 my-4 sm:my-8 border-2 border-purple-500 min-h-screen sm:min-h-0">
        <div className="text-center mb-4 sm:mb-6 pt-4 sm:pt-0">
          <h2 className="text-responsive-2xl font-bold text-cyan-400 mb-2">📖 How to Play</h2>
          <p className="text-responsive-lg text-gray-300">Master Shadow Duel Arena</p>
        </div>

        <div className="space-y-4 sm:space-y-6 text-white">
          {/* Overview */}
          <section className="bg-purple-900/50 border border-yellow-300 p-responsive rounded-lg">
            <h3 className="text-responsive-lg font-bold text-yellow-400 mb-2">🎮 Game Overview</h3>
            <p className="text-responsive-sm text-gray-200">
              Shadow Duel Arena is a turn-based battle game where you fight opponents in real-time PvP or 
              against "Shadows" - AI opponents created from recorded battles of real players!
            </p>
          </section>

          {/* Battle Basics */}
          <section className="bg-purple-900/50 border border-yellow-300 p-responsive rounded-lg">
            <h3 className="text-responsive-lg font-bold text-yellow-400 mb-2">⚔️ Battle Basics</h3>
            <div className="space-y-2 text-responsive-xs text-gray-200">
              <div>
                <strong className="text-cyan-400">Turn Timer:</strong> You have <strong>10 seconds</strong> per turn to choose an ability. If you don't act in time, you take a <strong>-5❤️</strong> penalty.
              </div>
              <div>
                <strong className="text-cyan-400">HP (Hit Points):</strong> When you reach 0, you lose
              </div>
              <div>
                <strong className="text-cyan-400">Energy:</strong> No passive regeneration. Use <span className="text-yellow-300">REST</span> to gain energy (+15⚡ / -5❤️)
              </div>
              <div>
                <strong className="text-cyan-400">Rest (fallback):</strong> If you can't afford any move, use <span className="text-yellow-300">REST</span> to gain <strong>+15⚡</strong> at the cost of <strong>-5❤️</strong>.
              </div>
              <div>
                <strong className="text-cyan-400">Status Effects:</strong> Watch for poison, berserk, defend buffs, and counters
              </div>
              <div>
                <strong className="text-cyan-400">Turn Limit:</strong> Battles have a <strong>10 turn</strong> limit. If time runs out, the player with higher HP wins; if exactly equal, it's a <strong>draw</strong>.
              </div>
            </div>
          </section>

          {/* Abilities Guide */}
          <section className="bg-purple-900/50  p-responsive rounded-lg">
            <h3 className="text-responsive-lg font-bold text-yellow-400 mb-2">🔥 Starter Abilities</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-responsive-xs">
              <div className="bg-gray-800 p-2 sm:p-3 rounded">
                <div className="font-bold text-red-400">⚔️ Attack (10 energy)</div>
                <div className="text-gray-300">Deal 20 damage</div>
              </div>
              <div className="bg-gray-800 p-2 sm:p-3 rounded">
                <div className="font-bold text-blue-400">🛡️ Defend (15 energy)</div>
                <div className="text-gray-300">Block 50% next turn</div>
              </div>
              <div className="bg-gray-800 p-2 sm:p-3 rounded">
                <div className="font-bold text-orange-400">🔥 Fireball (20 energy)</div>
                <div className="text-gray-300">Deal 35 damage</div>
              </div>
              <div className="bg-gray-800 p-2 sm:p-3 rounded">
                <div className="font-bold text-green-400">💊 Heal (25 energy)</div>
                <div className="text-gray-300">Restore 30 HP</div>
              </div>
            </div>
          </section>

          {/* Characters */}
          <section className="bg-purple-900/50 p-responsive rounded-lg">
            <h3 className="text-responsive-lg font-bold text-yellow-400 mb-2">🧙 Choose Your Fighter</h3>
            <div className="space-y-2 text-responsive-xs text-gray-200">
              <div><strong>🧙‍♂️ Mage:</strong> 80 HP, 60 Energy - High damage mage</div>
              <div><strong>⚔️ Knight:</strong> 100 HP, 50 Energy - Balanced warrior</div>
              <div><strong>🏹 Ranger:</strong> 90 HP, 55 Energy - Fast archer</div>
              <div className="text-yellow-400"><strong>🎯 Unlock:</strong> Level up to unlock Assassin (L5), Tank (L10), Healer (L15). New characters appear automatically on reaching the required level.</div>
            </div>
          </section>

          {/* Strategy Tips */}
          <section className="bg-purple-900/50 p-responsive rounded-lg">
            <h3 className="text-responsive-lg font-bold text-yellow-400 mb-2">💡 Pro Tips</h3>
            <ul className="list-disc list-inside space-y-1 sm:space-y-2 text-responsive-xs text-gray-200">
              <li>Manage your energy - don't waste it on weak attacks</li>
              <li>Defend when enemy has high energy</li>
              <li>Use heal when below 50% HP</li>
              <li>Watch for status effects like poison or berserk</li>
              <li>Study your opponent's patterns</li>
              <li>Energy doesn't regenerate - manage it carefully!</li>
            </ul>
          </section>

          {/* Shadows */}
          <section className="bg-purple-900/50 p-responsive rounded-lg border-2 border-cyan-500">
            <h3 className="text-responsive-lg font-bold text-cyan-400 mb-2">👻 The Shadow System</h3>
            <p className="text-responsive-xs text-gray-200">
              Every battle you fight gets recorded and becomes a "Shadow" opponent for other players!
              You'll never know if you're fighting a real player or a shadow until after the battle. 
              This means you can ALWAYS play, even when alone online!
            </p>
            <p className="text-responsive-xs text-gray-300 mt-2">
              <strong>Opponent selection:</strong> We first try to match you with online players near your rank. If none are available, we pick a compatible Shadow recorded from past community battles so matchmaking is instant.
            </p>
          </section>

          {/* Progression System */}
          <section className="bg-purple-900/50 p-responsive rounded-lg border-2 border-green-500">
            <h3 className="text-responsive-lg font-bold text-green-400 mb-2">📈 Progression System</h3>
            
            {/* XP & Levels */}
            <div className="mb-3">
              <h4 className="text-responsive-base font-bold text-yellow-400 mb-1">⭐ Experience & Levels</h4>
              <div className="text-responsive-xs text-gray-200 space-y-1">
                <div><strong>Win:</strong> +50 XP | <strong>Loss:</strong> +20 XP | <strong>Draw:</strong> +30 XP</div>
                <div><strong>Level Up:</strong> Every 100 XP (Level = Total XP ÷ 100 + 1)</div>
                <div className="text-green-300"><strong>Benefits:</strong> Unlock new characters and abilities permanently</div>
              </div>
            </div>

            {/* Rank System */}
            <div className="mb-3">
              <h4 className="text-responsive-base font-bold text-yellow-400 mb-1">🏆 Rank System (Ranked Mode Only)</h4>
              <div className="text-responsive-xs text-gray-200 space-y-1">
                <div><strong>Win:</strong> +25 Rank Points | <strong>Loss:</strong> -15 Rank Points | <strong>Draw:</strong> No change</div>
                <div className="grid grid-cols-2 gap-1 mt-2">
                  <div>🥉 <strong>Bronze:</strong> 0-99 pts</div>
                  <div>🥈 <strong>Silver:</strong> 100-299 pts</div>
                  <div>🥇 <strong>Gold:</strong> 300-599 pts</div>
                  <div>💎 <strong>Platinum:</strong> 600-999 pts</div>
                  <div>💠 <strong>Diamond:</strong> 1000-1999 pts</div>
                  <div>👑 <strong>Legend:</strong> 2000+ pts</div>
                </div>
              </div>
            </div>

            {/* Rewards */}
            <div className="mb-3">
              <h4 className="text-responsive-base font-bold text-yellow-400 mb-1">💰 Battle Rewards</h4>
              <div className="text-responsive-xs text-gray-200">
                <div><strong>Win:</strong> +100 Coins | <strong>Loss:</strong> +50 Coins | <strong>Draw:</strong> +75 Coins</div>
              </div>
            </div>

            {/* Unlocks */}
            <div>
              <h4 className="text-responsive-base font-bold text-yellow-400 mb-1">🔓 Level Unlocks</h4>
              <div className="text-responsive-xs text-gray-200 space-y-1">
                <div><strong>Characters:</strong> Assassin (L5), Tank (L10), Healer (L15)</div>
                <div><strong>Abilities:</strong> Power Strike (L3), Energy Drain (L5), Shield Break (L7), Berserk (L10), Poison (L12), Counter (L15), Ultimate (L20), Sacrifice (L25)</div>
                <div className="text-cyan-300 mt-1"><strong>Note:</strong> All unlocks are permanent and apply to all game modes!</div>
              </div>
            </div>
          </section>

          {/* Raid Boss */}
          <section className="bg-red-900/50 p-responsive rounded-lg">
            <h3 className="text-responsive-lg font-bold text-red-400 mb-2">🐉 Raid Boss Mode</h3>
            <p className="text-responsive-xs text-gray-200">
              When 10+ players are online, a Raid Boss spawns! Team up with other players to defeat 
              the massive boss and earn huge rewards! Lasts 10 minutes or until defeated.
            </p>
          </section>
        </div>

        {/* Close Button */}
        <div className="mt-6 sm:mt-8 text-center pb-4 sm:pb-0">
          <button
            onClick={onClose}
            className="px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl text-responsive-lg font-bold hover:from-purple-700 hover:to-cyan-700 transition-all transform hover:scale-105 cursor-pointer"
          >
            🎮 Start Playing!
          </button>
        </div>
      </div>
    </div>
  );
};

