import express from 'express';
import { InitResponse, IncrementResponse, DecrementResponse } from '../shared/types/api';
import { redis, reddit, createServer, context, getServerPort } from '@devvit/web/server';
import { createPost } from './core/post';
import { GameAPI } from './api/gameApi';
import { RedisStorage } from './storage/redis';

const app = express();

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

const router = express.Router();

router.get<{ postId: string }, InitResponse | { status: string; message: string }>(
  '/api/init',
  async (_req, res): Promise<void> => {
    const { postId } = context;

    if (!postId) {
      console.error('API Init Error: postId not found in devvit context');
      res.status(400).json({
        status: 'error',
        message: 'postId is required but missing from context',
      });
      return;
    }

    try {
      const [count, username] = await Promise.all([
        redis.get('count'),
        reddit.getCurrentUsername(),
      ]);

      res.json({
        type: 'init',
        postId: postId,
        count: count ? parseInt(count) : 0,
        username: username ?? 'anonymous',
      });
    } catch (error) {
      console.error(`API Init Error for post ${postId}:`, error);
      let errorMessage = 'Unknown error during initialization';
      if (error instanceof Error) {
        errorMessage = `Initialization failed: ${error.message}`;
      }
      res.status(400).json({ status: 'error', message: errorMessage });
    }
  }
);

router.post<{ postId: string }, IncrementResponse | { status: string; message: string }, unknown>(
  '/api/increment',
  async (_req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    res.json({
      count: await redis.incrBy('count', 1),
      postId,
      type: 'increment',
    });
  }
);

router.post<{ postId: string }, DecrementResponse | { status: string; message: string }, unknown>(
  '/api/decrement',
  async (_req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    res.json({
      count: await redis.incrBy('count', -1),
      postId,
      type: 'decrement',
    });
  }
);

