// Persistent storage using Devvit KV store
import { redis as redisClient } from '@devvit/web/server';
import type { Player, ShadowData, LeaderboardEntry } from '../../shared/types/game';
import { createDefaultPlayer, getLevelInfo } from '../../shared/utils/helpers';

export class Persistence {
  /**
   * Save player profile
   */
  static async savePlayer(player: Player): Promise<void> {
    await redisClient.set(`profile:${player.userId}`, JSON.stringify(player));
  }

  /**
   * Get player profile
   */
  static async getPlayer(userId: string): Promise<Player | null> {
    try {
      const data = await redisClient.get(`profile:${userId}`);
      if (!data) {
        return null;
      }
      return JSON.parse(data) as Player;
    } catch (error) {
      console.error('Error getting player:', error);
      return null;
    }
  }

  /**
   * Create or get player profile
   */
  static async getOrCreatePlayer(userId: string, username: string): Promise<Player> {
    let player = await this.getPlayer(userId);
    if (!player) {
      player = createDefaultPlayer(userId, username);
      await this.savePlayer(player);
    } else {
      // Ensure level is properly calculated from XP for existing players
      const levelInfo = getLevelInfo(player.xp);
      let needsUpdate = false;
      
      if (player.level !== levelInfo.level) {
        player.level = levelInfo.level;
        needsUpdate = true;
      }
      
      // Ensure all required fields exist for existing players (migration)
      if (player.rankPoints === undefined) {
        player.rankPoints = 0;
        needsUpdate = true;
      }
      if (player.totalBattles === undefined) {
        player.totalBattles = (player.wins || 0) + (player.losses || 0);
        needsUpdate = true;
      }
      if (player.bestStreak === undefined) {
        player.bestStreak = 0;
        needsUpdate = true;
      }
      if (player.currentStreak === undefined) {
        player.currentStreak = 0;
        needsUpdate = true;
      }
      if (player.coins === undefined) {
        player.coins = 500;
        needsUpdate = true;
      }
      if (!player.achievements) {
        player.achievements = [];
        needsUpdate = true;
      }
      if (!player.unlockedCharacters) {
        player.unlockedCharacters = ['mage', 'knight', 'ranger'];
        needsUpdate = true;
      }
      if (!player.unlockedAbilities) {
        player.unlockedAbilities = ['basic_attack', 'defend', 'fireball', 'heal'];
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        console.log(`Migrating player data for ${player.username}: adding missing fields`);
        await this.savePlayer(player);
      }
    }
    return player;
  }

  /**
   * Save shadow data
   */
  static async saveShadow(shadow: ShadowData): Promise<void> {
    const key = `shadow:${shadow.originalUsername}:${shadow.recordedAt}`;
    await redisClient.set(key, JSON.stringify(shadow));
    
    // Add to shadow list using a simple JSON array
    try {
      const shadowsListData = await redisClient.get('shadows:list');
      const shadowsList = shadowsListData ? JSON.parse(shadowsListData) : [];
      
      if (!shadowsList.includes(key)) {
        shadowsList.push(key);
        // Keep only the last 100 shadows
        if (shadowsList.length > 100) {
          shadowsList.splice(0, shadowsList.length - 100);
        }
        await redisClient.set('shadows:list', JSON.stringify(shadowsList));
      }
    } catch (error) {
      console.error('Error adding shadow to list:', error);
    }
  }

  /**
   * Get shadows for a user
   */
  static async getShadows(userId?: string): Promise<ShadowData[]> {
    let keys: string[] = [];
    
    try {
      // Use simple JSON array
      const shadowsListData = await redisClient.get('shadows:list');
      keys = shadowsListData ? JSON.parse(shadowsListData) : [];
    } catch (error) {
      console.error('Error getting shadows list:', error);
      return [];
    }

    if (!keys || keys.length === 0) return [];

    const shadows: ShadowData[] = [];
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

    for (const key of keys) {
      try {
        const data = await redisClient.get(key);
        if (data) {
          const shadow = JSON.parse(data) as ShadowData;
          // Filter expired shadows
          if (now - shadow.recordedAt < maxAge) {
            shadows.push(shadow);
          }
        }
      } catch (error) {
        console.error(`Error loading shadow ${key}:`, error);
      }
    }

    return shadows;
  }

  /**
   * Save leaderboard
   */
  static async saveLeaderboard(type: string, entries: LeaderboardEntry[]): Promise<void> {
    await redisClient.set(`leaderboard:${type}`, JSON.stringify(entries));
  }

  /**
   * Get leaderboard
   */
  static async getLeaderboard(type: string): Promise<LeaderboardEntry[]> {
    const data = await redisClient.get(`leaderboard:${type}`);
    return data ? JSON.parse(data) : [];
  }

  /**
   * Save daily challenge
   */
  static async saveDailyChallenge(userId: string, date: string, challenge: any): Promise<void> {
    await redisClient.set(`daily:${userId}:${date}`, JSON.stringify(challenge));
  }

  /**
   * Get daily challenge
   */
  static async getDailyChallenge(userId: string, date: string): Promise<any> {
    const data = await redisClient.get(`daily:${userId}:${date}`);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Save player stats
   */
  static async saveStats(userId: string, stats: any): Promise<void> {
    await redisClient.set(`stats:${userId}`, JSON.stringify(stats));
  }

  /**
   * Get player stats
   */
  static async getStats(userId: string): Promise<any> {
    const data = await redisClient.get(`stats:${userId}`);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Save player achievements
   */
  static async saveAchievements(userId: string, achievements: string[]): Promise<void> {
    await redisClient.set(`achievements:${userId}`, JSON.stringify(achievements));
  }

  /**
   * Get player achievements
   */
  static async getAchievements(userId: string): Promise<string[]> {
    const data = await redisClient.get(`achievements:${userId}`);
    return data ? JSON.parse(data) : [];
  }

  /**
   * Clean up expired shadows
   */
  static async cleanupExpiredShadows(): Promise<void> {
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000;

    // Get all shadow keys and clean up expired ones
    let keys: string[] = [];
    try {
      const shadowsListData = await redisClient.get('shadows:list');
      keys = shadowsListData ? JSON.parse(shadowsListData) : [];
    } catch (error) {
      console.error('Error getting shadow keys for cleanup:', error);
      return;
    }
    
    const validKeys: string[] = [];
    
    for (const key of keys) {
      try {
        const data = await redisClient.get(key);
        if (data) {
          const shadow = JSON.parse(data) as ShadowData;
          if (now - shadow.recordedAt > maxAge) {
            await redisClient.del(key);
          } else {
            validKeys.push(key);
          }
        }
      } catch (error) {
        console.error(`Error cleaning up shadow ${key}:`, error);
      }
    }
    
    // Update the shadows list with only valid keys
    await redisClient.set('shadows:list', JSON.stringify(validKeys));
  }
}