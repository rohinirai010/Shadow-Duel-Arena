// Game API handlers

import type { 
  Player, 
  GameState, 
  ShadowData, 
  BattlePlayer,
  GetPlayerResponse,
  StartBattleResponse,
  GetLeaderboardResponse,
  GetRaidBossResponse,
} from '../../shared/types/api';
import { Persistence } from '../storage/persistence';
import { RedisStorage } from '../storage/redis';
import { LeaderboardStorage } from '../storage/leaderboard';
import { MatchmakingSystem } from '../game/matchmaking';
import { BattleEngine } from '../game/battleEngine';
import { ProgressionSystem } from '../game/progression';
import { GAME_CONFIG } from '../../shared/utils/constants';
import { RaidBossSystem } from '../game/raidBoss';
import { createDefaultPlayer, generateGameId } from '../../shared/utils/helpers';
import { reddit } from '@devvit/web/server';

export class GameAPI {
  private static timeoutTimers: Map<string, NodeJS.Timeout> = new Map();

  static scheduleTimeoutCheck(gameId: string, _turnStartedAt: number) {
    // Clear any existing timeout for this game
    const existingTimer = this.timeoutTimers.get(gameId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      console.log(`Cleared existing timeout for game ${gameId}`);
    }

    // Schedule timeout check after TURN_TIME_LIMIT seconds
    const timeoutMs = GAME_CONFIG.TURN_TIME_LIMIT * 1000;
    const timer = setTimeout(async () => {
      try {
        console.log(`🚨 SERVER TIMEOUT CHECK TRIGGERED for game ${gameId} after ${GAME_CONFIG.TURN_TIME_LIMIT} seconds`);
        const result = await this.timeoutTick(gameId);
        console.log(`Server timeout result:`, result);
      } catch (error) {
        console.error(`Error in scheduled timeout check for game ${gameId}:`, error);
      }
    }, timeoutMs);

    this.timeoutTimers.set(gameId, timer);
    console.log(`✅ Scheduled server timeout check for game ${gameId} in ${GAME_CONFIG.TURN_TIME_LIMIT} seconds (${timeoutMs}ms)`);
  }

  static clearTimeoutCheck(gameId: string) {
    const timer = this.timeoutTimers.get(gameId);
    if (timer) {
      clearTimeout(timer);
      this.timeoutTimers.delete(gameId);
      console.log(`Cleared timeout check for game ${gameId}`);
    }
  }

  static getActiveTimeouts() {
    return Array.from(this.timeoutTimers.keys());
  }

