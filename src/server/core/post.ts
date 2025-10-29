import { context, reddit } from '@devvit/web/server';

export const createPost = async () => {
  const { subredditName } = context;
  if (!subredditName) {
    throw new Error('subredditName is required');
  }

  return await reddit.submitCustomPost({
    splash: {
      // Splash Screen Configuration for Shadow Duel Arena
      appDisplayName: 'Shadow Duel Arena',
      backgroundUri: 'default-splash.png',
      buttonLabel: 'Enter Arena',
      description: 'Turn-based battle game with shadow opponents',
      entryUri: 'index.html',
      heading: 'Welcome to Shadow Duel Arena!',
      appIconUri: 'default-icon.png',
    },
    postData: {
      gameState: 'splash',
      initialized: true,
    },
    subredditName: subredditName,
    title: 'Shadow Duel Arena - Turn-Based Battle Game',
  });
};
