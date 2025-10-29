// Core game types for Shadow Duel Arena

export type CharacterType = 'mage' | 'knight' | 'ranger' | 'assassin' | 'tank' | 'healer';

export interface Character {
  id: CharacterType;
  name: string;
  emoji: string;
  baseHP: number;
  baseEnergy: number;
  unlocked: boolean;
  unlockLevel?: number;
  description: string;
}

export type AbilityID = 
  | 'basic_attack'
  | 'defend'
  | 'fireball'
  | 'heal'
  | 'rest'
  | 'power_strike'
  | 'energy_drain'
  | 'shield_break'
  | 'berserk'
  | 'poison'
  | 'counter'
  | 'ultimate'
  | 'sacrifice';

export interface Ability {
  id: AbilityID;
  name: string;
  description: string;
  damage: number;
  energyCost: number;
  cooldown: number;
  category: 'attack' | 'defense' | 'support';
  unlocked: boolean;
}

export interface Player {
  userId: string;
  username: string;
  level: number;
  xp: number;
  rank: number;
  rankPoints: number;
  totalBattles: number;
  wins: number;
  losses: number;
  bestStreak: number;
  currentStreak: number;
  favoriteCharacter: CharacterType;
  battles: number;
  coins: number;
  achievements: AchievementID[];
  unlockedCharacters: CharacterType[];
  unlockedAbilities: AbilityID[];
  createdAt: number;
  lastActive: number;
}

export type AchievementID = string;

export interface Achievement {
  id: AchievementID;
  name: string;
  description: string;
  emoji: string;
  points: number;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface GameState {
  gameId: string;
  mode: 'quick_match' | 'ranked' | 'raid';
  player1: BattlePlayer;
  player2?: BattlePlayer;
  isShadowMatch: boolean;
  shadowData?: ShadowData;
  currentTurn: 'player1' | 'player2';
  turnNumber: number;
  status: 'waiting' | 'active' | 'finished';
  winner?: 'player1' | 'player2' | 'draw';
  turnStartedAt?: number; // epoch ms when current turn started
  createdAt: number;
  updatedAt: number;
  battleLog: BattleLogEntry[];
}

export interface BattlePlayer {
  userId: string;
  username: string;
  character: CharacterType;
  hp: number;
  maxHP: number;
  energy: number;
  maxEnergy: number;
  statusEffects: StatusEffect[];
  abilities: AbilityID[];
  moves: BattleMove[];
  totalDamageDealt: number;
  totalDamageTaken: number;
}

export interface StatusEffect {
  type: 'poison' | 'berserk' | 'counter' | 'defense';
  turns: number;
  value?: number;
}

export interface BattleMove {
  turn: number;
  player: 'player1' | 'player2';
  ability: AbilityID;
  damage?: number;
  timestamp: number;
}

export interface BattleLogEntry {
  turn: number;
  message: string;
  type: 'action' | 'damage' | 'heal' | 'status';
  timestamp: number;
}

export interface ShadowData {
  originalUsername: string;
  recordedAt: number;
  originalCharacter: CharacterType;
  originalRank: number;
  moves: BattleMove[];
  battleResult: 'win' | 'loss' | 'draw';
}

export interface RaidBoss {
  id: string;
  name: string;
  hp: number;
  maxHP: number;
  phase: 1 | 2 | 3;
  participants: string[];
  isActive: boolean;
  createdAt: number;
  expiresAt: number;
}

export interface DailyChallenge {
  date: string;
  challenge: {
    id: string;
    type: 'win_battles' | 'defeat_shadow' | 'total_damage' | 'raid' | 'streak';
    description: string;
    target: number;
    reward: number;
    progress: number;
    completed: boolean;
  };
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  rankPoints: number;
  level: number;
  wins: number;
  losses: number;
}

export interface BattleStats {
  totalDamageDealt: number;
  totalDamageTaken: number;
  turnsSurvived: number;
  energyEfficiency: number;
  abilitiesUsed: Record<AbilityID, number>;
}

export interface VictoryData {
  winner: boolean;
  stats: BattleStats;
  xpEarned: number;
  coinsEarned: number;
  rankPointsChange?: number;
  opponentWasShadow: boolean;
  opponentUsername: string;
}