  private static async finalizeBattle(gameId: string, gameState: GameState, winner: 'player1' | 'player2' | 'draw') {
    gameState.status = 'finished';
    gameState.winner = winner;
    
    // Save the finished game state first so both players can see the result
    await RedisStorage.setGameState(gameId, gameState, 30); // Keep for 30 seconds for both players to see
    
    // Update both players' stats if it's a PvP match
    if (!gameState.isShadowMatch && gameState.player2) {
      try {
        // Update Player 1 stats
        const player1 = await Persistence.getPlayer(gameState.player1.userId);
        if (player1) {
          const player1Won = winner === 'player1';
          const isDraw = winner === 'draw';
          
          // Use ProgressionSystem for proper XP, level, and unlock handling
          const xpResult = ProgressionSystem.awardXP(player1, player1Won, isDraw);
          const updatedPlayer1 = xpResult.updatedPlayer;
          
          // Award coins
          const coinsEarned = isDraw ? 75 : ProgressionSystem.awardCoins(player1, player1Won);
          updatedPlayer1.coins += coinsEarned;
          
          // Update rank points for ranked matches
          if (gameState.mode === 'ranked') {
            const rankResult = ProgressionSystem.updateRankPoints(player1, player1Won, isDraw);
            updatedPlayer1.rankPoints = rankResult.newPoints;
          }
          
          // Update battle counts
          updatedPlayer1.totalBattles = (player1.totalBattles || 0) + 1;
          if (player1Won) updatedPlayer1.wins = (player1.wins || 0) + 1; 
          else if (!isDraw) updatedPlayer1.losses = (player1.losses || 0) + 1;
          
          await Persistence.savePlayer(updatedPlayer1);
          
          // Update leaderboard
          await LeaderboardStorage.updatePlayerRank(updatedPlayer1);
          
          console.log(`Player1 progression: Level ${xpResult.leveledUp ? `${player1.level} → ${updatedPlayer1.level}` : updatedPlayer1.level}, XP +${isDraw ? 30 : (player1Won ? 50 : 20)}, Coins +${coinsEarned}${gameState.mode === 'ranked' ? `, Rank Points: ${updatedPlayer1.rankPoints}` : ''}`);
          if (xpResult.leveledUp) {
            console.log(`🎉 Player1 ${updatedPlayer1.username} leveled up to Level ${updatedPlayer1.level}!`);
          }
          
          // Save shadow data for player1
          const shadow1 = {
            originalUsername: player1.username,
            recordedAt: Date.now(),
            originalCharacter: gameState.player1.character,
            originalRank: player1.rankPoints,
            moves: gameState.player1.moves,
            battleResult: isDraw ? 'draw' as const : (player1Won ? 'win' as const : 'loss' as const),
          };
          await Persistence.saveShadow(shadow1).catch(err => console.error('Error saving player1 shadow:', err));
        }

        // Update Player 2 stats
        const player2 = await Persistence.getPlayer(gameState.player2.userId);
        if (player2) {
          const player2Won = winner === 'player2';
          const isDraw = winner === 'draw';
          
          // Use ProgressionSystem for proper XP, level, and unlock handling
          const xpResult = ProgressionSystem.awardXP(player2, player2Won, isDraw);
          const updatedPlayer2 = xpResult.updatedPlayer;
          
          // Award coins
          const coinsEarned = isDraw ? 75 : ProgressionSystem.awardCoins(player2, player2Won);
          updatedPlayer2.coins += coinsEarned;
          
          // Update rank points for ranked matches
          if (gameState.mode === 'ranked') {
            const rankResult = ProgressionSystem.updateRankPoints(player2, player2Won, isDraw);
            updatedPlayer2.rankPoints = rankResult.newPoints;
          }
          
          // Update battle counts
          updatedPlayer2.totalBattles = (player2.totalBattles || 0) + 1;
          if (player2Won) updatedPlayer2.wins = (player2.wins || 0) + 1; 
          else if (!isDraw) updatedPlayer2.losses = (player2.losses || 0) + 1;
          
          await Persistence.savePlayer(updatedPlayer2);
          
          // Update leaderboard
          await LeaderboardStorage.updatePlayerRank(updatedPlayer2);
          
          console.log(`Player2 progression: Level ${xpResult.leveledUp ? `${player2.level} → ${updatedPlayer2.level}` : updatedPlayer2.level}, XP +${isDraw ? 30 : (player2Won ? 50 : 20)}, Coins +${coinsEarned}${gameState.mode === 'ranked' ? `, Rank Points: ${updatedPlayer2.rankPoints}` : ''}`);
          if (xpResult.leveledUp) {
            console.log(`🎉 Player2 ${updatedPlayer2.username} leveled up to Level ${updatedPlayer2.level}!`);
          }
          
          // Save shadow data for player2
          const shadow2 = {
            originalUsername: player2.username,
            recordedAt: Date.now(),
            originalCharacter: gameState.player2.character,
            originalRank: player2.rankPoints,
            moves: gameState.player2.moves || [],
            battleResult: isDraw ? 'draw' as const : (player2Won ? 'win' as const : 'loss' as const),
          };
          await Persistence.saveShadow(shadow2).catch(err => console.error('Error saving player2 shadow:', err));
        }

        console.log(`PvP Battle completed: ${gameState.player1.username} vs ${gameState.player2.username}, Winner: ${winner}`);
      } catch (error) {
        console.error('Error updating players after PvP battle:', error);
      }
    } else if (gameState.isShadowMatch) {
      // Update only player1 for shadow matches
      try {
        const player = await Persistence.getPlayer(gameState.player1.userId);
        if (player) {
          const won = winner === 'player1';
          
          // Use ProgressionSystem for proper XP, level, and unlock handling
          const xpResult = ProgressionSystem.awardXP(player, won, false);
          const updatedPlayer = xpResult.updatedPlayer;
          
          // Award coins
          const coinsEarned = ProgressionSystem.awardCoins(player, won);
          updatedPlayer.coins += coinsEarned;
          
          // Update battle counts
          updatedPlayer.totalBattles = (player.totalBattles || 0) + 1;
          if (won) updatedPlayer.wins = (player.wins || 0) + 1; 
          else updatedPlayer.losses = (player.losses || 0) + 1;
          
          await Persistence.savePlayer(updatedPlayer);
          
          // Update leaderboard
          await LeaderboardStorage.updatePlayerRank(updatedPlayer);
          
          console.log(`Shadow match progression: Level ${xpResult.leveledUp ? `${player.level} → ${updatedPlayer.level}` : updatedPlayer.level}, XP +${won ? 50 : 20}, Coins +${coinsEarned}`);
          if (xpResult.leveledUp) {
            console.log(`🎉 ${updatedPlayer.username} leveled up to Level ${updatedPlayer.level}!`);
          }
          
          const shadow = {
            originalUsername: player.username,
            recordedAt: Date.now(),
            originalCharacter: gameState.player1.character,
            originalRank: player.rankPoints,
            moves: gameState.player1.moves,
            battleResult: won ? 'win' as const : 'loss' as const,
          };
          await Persistence.saveShadow(shadow).catch(err => console.error('Error saving shadow:', err));
        }
      } catch (error) {
        console.error('Error updating player after shadow battle:', error);
      }
    }
    
    // Clear battle notifications for both players
    await RedisStorage.clearBattleNotification(gameState.player1.userId).catch(() => {});
    await RedisStorage.clearBattleNotification(gameState.player2.userId).catch(() => {});
    
    // Increment battles today counter
    await RedisStorage.incrementBattlesToday().catch(() => {});
    
    // Clear any pending timeout checks
    this.clearTimeoutCheck(gameId);
    
    // Schedule game state deletion after 30 seconds to allow both players to see result
    setTimeout(async () => {
      await RedisStorage.deleteGameState(gameId).catch(err => console.error('Error deleting game state:', err));
    }, 30000);
    
    return {
      type: 'battle_complete',
      winner,
      stats: {
        totalDamageDealt: gameState.player1.totalDamageDealt || 0,
        totalDamageTaken: gameState.player1.totalDamageTaken || 0,
        turnsSurvived: gameState.turnNumber,
        energyEfficiency: 0,
      },
    };
  }
  /**
   * Get or create player
   */
  static async getPlayer(userId: string, username: string): Promise<GetPlayerResponse> {
    try {
      const player = await Persistence.getOrCreatePlayer(userId, username);
      // Normalize counters to prevent inconsistent UI (total = wins + losses)
      const wins = Math.max(0, player.wins || 0);
      const losses = Math.max(0, player.losses || 0);
      const total = wins + losses;
      if (player.totalBattles !== total) {
        player.totalBattles = total;
        await Persistence.savePlayer(player).catch(() => {});
      }
      
      // Mark as online (don't await, fire and forget)
      RedisStorage.setPlayerOnline(userId).catch(err => {
        console.error('Failed to mark player online:', err);
      });
      
      // Debug logging to check player data
      console.log(`Player data for ${player.username}:`, {
        level: player.level,
        rankPoints: player.rankPoints,
        xp: player.xp,
        wins: player.wins,
        losses: player.losses,
        totalBattles: player.totalBattles
      });
      
      return {
        type: 'player',
        player,
      };
    } catch (error) {
      console.error('Error in GameAPI.getPlayer:', error);
      throw error;
    }
  }
  
