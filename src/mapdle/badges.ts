// Streak badges for Mapdle. The streak itself lives in logic.ts; this file only reads it.
// Badges are awarded off stats.maxStreak, so a broken streak never takes one away.
import { SHARE_URL, type Stats } from './logic'

export interface Badge {
  id: string
  name: string
  /** Consecutive wins that earn this badge. */
  days: number
  /** Flavour line used in the share text. */
  brag: string
}

/** Must stay sorted by `days`, ascending. */
export const BADGES: readonly Badge[] = [
  { id: 'scout', name: 'Scout', days: 3, brag: 'Three days in. Just getting my bearings.' },
  { id: 'explorer', name: 'Explorer', days: 7, brag: 'One week straight. Not lost yet.' },
  { id: 'navigator', name: 'Navigator', days: 14, brag: 'Two weeks without missing a day.' },
  { id: 'cartographer', name: 'Cartographer', days: 30, brag: 'A full month. I am drawing the maps now.' },
  { id: 'geographer', name: 'Geographer', days: 90, brag: 'Ninety days without missing one.' },
  { id: 'atlas-master', name: 'Atlas Master', days: 180, brag: 'Six months, 180 puzzles, zero days missed.' },
]

/** Every badge earned so far. Permanent: based on the best streak, not the current one. */
export function earnedBadges(stats: Stats): Badge[] {
  return BADGES.filter((badge) => badge.days <= stats.maxStreak)
}

/** The badge this finish just earned, if any. Pass the stats from before and after recordFinished(). */
export function badgeEarnedBy(before: Stats, after: Stats): Badge | null {
  return BADGES.find((badge) => before.maxStreak < badge.days && after.maxStreak >= badge.days) ?? null
}

/** The next badge above the current streak, or null once they are all earned. */
export function nextBadge(streak: number): Badge | null {
  return BADGES.find((badge) => badge.days > streak) ?? null
}

/** The nudge under the result. Stays quiet unless the next badge is within `within` days. */
export function streakTeaser(streak: number, within = 3): string | null {
  if (streak < 1) return null
  const next = nextBadge(streak)
  if (!next) return null
  const toGo = next.days - streak
  if (toGo > within) return null
  if (toGo === 1) return `Come back tomorrow to earn the ${next.name} badge!`
  return `${toGo} more days to the ${next.name} badge.`
}

/** The brag, in the same shape as the daily result share. */
export function badgeShareText(badge: Badge, day: number): string {
  const title = day >= 1 ? `🌍 Mapdle #${day}` : '🌍 Mapdle preview'
  return `${title}\n${badge.name} badge earned — ${badge.days}-day streak!\n${badge.brag}\n${SHARE_URL}`
}
