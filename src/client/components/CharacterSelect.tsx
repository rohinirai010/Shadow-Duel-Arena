// Character Selection Component

import React, { useState } from 'react';

interface CharacterSelectProps {
  player: any;
  onStart: (data: any) => void;
  onBack: () => void;
}

const getCharacterUnlockStatus = (characterId: string, playerLevel: number): boolean => {
  switch (characterId) {
    case 'assassin':
      return playerLevel >= 5;
    case 'tank':
      return playerLevel >= 10;
    case 'healer':
      return playerLevel >= 15;
    default:
      return true;
  }
};

export const CharacterSelect: React.FC<CharacterSelectProps> = ({ player, onStart, onBack }) => {
  const [selected, setSelected] = useState('knight');
  const [mode, setMode] = useState<'quick_match' | 'ranked'>('quick_match');

  const CHARACTERS = [
    { id: 'mage', name: 'Mage', emoji: '🧙‍♂️', stats: '80 HP, 60 Energy', unlocked: true },
    { id: 'knight', name: 'Knight', emoji: '⚔️', stats: '100 HP, 50 Energy', unlocked: true },
    { id: 'ranger', name: 'Ranger', emoji: '🏹', stats: '90 HP, 55 Energy', unlocked: true },
    { id: 'assassin', name: 'Assassin', emoji: '🗡️', stats: '70 HP, 65 Energy', unlocked: getCharacterUnlockStatus('assassin', player.level) },
    { id: 'tank', name: 'Tank', emoji: '🛡️', stats: '130 HP, 45 Energy', unlocked: getCharacterUnlockStatus('tank', player.level) },
    { id: 'healer', name: 'Healer', emoji: '✨', stats: '95 HP, 60 Energy', unlocked: getCharacterUnlockStatus('healer', player.level) },
  ];

  const handleStart = async () => {
    try {
      const response = await fetch('/api/game/battle/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, character: selected }),
      });
      const data = await response.json();
      onStart(data);
    } catch (error) {
      console.error('Failed to start battle:', error);
    }
  };

  return (
    <div className="container-responsive">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <button onClick={onBack} className="px-4 py-2 bg-gray-700 rounded-xl sm:rounded-2xl hover:bg-gray-600 text-responsive-sm cursor-pointer">
          ← Back
        </button>
        <h2 className="text-responsive-lg font-bold">Select Character</h2>
        <div className="w-16 sm:w-20"></div>
      </div>

      {/* Mode Selection */}
      <div className="flex gap-2 sm:gap-4 mb-4 sm:mb-6">
        <button
          onClick={() => setMode('quick_match')}
          className={`flex-1 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-semibold transition-all text-responsive-sm cursor-pointer ${
            mode === 'quick_match'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          }`}
        >
          🎮 Quick Match
        </button>
        <button
          onClick={() => setMode('ranked')}
          className={`flex-1 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-semibold transition-all text-responsive-sm cursor-pointer ${
            mode === 'ranked'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          }`}
        >
          🏆 Ranked
        </button>
      </div>

      {/* Character Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 lg:gap-7 mb-4 sm:mb-6">
        {CHARACTERS.map(char => (
          <button
            key={char.id}
            onClick={() => char.unlocked && setSelected(char.id)}
            disabled={!char.unlocked}
            className={`p-2 sm:p-3 lg:p-5 rounded-xl sm:rounded-2xl transition-all ${
              selected === char.id
                ? 'bg-gradient-to-r from-purple-600 to-cyan-600 scale-105'
                : 'bg-purple-900/50 hover:bg-purple-800'
            } ${
              !char.unlocked ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
            }`}
          >
            <div className="text-center">
              <div className="text-4xl sm:text-5xl lg:text-6xl mb-2">{char.emoji}</div>
              <div className="text-responsive-base font-bold mb-1">{char.name}</div>
              <div className="text-responsive-xs text-gray-300">{char.stats}</div>
              {!char.unlocked && (
                <div className="mt-2 text-responsive-xs text-yellow-400">🔒 Locked</div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Abilities Display */}
      <div className="bg-purple-900/50 p-responsive rounded-xl sm:rounded-2xl mb-4 sm:mb-6">
        <div className="text-responsive-sm font-semibold mb-2">Selected Abilities:</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {['basic_attack', 'defend', 'fireball', 'heal'].map(ability => (
            <div key={ability} className="text-responsive-xs bg-gray-800 p-2 rounded-xl sm:rounded-2xl border border-gray-600">
              {ability.replace('_', ' ')}
            </div>
          ))}
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={handleStart}
        className="w-full py-responsive bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl sm:rounded-2xl text-responsive-lg font-bold hover:from-purple-700 hover:to-cyan-700 transition-all transform hover:scale-105 cursor-pointer"
      >
        START BATTLE ⚔️
      </button>
    </div>
  );
};

