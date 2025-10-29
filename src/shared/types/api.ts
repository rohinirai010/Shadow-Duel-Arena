// API request/response types

export interface InitResponse {
  type: 'init';
  postId: string;
  count: number;
  username: string;
}

export interface IncrementResponse {
  type: 'increment';
  count: number;
  postId: string;
}

export interface DecrementResponse {
  type: 'decrement';
  count: number;
  postId: string;
}

// Game API Types
export interface GetPlayerResponse {
  type: 'player';
  player: Player;
}

export interface StartBattleResponse {
  type: 'battle_started';
  gameId: string;
  opponent: BattlePlayer;
  isShadow: boolean;
}

export interface SubmitMoveResponse {
  type: 'move_submitted';
  currentState: GameState;
}

export interface GetLeaderboardResponse {
  type: 'leaderboard';
  entries: LeaderboardEntry[];
  playerRank?: number;
}

export interface GetRaidBossResponse {
  type: 'raid_boss';
  raid?: RaidBoss;
  isActive: boolean;
}

export interface JoinRaidResponse {
  type: 'raid_joined';
  raidId: string;
  participants: number;
}

// Re-export game types
import type {
  Player,
  Character,
  Ability,
  GameState,
  BattlePlayer,
  BattleLogEntry,
  ShadowData,
  RaidBoss,
  DailyChallenge,
  LeaderboardEntry,
  BattleStats,
  VictoryData,
} from './game';

export type {
  Player,
  Character,
  Ability,
  GameState,
  BattlePlayer,
  BattleLogEntry,
  ShadowData,
  RaidBoss,
  DailyChallenge,
  LeaderboardEntry,
  BattleStats,
  VictoryData,
};