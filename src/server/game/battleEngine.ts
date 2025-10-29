// Battle Engine - Core combat logic for Shadow Duel Arena

import type { GameState, BattlePlayer, Ability, BattleLogEntry, StatusEffect } from '../../shared/types/game';
import { ABILITIES, CHARACTERS } from '../../shared/utils/constants';
import { clamp } from '../../shared/utils/helpers';

export class BattleEngine {
  /**
   * Calculate damage for an ability
   */
  static calculateDamage(ability: Ability, attacker: BattlePlayer, defender: BattlePlayer, useBonus = true): number {
    let damage = ability.damage;
    
    // Apply character-specific modifiers
    const char = CHARACTERS[attacker.character];
    if (char.name === 'Assassin') damage = Math.floor(damage * 1.2); // +20%
    if (char.name === 'Mage') damage = Math.floor(damage * 1.1); // +10%
    if (char.name === 'Tank') damage = Math.floor(damage * 0.8); // -20%
    
    // Apply status effects
    const berserk = attacker.statusEffects.find(e => e.type === 'berserk');
    if (berserk && useBonus) {
      damage = Math.floor(damage * 2);
    }
    
    // Check for defend status
    const hasDefend = defender.statusEffects.find(e => e.type === 'defense');
    if (hasDefend) {
      damage = Math.floor(damage * 0.5);
    }
    
    // Shield Break ignores defend
    if (ability.id === 'shield_break') {
      damage = ability.damage;
    }
    
    // Counter damage if defender has counter
    const hasCounter = defender.statusEffects.find(e => e.type === 'counter');
    if (hasCounter && ability.category === 'attack') {
      const counterDamage = Math.floor(damage * 0.3);
      // This will be applied to the attacker
    }
    
    return Math.max(0, damage);
  }
  
  /**
   * Apply an ability's effects
   */
  static applyAbility(
    abilityId: string,
    attacker: BattlePlayer,
    defender: BattlePlayer
  ): { attackerUpdated: BattlePlayer; defenderUpdated: BattlePlayer; log: BattleLogEntry[] } {
    const ability = ABILITIES[abilityId as keyof typeof ABILITIES];
    const logs: BattleLogEntry[] = [];
    
    let attackerNew = { ...attacker };
    let defenderNew = { ...defender };
    
    // Update energy
    attackerNew.energy -= ability.energyCost;
    attackerNew.energy = Math.max(0, attackerNew.energy);
    
    logs.push({
      turn: attacker.moves.length,
      message: `${attackerNew.username} used ${ability.name}!`,
      type: 'action',
      timestamp: Date.now(),
    });
    
    // Apply ability-specific logic
    switch (ability.id) {
      case 'basic_attack':
      case 'fireball':
      case 'power_strike':
      case 'shield_break':
      case 'ultimate': {
        const damage = this.calculateDamage(ability, attackerNew, defenderNew);
        defenderNew.hp -= damage;
        defenderNew.totalDamageTaken += damage;
        attackerNew.totalDamageDealt += damage;
        defenderNew.hp = Math.max(0, defenderNew.hp);
        logs.push({
          turn: attacker.moves.length,
          message: `${defenderNew.username} took ${damage} damage!`,
          type: 'damage',
          timestamp: Date.now(),
        });
        break;
      }
      case 'rest': {
        // Recover energy when no affordable moves are available
        const recover = 15;
        attackerNew.energy = clamp(attackerNew.energy + recover, 0, attackerNew.maxEnergy);
        // Tradeoff: lose 5 HP
        attackerNew.hp = Math.max(0, attackerNew.hp - 5);
        logs.push({
          turn: attacker.moves.length,
          message: `${attackerNew.username} rested: +${recover} energy, -5 HP`,
          type: 'status',
          timestamp: Date.now(),
        });
        break;
      }
      
      case 'defend': {
        attackerNew.statusEffects.push({
          type: 'defense',
          turns: 1,
        });
        logs.push({
          turn: attacker.moves.length,
          message: `${attackerNew.username} is defending!`,
          type: 'status',
          timestamp: Date.now(),
        });
        break;
      }
      
      case 'heal': {
        const healAmount = 30;
        const oldHp = attackerNew.hp;
        attackerNew.hp = clamp(attackerNew.hp + healAmount, 0, attackerNew.maxHP);
        const actualHeal = attackerNew.hp - oldHp;
        logs.push({
          turn: attacker.moves.length,
          message: `${attackerNew.username} healed ${actualHeal} HP!`,
          type: 'heal',
          timestamp: Date.now(),
        });
        break;
      }
      
      case 'energy_drain': {
        const drainAmount = Math.min(20, defenderNew.energy);
        defenderNew.energy -= drainAmount;
        attackerNew.energy = clamp(attackerNew.energy + drainAmount, 0, attackerNew.maxEnergy);
        logs.push({
          turn: attacker.moves.length,
          message: `${attackerNew.username} drained ${drainAmount} energy from ${defenderNew.username}!`,
          type: 'action',
          timestamp: Date.now(),
        });
        break;
      }
      
      case 'berserk': {
        attackerNew.statusEffects.push({
          type: 'berserk',
          turns: 1,
        });
        // Take self damage
        attackerNew.hp -= 20;
        attackerNew.hp = Math.max(0, attackerNew.hp);
        logs.push({
          turn: attacker.moves.length,
          message: `${attackerNew.username} entered berserk mode! (took 20 self damage)`,
          type: 'status',
          timestamp: Date.now(),
        });
        break;
      }
      
      case 'poison': {
        defenderNew.statusEffects.push({
          type: 'poison',
          turns: 3,
          value: 10,
        });
        logs.push({
          turn: attacker.moves.length,
          message: `${defenderNew.username} is now poisoned!`,
          type: 'status',
          timestamp: Date.now(),
        });
        break;
      }
      
      case 'counter': {
        attackerNew.statusEffects.push({
          type: 'counter',
          turns: 1,
        });
        logs.push({
          turn: attacker.moves.length,
          message: `${attackerNew.username} is ready to counter!`,
          type: 'status',
          timestamp: Date.now(),
        });
        break;
      }
      
      case 'sacrifice': {
        attackerNew.hp -= 40;
        attackerNew.hp = Math.max(0, attackerNew.hp);
        attackerNew.energy = attackerNew.maxEnergy;
        logs.push({
          turn: attacker.moves.length,
          message: `${attackerNew.username} sacrificed HP for full energy!`,
          type: 'action',
          timestamp: Date.now(),
        });
        break;
      }
    }
    
    // Process poison damage
    const poison = defenderNew.statusEffects.find(e => e.type === 'poison');
    if (poison && defenderNew.hp > 0) {
      const poisonDamage = poison.value || 10;
      defenderNew.hp -= poisonDamage;
      defenderNew.totalDamageTaken += poisonDamage;
      attackerNew.totalDamageDealt += poisonDamage;
      defenderNew.hp = Math.max(0, defenderNew.hp);
      
      // Reduce poison turns
      poison.turns -= 1;
      if (poison.turns <= 0) {
        defenderNew.statusEffects = defenderNew.statusEffects.filter(e => e.type !== 'poison');
      }
    }
    
    // Update status effects
    attackerNew.statusEffects = attackerNew.statusEffects.filter(e => e.turns > 0);
    
    return { attackerUpdated: attackerNew, defenderUpdated: defenderNew, log: logs };
  }
  