  /**
   * Start a battle
   */
  static async startBattle(
    userId: string, 
    mode: 'quick_match' | 'ranked',
    character: string
  ): Promise<StartBattleResponse> {
    try {
      // Get player
      const player = await Persistence.getPlayer(userId);
      if (!player) {
        throw new Error('Player not found');
      }
      
      // Mark as online (fire and forget)
      RedisStorage.setPlayerOnline(userId).catch(err => {
        console.error('Failed to mark player online:', err);
      });
      
      // Find opponent
      let onlinePlayers: string[] = [];
      try {
        onlinePlayers = await RedisStorage.getOnlinePlayers();
        console.log(`Found ${onlinePlayers.length} online players:`, onlinePlayers);
      } catch (err) {
        console.error('Error getting online players:', err);
      }
      
      const onlinePlayersData = await Promise.all(
        onlinePlayers.map(async p => {
          try {
            return await Persistence.getPlayer(p);
          } catch (err) {
            console.error(`Error getting player ${p}:`, err);
            return null;
          }
        })
      );
      const validOnlinePlayers = onlinePlayersData.filter(p => p !== null) as Player[];
      console.log(`Valid online players for matchmaking: ${validOnlinePlayers.length}`, validOnlinePlayers.map(p => p.username));
      
      let opponent;
      try {
        opponent = await MatchmakingSystem.findOpponent(
          player,
          mode,
          validOnlinePlayers,
          () => Persistence.getShadows()
        );
        console.log(`Matchmaking result: ${opponent.isShadow ? 'Shadow' : 'Real Player'} - ${opponent.opponent.username}`);
      } catch (err) {
        console.error('Error finding opponent:', err);
        // Create a default opponent if matchmaking fails
        opponent = {
          opponent: {
            userId: 'shadow_default',
            username: 'Training Shadow',
            character: 'knight' as const,
            hp: 100,
            maxHP: 100,
            energy: 50,
            maxEnergy: 50,
            statusEffects: [],
            abilities: ['basic_attack', 'defend', 'fireball', 'heal'],
            moves: [],
            totalDamageDealt: 0,
            totalDamageTaken: 0,
          },
          isShadow: true,
        };
      }
      
      // Create game state - battle initiator always goes first
      const gameState: GameState = {
        gameId: generateGameId(),
        mode,
        player1: this.createBattlePlayer(player, character), // Battle initiator is always player1
        player2: opponent.opponent,
        isShadowMatch: opponent.isShadow,
        shadowData: opponent.shadowData,
        currentTurn: 'player1', // Battle initiator goes first
        turnNumber: 0,
        status: 'pending', // Will be set to 'active' when accepted
        turnStartedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        battleLog: [],
      };
      
      // If this is a real PvP match, create invitation instead of immediate battle
      if (!opponent.isShadow && gameState.player2) {
        console.log(`Creating PvP invitation: ${gameState.player1.username} invites ${gameState.player2.username}`);
        
        // Save the game state as "waiting" until accepted
        gameState.status = 'waiting';
        await RedisStorage.setGameState(gameState.gameId, gameState, 600); // 10 minute expiry
        
        // Create invitation for the opponent
        await RedisStorage.createBattleInvitation(
          gameState.player2!.userId, 
          gameState.gameId, 
          gameState.player1.username,
          'player2'
        );
        
        // Return invitation created response
        return {
          type: 'battle_started',
          gameId: gameState.gameId,
          opponent: opponent.opponent,
          isShadow: false,
          message: `Battle invitation sent to ${opponent.opponent.username}!`
        } as any;
      } else {
        // For shadow matches, start immediately
        gameState.status = 'active';
        gameState.turnStartedAt = Date.now();
        await RedisStorage.setGameState(gameState.gameId, gameState);
        
        // Start timeout monitoring for the first turn
        console.log(`🕐 Scheduling timeout for first turn - Game: ${gameState.gameId}, Turn: ${gameState.currentTurn}`);
        this.scheduleTimeoutCheck(gameState.gameId, gameState.turnStartedAt);
        
        return {
          type: 'battle_started',
          gameId: gameState.gameId,
          opponent: opponent.opponent,
          isShadow: opponent.isShadow,
          gameState: gameState,
        };
      }
    } catch (error) {
      console.error('Error in startBattle:', error);
      throw error;
    }
  }
  
