// Matchmaking System - Find opponents for players

import type { Player, GameState, BattlePlayer, ShadowData } from '../../shared/types/game';
import { CHARACTERS } from '../../shared/utils/constants';
import { generateGameId, clamp } from '../../shared/utils/helpers';

export class MatchmakingSystem {
  /**
   * Find an opponent for a player
   */
  static async findOpponent(
    player: Player,
    mode: 'quick_match' | 'ranked',
    onlinePlayers: Player[],
    getShadows: () => Promise<ShadowData[]>
  ): Promise<{ opponent: BattlePlayer; isShadow: boolean; shadowData?: ShadowData }> {
    
    // First, check if there are real players online (excluding self)
    const otherPlayers = onlinePlayers.filter(p => p.userId !== player.userId);
    console.log(`Matchmaking for ${player.username} (${player.userId}): Found ${otherPlayers.length} other players online`);
    
    if (otherPlayers.length > 0) {
      // Try to match with a real player of similar rank for both quick_match and ranked
      const similarRankPlayer = this.findSimilarRank(player, otherPlayers);
      if (similarRankPlayer) {
        console.log(`Matching ${player.username} with real player ${similarRankPlayer.username} (similar rank)`);
        return {
          opponent: this.createBattlePlayer(similarRankPlayer, this.getRandomCharacter(similarRankPlayer)),
          isShadow: false,
        };
      }
      
      // If no similar rank player, match with any available player for quick_match
      if (mode === 'quick_match' && otherPlayers.length > 0) {
        const randomPlayer = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
        console.log(`Quick matching ${player.username} with real player ${randomPlayer.username} (random)`);
        return {
          opponent: this.createBattlePlayer(randomPlayer, this.getRandomCharacter(randomPlayer)),
          isShadow: false,
        };
      }
    }
    
    console.log(`No real players available for ${player.username}, falling back to shadow opponent`);
    
    // Fall back to shadow opponent
    const shadows = await getShadows();
    if (shadows.length > 0) {
      const shadow = this.selectShadow(player, shadows);
      if (shadow) {
        return {
          opponent: this.createShadowBattlePlayer(shadow),
          isShadow: true,
          shadowData: shadow,
        };
      }
    }
    
    // Last resort: create a generic shadow opponent
    return {
      opponent: this.createGenericShadow(player),
      isShadow: true,
    };
  }
  
  /**
   * Find a player with similar rank (±50 points)
   */
  private static findSimilarRank(player: Player, candidates: Player[]): Player | null {
    const candidatesWithSimilarRank = candidates.filter(p => 
      Math.abs(p.rankPoints - player.rankPoints) < 50
    );
    
    if (candidatesWithSimilarRank.length === 0) return null;
    
    // Return random similar rank player
    return candidatesWithSimilarRank[Math.floor(Math.random() * candidatesWithSimilarRank.length)];
  }
  
  /**
   * Select the best shadow to fight
   */
  private static selectShadow(player: Player, shadows: ShadowData[]): ShadowData | null {
    // Filter shadows within ±100 rank points
    const eligibleShadows = shadows.filter(s => 
      Math.abs(s.originalRank - player.rankPoints) < 100
    );
    
    if (eligibleShadows.length === 0) {
      // No shadows in range, pick randomly
      return shadows[Math.floor(Math.random() * shadows.length)] || null;
    }
    
    // Prefer recent shadows (last 24 hours)
    const recent = eligibleShadows.filter(s => 
      Date.now() - s.recordedAt < 86400000
    );
    
    if (recent.length > 0) {
      return recent[Math.floor(Math.random() * recent.length)];
    }
    
    return eligibleShadows[Math.floor(Math.random() * eligibleShadows.length)];
  }
  
  /**
   * Create a BattlePlayer from a Player
   */
  private static createBattlePlayer(player: Player, character: string): BattlePlayer {
    const char = CHARACTERS[character as keyof typeof CHARACTERS];
    return {
      userId: player.userId,
      username: player.username,
      character: character as any,
      hp: char.baseHP,
      maxHP: char.baseHP,
      energy: char.baseEnergy,
      maxEnergy: char.baseEnergy,
      statusEffects: [],
      abilities: player.unlockedAbilities.slice(0, 4), // First 4 abilities
      moves: [],
      totalDamageDealt: 0,
      totalDamageTaken: 0,
    };
  }
  
  /**
   * Create a BattlePlayer from Shadow data
   */
  private static createShadowBattlePlayer(shadow: ShadowData): BattlePlayer {
    const char = CHARACTERS[shadow.originalCharacter];
    return {
      userId: `shadow_${shadow.originalUsername}_${shadow.recordedAt}`,
      username: `Shadow of ${shadow.originalUsername}`,
      character: shadow.originalCharacter,
      hp: char.baseHP,
      maxHP: char.baseHP,
      energy: char.baseEnergy,
      maxEnergy: char.baseEnergy,
      statusEffects: [],
      abilities: this.getAbilitiesForCharacter(shadow.originalCharacter),
      moves: [],
      totalDamageDealt: 0,
      totalDamageTaken: 0,
    };
  }
  
  /**
   * Create a generic fallback shadow opponent
   */
  private static createGenericShadow(player: Player): BattlePlayer {
    const character = this.getRandomCharacter({} as Player);
    const char = CHARACTERS[character as keyof typeof CHARACTERS];
    
    return {
      userId: 'shadow_generic',
      username: 'Training Shadow',
      character: character as any,
      hp: char.baseHP,
      maxHP: char.baseHP,
      energy: char.baseEnergy,
      maxEnergy: char.baseEnergy,
      statusEffects: [],
      abilities: ['basic_attack', 'defend', 'fireball', 'heal'],
      moves: [],
      totalDamageDealt: 0,
      totalDamageTaken: 0,
    };
  }
  
  /**
   * Get random character based on player level
   */
  private static getRandomCharacter(player: Player): string {
    const available = player.level >= 15 ? ['mage', 'knight', 'ranger', 'assassin', 'tank', 'healer'] :
                      player.level >= 10 ? ['mage', 'knight', 'ranger', 'assassin', 'tank'] :
                      player.level >= 5 ? ['mage', 'knight', 'ranger', 'assassin'] :
                      ['mage', 'knight', 'ranger'];
    return available[Math.floor(Math.random() * available.length)];
  }
  
  /**
   * Get abilities for a character
   */
  private static getAbilitiesForCharacter(character: string): string[] {
    // Each character gets a default set
    const defaults: Record<string, string[]> = {
      mage: ['basic_attack', 'fireball', 'energy_drain', 'ultimate'],
      knight: ['basic_attack', 'power_strike', 'defend', 'counter'],
      ranger: ['basic_attack', 'shield_break', 'heal', 'ultimate'],
      assassin: ['basic_attack', 'power_strike', 'berserk', 'ultimate'],
      tank: ['basic_attack', 'defend', 'counter', 'heal'],
      healer: ['basic_attack', 'heal', 'energy_drain', 'ultimate'],
    };
    return defaults[character] || ['basic_attack', 'defend', 'fireball', 'heal'];
  }
}
