// Redis storage for real-time game state

import { redis } from '@devvit/web/server';
import type { GameState, Player, RaidBoss } from '../../shared/types/game';

export class RedisStorage {
  /**
   * Store active game state
   */
  static async setGameState(gameId: string, state: GameState, ttl = 300): Promise<void> {
    await redis.set(`game:${gameId}`, JSON.stringify(state), { expiration: new Date(Date.now() + ttl * 1000) });
  }
  
  /**
   * Get active game state
   */
  static async getGameState(gameId: string): Promise<GameState | null> {
    const data = await redis.get(`game:${gameId}`);
    if (!data) return null;
    return JSON.parse(data) as GameState;
  }
  
  /**
   * Delete game state
   */
  static async deleteGameState(gameId: string): Promise<void> {
    await redis.del(`game:${gameId}`);
  }
  
  /**
   * Mark player as online
   */
  static async setPlayerOnline(userId: string, ttl = 300): Promise<void> {
    // Use a simple key-value approach with TTL
    await redis.set(`player:online:${userId}`, Date.now().toString(), { expiration: new Date(Date.now() + ttl * 1000) });
    
    // Update the online players list
    await this.updateOnlinePlayersList(userId);
    
    // Also maintain a list of all players who have been online (for tracking)
    await redis.set(`player:last_seen:${userId}`, Date.now().toString());
  }
  
  /**
   * Check if player is online
   */
  static async isPlayerOnline(userId: string): Promise<boolean> {
    const online = await redis.get(`player:online:${userId}`);
    return online !== null;
  }
  
  /**
   * Get count of online players - simplified approach
   */
  static async getOnlinePlayerCount(): Promise<number> {
    try {
      // Get the actual online players list and count them
      const onlinePlayers = await this.getOnlinePlayers();
      return Math.max(1, onlinePlayers.length); // At least 1 (the current player)
    } catch (error) {
      console.error('Error getting online player count:', error);
      return 1;
    }
  }
  
  /**
   * Get all online player IDs - simplified approach
   */
  static async getOnlinePlayers(): Promise<string[]> {
    try {
      // Since we can't scan keys, we'll maintain a simple list
      const playersData = await redis.get('players:online_list');
      if (!playersData) return [];
      
      const playersList = JSON.parse(playersData) as Array<{userId: string, timestamp: number}>;
      const now = Date.now();
      const fiveMinutesAgo = now - 300000; // 5 minutes
      
      // Filter out players who haven't been seen in 5 minutes
      const onlinePlayers = playersList
        .filter(p => p.timestamp > fiveMinutesAgo)
        .map(p => p.userId);
      
      return onlinePlayers;
    } catch (error) {
      console.error('Error getting online players:', error);
      return [];
    }
  }
  
  /**
   * Update online players list
   */
  static async updateOnlinePlayersList(userId: string): Promise<void> {
    try {
      const playersData = await redis.get('players:online_list');
      let playersList = playersData ? JSON.parse(playersData) as Array<{userId: string, timestamp: number}> : [];
      
      // Remove old entry for this user
      playersList = playersList.filter(p => p.userId !== userId);
      
      // Add current entry
      playersList.push({ userId, timestamp: Date.now() });
      
      // Keep only last 100 players and recent ones (last 10 minutes)
      const tenMinutesAgo = Date.now() - 600000;
      playersList = playersList
        .filter(p => p.timestamp > tenMinutesAgo)
        .slice(-100);
      
      await redis.set('players:online_list', JSON.stringify(playersList));
      await redis.set('stats:online_count', playersList.length.toString());
    } catch (error) {
      console.error('Error updating online players list:', error);
    }
  }
  
  /**
   * Set active raid boss
   */
  static async setRaidBoss(raid: RaidBoss, ttl = 600): Promise<void> {
    const data = JSON.stringify(raid);
    await redis.set('raid:active', data, { expiration: new Date(Date.now() + ttl * 1000) });
  }
  
  /**
   * Get active raid boss
   */
  static async getRaidBoss(): Promise<RaidBoss | null> {
    const data = await redis.get('raid:active');
    if (!data) return null;
    return JSON.parse(data) as RaidBoss;
  }
  
  /**
   * Clear raid boss
   */
  static async clearRaidBoss(): Promise<void> {
    await redis.del('raid:active');
  }
  
  /**
   * Add player to matchmaking queue
   */
  static async addToQueue(mode: string, userId: string): Promise<void> {
    const queueData = await redis.get(`queue:${mode}`);
    const queue = queueData ? JSON.parse(queueData) : [];
    if (!queue.includes(userId)) {
      queue.push(userId);
      await redis.set(`queue:${mode}`, JSON.stringify(queue));
    }
  }
  
  /**
   * Remove player from matchmaking queue
   */
  static async removeFromQueue(mode: string, userId: string): Promise<void> {
    const queueData = await redis.get(`queue:${mode}`);
    if (queueData) {
      const queue = JSON.parse(queueData);
      const filtered = queue.filter((id: string) => id !== userId);
      await redis.set(`queue:${mode}`, JSON.stringify(filtered));
    }
  }
  
