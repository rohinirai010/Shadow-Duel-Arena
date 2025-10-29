// Leaderboard management

import { Persistence } from './persistence';
import type { Player, LeaderboardEntry } from '../../shared/types/game';
import { calculateWinRate } from '../../shared/utils/helpers';

export class LeaderboardStorage {
  /**
   * Update player rank on leaderboard
   */
  static async updatePlayerRank(player: Player): Promise<void> {
    const entry: LeaderboardEntry = {
      rank: 0, // Will be calculated
      userId: player.userId,
      username: player.username,
      rankPoints: player.rankPoints,
      level: player.level,
      wins: player.wins,
      losses: player.losses,
    };
    
    // Update global leaderboard
    await this.addToLeaderboard('global', entry);
    
    // Update weekly leaderboard
    await this.addToLeaderboard('weekly', entry);
    
    // Update monthly leaderboard
    await this.addToLeaderboard('monthly', entry);
  }
  
  /**
   * Add entry to leaderboard
   */
  private static async addToLeaderboard(type: string, entry: LeaderboardEntry): Promise<void> {
    const leaderboard = await Persistence.getLeaderboard(type);
    
    // Remove old entry if exists
    const filtered = leaderboard.filter(e => e.userId !== entry.userId);
    
    // Add new entry
    filtered.push(entry);
    
    // Sort by rank points
    filtered.sort((a, b) => b.rankPoints - a.rankPoints);
    
    // Update ranks
    filtered.forEach((e, i) => {
      e.rank = i + 1;
    });
    
    // Keep top 100
    const top100 = filtered.slice(0, 100);
    
    await Persistence.saveLeaderboard(type, top100);
  }
  
  /**
   * Get leaderboard
   */
  static async getLeaderboard(type: string, limit = 100): Promise<LeaderboardEntry[]> {
    const leaderboard = await Persistence.getLeaderboard(type);
    return leaderboard.slice(0, limit);
  }
  
  /**
   * Get player's rank on leaderboard
   */
  static async getPlayerRank(userId: string, type: string): Promise<number | null> {
    const leaderboard = await Persistence.getLeaderboard(type);
    const index = leaderboard.findIndex(e => e.userId === userId);
    return index >= 0 ? index + 1 : null;
  }
  
  /**
   * Get global stats
   */
  static async getGlobalStats(): Promise<{
    totalPlayers: number;
    totalBattles: number;
    activePlayers: number;
  }> {
    // These would be aggregated from Redis in real implementation
    return {
      totalPlayers: 1000,
      totalBattles: 5000,
      activePlayers: 50,
    };
  }
}
