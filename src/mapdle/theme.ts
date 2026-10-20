export type ThemeMode = 'system' | 'light' | 'dark'

const OWN_KEY = 'mapdle:theme'
const GYM_KEY = 'geography-gym-profiles-v1'
const isMode = (value: unknown): value is ThemeMode => value === 'system' || value === 'light' || value === 'dark'

// Mapdle's own choice wins. If there isn't one yet, follow the theme chosen in Geography Gym on this browser.
export function readThemeMode(): ThemeMode {
  try {
    const own = localStorage.getItem(OWN_KEY)
    if (isMode(own)) return own
    const store = JSON.parse(localStorage.getItem(GYM_KEY) ?? 'null')
    const profile = store?.profiles?.find((p: { id?: string }) => p.id === store.activeProfileId) ?? store?.profiles?.[0]
    const gym = profile?.preferences?.theme
    if (isMode(gym)) return gym
  } catch {
    // Storage can be blocked; fall back to the device setting.
  }
  return 'system'
}

export function saveThemeMode(mode: ThemeMode) {
  try { localStorage.setItem(OWN_KEY, mode) } catch { /* ignore */ }
}

export function applyTheme(mode: ThemeMode) {
  const dark = window.matchMedia('(prefers-color-scheme: dark)').matches
  document.documentElement.setAttribute('data-theme', mode === 'system' ? (dark ? 'dark' : 'light') : mode)
}
