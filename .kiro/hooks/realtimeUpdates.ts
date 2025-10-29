// Kiro Hooks for Real-time Game Updates

/**
 * Real-time update hooks for Shadow Duel Arena
 * These hooks enable automatic polling and state synchronization
 */

import { useEffect, useState } from 'react';

/**
 * Hook for updating online player count
 * Auto-refreshes every 5 seconds
 */
export function useOnlinePlayers() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updateCount = async () => {
      try {
        const response = await fetch('/api/game/stats?type=online');
        const data = await response.json();
        setCount(data.count || 0);
      } catch (error) {
        console.error('Failed to fetch online players:', error);
      } finally {
        setLoading(false);
      }
    };

    updateCount();
    const interval = setInterval(updateCount, 5000);

    return () => clearInterval(interval);
  }, []);

  return { count, loading };
}

/**
 * Hook for monitoring raid boss status
 * Auto-refreshes every 5 seconds
 */
export function useRaidBoss() {
  const [raidBoss, setRaidBoss] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updateRaid = async () => {
      try {
        const response = await fetch('/api/game/raid');
        const data = await response.json();
        setRaidBoss(data.raid || null);
      } catch (error) {
        console.error('Failed to fetch raid boss:', error);
      } finally {
        setLoading(false);
      }
    };

    updateRaid();
    const interval = setInterval(updateRaid, 5000);

    return () => clearInterval(interval);
  }, []);

  return { raidBoss, loading };
}

/**
 * Hook for real-time leaderboard updates
 * Refreshes every 10 seconds
 */
export function useLeaderboard(type: string = 'global') {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updateLeaderboard = async () => {
      try {
        const response = await fetch(`/api/game/leaderboard?type=${type}`);
        const data = await response.json();
        setEntries(data.entries || []);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    updateLeaderboard();
    const interval = setInterval(updateLeaderboard, 10000);

    return () => clearInterval(interval);
  }, [type]);

  return { entries, loading };
}

/**
 * Hook for daily challenge progress
 * Checks completion status
 */
export function useDailyChallenge() {
  const [challenge, setChallenge] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChallenge = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(`/api/game/daily?date=${today}`);
        const data = await response.json();
        setChallenge(data.challenge);
      } catch (error) {
        console.error('Failed to fetch daily challenge:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChallenge();
  }, []);

  return { challenge, loading };
}