  /**
   * Process end of turn effects (status tick only, no energy regen)
   */
  static processTurnEnd(player: BattlePlayer): BattlePlayer {
    const updated = { ...player };
    
    // No energy regeneration - energy only changes through abilities
    
    // Reduce status effect turns
    updated.statusEffects = updated.statusEffects.map(e => ({
      ...e,
      turns: e.turns - 1,
    })).filter(e => e.turns > 0);
    
    return updated;
  }
  
  /**
   * Check if battle is over
   */
  static isBattleOver(state: GameState): 'player1' | 'player2' | 'draw' | null {
    // Check for KO
    if (state.player1.hp <= 0 && state.player2 && state.player2.hp <= 0) {
      return 'draw'; // Both players KO'd simultaneously
    }
    if (state.player1.hp <= 0) return 'player2';
    if (state.player2 && state.player2.hp <= 0) return 'player1';
    
    // Check for turn limit (10 turns as per GAME_CONFIG)
    if (state.turnNumber >= 10) {
      console.log(`Turn limit reached: ${state.turnNumber}/10 turns. Player1 HP: ${state.player1.hp}, Player2 HP: ${state.player2?.hp || 0}`);
      if (state.player2) {
        if (state.player1.hp > state.player2.hp) return 'player1';
        if (state.player2.hp > state.player1.hp) return 'player2';
        return 'draw'; // Equal HP = draw
      }
      return 'player1'; // Shadow match fallback
    }
    
    return null;
  }
  
  /**
   * Get available abilities for a player
   */
  static getAvailableAbilities(player: BattlePlayer): string[] {
    const affordable = player.abilities.filter(abilityId => {
      const ability = ABILITIES[abilityId as keyof typeof ABILITIES];
      if (!ability) return false;
      
      // Check energy cost
      if (player.energy < ability.energyCost) return false;
      
      // Check cooldown
      if (ability.cooldown > 0) {
        const lastUse = player.moves
          .filter(m => m.ability === abilityId)
          .sort((a, b) => b.turn - a.turn)[0];
        if (lastUse) {
          const turnsSince = (player.moves.length - 1) - lastUse.turn;
          if (turnsSince < ability.cooldown) return false;
        }
      }
      
      // Check special conditions
      if (ability.id === 'ultimate') {
        const hasUsed = player.moves.some(m => m.ability === 'ultimate');
        if (hasUsed) return false;
      }
      
      return true;
    });
    // If player cannot afford any ability, allow 'rest' as a fallback move
    if (affordable.length === 0) {
      return ['rest'];
    }
    return affordable;
  }
}
