// Progression System - XP, leveling, unlocks

import type { Player, VictoryData } from '../../shared/types/game';
import { GAME_CONFIG, CHARACTERS } from '../../shared/utils/constants';
import { getLevelInfo } from '../../shared/utils/helpers';

export class ProgressionSystem {
  /**
   * Award XP to player after battle
   */
  static awardXP(player: Player, won: boolean, isDraw: boolean = false): { updatedPlayer: Player; leveledUp: boolean; newLevel?: number } {
    let xpGain: number;
    if (isDraw) {
      xpGain = 30; // Draw XP
    } else {
      xpGain = won ? GAME_CONFIG.XP_PER_WIN : GAME_CONFIG.XP_PER_LOSS;
    }
    const newXP = player.xp + xpGain;
    
    const oldLevelInfo = getLevelInfo(player.xp);
    const newLevelInfo = getLevelInfo(newXP);
    
    const leveledUp = newLevelInfo.level > oldLevelInfo.level;
    
    const updated: Player = {
      ...player,
      xp: newXP,
      level: newLevelInfo.level,
      totalBattles: player.totalBattles + 1,
      wins: won ? player.wins + 1 : player.wins,
      losses: won ? player.losses : player.losses + 1,
      currentStreak: won ? player.currentStreak + 1 : 0,
      bestStreak: won ? Math.max(player.bestStreak, player.currentStreak + 1) : player.bestStreak,
      lastActive: Date.now(),
    };
    
    // Unlock characters based on level
    const unlockedChars = this.checkCharacterUnlocks(updated);
    updated.unlockedCharacters = Array.from(new Set([...updated.unlockedCharacters, ...unlockedChars]));
    
    // Unlock abilities based on level
    const unlockedAbils = this.checkAbilityUnlocks(updated);
    updated.unlockedAbilities = Array.from(new Set([...updated.unlockedAbilities, ...unlockedAbils]));
    
    return {
      updatedPlayer: updated,
      leveledUp,
      newLevel: leveledUp ? newLevelInfo.level : undefined,
    };
  }
  
  /**
   * Award coins to player after battle
   */
  static awardCoins(player: Player, won: boolean): number {
    const coins = won ? GAME_CONFIG.COINS_PER_WIN : GAME_CONFIG.COINS_PER_LOSS;
    return coins;
  }
  
  /**
   * Update rank points after ranked battle
   */
  static updateRankPoints(player: Player, won: boolean, isDraw: boolean = false): { newPoints: number; change: number } {
    let change: number;
    if (isDraw) {
      change = 0; // No rank point change for draws
    } else {
      change = won ? GAME_CONFIG.RANK_POINTS_WIN : GAME_CONFIG.RANK_POINTS_LOSS;
    }
    const newPoints = Math.max(0, player.rankPoints + change);
    
    return {
      newPoints,
      change,
    };
  }
  
  /**
   * Check for character unlocks based on level
   */
  private static checkCharacterUnlocks(player: Player): string[] {
    const unlocked: string[] = [];
    
    Object.values(CHARACTERS).forEach(char => {
      if (!char.unlocked && char.unlockLevel && player.level >= char.unlockLevel) {
        unlocked.push(char.id);
      }
    });
    
    return unlocked;
  }
  
  /**
   * Check for ability unlocks based on level
   */
  private static checkAbilityUnlocks(player: Player): string[] {
    const unlocked: string[] = [];
    const levelThresholds = {
      power_strike: 3,
      energy_drain: 5,
      shield_break: 7,
      berserk: 10,
      poison: 12,
      counter: 15,
      ultimate: 20,
      sacrifice: 25,
    };
    
    Object.entries(levelThresholds).forEach(([ability, minLevel]) => {
      if (!player.unlockedAbilities.includes(ability as any) && player.level >= minLevel) {
        unlocked.push(ability);
      }
    });
    
    return unlocked;
  }
  
  /**
   * Get rewards summary for a completed battle
   */
  static getRewardsSummary(victoryData: VictoryData): string {
    const parts: string[] = [];
    
    if (victoryData.winner) {
      parts.push(`💰 +${victoryData.coinsEarned} coins`);
      parts.push(`⭐ +${victoryData.xpEarned} XP`);
      
      if (victoryData.rankPointsChange) {
        const sign = victoryData.rankPointsChange > 0 ? '+' : '';
        parts.push(`🏆 ${sign}${victoryData.rankPointsChange} rank points`);
      }
    } else {
      parts.push(`💔 Lost battle`);
      parts.push(`⭐ +${victoryData.xpEarned} XP`);
    }
    
    return parts.join(' • ');
  }
  
  /**
   * Calculate next level XP requirement
   */
  static getXPForNextLevel(player: Player): { needed: number; progress: number; nextLevel: number } {
    const { level, xpForNext, nextLevel } = getLevelInfo(player.xp);
    
    return {
      needed: GAME_CONFIG.XP_PER_LEVEL,
      progress: GAME_CONFIG.XP_PER_LEVEL - xpForNext,
      nextLevel: nextLevel,
    };
  }
}
