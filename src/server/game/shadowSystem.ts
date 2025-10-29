// Shadow System - Record and replay player battles

import type { BattlePlayer, ShadowData, BattleMove, GameState } from '../../shared/types/game';

export class ShadowSystem {
  /**
   * Record a completed battle as a shadow
   */
  static recordShadow(
    gameState: GameState,
    player: BattlePlayer,
    wonBattle: boolean
  ): ShadowData {
    const shadow: ShadowData = {
      originalUsername: player.username,
      recordedAt: Date.now(),
      originalCharacter: player.character,
      originalRank: 0, // Will be filled from player profile
      moves: player.moves.map((move, idx) => ({
        turn: idx + 1,
        player: 'player1',
        ability: move.ability,
        damage: move.damage,
        timestamp: move.timestamp,
      })),
      battleResult: wonBattle ? 'win' : 'loss',
    };
    
    return shadow;
  }
  
  /**
   * Play a shadow's recorded move
   */
  static getShadowMove(shadow: ShadowData, turnNumber: number): string | null {
    // Find the move for this turn
    const move = shadow.moves.find(m => m.turn === turnNumber);
    
    if (move) {
      return move.ability;
    }
    
    // If no exact move found, use a similar move or fallback
    if (turnNumber > shadow.moves.length) {
      // Shadow has exhausted its moves, use basic attack
      return 'basic_attack';
    }
    
    // Use a move from similar turn (with slight randomization)
    const similarTurn = Math.max(1, Math.min(turnNumber, shadow.moves.length));
    const similarMove = shadow.moves[similarTurn - 1];
    return similarMove.ability;
  }
  
  /**
   * Add slight randomization to shadow behavior
   */
  static randomizeShadowMove(baseAbility: string): string {
    // 20% chance to deviate to a similar move
    if (Math.random() < 0.2) {
      const similarMoves: Record<string, string[]> = {
        basic_attack: ['basic_attack', 'fireball', 'power_strike'],
        defend: ['defend', 'counter'],
        fireball: ['fireball', 'basic_attack'],
        heal: ['heal', 'defend'],
        power_strike: ['power_strike', 'basic_attack'],
      };
      
      const alternatives = similarMoves[baseAbility] || [baseAbility];
      return alternatives[Math.floor(Math.random() * alternatives.length)];
    }
    
    return baseAbility;
  }
  
  /**
   * Create shadow metadata for display
   */
  static createShadowDisplay(shadow: ShadowData): {
    name: string;
    recordedTime: string;
    winRate: string;
  } {
    const timeAgo = this.getTimeAgo(shadow.recordedAt);
    const winRate = shadow.battleResult === 'win' ? 'Win' : 'Loss';
    
    return {
      name: `Shadow of ${shadow.originalUsername}`,
      recordedTime: timeAgo,
      winRate,
    };
  }
  
  /**
   * Get human-readable time ago
   */
  private static getTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = Math.floor((now - timestamp) / 1000);
    
    if (diff < 60) return 'just now';
    if (diff < 3600) {
      const mins = Math.floor(diff / 60);
      return `${mins} minute${mins === 1 ? '' : 's'} ago`;
    }
    if (diff < 86400) {
      const hours = Math.floor(diff / 3600);
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    }
    const days = Math.floor(diff / 86400);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }
  
  /**
   * Check if shadow data is valid
   */
  static isValidShadow(shadow: ShadowData): boolean {
    return (
      shadow.originalUsername !== undefined &&
      shadow.recordedAt > 0 &&
      shadow.originalCharacter !== undefined &&
      shadow.moves !== undefined &&
      shadow.battleResult !== undefined
    );
  }
  
  /**
   * Get shadow difficulty rating
   */
  static getShadowDifficulty(shadow: ShadowData, playerRank: number): 'easy' | 'medium' | 'hard' | 'legendary' {
    const rankDiff = Math.abs(shadow.originalRank - playerRank);
    
    if (shadow.originalRank > playerRank + 200) return 'legendary';
    if (rankDiff < 50) return 'easy';
    if (rankDiff < 150) return 'medium';
    return 'hard';
  }
}