router.post('/internal/on-app-install', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      status: 'success',
      message: `Post created in subreddit ${context.subredditName} with id ${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

router.post('/internal/menu/post-create', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

// Game API Routes
router.get('/api/game/player', async (_req, res): Promise<void> => {
  try {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({ error: 'postId required' });
      return;
    }
    
    const username = await reddit.getCurrentUsername();
    // Create a unique userId by combining username with postId to ensure each user has a unique identifier
    const userId = username ? `${username}_${postId}` : `anonymous_${postId}_${Date.now()}`;
    
    const response = await GameAPI.getPlayer(userId, username || 'Player');
    res.json(response);
  } catch (error) {
    console.error('Game API Error:', error);
    res.status(500).json({ error: 'Failed to get player', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.post('/api/game/battle/start', async (req, res): Promise<void> => {
  try {
    const { mode, character } = req.body;
    const { postId } = context;
    const username = await reddit.getCurrentUsername();
    // Create a unique userId by combining username with postId to ensure each user has a unique identifier
    const userId = username ? `${username}_${postId}` : `anonymous_${postId}_${Date.now()}`;
    
    if (!mode || !character) {
      res.status(400).json({ error: 'Mode and character required' });
      return;
    }
    
    const response = await GameAPI.startBattle(userId, mode, character);
    res.json(response);
  } catch (error) {
    console.error('Battle start error:', error);
    res.status(500).json({ 
      error: 'Failed to start battle',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/api/game/battle/move', async (req, res): Promise<void> => {
  try {
    const { gameId, ability } = req.body;
    const { postId } = context;
    const username = await reddit.getCurrentUsername();
    const userId = username ? `${username}_${postId}` : `anonymous_${postId}_${Date.now()}`;
    
    const response = await GameAPI.submitMove(gameId, ability, userId);
    res.json(response);
  } catch (error) {
    console.error('Battle move error:', error);
    res.status(500).json({ error: 'Failed to submit move' });
  }
});

// Manual timeout endpoint for testing
router.post('/api/game/battle/timeout', async (req, res): Promise<void> => {
  try {
    const { gameId } = req.body;
    console.log(`Manual timeout triggered for game: ${gameId}`);
    const response = await GameAPI.timeoutTick(gameId);
    res.json(response);
  } catch (error) {
    console.error('Battle timeout error:', error);
    res.status(500).json({ error: 'Failed to process timeout' });
  }
});

// Debug endpoint to check active timeouts
router.get('/api/game/debug/timeouts', async (_req, res): Promise<void> => {
  try {
    const activeTimeouts = GameAPI.getActiveTimeouts();
    res.json({ activeTimeouts });
  } catch (error) {
    console.error('Debug timeouts error:', error);
    res.status(500).json({ error: 'Failed to get timeout info' });
  }
});

router.get('/api/game/battle/state/:gameId', async (req, res): Promise<void> => {
  try {
    const { gameId } = req.params;
    const { postId } = context;
    const username = await reddit.getCurrentUsername();
    const userId = username ? `${username}_${postId}` : `anonymous_${postId}_${Date.now()}`;
    
    const gameState = await RedisStorage.getGameState(gameId);
    if (!gameState) {
      res.status(404).json({ error: 'Battle not found' });
      return;
    }
    
    // Verify this player is part of the battle
    if (gameState.player1.userId !== userId && gameState.player2?.userId !== userId) {
      res.status(403).json({ error: 'Not authorized to view this battle' });
      return;
    }
    
    res.json({
      type: 'battle_state',
      gameState: gameState,
      playerRole: gameState.player1.userId === userId ? 'player1' : 'player2'
    });
  } catch (error) {
    console.error('Battle state error:', error);
    res.status(500).json({ error: 'Failed to get battle state' });
  }
});

router.post('/api/game/battle/accept', async (req, res): Promise<void> => {
  try {
    const { gameId } = req.body;
    const { postId } = context;
    const username = await reddit.getCurrentUsername();
    const userId = username ? `${username}_${postId}` : `anonymous_${postId}_${Date.now()}`;
    
    // Get the game state
    const gameState = await RedisStorage.getGameState(gameId);
    if (!gameState) {
      res.status(404).json({ error: 'Battle invitation expired' });
      return;
    }
    
    // Verify this player is part of the battle
    if (gameState.player1.userId !== userId && gameState.player2?.userId !== userId) {
      res.status(403).json({ error: 'Not authorized to join this battle' });
      return;
    }
    
    // Accept the invitation and activate the battle
    await RedisStorage.acceptBattleInvitation(userId);
    gameState.status = 'active';
    gameState.turnStartedAt = Date.now(); // Start timer for player1 (battle initiator)
    await RedisStorage.setGameState(gameId, gameState);
    
    // Start timeout monitoring for the first turn
    console.log(`🕐 Scheduling timeout for accepted battle - Game: ${gameId}, Turn: ${gameState.currentTurn}`);
    GameAPI.scheduleTimeoutCheck(gameId, gameState.turnStartedAt);
    
    // Clear invitations and notify both players that battle is now active
    await RedisStorage.clearBattleInvitation(userId);
    await RedisStorage.notifyBattleActive(gameState.player1.userId, gameId);
    await RedisStorage.notifyBattleActive(gameState.player2?.userId || '', gameId);
    
    console.log(`Battle accepted and activated: ${gameState.player1.username} vs ${gameState.player2?.username}`);
    console.log(`${gameState.player1.username} goes first (battle initiator)`);
    
    res.json({
      type: 'battle_accepted',
      gameId: gameState.gameId,
      gameState: gameState,
      playerRole: gameState.player1.userId === userId ? 'player1' : 'player2'
    });
  } catch (error) {
    console.error('Battle accept error:', error);
    res.status(500).json({ error: 'Failed to accept battle' });
  }
});

router.post('/api/game/battle/decline', async (req, res): Promise<void> => {
  try {
    const { gameId } = req.body;
    const { postId } = context;
    const username = await reddit.getCurrentUsername();
    const userId = username ? `${username}_${postId}` : `anonymous_${postId}_${Date.now()}`;
    
    // Decline the invitation
    await RedisStorage.declineBattleInvitation(userId);
    
    // Delete the pending game
    await RedisStorage.deleteGameState(gameId);
    
    console.log(`Battle declined by ${username}`);
    
    res.json({
      type: 'battle_declined',
      message: 'Battle invitation declined'
    });
  } catch (error) {
    console.error('Battle decline error:', error);
    res.status(500).json({ error: 'Failed to decline battle' });
  }
});

router.get('/api/game/stats', async (_req, res): Promise<void> => {
  try {
    const { postId } = context;
    const username = await reddit.getCurrentUsername();
    const userId = username ? `${username}_${postId}` : `anonymous_${postId}_${Date.now()}`;
    
    // Mark current player as online
    await RedisStorage.setPlayerOnline(userId);
    
    const onlineCount = await RedisStorage.getOnlinePlayerCount();
    // Get actual battles today from Redis or default to 0
    const battlesToday = await RedisStorage.getBattlesToday() || 0;
    res.json({ onlineCount: Math.max(1, onlineCount), battlesToday });
  } catch (error) {
    console.error('Stats error:', error);
    res.json({ onlineCount: 1, battlesToday: 0 }); // At least 1 player (current user)
  }
});

router.post('/api/game/heartbeat', async (_req, res): Promise<void> => {
  try {
    const { postId } = context;
    const username = await reddit.getCurrentUsername();
    const userId = username ? `${username}_${postId}` : `anonymous_${postId}_${Date.now()}`;
    
    // Refresh online status
    await RedisStorage.setPlayerOnline(userId);
    
    // Check for battle invitations and active battle notifications
    const battleInvitation = await RedisStorage.getBattleInvitation(userId);
    const activeBattleId = await RedisStorage.getPlayerActiveBattle(userId);
    const battleActiveNotification = await RedisStorage.getBattleActiveNotification(userId);
    
    res.json({ 
      success: true, 
      battleInvitation,
      activeBattleId,
      battleActiveNotification
    });
  } catch (error) {
    console.error('Heartbeat error:', error);
    res.status(500).json({ error: 'Failed to update heartbeat' });
  }
});

router.get('/api/game/leaderboard', async (_req, res): Promise<void> => {
  try {
    const { type } = _req.query;
    const response = await GameAPI.getLeaderboard((type as string) || 'global');
    res.json(response);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

router.get('/api/game/raid', async (_req, res): Promise<void> => {
  try {
    const response = await GameAPI.getRaidBoss();
    res.json(response);
  } catch (error) {
    console.error('Raid error:', error);
    res.status(500).json({ error: 'Failed to get raid status' });
  }
});

router.post('/api/game/raid/join', async (_req, res): Promise<void> => {
  try {
    const { postId } = context;
    const username = await reddit.getCurrentUsername();
    // Create a unique userId by combining username with postId to ensure each user has a unique identifier
    const userId = username ? `${username}_${postId}` : `anonymous_${postId}_${Date.now()}`;
    
    const response = await GameAPI.joinRaid(userId);
    res.json(response);
  } catch (error) {
    console.error('Raid join error:', error);
    res.status(500).json({ error: 'Failed to join raid' });
  }
});

// Use router middleware
app.use(router);

// Get port from environment variable with fallback
const port = getServerPort();

const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(port);
