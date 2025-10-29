// Helper functions for Shadow Duel Arena

import type { Player } from '../types/game';
import { GAME_CONFIG } from './constants';

export function getRankTier(rankPoints: number): string {
  if (rankPoints < 100) return 'Bronze';
  if (rankPoints < 300) return 'Silver';
  if (rankPoints < 600) return 'Gold';
  if (rankPoints < 1000) return 'Platinum';
  if (rankPoints < 2000) return 'Diamond';
  return 'Legend';
}

export function calculateWinRate(player: Player): number {
  if (player.battles === 0) return 0;
  return Math.round((player.wins / player.battles) * 100);
}

export function getLevelInfo(xp: number): { level: number; xpInLevel: number; xpForNext: number } {
  const level = Math.floor(xp / GAME_CONFIG.XP_PER_LEVEL) + 1;
  const xpInLevel = xp % GAME_CONFIG.XP_PER_LEVEL;
  const xpForNext = GAME_CONFIG.XP_PER_LEVEL - xpInLevel;
  return { level, xpInLevel, xpForNext };
}

export function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = Math.floor((now - timestamp) / 1000);
  
  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function generateGameId(): string {
  return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function randomRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getPercentage(current: number, max: number): number {
  if (max === 0) return 0;
  return Math.round((current / max) * 100);
}

export function calculateEnergyEfficiency(
  totalEnergyUsed: number,
  totalDamageDealt: number
): number {
  if (totalEnergyUsed === 0) return 0;
  return Math.round(totalDamageDealt / totalEnergyUsed);
}

export function checkAchievements(
  player: Player,
  battleResult: 'win' | 'loss',
  damageTaken: number,
  energyRemaining: number,
  isShadowVictory: boolean
): string[] {
  const newAchievements: string[] = [];
  
  // First Blood
  if (player.wins === 1 && !player.achievements.includes('first_blood')) {
    newAchievements.push('first_blood');
  }
  
  // Hot Streak
  if (player.currentStreak >= 5 && !player.achievements.includes('hot_streak')) {
    newAchievements.push('hot_streak');
  }
  
  // Perfectionist
  if (damageTaken === 0 && !player.achievements.includes('perfectionist')) {
    newAchievements.push('perfectionist');
  }
  
  // Shadow Hunter
  if (player.losses + player.wins >= 100 && !player.achievements.includes('shadow_hunter')) {
    newAchievements.push('shadow_hunter');
  }
  
  // Dragon Slayer
  if (player.achievements.filter(a => a.includes('raid')).length >= 10 && !player.achievements.includes('dragon_slayer')) {
    newAchievements.push('dragon_slayer');
  }
  
  // Energy Master
  if (energyRemaining === 0 && !player.achievements.includes('energy_master')) {
    newAchievements.push('energy_master');
  }
  
  // Survivor
  if (damageTaken > 0 && damageTaken < 10 && !player.achievements.includes('survivor')) {
    newAchievements.push('survivor');
  }
  
  return newAchievements;
}

export function isValidCharacter(char: string): boolean {
  return ['mage', 'knight', 'ranger', 'assassin', 'tank', 'healer'].includes(char);
}

export function isValidAbility(ability: string): boolean {
  const abilities = [
    'basic_attack',
    'defend',
    'fireball',
    'heal',
    'power_strike',
    'energy_drain',
    'shield_break',
    'berserk',
    'poison',
    'counter',
    'ultimate',
    'sacrifice',
  ];
  return abilities.includes(ability);
}

export function createDefaultPlayer(userId: string, username: string): Player {
  return {
    userId,
    username,
    level: 1,
    xp: 0,
    rank: 0,
    rankPoints: 0,
    totalBattles: 0,
    wins: 0,
    losses: 0,
    bestStreak: 0,
    currentStreak: 0,
    favoriteCharacter: 'knight',
    battles: 0,
    coins: 500, // starting coins
    achievements: [],
    unlockedCharacters: ['mage', 'knight', 'ranger'],
    unlockedAbilities: ['basic_attack', 'defend', 'fireball', 'heal'],
    createdAt: Date.now(),
    lastActive: Date.now(),
  };
}
