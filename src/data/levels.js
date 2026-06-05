// Achievement levels. Each level unlocks when ALL its quest tasks are complete.
// Tasks are measured against simple stats computed from the player's portfolio:
//   distinctBought — how many different stocks they've ever bought
//   lessonsDone    — how many Learn & Earn quizzes they've passed
//   follows        — how many stocks they follow
//   gainPct        — their total gain/loss as a percent of starting cash

export const ROOKIE = { id: 'rookie', name: 'Rookie', icon: '🐣' }

export const LEVELS = [
  {
    id: 'trader',
    name: 'Trader',
    icon: '📈',
    blurb: 'Finish your first 3 quests to become a Trader!',
    congrats: 'You finished your first quests. You\'re officially a Trader! 📈',
    tasks: [
      { id: 'buy2', icon: '🛒', label: 'Buy 2 different stocks', metric: 'distinctBought', goal: 2 },
      { id: 'quiz2', icon: '🎓', label: 'Answer 2 quiz questions', metric: 'lessonsDone', goal: 2 },
      { id: 'follow1', icon: '⭐', label: 'Follow a stock', metric: 'follows', goal: 1 },
    ],
  },
  {
    id: 'super-trader',
    name: 'Super Trader',
    icon: '🚀',
    blurb: 'Grow your money by 10% to become a Super Trader!',
    congrats: 'You grew your money by 10%! You\'re a Super Trader! 🚀',
    tasks: [
      { id: 'gain10', icon: '💎', label: 'Make a 10% gain', metric: 'gainPct', goal: 10, unit: '%' },
    ],
  },
]

// Is every task in this level complete, given the stats?
export const isLevelComplete = (level, stats) =>
  level.tasks.every((t) => (stats[t.metric] ?? 0) >= t.goal)

// Highest unlocked level (or Rookie if none). LEVELS is ordered easiest → hardest.
export function currentLevel(unlocked) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (unlocked.includes(LEVELS[i].id)) return LEVELS[i]
  }
  return ROOKIE
}
