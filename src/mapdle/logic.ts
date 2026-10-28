// Pure game rules for Mapdle. No React, no browser APIs except localStorage helpers at the bottom.
import { GREEN_KM, YELLOW_KM, PUZZLES, type MapdlePuzzle } from './puzzles'

export const MAX_PINS = 5
/** First day of the daily game (local date, YYYY-MM-DD). Change this before you launch. */
export const LAUNCH_DATE = '2026-11-01'
export const SHARE_URL = 'geographygym.com/mapdle' // no https:// on purpose, so Messages keeps it in the same bubble as the result

export type Band = 'green' | 'yellow' | 'red'
export type Status = 'playing' | 'won' | 'lost'
export interface Coord { lat: number; lon: number }
export interface Pin extends Coord { km: number; band?: Band }
export interface DayRecord { day: number; pins: Pin[]; status: Status }
export interface Stats {
  played: number
  wins: number
  streak: number
  maxStreak: number
  lastWonDay: number
  /** index 0..4 = won with that many pins */
  distribution: number[]
  lastFinishedDay: number
}

const R = 6371
const rad = (d: number) => (d * Math.PI) / 180
const deg = (r: number) => (r * 180) / Math.PI

export function distanceKm(a: Coord, b: Coord): number {
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2
    + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** Initial compass bearing (0-360, 0 = north) when travelling from `from` to `to`. */
export function bearingDeg(from: Coord, to: Coord): number {
  const y = Math.sin(rad(to.lon - from.lon)) * Math.cos(rad(to.lat))
  const x = Math.cos(rad(from.lat)) * Math.sin(rad(to.lat))
    - Math.sin(rad(from.lat)) * Math.cos(rad(to.lat)) * Math.cos(rad(to.lon - from.lon))
  return (deg(Math.atan2(y, x)) + 360) % 360
}

const COMPASS = [
  { arrow: '↑', label: 'N' }, { arrow: '↗', label: 'NE' }, { arrow: '→', label: 'E' }, { arrow: '↘', label: 'SE' },
  { arrow: '↓', label: 'S' }, { arrow: '↙', label: 'SW' }, { arrow: '←', label: 'W' }, { arrow: '↖', label: 'NW' },
]
export function compass(bearing: number) {
  return COMPASS[Math.round((((bearing % 360) + 360) % 360) / 45) % 8]
}

export function bandFor(km: number): Band {
  if (km <= GREEN_KM) return 'green'
  if (km <= YELLOW_KM) return 'yellow'
  return 'red'
}
/** The color of a pin. State and country puzzles store it directly; all others come from the distance. */
export function pinBand(pin: Pin): Band { return pin.band ?? bandFor(pin.km) }
export const BAND_EMOJI: Record<Band, string> = { green: '🟩', yellow: '🟨', red: '🟥' }
export const BAND_WORD: Record<Band, string> = { green: 'Green', yellow: 'Yellow', red: 'Red' }

export function formatDistance(km: number, unit: 'km' | 'mi'): string {
  const value = unit === 'mi' ? km * 0.621371 : km
  return `${Math.round(value).toLocaleString('en-US')} ${unit}`
}

/** Point `fraction` of the way along the great circle from a to b. */
export function interpolate(a: Coord, b: Coord, fraction: number): Coord {
  const d = distanceKm(a, b) / R
  if (d < 1e-9) return { ...b }
  const A = Math.sin((1 - fraction) * d) / Math.sin(d)
  const B = Math.sin(fraction * d) / Math.sin(d)
  const x = A * Math.cos(rad(a.lat)) * Math.cos(rad(a.lon)) + B * Math.cos(rad(b.lat)) * Math.cos(rad(b.lon))
  const y = A * Math.cos(rad(a.lat)) * Math.sin(rad(a.lon)) + B * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon))
  const z = A * Math.sin(rad(a.lat)) + B * Math.sin(rad(b.lat))
  return { lat: deg(Math.atan2(z, Math.hypot(x, y))), lon: deg(Math.atan2(y, x)) }
}

// ---- days ----
export function dateKey(date: Date = new Date()): string {
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${m}-${d}`
}
const utcDay = (key: string) => {
  const [y, m, d] = key.split('-').map(Number)
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000)
}
/** Day 1 is LAUNCH_DATE. Before launch (testing) it stays at 1. Uses the player's local calendar date. */
export function dayNumber(date: Date = new Date(), launch: string = LAUNCH_DATE): number {
  return utcDay(dateKey(date)) - utcDay(launch) + 1 // zero or negative before launch: a preview day
}
/** Text under the Mapdle title. Before launch it says so, so nobody mistakes a preview for puzzle #1. */
export function dayLabel(day: number, launch: string = LAUNCH_DATE): string {
  if (day >= 1) return `Daily puzzle #${day}`
  const [y, m, d] = launch.split('-').map(Number)
  const when = new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  return `Preview puzzle · daily puzzles start ${when}`
}
export function puzzleForDay(day: number, puzzles: MapdlePuzzle[] = PUZZLES): MapdlePuzzle {
  return puzzles[(((day - 1) % puzzles.length) + puzzles.length) % puzzles.length]
}
export function msUntilNextDay(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  return next.getTime() - now.getTime()
}

