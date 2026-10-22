// Anonymous usage counts (Umami). Never blocks or breaks the game: if analytics is blocked or offline, nothing happens.
type Data = Record<string, string | number>
export function track(name: string, data?: Data): void {
  try {
    ;(window as unknown as { umami?: { track: (n: string, d?: Data) => void } }).umami?.track(name, data)
  } catch { /* analytics is optional */ }
}
