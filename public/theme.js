(() => {
  const media = window.matchMedia('(prefers-color-scheme: dark)')

  const readJson = (key) => {
    try {
      return JSON.parse(localStorage.getItem(key) ?? 'null')
    } catch {
      return null
    }
  }

  const getThemePreference = () => {
    const store = readJson('geography-gym-profiles-v1')
    const activeProfile = store?.profiles?.find(
      (profile) => profile.id === store.activeProfileId,
    )
    const profileTheme = activeProfile?.preferences?.theme
    if (['system', 'light', 'dark'].includes(profileTheme)) return profileTheme

    const legacyTheme = readJson('geography-gym-preferences')?.theme
    return ['system', 'light', 'dark'].includes(legacyTheme) ? legacyTheme : 'system'
  }

  const applyTheme = () => {
    const preference = getThemePreference()
    const theme = preference === 'system' ? (media.matches ? 'dark' : 'light') : preference
    document.documentElement.setAttribute('data-theme', theme)
  }

  applyTheme()
  media.addEventListener('change', () => {
    if (getThemePreference() === 'system') applyTheme()
  })
  window.addEventListener('storage', (event) => {
    if (
      event.key === 'geography-gym-profiles-v1' ||
      event.key === 'geography-gym-preferences'
    ) {
      applyTheme()
    }
  })
})()
