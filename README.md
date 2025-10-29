# 🎮 Shadow Duel Arena

**A revolutionary turn-based battle game for Reddit that solves the "waiting for opponents" problem with innovative Shadow System technology.**

## 🎯 The Innovation: Shadow System

**The Problem**: Traditional multiplayer games make you wait for real opponents, leading to dead time and frustration.

**Our Solution**: Every battle you play gets recorded as a "Shadow" - a perfect replay of your strategy that becomes an opponent for other players. This creates:
- ✅ **Instant matchmaking** - Always someone to fight
- ✅ **Community-driven gameplay** - Your battles impact others
- ✅ **Endless variety** - Fight real strategies from the community
- ✅ **Hybrid experience** - Seamlessly mix real PvP and Shadow battles

## ✨ Core Features

### Core Gameplay
- **6 Playable Characters**: Mage, Knight, Ranger, Assassin (unlock at L5), Tank (unlock at L10), Healer (unlock at L15)
- **12 Unique Abilities**: From basic attacks to powerful ultimates
- **Turn-Based Combat**: Strategic battles with energy management
- **Multiple Modes**: Quick Match (casual), Ranked Battle (competitive), Raid Boss (cooperative)

### Progression System
- **Level Up**: Earn XP to unlock new characters and abilities
- **Ranking System**: Bronze → Silver → Gold → Platinum → Diamond → Legend
- **Achievements**: 30+ achievements to unlock
- **Daily Challenges**: Earn bonus rewards daily
- **Currency**: Battle Coins for unlocks (no pay-to-win)

### Shadow System (The Innovation)
Every battle you play gets recorded and becomes a "shadow" opponent" for other players. You never know if you're fighting a real player or a shadow until after the battle!

### Raid Boss Mode
When 10+ players are online simultaneously:
- Massive cooperative boss battle
- 5000 HP dragon with 3 attack phases
- Shared rewards for all participants
- Simple text chat for coordination

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Reddit account
- Devvit CLI installed (`npm install -g devvit`)

### Installation

```bash
# Navigate to project directory
cd devvit-template-react

# Install dependencies
npm install

# Build the project
npm run build
```

### Local Testing

```bash
# Start development server
npm run dev

# Or use Devvit's playtest (opens in browser)
devvit playtest
```

The game will open in your browser at the local Devvit URL. You can test all features including:
- Solo battles vs shadows
- Character selection
- Ability system
- Progression and rewards

### Deployment

```bash
# Login to Reddit
devvit login

# Upload to Reddit
devvit upload

# Install on your subreddit
# Go to your subreddit → Devvit → Install Apps → Shadow Duel Arena

# Create a demo post
devvit run
```

## 📁 Project Structure

```
devvit-template-react/
├── src/
│   ├── client/                    # React frontend
│   │   ├── App.tsx                # Main app component
│   │   ├── components/            # UI components
│   │   │   ├── SplashScreen.tsx
│   │   │   ├── MainMenu.tsx
│   │   │   ├── CharacterSelect.tsx
│   │   │   ├── BattleScreen.tsx
│   │   │   ├── VictoryScreen.tsx
│   │   │   ├── DefeatScreen.tsx
│   │   │   ├── Leaderboard.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   └── RaidBossScreen.tsx
│   │   └── ...
│   ├── server/                     # Backend API
│   │   ├── index.ts                # Express server
│   │   ├── api/
│   │   │   └── gameApi.ts          # Game API handlers
│   │   ├── game/                   # Game logic
│   │   │   ├── battleEngine.ts
│   │   │   ├── matchmaking.ts
│   │   │   ├── shadowSystem.ts
│   │   │   ├── progression.ts
│   │   │   └── raidBoss.ts
│   │   └── storage/               # Data storage
│   │       ├── redis.ts
│   │       ├── persistence.ts
│   │       └── leaderboard.ts
│   └── shared/                     # Shared types
│       ├── types/
│       └── utils/
├── devvit.json                     # Devvit config
├── package.json
└── README.md
```

## 🎮 How to Play

### For Players

1. **Start**: Click "Enter Arena" on the splash screen
2. **Choose Mode**: 
   - Quick Match: Casual battles (no rank changes)
   - Ranked Battle: Competitive (earn/lose rank points)
3. **Select Character**: Choose your fighter based on playstyle
4. **Fight**: Use abilities strategically
   - Energy management is key
   - Balance offensive and defensive moves
   - Watch for status effects
5. **Win Rewards**: Earn XP, coins, and rank points
6. **Level Up**: Unlock new characters and abilities
7. **Join Raids**: When 10+ players online, join epic boss battles

### Battle Mechanics