  /**
   * Submit a move
   */
  static async submitMove(gameId: string, ability: string, userId: string): Promise<any> {
    try {
      console.log(`Attempting to submit move for game: ${gameId}, ability: ${ability}, userId: ${userId}`);
      const gameState = await RedisStorage.getGameState(gameId);
      if (!gameState) {
        console.error(`Game not found: ${gameId}`);
        throw new Error('Game not found');
      }
      console.log(`Game found: ${gameId}, status: ${gameState.status}, current turn: ${gameState.currentTurn}`);
      
      // Determine which player is making the move
      const isPlayer1 = gameState.player1.userId === userId;
      const isPlayer2 = gameState.player2?.userId === userId;
      const playerRole = isPlayer1 ? 'player1' : isPlayer2 ? 'player2' : null;
      
      if (!playerRole) {
        throw new Error('Player not found in this game');
      }
      
      // Check if it's this player's turn
      if (gameState.currentTurn !== playerRole) {
        throw new Error(`Not your turn. Current turn: ${gameState.currentTurn}, Your role: ${playerRole}`);
      }
      
      console.log(`Move submitted by ${playerRole} (${userId}): ${ability}`);
      
      // Ensure players have required properties
      if (!gameState.player1) throw new Error('Player1 missing');
      if (!gameState.player2) throw new Error('Player2 missing');
      
      // No timeout penalty in submitMove - this is handled by the timeout tick system

      // Check KO after penalties
      {
        const preWinner = BattleEngine.isBattleOver(gameState);
        if (preWinner) {
          gameState.status = 'finished';
          gameState.winner = preWinner;
          await RedisStorage.deleteGameState(gameId).catch(err => console.error('Error deleting game state:', err));
          return {
            type: 'battle_complete',
            winner: preWinner,
            stats: {
              totalDamageDealt: gameState.player1.totalDamageDealt || 0,
              totalDamageTaken: gameState.player1.totalDamageTaken || 0,
              turnsSurvived: gameState.turnNumber,
              energyEfficiency: 0,
            },
          };
        }
      }

      // Record move for the correct player
      const currentPlayer = playerRole === 'player1' ? gameState.player1 : gameState.player2!;
      const opponent = playerRole === 'player1' ? gameState.player2! : gameState.player1;
      
      if (!currentPlayer.moves) currentPlayer.moves = [];
      currentPlayer.moves.push({
        turn: gameState.turnNumber + 1,
        player: playerRole as any,
        ability: ability as any,
        timestamp: Date.now(),
      });
      
      // Apply ability
      const result = BattleEngine.applyAbility(
        ability,
        currentPlayer,
        opponent
      );
      
      // Update the correct players
      if (playerRole === 'player1') {
        gameState.player1 = result.attackerUpdated;
        gameState.player2 = result.defenderUpdated;
      } else {
        gameState.player2 = result.attackerUpdated;
        gameState.player1 = result.defenderUpdated;
      }
      
      if (!gameState.battleLog) gameState.battleLog = [];
      gameState.battleLog.push(...result.log);
    
      // End-of-turn processing happens after both actors (post AI)

      // Check if battle is over after the move
      const winner = BattleEngine.isBattleOver(gameState);
      if (winner) {
        return await this.finalizeBattle(gameId, gameState, winner);
      }
    
      // Next turn for shadow/AI (simplified - just alternate)
      if (gameState.isShadowMatch && gameState.player2) {
        try {
          // Shadow's turn (simplified AI)
          let shadowMove = this.getShadowAIChoice(gameState, gameState.turnNumber);
          // Ensure AI can always act: if it can't afford any ability, it will 'rest'
          const available = BattleEngine.getAvailableAbilities(gameState.player2);
          if (!shadowMove || !available.includes(shadowMove)) {
            shadowMove = available[0] || 'rest';
          }
          if (shadowMove) {
            if (!gameState.player2.moves) gameState.player2.moves = [];
            const aiResult = BattleEngine.applyAbility(
              shadowMove,
              gameState.player2,
              gameState.player1
            );
            gameState.player2 = aiResult.attackerUpdated;
            gameState.player1 = aiResult.defenderUpdated;
            gameState.battleLog.push(...aiResult.log);
            
            gameState.player2.moves.push({
              turn: gameState.turnNumber + 1,
              player: 'player2',
              ability: shadowMove as any,
              timestamp: Date.now(),
            });
            
            // End-of-turn processing after AI move (status effects only, no energy regen)
            gameState.player1 = BattleEngine.processTurnEnd(gameState.player1);
            gameState.player2 = BattleEngine.processTurnEnd(gameState.player2);

            // Check for battle completion after AI turn
            const aiWinner = BattleEngine.isBattleOver(gameState);
            if (aiWinner) {
              return await this.finalizeBattle(gameId, gameState, aiWinner);
            }
          }
        } catch (error) {
          console.error('Error in shadow turn:', error);
        }
      }
      
      // Switch turns for PvP battles and increment turn number
      if (!gameState.isShadowMatch) {
        gameState.currentTurn = gameState.currentTurn === 'player1' ? 'player2' : 'player1';
        console.log(`Turn switched to: ${gameState.currentTurn}`);
      }
      
      gameState.turnNumber += 1;
      gameState.updatedAt = Date.now();
      gameState.turnStartedAt = Date.now();
      
      // Check for turn limit after incrementing turn number
      const turnLimitWinner = BattleEngine.isBattleOver(gameState);
      if (turnLimitWinner) {
        console.log(`Battle ended due to turn limit (${gameState.turnNumber}/${GAME_CONFIG.BATTLE_MAX_TURNS}). Winner: ${turnLimitWinner}`);
        return await this.finalizeBattle(gameId, gameState, turnLimitWinner);
      }
      
      // Save updated game state
      await RedisStorage.setGameState(gameId, gameState).catch(err => {
        console.error('Error saving game state:', err);
      });
      
      // Start timeout monitoring for the new turn
      console.log(`🕐 Scheduling timeout for new turn - Game: ${gameId}, Turn: ${gameState.currentTurn}`);
      this.scheduleTimeoutCheck(gameId, gameState.turnStartedAt);
      
      return {
        type: 'move_submitted',
        currentState: gameState,
      };
    } catch (error) {
      console.error('Error in submitMove:', error);
      throw error;
    }
  }
  
