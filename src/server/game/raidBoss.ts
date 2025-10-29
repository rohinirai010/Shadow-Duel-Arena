// Raid Boss System - Multiplayer raid battles

import type { RaidBoss, BattlePlayer } from '../../shared/types/game';
import { GAME_CONFIG } from '../../shared/utils/constants';
import { generateGameId } from '../../shared/utils/helpers';

export class RaidBossSystem {
  /**
   * Check if raid boss should spawn
   */
  static shouldSpawnRaid(onlinePlayerCount: number): boolean {
    return onlinePlayerCount >= GAME_CONFIG.RAID_BOSS_TRIGGER;
  }
  
  /**
   * Create a new raid boss
   */
  static createRaidBoss(participantIds: string[]): RaidBoss {
    const now = Date.now();
    
    return {
      id: `raid_${generateGameId()}`,
      name: 'Ancient Dragon',
      hp: GAME_CONFIG.RAID_BOSS_HP,
      maxHP: GAME_CONFIG.RAID_BOSS_HP,
      phase: 1,
      participants: participantIds,
      isActive: true,
      createdAt: now,
      expiresAt: now + GAME_CONFIG.RAID_BOSS_DURATION * 1000,
    };
  }
  
  /**
   * Calculate raid boss phase based on HP percentage
   */
  static getRaidPhase(raid: RaidBoss): 1 | 2 | 3 {
    const hpPercent = (raid.hp / raid.maxHP) * 100;
    
    if (hpPercent > 50) return 1;
    if (hpPercent > 25) return 2;
    return 3;
  }
  
  /**
   * Calculate damage dealt to raid boss
   */
  static calculateRaidDamage(
    attacker: BattlePlayer,
    ability: string,
    totalPlayers: number
  ): number {
    // Base ability damage
    let damage = 25; // Base raid damage
    
    // Scale with number of participants (diminishing returns)
    const scaleFactor = 1 + (Math.log(totalPlayers) / 3);
    
    // Apply character modifiers
    const char = attacker.character;
    if (char === 'assassin') damage = Math.floor(damage * 1.3);
    if (char === 'mage') damage = Math.floor(damage * 1.2);
    if (char === 'tank') damage = Math.floor(damage * 0.9);
    
    return Math.floor(damage * scaleFactor);
  }
  
  /**
   * Calculate raid boss attack damage
   */
  static calculateBossAttack(raid: RaidBoss): number {
    const baseDamage = 15;
    
    // Phase 2: Enraged (more damage)
    if (raid.phase >= 2) {
      return baseDamage + 10;
    }
    
    // Phase 3: Ultimate mode
    if (raid.phase >= 3) {
      return baseDamage + 25;
    }
    
    return baseDamage;
  }
  
  /**
   * Select random target from participants
   */
  static selectBossTarget(participants: string[]): string {
    return participants[Math.floor(Math.random() * participants.length)];
  }
  
  /**
   * Get raid rewards based on performance
   */
  static calculateRaidRewards(raid: RaidBoss, participated: boolean, damageDealt: number): {
    xp: number;
    coins: number;
    isVictory: boolean;
  } {
    const isVictory = raid.hp <= 0;
    const isExpired = Date.now() >= raid.expiresAt;
    
    if (!participated) {
      return { xp: 0, coins: 0, isVictory: false };
    }
    
    if (isVictory) {
      const baseXP = 150;
      const baseCoins = 500;
      const bonus = Math.min(damageDealt / 100, 2); // Up to 2x bonus
      
      return {
        xp: Math.floor(baseXP * bonus),
        coins: Math.floor(baseCoins * bonus),
        isVictory: true,
      };
    }
    
    if (isExpired) {
      // Partial participation rewards
      return {
        xp: 50,
        coins: 100,
        isVictory: false,
      };
    }
    
    return { xp: 0, coins: 0, isVictory: false };
  }
  
  /**
   * Check if raid boss is still active
   */
  static isRaidActive(raid: RaidBoss): boolean {
    return raid.isActive && raid.hp > 0 && Date.now() < raid.expiresAt;
  }
  
  /**
   * Get time remaining for raid
   */
  static getRaidTimeRemaining(raid: RaidBoss): number {
    const remaining = raid.expiresAt - Date.now();
    return Math.max(0, remaining);
  }
  
  /**
   * Get raid status for display
   */
  static getRaidStatus(raid: RaidBoss): string {
    if (raid.hp <= 0) return 'Defeated! 🎉';
    
    const timeRemaining = this.getRaidTimeRemaining(raid);
    if (timeRemaining === 0) return 'Expired ❌';
    
    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')} remaining`;
  }
  
  /**
   * Get raid phase description
   */
  static getPhaseDescription(phase: number): string {
    const descriptions = {
      1: 'Phase 1: Awakening 🐉',
      2: 'Phase 2: Enraged! 🔥',
      3: 'Phase 3: Last Stand 💀',
    };
    return descriptions[phase as keyof typeof descriptions] || 'Unknown phase';
  }
}