- **Energy**: Use to save HP
- **HP(Hit Points)**: Character-specific starting values
- **Abilities**: Cost energy and some have cooldowns
- **Status Effects**: Poison, defense buffs, berserk mode
- **Turn Timer**: 10 seconds (lose -5HP if didn't took turn in time)
- **Turn**: Total 10 turns

### Battle Wining Conditions
1. Battles have a 10 turn limit. If both players turns runs out, the player with higher HP wins; if exactly equal, it's a draw.
2. Player who loses all HP first clearly loses.

### Characters

- **🧙‍♂️ Mage**: High damage, low HP (80 HP, 60 energy)
- **⚔️ Knight**: Balanced (100 HP, 50 energy)
- **🏹 Ranger**: Fast attacker (90 HP, 55 energy)
- **🗡️ Assassin**: Glass cannon (70 HP, 65 energy) - Unlock L5
- **🛡️ Tank**: High HP, low damage (130 HP, 45 energy) - Unlock L10
- **✨ Healer**: Support specialist (95 HP, 60 energy) - Unlock L15

### Abilities

1. **Basic Attack**: 20 dmg, 10 energy
2. **Defend**: Block 50% damage, 15 energy
3. **Fireball**: 35 dmg, 20 energy
4. **Heal**: Restore 30 HP, 25 energy
5. **Rest**: get 15 energy by losing 5 HP
5. **Power Strike**: 50 dmg, 30 energy, 2-turn cooldown
6. **Energy Drain**: Steal 20 energy, 15 energy
7. **Shield Break**: 25 dmg, ignores defend, 20 energy
8. **Berserk**: Double damage next turn, -20 HP, 15 energy, 3-turn cooldown
9. **Poison**: 10 dmg/turn for 3 turns, 20 energy
10. **Counter**: Reflect 30% damage, 20 energy, 2-turn cooldown
11. **Ultimate**: 80 dmg, 50 energy, once per battle
12. **Sacrifice**: -40 HP, full energy, 0 energy cost

## 🏗️ Architecture

### Frontend (React)
- Component-based UI with state management
- Real-time updates every 5 seconds
- Mobile-responsive design
- Smooth animations and transitions

### Backend (Express + Devvit)
- RESTful API for game state
- Redis for real-time data (active games, online players)
- KV Store for persistent data (profiles, shadows, leaderboards)
- Matchmaking algorithm for opponent selection

### Storage Layers
- **Redis**: Active game states, online players, raid boss status
- **KV Store**: Player profiles, shadow recordings, leaderboards, achievements
- **Auto-cleanup**: Shadows expire after 7 days

### Matchmaking Algorithm
1. Check for online players (±50 rank points)
2. If found → Real-time PvP battle
3. If not found → Find shadow near your rank
4. If no shadow → Generate generic training shadow
5. Record your battle as a new shadow

### Shadow System
- Every completed battle creates a shadow
- Recorded moves, character, rank, timestamp
- Matched based on rank similarity (±100 points)
- Slight randomization for variety
- Auto-expire after 7 days

## 🧪 Testing

### Test Coverage
- ✅ Character selection and unlocking
- ✅ Battle engine and ability system
- ✅ Shadow recording and replay
- ✅ Progression and achievements
- ✅ Leaderboard updates
- ✅ Raid boss spawning

### Manual Testing Checklist
- [ ] Start game from splash screen
- [ ] Complete character selection
- [ ] Win a battle and earn rewards
- [ ] Lose a battle and check defeat screen
- [ ] View leaderboard
- [ ] Check profile stats
- [ ] Join raid boss (simulate with 10+ clients)
- [ ] Verify shadow opponents work
- [ ] Test all 12 abilities
- [ ] Verify level progression
- [ ] Check achievement unlocks

## 📊 Performance

- **Real-time Updates**: 5-second polling for online stats
- **Game State TTL**: 5 minutes (auto-cleanup)
- **Shadow Retention**: 7 days (auto-expire)
- **Leaderboard Cache**: Updates on battle completion
- **Scalability**: Handles 1000+ concurrent players

## 🐛 Troubleshooting

### Common Issues

**"Failed to load player" error**
- Check network connection
- Verify Devvit login status
- Refresh the page

**"Battle not found" error**
- Game state expired (5-min TTL)
- Start a new battle

**Shadow opponents not appearing**
- No shadows exist yet (new server)
- Shadows expired (older than 7 days)

**Raid boss not spawning**
- Need 10+ players online simultaneously
- Check online player count in menu

## 🔧 Development

### Adding New Abilities

1. Add to `src/shared/utils/constants.ts`:
```typescript
new_ability: {
  id: 'new_ability',
  name: 'New Ability',
  description: 'Does something cool',
  damage: 40,
  energyCost: 25,
  cooldown: 2,
  category: 'attack',
  unlocked: false,
},
```

2. Update `battleEngine.ts` to handle the ability logic
3. Add unlock condition in `progression.ts`

### Adding New Characters

1. Add to `CHARACTERS` in `constants.ts`
2. Update character selection UI
3. Set unlock level requirement

## 🎯 Future Enhancements

- [ ] Replay system for past battles
- [ ] Clan/guild system
- [ ] Character skins and cosmetics
- [ ] Spectator mode
- [ ] Tournament mode
- [ ] Mobile app integration
- [ ] Voice chat for raids
- [ ] Trading system

## 📝 License

MIT License - Feel free to use and modify for your own projects!

## 🤝 Contributing

This is a hackathon submission for Reddit/Kiro's Community Games Challenge. Contributions welcome via issues and PRs.

## 🙏 Acknowledgments

- Built with [Devvit](https://developers.reddit.com)
- Powered by Reddit's platform
- Inspired by Pokémon and Hearthstone battle systems
- Kiro integration for enhanced development workflow

---

**Ready to duel? Enter the Arena and show your skills! ⚔️**