  /**
   * Get leaderboard
   */
  static async getLeaderboard(type: string): Promise<GetLeaderboardResponse> {
    const entries = await LeaderboardStorage.getLeaderboard(type);
    
    return {
      type: 'leaderboard',
      entries,
    };
  }
  
  /**
   * Get raid boss status
   */
  static async getRaidBoss(): Promise<GetRaidBossResponse> {
    const raid = await RedisStorage.getRaidBoss();
    
    return {
      type: 'raid_boss',
      raid: raid!,
      isActive: raid !== null && RaidBossSystem.isRaidActive(raid),
    } as any;
  }
  
  /**
   * Timeout tick - apply HP penalties if turn timer elapsed and reset timer
   */
  static async timeoutTick(gameId: string): Promise<any> {
    try {
      const gameState = await RedisStorage.getGameState(gameId);
      if (!gameState) throw new Error('Game not found');
      if (gameState.status !== 'active') return { type: 'no_op', currentState: gameState };
      
      const now = Date.now();
      const perTurnMs = GAME_CONFIG.TURN_TIME_LIMIT * 1000;
      const startedAt = gameState.turnStartedAt || gameState.updatedAt || gameState.createdAt;
      let elapsedMs = Math.max(0, now - startedAt);
      
      console.log(`Timeout check: Elapsed ${elapsedMs}ms, Limit ${perTurnMs}ms, Current turn: ${gameState.currentTurn}`);
      
      if (elapsedMs >= perTurnMs) {
        const penalty = GAME_CONFIG.TIMEOUT_HP_PENALTY || 5;
        
        // Apply penalty to the player whose turn it is
        const currentPlayer = gameState.currentTurn === 'player1' ? gameState.player1 : gameState.player2!;
        const currentPlayerName = currentPlayer.username;
        
        // Apply the penalty
        currentPlayer.hp = Math.max(0, currentPlayer.hp - penalty);
        
        // Add to battle log
        if (!gameState.battleLog) gameState.battleLog = [];
        gameState.battleLog.push({
          turn: gameState.turnNumber + 1,
          message: `⏰ ${currentPlayerName} took too long (-${penalty} HP)`,
          type: 'status',
          timestamp: now,
        });
        
        // Reset timer for continued play (don't switch turns on timeout)
        gameState.turnStartedAt = now;
        gameState.updatedAt = now;
        
        console.log(`Timeout penalty applied to ${currentPlayerName}: -${penalty} HP, Timer reset to 10s`);
        
        // Check if battle is over due to timeout penalty
        const winner = BattleEngine.isBattleOver(gameState);
        if (winner) {
          console.log(`Battle ended due to timeout penalty. Winner: ${winner}`);
          return await this.finalizeBattle(gameId, gameState, winner);
        }
        
        // Save updated game state
        await RedisStorage.setGameState(gameId, gameState);
        
        // Schedule another timeout check since the battle continues with the same player
        this.scheduleTimeoutCheck(gameId, gameState.turnStartedAt);
        
        return { 
          type: 'timeout_penalty', 
          currentState: gameState, 
          penaltyApplied: penalty,
          penalizedPlayer: currentPlayerName
        };
      }
      
      return { type: 'tick', currentState: gameState };
    } catch (error) {
      console.error('Error in timeoutTick:', error);
      throw error;
    }
  }
  /**
   * Join raid boss
   */
  static async joinRaid(userId: string): Promise<any> {
    let raid = await RedisStorage.getRaidBoss();
    
    if (!raid) {
      // Check if should spawn
      const onlineCount = await RedisStorage.getOnlinePlayerCount();
      if (RaidBossSystem.shouldSpawnRaid(onlineCount)) {
        const onlinePlayers = await RedisStorage.getOnlinePlayers();
        raid = RaidBossSystem.createRaidBoss(onlinePlayers);
        await RedisStorage.setRaidBoss(raid);
      } else {
        return { error: 'Raid boss not available' };
      }
    }
    
    if (!raid.participants.includes(userId)) {
      raid.participants.push(userId);
      await RedisStorage.setRaidBoss(raid);
    }
    
    return {
      type: 'raid_joined',
      raidId: raid.id,
      participants: raid.participants.length,
    };
  }
  
