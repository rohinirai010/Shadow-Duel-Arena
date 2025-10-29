// Enhanced Battle Effects Component for fighting game visual feedback

import React, { useState, useEffect } from 'react';

interface BattleEffectsProps {
  lastMove?: string;
  damage?: number;
  isPlayerTurn: boolean;
  comboCount?: number;
  moveType?: 'attack' | 'defend' | 'special' | 'heal';
}

export const BattleEffects: React.FC<BattleEffectsProps> = ({ 
  lastMove, 
  damage, 
  isPlayerTurn, 
  comboCount = 0,
  moveType = 'attack'
}) => {
  const [effects, setEffects] = useState<Array<{
    id: number;
    message: string;
    type: string;
    x: number;
    y: number;
    duration: number;
  }>>([]);

  useEffect(() => {
    if (lastMove && damage !== undefined) {
      const effectId = Date.now() + Math.random();
      const effectType = moveType;
      const message = getMoveMessage(lastMove, damage, effectType);
      
      setEffects(prev => [...prev, {
        id: effectId,
        message,
        type: effectType,
        x: 50 + (Math.random() - 0.5) * 20, // Center with some randomness
        y: 30 + (Math.random() - 0.5) * 20,
        duration: getEffectDuration(effectType)
      }]);
      
      setTimeout(() => {
        setEffects(prev => prev.filter(e => e.id !== effectId));
      }, getEffectDuration(effectType));
    }
  }, [lastMove, damage, moveType]);

  const getMoveMessage = (move: string, dmg: number, type: string) => {
    const moveNames: {[key: string]: string} = {
      'basic_attack': 'PUNCH!',
      'defend': 'BLOCK!',
      'fireball': 'FIREBALL!',
      'heal': 'HEAL!',
      'combo_attack': 'COMBO!',
      'special_move': 'SPECIAL!'
    };
    
    const moveName = moveNames[move] || move.toUpperCase();
    return `${moveName} ${dmg > 0 ? `-${dmg}` : ''}`;
  };

  const getEffectDuration = (type: string) => {
    const durations: {[key: string]: number} = {
      'attack': 1500,
      'defend': 1000,
      'special': 2000,
      'heal': 1500
    };
    return durations[type] || 1500;
  };

  const getEffectStyle = (type: string) => {
    const styles: {[key: string]: string} = {
      'attack': 'text-red-400 text-4xl sm:text-5xl font-bold animate-pulse',
      'defend': 'text-blue-400 text-3xl sm:text-4xl font-bold animate-bounce',
      'special': 'text-yellow-400 text-5xl sm:text-6xl font-bold animate-ping',
      'heal': 'text-green-400 text-4xl sm:text-5xl font-bold animate-pulse'
    };
    return styles[type] || styles['attack'];
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {effects.map((effect) => (
        <div
          key={effect.id}
          className={`absolute ${getEffectStyle(effect.type)}`}
          style={{
            left: `${effect.x}%`,
            top: `${effect.y}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
            animation: 'effectFloat 1.5s ease-out forwards'
          }}
        >
          {effect.message}
        </div>
      ))}
      
      {/* Combo indicator */}
      {comboCount > 1 && (
        <div
          className="absolute top-4 right-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-3 py-1 rounded-full font-bold text-lg animate-pulse"
          style={{ zIndex: 1001 }}
        >
          {comboCount}x COMBO!
        </div>
      )}
    </div>
  );
};

// Enhanced floating damage number component
interface DamageNumberProps {
  damage: number;
  x: number;
  y: number;
  type: 'damage' | 'heal' | 'critical' | 'blocked';
  isCritical?: boolean;
}

export const DamageNumber: React.FC<DamageNumberProps> = ({ 
  damage, 
  x, 
  y, 
  type, 
  isCritical = false 
}) => {
  const [visible, setVisible] = useState(true);
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 1500);
    const phaseTimer = setTimeout(() => setAnimationPhase(1), 200);
    return () => {
      clearTimeout(timer);
      clearTimeout(phaseTimer);
    };
  }, []);

  if (!visible) return null;

  const getDamageStyle = () => {
    const baseStyle = "absolute text-2xl sm:text-3xl lg:text-4xl font-bold";
    const typeStyles: {[key: string]: string} = {
      'damage': 'text-red-400',
      'heal': 'text-green-400',
      'critical': 'text-yellow-400 text-3xl sm:text-4xl lg:text-5xl',
      'blocked': 'text-gray-400 text-xl sm:text-2xl'
    };
    
    return `${baseStyle} ${typeStyles[type] || typeStyles['damage']}`;
  };

  const getAnimationStyle = () => {
    if (animationPhase === 0) {
      return {
        transform: 'translate(-50%, -50%) scale(0.5)',
        opacity: 0
      };
    }
    return {
      transform: 'translate(-50%, -50%) scale(1)',
      opacity: 1
    };
  };

  return (
    <div
      className={`${getDamageStyle()} ${isCritical ? 'animate-pulse' : ''}`}
      style={{ 
        left: `${x}%`, 
        top: `${y}%`, 
        zIndex: 1000,
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
        transition: 'all 0.3s ease-out',
        ...getAnimationStyle()
      }}
    >
      {type === 'damage' ? '-' : type === 'heal' ? '+' : ''}{damage}
      {isCritical && '!'}
    </div>
  );
};

// Screen shake effect component
interface ScreenShakeProps {
  intensity: number;
  duration: number;
  trigger: boolean;
}

export const ScreenShake: React.FC<ScreenShakeProps> = ({ 
  intensity, 
  duration, 
  trigger 
}) => {
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (trigger) {
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), duration);
      return () => clearTimeout(timer);
    }
  }, [trigger, duration]);

  if (!isShaking) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        animation: `screenShake ${duration}ms ease-out`,
        zIndex: 999
      }}
    />
  );
};

// Hit effect component
interface HitEffectProps {
  x: number;
  y: number;
  type: 'hit' | 'block' | 'critical' | 'miss';
  trigger: boolean;
}

export const HitEffect: React.FC<HitEffectProps> = ({ x, y, type, trigger }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (trigger) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 800);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  if (!visible) return null;

  const getHitStyle = () => {
    const styles: {[key: string]: string} = {
      'hit': 'text-red-500 text-6xl animate-ping',
      'block': 'text-blue-500 text-5xl animate-bounce',
      'critical': 'text-yellow-500 text-7xl animate-pulse',
      'miss': 'text-gray-500 text-4xl animate-ping'
    };
    return styles[type] || styles['hit'];
  };

  const getHitSymbol = () => {
    const symbols: {[key: string]: string} = {
      'hit': '💥',
      'block': '🛡️',
      'critical': '⚡',
      'miss': '💨'
    };
    return symbols[type] || symbols['hit'];
  };

  return (
    <div
      className={`absolute ${getHitStyle()}`}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: 1001
      }}
    >
      {getHitSymbol()}
    </div>
  );
};

