export type ThemeMode = 'system' | 'light' | 'dark'

const OWN_KEY = 'mapdle:theme'
const GYM_KEY = 'geography-gym-profiles-v1'
const isMode = (value: unknown): value is ThemeMode => value === 'system' || value === 'light' || value === 'dark'

type GymPreferences = {
  theme?: unknown
  accent?: unknown
  highContrast?: unknown
  fontSize?: unknown
  colorblind?: unknown
}

// Mapdle runs as its own page, so Geography Gym's React effects never fire
// here. Without reading them, a player who set large text and high contrast in
// the Gym would get neither in Mapdle.
function readGymPreferences(): GymPreferences | null {
  try {
    const store = JSON.parse(localStorage.getItem(GYM_KEY) ?? 'null')
    const profile = store?.profiles?.find((p: { id?: string }) => p.id === store.activeProfileId) ?? store?.profiles?.[0]
    return (profile?.preferences ?? null) as GymPreferences | null
  } catch {
    // Storage can be blocked; fall back to the device setting.
    return null
  }
}

function writeGymPreference(key: string, value: unknown) {
  try {
    const store = JSON.parse(localStorage.getItem(GYM_KEY) ?? 'null')
    if (!store?.profiles?.length) return
    const profile = store.profiles.find((p: { id?: string }) => p.id === store.activeProfileId) ?? store.profiles[0]
    if (!profile) return
    profile.preferences = { ...(profile.preferences ?? {}), [key]: value }
    localStorage.setItem(GYM_KEY, JSON.stringify(store))
  } catch { /* ignore */ }
}

// Theme is a look, so Mapdle's own choice wins and the Gym's is the fallback.
export function readThemeMode(): ThemeMode {
  try {
    const own = localStorage.getItem(OWN_KEY)
    if (isMode(own)) return own
    const gym = readGymPreferences()?.theme
    if (isMode(gym)) return gym
  } catch {
    // Storage can be blocked; fall back to the device setting.
  }
  return 'system'
}

export function saveThemeMode(mode: ThemeMode) {
  try { localStorage.setItem(OWN_KEY, mode) } catch { /* ignore */ }
}

// Color-blind mode is an accessibility need rather than a look: a person's
// eyes don't change between pages, so it is ONE setting shared both ways with
// the Gym rather than a per-page override.
export function readColorblind(legacy?: boolean): boolean {
  const pref = readGymPreferences()?.colorblind
  if (typeof pref === 'boolean') return pref
  return !!legacy
}

export function saveColorblind(on: boolean) {
  writeGymPreference('colorblind', on)
}

export function applyTheme(mode: ThemeMode) {
  const dark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const root = document.documentElement
  root.setAttribute('data-theme', mode === 'system' ? (dark ? 'dark' : 'light') : mode)
  root.setAttribute('data-theme-mode', mode)

  // Mirror the rest of the Gym's appearance so Mapdle doesn't ignore the
  // player's accessibility settings. Same attributes App.tsx sets.
  const prefs = readGymPreferences()
  if (typeof prefs?.accent === 'string') root.setAttribute('data-accent', prefs.accent)
  if (typeof prefs?.fontSize === 'string') root.setAttribute('data-font-size', prefs.fontSize)
  root.setAttribute('data-high-contrast', String(prefs?.highContrast === true))
  root.setAttribute('data-colorblind', String(readColorblind()))
}
