// Waiting Screen Component - Shows while waiting for opponent to accept battle

import React, { useState, useEffect } from 'react';

interface WaitingScreenProps {
  opponentName: string;
  onCancel: () => void;
  onBattleAccepted: (battleData: any) => void;
}

export const WaitingScreen: React.FC<WaitingScreenProps> = ({ 
  opponentName, 
  onCancel, 
  onBattleAccepted 
}) => {
  const [dots, setDots] = useState('');
  const [timeWaited, setTimeWaited] = useState(0);

  // Animated dots effect
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Track waiting time
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeWaited(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check for battle acceptance via heartbeat
  useEffect(() => {
    const checkBattleStatus = async () => {
      try {
        const response = await fetch('/api/game/heartbeat', { method: 'POST' });
        const data = await response.json();
        
        if (data.battleActiveNotification) {
          // Battle was accepted, fetch battle data
          const battleResponse = await fetch('/api/game/battle/accept', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameId: data.battleActiveNotification.gameId })
          });
          
          if (battleResponse.ok) {
            const battleData = await battleResponse.json();
            onBattleAccepted(battleData);
          }
        }
      } catch (error) {
        console.error('Error checking battle status:', error);
      }
    };

    const interval = setInterval(checkBattleStatus, 2000); // Check every 2 seconds
    return () => clearInterval(interval);
  }, [onBattleAccepted]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-black to-purple-900 text-white flex items-center justify-center p-6">
      <div className="text-center max-w-md mx-auto">
        {/* Animated Battle Icon */}
        <div className="mb-8 animate-pulse">
          <div className="text-8xl mb-4">⚔️</div>
          <div className="text-6xl animate-bounce">⏳</div>
        </div>

        {/* Waiting Message */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Battle Invitation Sent!
          </h1>
          <p className="text-xl text-gray-300 mb-2">
            Waiting for <span className="text-yellow-400 font-bold">{opponentName}</span> to accept{dots}
          </p>
          <p className="text-sm text-gray-500">
            Time waited: {Math.floor(timeWaited / 60)}:{(timeWaited % 60).toString().padStart(2, '0')}
          </p>
        </div>

        {/* Status Messages */}
        <div className="mb-8 p-4 bg-purple-900/50 rounded-lg backdrop-blur-sm">
          <div className="text-sm text-gray-400 space-y-2">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Battle invitation delivered</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span>Waiting for response...</span>
            </div>
          </div>
        </div>

        {/* Cancel Button */}
        <button
          onClick={onCancel}
          className="px-8 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-bold transition-all transform hover:scale-105"
        >
          Cancel Battle
        </button>

        {/* Tips */}
        <div className="mt-8 text-xs text-gray-500">
          <p>💡 Tip: The opponent has 2 minutes to respond</p>
          <p>If they don't respond, you'll be matched with a shadow opponent</p>
        </div>
      </div>
    </div>
  );
};