  /**
   * Get players in queue
   */
  static async getQueuePlayers(mode: string): Promise<string[]> {
    const queueData = await redis.get(`queue:${mode}`);
    return queueData ? JSON.parse(queueData) : [];
  }
  
  /**
   * Set global stats
   */
  static async incrementStat(stat: string, value = 1): Promise<number> {
    return await redis.incrBy(`stats:${stat}`, value);
  }
  
  /**
   * Get global stats
   */
  static async getStat(stat: string): Promise<number> {
    const value = await redis.get(`stats:${stat}`);
    return value ? parseInt(value) : 0;
  }
  
  /**
   * Set temporary data
   */
  static async setTemp(key: string, value: any, ttl: number): Promise<void> {
    await redis.set(key, JSON.stringify(value), { expiration: new Date(Date.now() + ttl * 1000) });
  }
  
  /**
   * Get battles today count
   */
  static async getBattlesToday(): Promise<number> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return await this.getStat(`battles:${today}`);
  }
  
  /**
   * Increment battles today count
   */
  static async incrementBattlesToday(): Promise<number> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return await this.incrementStat(`battles:${today}`);
  }

  /**
   * Create a battle invitation
   */
  static async createBattleInvitation(
    inviteeUserId: string, 
    gameId: string, 
    inviterUsername: string,
    playerRole: 'player1' | 'player2'
  ): Promise<void> {
    const invitation = {
      gameId,
      playerRole,
      inviterUsername,
      timestamp: Date.now(),
      type: 'battle_invitation',
      status: 'pending'
    };
    
    // Set invitation with 10 minute expiry
    await redis.set(`invitation:${inviteeUserId}`, JSON.stringify(invitation), { expiration: new Date(Date.now() + 600000) });
  }

  /**
   * Get pending battle invitation for a player
   */
  static async getBattleInvitation(userId: string): Promise<{gameId: string, playerRole: 'player1' | 'player2', inviterUsername: string} | null> {
    try {
      const invitationData = await redis.get(`invitation:${userId}`);
      if (!invitationData) return null;
      
      const invitation = JSON.parse(invitationData);
      if (invitation.type === 'battle_invitation' && invitation.status === 'pending') {
        return {
          gameId: invitation.gameId,
          playerRole: invitation.playerRole,
          inviterUsername: invitation.inviterUsername
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting battle invitation:', error);
      return null;
    }
  }

  /**
   * Clear battle invitation for a player
   */
  static async clearBattleInvitation(userId: string): Promise<void> {
    await redis.del(`invitation:${userId}`);
  }

  /**
   * Clear battle notification for a player (alias for clearBattleInvitation)
   */
  static async clearBattleNotification(userId: string): Promise<void> {
    await this.clearBattleInvitation(userId);
    await redis.del(`battle_active:${userId}`);
  }

  /**
   * Accept battle invitation
   */
  static async acceptBattleInvitation(userId: string): Promise<void> {
    const invitationData = await redis.get(`invitation:${userId}`);
    if (invitationData) {
      const invitation = JSON.parse(invitationData);
      invitation.status = 'accepted';
      await redis.set(`invitation:${userId}`, JSON.stringify(invitation), { expiration: new Date(Date.now() + 600000) });
    }
  }

  /**
   * Decline battle invitation
   */
  static async declineBattleInvitation(userId: string): Promise<void> {
    const invitationData = await redis.get(`invitation:${userId}`);
    if (invitationData) {
      const invitation = JSON.parse(invitationData);
      invitation.status = 'declined';
      await redis.set(`invitation:${userId}`, JSON.stringify(invitation), { expiration: new Date(Date.now() + 60000) }); // Keep for 1 minute for cleanup
    }
  }

  /**
   * Notify player that battle is now active
   */
  static async notifyBattleActive(userId: string, gameId: string): Promise<void> {
    const notification = {
      type: 'battle_active',
      gameId,
      timestamp: Date.now()
    };
    await redis.set(`battle_active:${userId}`, JSON.stringify(notification), { expiration: new Date(Date.now() + 300000) }); // 5 minutes
  }

  /**
   * Check if player has battle active notification
   */
  static async getBattleActiveNotification(userId: string): Promise<{gameId: string} | null> {
    try {
      const notificationData = await redis.get(`battle_active:${userId}`);
      if (!notificationData) return null;
      
      const notification = JSON.parse(notificationData);
      if (notification.type === 'battle_active') {
        // Clear the notification after reading
        await redis.del(`battle_active:${userId}`);
        return { gameId: notification.gameId };
      }
      return null;
    } catch (error) {
      console.error('Error getting battle active notification:', error);
      return null;
    }
  }

  /**
   * Check if player has an active battle
   */
  static async getPlayerActiveBattle(userId: string): Promise<string | null> {
    try {
      // Check if player has an invitation first
      const invitation = await this.getBattleInvitation(userId);
      if (invitation) {
        // Verify the game still exists and is active
        const gameState = await this.getGameState(invitation.gameId);
        if (gameState && gameState.status === 'active') {
          return invitation.gameId;
        } else {
          // Clean up stale invitation
          await this.clearBattleInvitation(userId);
        }
      }
      return null;
    } catch (error) {
      console.error('Error checking active battle:', error);
      return null;
    }
  }
}