// ---- play ----
export function newRecord(day: number): DayRecord { return { day, pins: [], status: 'playing' } }

/** `inside` is for state and country puzzles: true = inside it (green), false = outside (never green), null or missing = distance only. */
export function submitPin(record: DayRecord, coord: Coord, target: Coord, inside?: boolean | null): DayRecord {
  if (record.status !== 'playing') return record
  const pin: Pin = { lat: coord.lat, lon: coord.lon, km: distanceKm(coord, target) }
  if (inside === true) pin.band = 'green'
  else if (inside === false) pin.band = pin.km <= YELLOW_KM ? 'yellow' : 'red'
  const pins = [...record.pins, pin]
  const status: Status = pinBand(pin) === 'green' ? 'won' : pins.length >= MAX_PINS ? 'lost' : 'playing'
  return { ...record, pins, status }
}

/** How many clues are showing: clue 1 at the start, one more after each pin, all three when finished. */
export function cluesShown(record: DayRecord): number {
  return record.status === 'playing' ? Math.min(3, record.pins.length + 1) : 3
}

export function shareText(record: DayRecord, subject: string): string {
  const blocks = record.pins.map((p) => BAND_EMOJI[pinBand(p)]).join('')
  const title = record.day >= 1 ? `🌍 Mapdle #${record.day}` : '🌍 Mapdle preview'
  return `${title}\n${subject}\n${blocks}\n${SHARE_URL}`
}

/** The headline in the result pop-up. "special" wins get a celebration: first pin, or never a red pin. */
export function winHeadline(record: DayRecord): { text: string; special: boolean } {
  if (record.status !== 'won') return { text: 'Out of pins', special: false }
  const n = record.pins.length
  if (n === 1) return { text: 'You got it in 1!', special: true }
  if (!record.pins.some((p) => pinBand(p) === 'red')) return { text: "You didn't need Red!", special: true }
  return { text: `Found it in ${n} pins`, special: false }
}

// ---- stats ----
export const emptyStats = (): Stats => ({ played: 0, wins: 0, streak: 0, maxStreak: 0, lastWonDay: 0, distribution: [0, 0, 0, 0, 0], lastFinishedDay: 0 })

export function recordFinished(stats: Stats, record: DayRecord): Stats {
  if (record.status === 'playing' || record.day < 1 || record.day <= stats.lastFinishedDay) return stats // preview days never count
  const next: Stats = { ...stats, distribution: [...stats.distribution], played: stats.played + 1, lastFinishedDay: record.day }
  if (record.status === 'won') {
    next.wins += 1
    next.streak = stats.lastWonDay === record.day - 1 ? stats.streak + 1 : 1
    next.maxStreak = Math.max(stats.maxStreak, next.streak)
    next.lastWonDay = record.day
    next.distribution[record.pins.length - 1] += 1
  } else {
    next.streak = 0
  }
  return next
}
/** A streak still counts if the player won yesterday and hasn't finished today yet. */
export function currentStreak(stats: Stats, today: number): number {
  return stats.lastWonDay >= today - 1 ? stats.streak : 0
}

// ---- storage (never throws) ----
const KEY = 'mapdle:v1'
interface Saved { records: Record<number, DayRecord>; stats: Stats; unit: 'km' | 'mi'; seenHelp: boolean }
export function loadSaved(): Saved {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Saved>
      return { records: parsed.records ?? {}, stats: { ...emptyStats(), ...parsed.stats }, unit: parsed.unit === 'km' ? 'km' : 'mi', seenHelp: !!parsed.seenHelp }
    }
  } catch { /* storage blocked or corrupt: start fresh */ }
  return { records: {}, stats: emptyStats(), unit: 'mi', seenHelp: false }
}
export function save(saved: Saved) {
  try {
    const days = Object.keys(saved.records).map(Number).sort((a, b) => b - a).slice(0, 30)
    const records: Record<number, DayRecord> = {}
    for (const d of days) records[d] = saved.records[d]
    localStorage.setItem(KEY, JSON.stringify({ ...saved, records }))
  } catch { /* ignore */ }
}
export type { Saved }
