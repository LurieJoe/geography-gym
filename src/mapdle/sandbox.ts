// Practice round and replay mode. Both play a puzzle in memory only: nothing is saved, and stats and analytics are untouched.
//   ?practice=1   the practice round (puzzle #1)
//   ?replay=8     plays an earlier puzzle again (only days that have already passed, so today's answer stays secret)
import { dayNumber, type Saved } from './logic'

export interface Sandbox { kind: 'practice' | 'replay'; day: number }

export function readSandbox(): Sandbox | null {
  try {
    const params = new URLSearchParams(window.location.search)
    if (params.has('practice')) return { kind: 'practice', day: 1 }
    const raw = params.get('replay')
    if (raw && /^\d{1,4}$/.test(raw)) {
      const day = Number(raw)
      if (day >= 1 && day < dayNumber()) return { kind: 'replay', day }
    }
  } catch { /* no address bar to read: play normally */ }
  return null
}

/** The player's saved data, minus any saved game for the day being practiced, so the round starts fresh. */
export function sandboxSaved(saved: Saved, sandbox: Sandbox | null): Saved {
  if (!sandbox) return saved
  const records = { ...saved.records }
  delete records[sandbox.day]
  return { ...saved, records }
}