  // Helper methods
  private static createBattlePlayer(player: Player, character: string): BattlePlayer {
    try {
      const char = this.getCharacterStats(character);
      return {
        userId: player.userId,
        username: player.username || 'Player',
        character: character as any,
        hp: char.baseHP,
        maxHP: char.baseHP,
        energy: char.baseEnergy,
        maxEnergy: char.baseEnergy,
        statusEffects: [],
        abilities: player.unlockedAbilities.slice(0, 4),
        moves: [],
        totalDamageDealt: 0,
        totalDamageTaken: 0,
      };
    } catch (error) {
      console.error('Error creating battle player:', error);
      // Return default player
      return {
        userId: 'error',
        username: 'Player',
        character: 'knight',
        hp: 100,
        maxHP: 100,
        energy: 50,
        maxEnergy: 50,
        statusEffects: [],
        abilities: ['basic_attack', 'defend', 'fireball', 'heal'],
        moves: [],
        totalDamageDealt: 0,
        totalDamageTaken: 0,
      };
    }
  }
  
  private static getCharacterStats(character: string): { baseHP: number; baseEnergy: number } {
    const stats = {
      mage: { baseHP: 80, baseEnergy: 60 },
      knight: { baseHP: 100, baseEnergy: 50 },
      ranger: { baseHP: 90, baseEnergy: 55 },
      assassin: { baseHP: 70, baseEnergy: 65 },
      tank: { baseHP: 130, baseEnergy: 45 },
      healer: { baseHP: 95, baseEnergy: 60 },
    };
    return stats[character as keyof typeof stats] || stats.knight;
  }
  
  private static getShadowAIChoice(gameState: GameState, turnNumber: number): string | null {
    if (!gameState.shadowData) return 'basic_attack';
    
    if (gameState.shadowData.moves.length > turnNumber) {
      return gameState.shadowData.moves[turnNumber]?.ability || null;
    }
    
    // Simple AI fallback
    if (gameState.player2!.hp < 30) return 'heal';
    if (gameState.player2!.energy < 20) return 'defend';
    return 'basic_attack';
  }
}

